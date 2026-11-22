#!/usr/bin/env node
// Live smoke test for the kiosk test page's entity logic.
//
//   HA_URL=http://homeassistant.local:8123 HA_TOKEN=<long-lived token> node tools/kiosk-test/smoke.mjs
//
// Optional: DASH=url_path1,url_path2 to override SOURCE_DASHBOARDS (use "default" for the default dashboard).
// Read-only: it only sends get/list commands. The token is never printed, logged or written.
import { SOURCE_DASHBOARDS } from '../../homeassistant/www/kiosk-test/config.js';
import {
  extractEntities, mergeExtractions, isStrategyDashboard, fallbackEntities, groupByArea, groupByDomain,
  parseDashParam,
} from '../../homeassistant/www/kiosk-test/entities.js';

const { HA_URL, HA_TOKEN } = process.env;
if (!HA_URL || !HA_TOKEN) {
  console.log('skipped: HA_URL/HA_TOKEN not set');
  process.exit(0);
}

const SUPAR_TITLE = /supar\s*home/i;

function open() {
  const url = `${HA_URL.replace(/\/+$/, '').replace(/^http/, 'ws')}/api/websocket`;
  const ws = new WebSocket(url);
  const pending = new Map();
  let nextId = 1;
  let authed;
  const ready = new Promise((resolve, reject) => { authed = { resolve, reject }; });

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'auth_required') ws.send(JSON.stringify({ type: 'auth', access_token: HA_TOKEN }));
    else if (msg.type === 'auth_ok') authed.resolve(msg.ha_version);
    else if (msg.type === 'auth_invalid') authed.reject(new Error('Home Assistant rejected the token (auth_invalid)'));
    else if (msg.type === 'result' && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.success) p.resolve(msg.result); else p.reject(Object.assign(new Error(msg.error?.message ?? 'failed'), { code: msg.error?.code }));
    }
  });
  ws.addEventListener('error', () => authed.reject(new Error(`could not open a websocket to ${new URL(HA_URL).host}`)));
  ws.addEventListener('close', () => {
    authed.reject(new Error('connection closed'));
    for (const p of pending.values()) p.reject(new Error('connection closed'));
  });

  const call = (msg) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ ...msg, id }));
  });
  const settle = (msg) => call(msg).then((value) => ({ ok: true, value }), (error) => ({ ok: false, error }));
  return { ready, call, settle, close: () => ws.close() };
}

async function main() {
  const ha = open();
  const version = await ha.ready;
  console.log(`connected to Home Assistant ${version}`);

  const user = await ha.settle({ type: 'auth/current_user' });
  if (user.ok) {
    console.log(`token user is admin: ${user.value.is_admin ? 'yes' : 'no'}`);
    if (user.value.is_admin) {
      console.log('WARNING: this token belongs to an admin. The kiosk should run as a non-admin user, so live results there may differ (registry access, dashboards).');
    }
  }

  // Report which dashboard looks like "SuPar Home" so SOURCE_DASHBOARDS can be checked.
  const list = await ha.settle({ type: 'lovelace/dashboards/list' });
  if (list.ok) {
    const match = list.value.find((d) => SUPAR_TITLE.test(d.title ?? ''));
    console.log(`dashboard titled "SuPar Home": ${match ? `url_path=${match.url_path}` : 'not found'}`);
    console.log(`dashboards: ${list.value.map((d) => `${d.url_path} ("${d.title}")`).join(', ') || '(none besides the default)'}`);
  } else {
    console.log(`lovelace/dashboards/list refused (${list.error.code}); can't look the url_path up by title`);
  }

  const dashboards = process.env.DASH ? parseDashParam(`?dash=${process.env.DASH}`) : SOURCE_DASHBOARDS;
  console.log(`resolved url_path: ${dashboards.map((d) => d ?? '(default)').join(', ')}`);

  const [states, areas, devices, entityReg, services, ...configs] = await Promise.all([
    ha.settle({ type: 'get_states' }),
    ha.settle({ type: 'config/area_registry/list' }),
    ha.settle({ type: 'config/device_registry/list' }),
    ha.settle({ type: 'config/entity_registry/list_for_display' }),
    ha.settle({ type: 'get_services' }),
    ...dashboards.map((url_path) => ha.settle({ type: 'lovelace/config', url_path })),
  ]);
  if (!states.ok) throw states.error;

  console.log('registry commands:');
  for (const [name, r] of [['config/area_registry/list', areas], ['config/device_registry/list', devices], ['config/entity_registry/list_for_display', entityReg]]) {
    console.log(`  ${name}: ${r.ok ? 'ok' : `refused (${r.error.code})`}`);
  }

  const known = new Set(states.value.map((s) => s.entity_id));
  const serviceNames = services.ok
    ? Object.entries(services.value).flatMap(([d, s]) => Object.keys(s).map((n) => `${d}.${n}`)) : [];
  const extractions = [];
  let fallback = false;
  configs.forEach((r, i) => {
    const label = dashboards[i] ?? '(default)';
    if (!r.ok) console.log(`lovelace/config ${label}: failed (${r.error.code})`);
    else if (isStrategyDashboard(r.value)) { console.log(`lovelace/config ${label}: strategy dashboard`); fallback = true; }
    else extractions.push(extractEntities(r.value, known, { services: serviceNames }));
  });
  let { entities, missing } = mergeExtractions(extractions);
  if (fallback || entities.length === 0) {
    entities = fallbackEntities(known, entityReg.ok ? entityReg.value : null);
    console.log('FALLBACK: showing all visible entities');
  }

  const registriesOk = areas.ok && devices.ok && entityReg.ok;
  const groups = registriesOk
    ? groupByArea(entities, { areas: areas.value, devices: devices.value, entities: entityReg.value })
    : groupByDomain(entities);

  console.log(`entities: ${entities.length} (of ${known.size} in the state machine)`);
  console.log(`per ${registriesOk ? 'area' : 'domain'}:`);
  for (const g of groups) console.log(`  ${g.name} [#${g.id}]: ${g.entityIds.length}`);
  console.log(`missing (${missing.length}): ${missing.join(', ') || 'none'}`);
  ha.close();
}

main().catch((err) => {
  // Only the message: never dump objects that could include request data.
  console.error(`smoke test failed: ${err.message}`);
  process.exit(1);
});
