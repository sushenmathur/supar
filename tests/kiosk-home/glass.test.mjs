// The Warm Stone Glass page (www/kiosk-home-glass/) shares its logic with kiosk-home; these cover what differs.
// Run with: node --test tests/kiosk-home
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../../homeassistant/www/kiosk-home-glass/home.js';

const world = (spec) => (id) => (id in spec ? { entity_id: id, state: spec[id], attributes: {}, last_changed: new Date().toISOString() } : undefined);

test('hallway door: a grey note on the banner whenever it is open, day or night, not snoozable', () => {
  for (const sun of ['above_horizon', 'below_horizon']) {
    const w = world({ 'sun.sun': sun, 'binary_sensor.hallwaydoorsensor_contact': 'on' });
    assert.deepEqual(G.alerts(w).map((a) => a.msg), ['Hallway door open']);
    const b = G.banner(w);
    assert.equal(b.title, 'Hallway door open'); assert.equal(b.level, 'note');
    assert.equal(G.bannerButtons(w).snooze, false);
  }
  assert.equal(G.banner(world({ 'binary_sensor.hallwaydoorsensor_contact': 'off' })).title, 'All clear');
  // Snoozing doesn't hide it, and a real alert comes first.
  const both = world({ 'binary_sensor.hallwaydoorsensor_contact': 'on', 'input_boolean.alert_banner_snooze': 'on', 'binary_sensor.side_door_contact': 'on' });
  const b = G.banner(both);
  assert.equal(b.title, 'Side door open'); assert.equal(b.level, 'urgent'); assert.deepEqual(b.chips.map((c) => [c.level, c.text]), [['note', 'Hallway door']]);
});

test('glass page: charging uses the status sensor, then the iPhone backup', () => {
  const ids = ['sensor.paro_phone_battery_status', 'sensor.paro_iphone_battery_state'];
  assert.equal(G.isCharging(world({ [ids[0]]: 'unavailable', [ids[1]]: 'Charging' }), ids), true);
  assert.equal(G.isCharging(world({ [ids[0]]: 'Not Charging', [ids[1]]: 'Charging' }), ids), false);
});

test('glass page: climate haze modes match kiosk-home', async () => {
  const a = await import('../../homeassistant/www/kiosk-home/views.js');
  const b = await import('../../homeassistant/www/kiosk-home-glass/views.js');
  for (const s of ['cool', 'heat', 'heat_cool', 'auto', 'fan_only', 'dry', 'off']) assert.deepEqual(b.acMode(s), a.acMode(s));
});

test('glass page: media pop-up players match kiosk-home', async () => {
  const K = await import('../../homeassistant/www/kiosk-home/home.js');
  const m = new Map([['media_player.spotify', { state: 'playing', attributes: { media_title: 'Song' } }], ['switch.bedroom_tv', { state: 'off' }]]);
  const get = (id) => m.get(id);
  const pick = (ps) => ps.map((p) => [p.id, p.sub, p.rank]);
  assert.deepEqual(pick(G.mediaPlayers(get)), pick(K.mediaPlayers(get)));
});
