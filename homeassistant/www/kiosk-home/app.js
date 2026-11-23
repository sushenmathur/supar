// SuPar Home, live block print page for Kiosk Satellite. Boot, rendering, actions and sheets.
import { VERSION, E, PEOPLE, CARS, NAV, ROOM_ROUTES, MORE, MUSIC_PANEL, ROBBIE_ROOMS, WIFI_QR, LIGHT_META, LIGHT_POOL, SECURITY_CONTACTS, BINS, CAMERA_REFRESH_MS, CONFIRM_WINDOW_MS } from './config.js?v=7';
import { connect, FatalConnectError, MESSAGES, inKioskSatellite, errorCode } from './connection.js?v=7';
import { applyEntityDiff, isUnavailable, isLocalImage } from './state.js?v=7';
import * as H from './home.js?v=7';
import { injectIcons, ic, weatherArt } from './icons.js?v=7';
import { VIEWS, viewEntityIds } from './views.js?v=7';
import { callService as hawsCallService } from './vendor/haws.mjs?v=7';

console.info(`kiosk-home loaded v${VERSION}`);

const $ = (s) => document.querySelector(s);
const ks = window.kioskSatellite;
const states = new Map();
const get = (id) => states.get(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let conn = null;
let via = '';
let tz = 'Australia/Brisbane';
let mediaIds = [];
let events = null;

// ---- Messages ----
function showMessage(text, kind = 'info') {
  const m = $('#message'); m.dataset.kind = kind; m.querySelector('p').textContent = text; m.hidden = false;
}
let toastTimer = 0;
function toast(text) {
  const t = $('#toast'); t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 4000);
}
async function call(domain, service, data = {}) {
  try { return await hawsCallService(conn, domain, service, data); }
  catch (err) {
    console.warn(`kiosk-home: ${domain}.${service} failed (${errorCode(err)})`);
    toast(`Couldn't run ${domain}.${service}${err?.message ? `: ${err.message}` : ''}`);
    throw err;
  }
}
const quiet = (p) => p.catch(() => {});

// ---- Confirm-twice buttons: armed state survives re-renders ----
const armed = new Map();
function arm(key) {
  clearTimeout(armed.get(key));
  armed.set(key, setTimeout(() => { armed.delete(key); renderAll(); }, CONFIRM_WINDOW_MS));
  renderAll();
}
function confirmOr(key, fn) {
  if (armed.has(key)) { clearTimeout(armed.get(key)); armed.delete(key); renderAll(); fn(); } else arm(key);
}
const label = (key, text) => (armed.has(key) ? 'Tap again' : text);

// ---- Small render helpers ----
// Continuous animations restart when their element is re-rendered; a negative delay set to the
// current phase keeps them moving smoothly instead of jumping back to the start.
// The phase goes in as a placeholder so region output only differs when content does; renderAll fills it in on write.
const phase = (ms) => `animation-delay:__PH${ms}__`;
const fillPhase = (html) => html.replace(/__PH(\d+)__/g, (_, ms) => `-${((Date.now() % Number(ms)) / 1000).toFixed(2)}s`);
const tile = ({ act, arg = '', icon, name, sub, on = false, alert = false, off = false, cls = '', key }) =>
  `<button class="tile b ${cls}${on ? ' on' : ''}${alert ? ' alert' : ''}${off ? ' unavailable' : ''}" data-act="${act}" data-arg="${esc(arg)}"${off ? ' disabled' : ''}${cls.includes('spin') ? ` style="--ph:__PH9600__"` : ''}>
    <span class="well">${ic(icon)}</span><span><span class="name">${esc(key ? label(key, name) : name)}</span><span class="sub">${esc(sub)}</span></span></button>`;

function fmtTime(d, zone, opts = {}) {
  return d.toLocaleTimeString('en-AU', { timeZone: zone, hour: 'numeric', minute: '2-digit', hour12: true, ...opts });
}

// ---- Regions ----
const regions = {
  tabs() {
    const lights = H.lightsOn(get);
    const sec = H.securityOpen(get);
    const cur = ROOM_ROUTES.some(([r]) => r === route) ? 'rooms' : route;
    return `<a class="brand" href="#home">SuPar <span>Home</span></a>` + NAV.map(([name, icon, r]) => {
      const badge = name === 'Lights' && lights ? `<span class="count num">${lights}</span>` : name === 'Security' && sec ? `<span class="count alert num">${sec}</span>` : '';
      const here = r === cur ? ' cur" aria-current="page' : '';
      if (r === 'more' || r === 'rooms') return `<button class="tab${here}" data-act="${r}">${ic(icon)}${name}${badge}</button>`;
      return `<a class="tab${here}" href="#${r}">${ic(icon)}${name}${badge}</a>`;
    }).join('') + `<span class="grow"></span><span class="conn" id="conn"></span>`;
  },

  wx() {
    const w = get(E.weather);
    const t = parseFloat(w?.attributes?.temperature);
    const night = get(E.sun)?.state === 'below_horizon';
    document.documentElement.dataset.sky = H.skyPhase(get(E.sun));
    return `${weatherArt(H.weatherIcon(w?.state, night))}<b class="num">${Number.isFinite(t) ? Math.round(t) : '–'}°</b><span>${esc(H.conditionText(w?.state) || 'Weather unavailable')}<br>North Lakes</span>`;
  },

  people() {
    return PEOPLE.map((p) => {
      const s = get(p.id);
      const first = (s?.attributes?.friendly_name ?? p.id.split('.')[1]).split(' ')[0];
      const place = H.personPlace(s?.state);
      const batt = parseFloat(get(p.battery)?.state);
      const charging = String(get(p.charge)?.state ?? '').toLowerCase() === 'charging';
      const band = H.batteryBand(batt);
      return `<div class="person b"><span class="mono" style="background:${p.colour}">${esc(first[0] ?? '?')}</span>
        <span><span class="name">${esc(first)}</span><span class="where${place === 'Home' ? '' : ' away'}">${esc(place)}</span></span>
        <span class="batt num${band === 'low' ? ' low' : ''}${charging ? ' chg' : ''}" title="${charging ? 'Charging' : ''}">${Number.isFinite(batt) ? `${Math.round(batt)}%` : '—'}<i style="--lvl:${Number.isFinite(batt) ? Math.round(batt) : 0}%"></i></span></div>`;
    }).join('');
  },

  cal() {
    if (events === null) return '<p class="empty">Loading…</p>';
    const upcoming = events.slice(0, 3);
    if (!upcoming.length) return '<p class="empty">Nothing in the next two weeks.</p>';
    return upcoming.map((ev) => {
      const start = new Date(ev.start);
      const allDay = ev.allDay;
      const time = allDay ? 'All day' : fmtTime(start, tz);
      const day = start.toLocaleDateString('en-AU', { timeZone: tz, weekday: 'short' }).toUpperCase();
      const date = start.toLocaleDateString('en-AU', { timeZone: tz, day: 'numeric' });
      const today = start.toLocaleDateString('en-AU', { timeZone: tz }) === new Date().toLocaleDateString('en-AU', { timeZone: tz });
      return `<div class="ev"><div class="d num${today ? ' today' : ''}"><small>${today ? 'TODAY' : day}</small>${date}</div><div><span class="name">${esc(ev.summary)}</span><span class="sub">${esc(time)}${ev.location ? ` · ${esc(ev.location)}` : ''}</span></div></div>`;
    }).join('');
  },

  cars() {
    return CARS.map((c) => {
      const l = H.carLabel(get, c);
      const sub = [l.place, l.pct !== null ? `${l.pct}%` : null, l.charging ? 'charging' : null].filter(Boolean).join(' · ');
      return `<div class="car b${l.charging ? ' on' : ''}"><span class="well">${ic('car')}</span><span><span class="name">${c.name}</span><span class="sub">${esc(sub)}</span></span></div>`;
    }).join('');
  },

  banner() {
    const b = H.banner(get);
    const btn = H.bannerButtons(get);
    const el = $('#banner');
    el.classList.toggle('alert', b.level === 'urgent' || b.level === 'warn');
    el.classList.toggle('on', b.level === 'info');
    el.classList.toggle('calm', b.level === 'calm');
    const ctl = (show, act, text, cls = 'line', key) => (show ? `<button class="btn ${key && armed.has(key) ? 'armed' : cls}" data-act="${act}">${esc(key ? label(key, text) : text)}</button>` : '');
    const keepOn = (id) => (get(id)?.state === 'on' ? 'solid' : 'line');
    return `<span class="well">${ic(b.icon)}</span>
      <span class="grow"><b>${esc(b.title)}</b><span class="sub">${esc(b.sub)}</span></span>
      ${ctl(btn.close, 'close-garage', 'Close door', 'solid', 'close-garage')}
      ${ctl(btn.keepGarage, 'keep-garage', 'Keep garage open', keepOn(E.keepGarage))}
      ${ctl(btn.keepSide, 'keep-side', 'Keep side open', keepOn(E.keepSide))}
      ${ctl(btn.snooze, 'snooze', 'Snooze 30 min')}
      ${ctl(btn.endQuiet, 'end-quiet', 'End quiet hour')}`;
  },

  actions() {
    const qh = get(E.quietHour)?.state === 'on';
    const r = H.robbie(get);
    const festive = get(E.festive);
    return [
      tile({ act: 'good-night', icon: 'moon', name: 'Good Night', sub: 'Run scene', key: 'good-night' }),
      tile({ act: 'toggle', arg: E.festive, icon: 'sparkle', name: 'Festive', sub: festive?.state === 'on' ? 'On' : 'Off', on: festive?.state === 'on', off: isUnavailable(festive) }),
      tile({ act: 'announce', icon: qh ? 'bellOff' : 'megaphone', name: qh ? 'Quiet' : 'Announce', sub: qh ? 'Quiet hour on' : 'Speak', on: qh }),
      tile({ act: 'lost-phone', icon: 'phone', name: 'Lost Phone', sub: 'Ring' }),
      tile({ act: 'wifi', icon: 'wifi', name: 'WiFi', sub: 'Guest QR' }),
      tile({ act: 'robbie', icon: r.alert ? 'alert' : 'robot', name: 'Robbie', sub: r.label, on: r.on, alert: r.alert, cls: get(E.robbie)?.state === 'cleaning' ? 'spin' : '' }),
    ].join('');
  },

  rooms() {
    const r = H.rooms(get, mediaIds);
    const t = (path, icon, name, x) => tile({ act: 'go', arg: `#${path}`, icon, name, sub: x.label, on: x.on && !x.alert, alert: x.alert });
    return t('living-room', 'sofa', 'Living', r.living) + t('kidsroom', 'kids', 'Kids', r.kids) + t('garage', 'garage', 'Garage', r.garage)
      + t('outdoor', 'tree', 'Outdoor', r.outdoor) + t('laundry', 'washer', 'Laundry', r.laundry) + t('media', 'tv', 'Media', r.media);
  },

  media() {
    const tv = get(E.tv);
    const tvOn = tv && !['off', 'unavailable', 'unknown'].includes(tv.state);
    const tvSub = tvOn ? [tv.attributes.app_name ?? tv.attributes.source, tv.attributes.media_title].filter(Boolean).join(' · ') || 'On' : 'Off';
    const ac = get(E.aircon);
    const acOn = ac && !['off', 'unavailable', 'unknown'].includes(ac.state);
    const target = ac?.attributes?.temperature;
    const acSub = acOn ? `${H.conditionText(ac.attributes.hvac_action) || ac.state.replace(/_/g, ' ')}${target != null ? ` · ${target}°` : ''}` : `Off${ac?.attributes?.current_temperature != null ? ` · room ${ac.attributes.current_temperature}°` : ''}`;
    return tile({ act: 'tv', icon: 'tv', name: 'TV', sub: tvSub, on: tvOn, off: isUnavailable(tv) })
      + tile({ act: 'aircon', icon: 'snow', name: 'Aircon', sub: acSub.charAt(0).toUpperCase() + acSub.slice(1), on: acOn, off: isUnavailable(ac) });
  },

  lights() {
    const slots = H.lightSlots(get);
    const n = H.lightsOn(get);
    return `<h2 class="head">Lights <span class="num">${n} of ${LIGHT_POOL.length} on in the house</span></h2>` + slots.map((id) => {
      const s = get(id);
      const isOn = s?.state === 'on';
      const bri = s?.attributes?.brightness;
      const sub = isUnavailable(s) ? 'Unavailable' : isOn ? (bri != null ? `${Math.round((bri / 255) * 100)}%` : 'On') : 'Off';
      return `<button class="light b${isOn ? ' on' : ''}${isUnavailable(s) ? ' unavailable' : ''}" data-act="toggle" data-arg="${id}"${isUnavailable(s) ? ' disabled' : ''}>
        <span class="well">${ic(LIGHT_META[id]?.[1] ?? 'bulb')}</span><span><span class="name">${esc(H.lightName(get, id))}</span><span class="sub">${sub}</span></span></button>`;
    }).join('');
  },

  energy() {
    const e = H.energy(get);
    return `<h2 class="head">Energy <span>${esc(e.tariff)}</span></h2>
      <div class="stats num">
        <div><b>${e.today}</b><span class="sub">Today</span></div>
        <div class="credit"><b>${e.sold}</b><span class="sub">Sold</span></div>
        <div><b>${e.bill}</b><span class="sub">Bill to date</span></div>
        <div><b>${e.estimate}</b><span class="sub">Estimated bill</span></div>
      </div>
      <div class="flow num">
        <div class="node"><span class="well">${ic('tower')}</span><b>${e.grid.value}</b><span class="sub">${e.grid.label}</span></div>
        <span class="flowline ${e.grid.dir === 'in' ? 'to-right' : e.grid.dir === 'out' ? 'to-left' : 'idle'}"><i style="${phase(13200)}"></i></span>
        <div class="node"><span class="well">${ic('home')}</span><b>${e.home}</b><span class="sub">Home</span></div>
        <span class="flowline ${e.solar.active ? 'to-left' : 'idle'}"><i style="${phase(13200)}"></i></span>
        <div class="node"><span class="well">${ic(e.solar.active ? 'sun' : 'moon')}</span><b>${e.solar.value}</b><span class="sub">Solar</span></div>
      </div>
      <div><div class="evrow num">Tesla <span class="sub">${e.tesla.charging ? 'Charging' : 'Not charging'}</span><em>${e.tesla.value}</em></div>
        <div class="evrow num">Kia <span class="sub">${e.kia.charging ? 'Charging' : 'Not charging'}</span><em>${e.kia.value}</em></div></div>
      <div class="selfp num">Self-powered<i style="--lvl:${e.self}%"></i><b>${e.self}%</b></div>`;
  },

  util() {
    const bins = H.nextBins(get);
    const w = H.machine(get, E.washer, E.washerEnd);
    const d = H.machine(get, E.dryer, E.dryerEnd);
    const lids = bins ? `<span class="binlids">${bins.bins.map((b) => `<i class="${b.lid}" title="${b.label}"></i>`).join('')}</span>` : '';
    return `<div class="tile b"><span class="well">${ic('bin')}</span><span><span class="name">Bins</span><span class="sub">${bins ? esc(bins.when) : '—'}${lids}</span></span></div>`
      + tile({ act: 'go', arg: '#laundry', icon: 'washer', name: 'Washer', sub: w.short ?? w.label, on: w.on, cls: w.on ? 'spin' : '' })
      + tile({ act: 'go', arg: '#laundry', icon: 'dryer', name: 'Dryer', sub: d.short ?? d.label, on: d.on, cls: d.on ? 'spin' : '' });
  },

  alarm() {
    const s = get(E.alarm);
    const a = H.alarmState(s?.state);
    const el = $('#alarm');
    el.classList.toggle('alert', a.alert);
    const off = isUnavailable(s);
    const btn = (act, icon, text, cur) => `<button class="abtn${cur ? ' cur' : ''}" data-act="${act}"${off ? ' disabled' : ''}>${ic(icon)}${text}</button>`;
    const buttons = a.armed || a.alert
      ? btn('alarm-disarm', 'lock', 'Disarm', false) + btn('noop', s?.state === 'armed_away' ? 'away' : 'home', a.label, true)
      : btn('alarm-arm-home', 'home', 'Arm home', false) + btn('alarm-arm-away', 'away', 'Arm away', false);
    return `<div class="top"><span class="well">${ic('shield')}</span><span><span class="name">Home Alarm</span><span class="sub ${a.armed || a.alert ? '' : 'ok'}">${esc(a.label)}</span></span></div><div class="btns">${buttons}</div>`;
  },

  gdoor() {
    const cover = get(E.garageCover);
    const open = cover?.state === 'open' || get(E.garageContact)?.state === 'on';
    const sub = get(E.garageState)?.state ?? cover?.state ?? '—';
    return tile({ act: 'garage-toggle', icon: 'garage', name: 'Garage door', sub, alert: open, off: isUnavailable(cover), key: 'garage-toggle' });
  },

  fdoor() {
    const f = H.frontDoor(get);
    return tile({ act: 'front-toggle', icon: f.unlocked ? 'door' : 'lock', name: 'Front door', sub: f.label, alert: f.alert, off: isUnavailable(get(E.frontDoor)), key: 'front-toggle' });
  },
};

// ---- Routing (hash) ----
let route = 'home';
function onRoute() {
  const r = decodeURIComponent(location.hash.slice(1)) || 'home';
  route = r === 'home' || VIEWS[r] ? r : 'home';
  $('#home-body').hidden = route !== 'home';
  $('#subview').hidden = route === 'home';
  closeSheet();
  last.clear();
  renderAll();
  const shown = route === 'home' ? $('#home-body') : $('#subview');
  shown.classList.remove('enter'); void shown.offsetWidth; shown.classList.add('enter');
}
regions.subview = () => (VIEWS[route] ? VIEWS[route].render(viewCtx) : '');
const viewCtx = { get, esc, ic, armed, label, H, E, tz: () => tz, fmtTime, isUnavailable, tile, call, quiet,
  openSheet: (...a) => openSheet(...a), mediaIds: () => mediaIds, musicPanel: MUSIC_PANEL, isLocalImage: (u) => isLocalImage(u, location.origin) };

// Region output is only written when it changes, so taps and focus survive unrelated updates.
const last = new Map();
let pending = 0;
function renderAll() {
  if (pending) return;
  pending = requestAnimationFrame(() => {
    pending = 0;
    for (const [name, fn] of Object.entries(regions)) {
      // Home regions only render while Home is on screen; the sub-view only while one is.
      if (name !== 'tabs' && (name === 'subview') === (route === 'home')) continue;
      const html = fn();
      if (last.get(name) === html) continue;
      last.set(name, html);
      const el = document.getElementById(name);
      if (el) el.innerHTML = fillPhase(html);
    }
  });
}

// ---- Clock (once a second, outside the state render) ----
function tick() {
  const now = new Date();
  const t = fmtTime(now, tz);
  const [hm, ap = ''] = t.split(/\s/);
  const clk = $('#clock');
  if (clk.textContent !== hm) {
    // A small stamp when the minute changes (skipped on first paint).
    if (clk.textContent) { clk.classList.remove('stamp'); void clk.offsetWidth; clk.classList.add('stamp'); }
    clk.textContent = hm;
  }
  // Only touch the DOM when text changes: every write costs a restyle, more so while animations run.
  const put = (sel, v) => { const el = $(sel); if (el.textContent !== v) el.textContent = v; };
  put('#ampm', ap.toUpperCase());
  const hour = Number(now.toLocaleString('en-AU', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }));
  put('#hello', `${H.greeting(hour)}, ${now.toLocaleDateString('en-AU', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' })}`);
  put('#india', fmtTime(now, 'Asia/Kolkata'));
  put('#austin', fmtTime(now, 'America/Chicago'));
}

// ---- Actions ----
const sheet = () => $('#sheet');
function openSheet(html, onOpen) {
  const d = sheet();
  d.innerHTML = `${html}<button class="btn line close b" data-act="sheet-close">Close</button>`;
  if (!d.open) { d.showModal(); if (inKioskSatellite()) quiet(Promise.resolve(ks.setInteractionActive?.(true, 'dashboard'))); }
  onOpen?.(d);
}
function closeSheet() { if (sheet().open) sheet().close(); }
sheet().addEventListener('close', () => { stopLiveCam(); if (inKioskSatellite()) quiet(Promise.resolve(ks.setInteractionActive?.(false, 'dashboard'))); });
sheet().addEventListener('click', (e) => { if (e.target === sheet()) closeSheet(); });

const ACTIONS = {
  noop() {},
  'sheet-close': closeSheet,
  go: (arg) => { if (arg.startsWith('#')) location.hash = arg; else location.href = arg; },
  rooms: () => openSheet(`<h2>Rooms</h2><div class="acts">${ROOM_ROUTES.map(([r, n, i]) => `<button class="tile b" data-act="go" data-arg="#${r}">${ic(i)}${n}</button>`).join('')}</div>`),
  // "domain.service|entity_id[,entity_id…]|{json}"
  call: (arg) => { const [svc, id, data] = arg.split('|'); const [d, s] = svc.split('.'); const ids = id.split(','); quiet(call(d, s, { entity_id: ids.length > 1 ? ids : id, ...(data ? JSON.parse(data) : {}) })); },
  temp: (arg) => {
    const [id, dir] = arg.split('|');
    const a = get(id)?.attributes ?? {};
    if (a.temperature == null) return;
    const step = a.target_temp_step ?? 0.5;
    const v = Math.min(a.max_temp ?? 32, Math.max(a.min_temp ?? 16, Math.round((a.temperature + Number(dir) * step) * 10) / 10));
    quiet(call('climate', 'set_temperature', { entity_id: id, temperature: v }));
  },
  'cam-live': (id) => liveCamSheet(id),
  'call-confirm': (arg) => confirmOr(arg, () => ACTIONS.call(arg)),
  toggle: (arg) => quiet(call('homeassistant', 'toggle', { entity_id: arg })),
  'good-night': () => confirmOr('good-night', () => quiet(call('scene', 'turn_on', { entity_id: E.goodNight }))),
  'close-garage': () => confirmOr('close-garage', () => quiet(call('cover', 'close_cover', { entity_id: E.garageCover }))),
  'keep-garage': () => quiet(call('input_boolean', 'toggle', { entity_id: E.keepGarage })),
  'keep-side': () => quiet(call('input_boolean', 'toggle', { entity_id: E.keepSide })),
  snooze: () => quiet(call('input_boolean', 'toggle', { entity_id: E.snooze })),
  'end-quiet': () => quiet(call('input_boolean', 'turn_off', { entity_id: E.quietHour })),
  'garage-toggle': () => confirmOr('garage-toggle', () => quiet(call('cover', 'toggle', { entity_id: E.garageCover }))),
  'front-toggle': () => {
    // Unlocking asks for a second tap; locking doesn't.
    const unlock = get(E.frontDoor)?.state === 'off';
    const run = () => quiet(call('input_boolean', 'toggle', { entity_id: E.frontDoor }));
    if (unlock) confirmOr('front-toggle', run); else run();
  },
  tv: () => quiet(call('script', 'turn_on', { entity_id: 'script.media_tv_power' })),
  'alarm-arm-home': () => alarmCall('alarm_arm_home'),
  'alarm-arm-away': () => alarmCall('alarm_arm_away'),
  'alarm-disarm': () => alarmCall('alarm_disarm'),
  announce: announceSheet,
  more: moreSheet,
  'lost-phone': lostPhoneSheet,
  wifi: () => openSheet(`<h2>Guest WiFi</h2><p>Scan with a phone camera to join.</p><img src="${WIFI_QR}" alt="WiFi QR code" style="display:block;width:280px;height:280px;margin:16px auto 0;background:#fff;border-radius:6px">`),
  robbie: robbieSheet,
  aircon: airconSheet,
  cam: camSheet,
};

function alarmCall(service) {
  const s = get(E.alarm);
  const needsCode = s?.attributes?.code_format && (service === 'alarm_disarm' || s.attributes.code_arm_required !== false);
  if (!needsCode) return quiet(call('alarm_control_panel', service, { entity_id: E.alarm }));
  const words = { alarm_arm_home: 'Arm home', alarm_arm_away: 'Arm away', alarm_disarm: 'Disarm' };
  openSheet(`<h2>${words[service]}</h2><p>Enter the alarm code.</p>
    <input id="code" type="password" inputmode="numeric" autocomplete="off" aria-label="Alarm code">
    <div class="acts"><button class="tile b on" data-sheet="code-go">${ic('shield')}${words[service]}</button></div>`, (d) => {
    d.querySelector('#code').focus();
    d.querySelector('[data-sheet="code-go"]').onclick = () => {
      const code = d.querySelector('#code').value;
      quiet(call('alarm_control_panel', service, { entity_id: E.alarm, code }).then(closeSheet));
    };
  });
}

function announceSheet() {
  const qh = get(E.quietHour)?.state === 'on';
  const speakers = get(E.announceSpeaker)?.attributes?.options ?? ['Home', 'Kitchen', 'Media Room'];
  const cur = get(E.announceSpeaker)?.state;
  openSheet(`<h2>Announce</h2>${qh ? '<p>Quiet hour is on. Automated announcements are suppressed.</p>' : '<p>Speak a message on the speakers.</p>'}
    <select id="spk" aria-label="Speakers">${speakers.map((o) => `<option${o === cur ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>
    <input id="msg" maxlength="255" placeholder="Message" aria-label="Message">
    <div class="acts">
      <button class="tile b on" data-sheet="say">${ic('megaphone')}Announce</button>
      <button class="tile b" data-sheet="quiet">${ic('bellOff')}${qh ? 'End quiet hour' : 'Start quiet hour'}</button>
    </div>`, (d) => {
    d.querySelector('[data-sheet="say"]').onclick = async () => {
      const message = d.querySelector('#msg').value.trim();
      if (!message) { d.querySelector('#msg').focus(); return; }
      try {
        await call('input_select', 'select_option', { entity_id: E.announceSpeaker, option: d.querySelector('#spk').value });
        await call('input_text', 'set_value', { entity_id: E.announceMessage, value: message });
        await call('script', 'turn_on', { entity_id: 'script.announce_from_helpers' });
        closeSheet();
      } catch { /* toast already shown */ }
    };
    d.querySelector('[data-sheet="quiet"]').onclick = () => quiet(call('input_boolean', qh ? 'turn_off' : 'turn_on', { entity_id: E.quietHour }).then(closeSheet));
  });
}

function lostPhoneSheet() {
  let phone = 'Sushen';
  let code = '';
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'go'];
  openSheet(`<h2>Lost Phone</h2><p id="lpmsg">Enter passcode</p>
    <div class="acts" id="lpwho">${['Sushen', 'Paro'].map((p) => `<button class="tile b${p === phone ? ' on' : ''}" data-phone="${p}">${ic('phone')}${p}</button>`).join('')}</div>
    <div class="acts" style="grid-template-columns:repeat(3,1fr)">${keys.map((k) => `<button class="tile b" data-key="${k}" style="justify-content:center;font-size:22px;font-weight:700">${k === 'clear' ? 'Clear' : k === 'go' ? 'Send' : k}</button>`).join('')}</div>`, (d) => {
    const msg = d.querySelector('#lpmsg');
    const show = () => { msg.textContent = code ? '•'.repeat(code.length) : 'Enter passcode'; };
    d.querySelectorAll('[data-phone]').forEach((b) => { b.onclick = () => { phone = b.dataset.phone; d.querySelectorAll('[data-phone]').forEach((x) => x.classList.toggle('on', x === b)); }; });
    d.querySelectorAll('[data-key]').forEach((b) => {
      b.onclick = async () => {
        const k = b.dataset.key;
        if (k === 'clear') { code = ''; show(); return; }
        if (k !== 'go') { if (code.length < 4) code += k; show(); return; }
        if (code.length < 4) return;
        msg.textContent = 'Checking…';
        try {
          const res = await conn.sendMessagePromise({ type: 'call_service', domain: 'script', service: 'lost_phone', service_data: { passcode: code, phone }, return_response: true });
          const ok = res?.response?.ok;
          msg.textContent = ok === true ? `Alert sent to ${phone}` : ok === false ? 'Wrong passcode' : 'Not confirmed: update the script';
          code = '';
          if (ok === true) setTimeout(closeSheet, 1500);
        } catch (err) {
          msg.textContent = /passcode|denied/i.test(err?.message ?? '') ? 'Wrong passcode' : `Error: ${String(err?.message ?? errorCode(err)).slice(0, 40)}`;
          code = '';
        }
      };
    });
  });
}

function moreSheet() {
  const draw = () => `<h2>More</h2>
    <div class="acts">${MORE.map(([name, icon, href]) => `<button class="tile b" data-act="go" data-arg="${href}">${ic(icon)}${name}</button>`).join('')}
      <button class="tile b${armed.has('restart') ? ' alert' : ''}" data-sheet="restart">${ic('alert')}${armed.has('restart') ? 'Tap again to restart' : 'Restart Home Assistant'}</button></div>`;
  openSheet(draw(), function wire(d) {
    d.querySelector('[data-sheet="restart"]').onclick = () => {
      if (armed.has('restart')) { clearTimeout(armed.get('restart')); armed.delete('restart'); quiet(call('homeassistant', 'restart')); closeSheet(); return; }
      armed.set('restart', setTimeout(() => { armed.delete('restart'); if (d.open) { d.innerHTML = draw() + '<button class="btn line close b" data-act="sheet-close">Close</button>'; wire(d); } }, CONFIRM_WINDOW_MS));
      d.innerHTML = draw() + '<button class="btn line close b" data-act="sheet-close">Close</button>'; wire(d);
    };
  });
}

function robbieSheet() {
  const r = H.robbie(get);
  const cleaning = get(E.robbie)?.state === 'cleaning';
  openSheet(`<h2>Robbie</h2><p>${esc(r.label)}</p>
    <div class="acts">
      <button class="tile b" data-svc="vacuum.${cleaning ? 'pause' : 'start'}">${ic(cleaning ? 'pause' : 'play')}${cleaning ? 'Pause' : 'Start'}</button>
      <button class="tile b" data-svc="vacuum.return_to_base">${ic('home')}Dock</button>
      <button class="tile b" data-svc="vacuum.stop">${ic('stop')}Stop</button>
    </div>
    <div class="acts">${ROBBIE_ROOMS.map(([id, name]) => `<button class="tile b" data-press="${id}">${ic('robot')}${esc(name)}</button>`).join('')}</div>`, (d) => {
    d.querySelectorAll('[data-svc]').forEach((b) => { const [dom, svc] = b.dataset.svc.split('.'); b.onclick = () => quiet(call(dom, svc, { entity_id: E.robbie })); });
    d.querySelectorAll('[data-press]').forEach((b) => { b.onclick = () => quiet(call('button', 'press', { entity_id: b.dataset.press }).then(closeSheet)); });
  });
}

function airconSheet() {
  const draw = () => {
    const ac = get(E.aircon);
    const a = ac?.attributes ?? {};
    const modes = a.hvac_modes ?? ['off', 'cool', 'heat', 'auto'];
    const step = a.target_temp_step ?? 0.5;
    return `<h2>Aircon</h2><p>Room ${a.current_temperature ?? '—'}° · target ${a.temperature ?? '—'}°</p>
      <div class="acts">${modes.map((m) => `<button class="tile b${ac?.state === m ? ' on' : ''}" data-mode="${m}">${esc(m.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()))}</button>`).join('')}</div>
      <div class="acts"><button class="tile b" data-temp="${-step}">${ic('stop')}Cooler</button><button class="tile b" data-temp="${step}">${ic('sun')}Warmer</button></div>`;
  };
  openSheet(draw(), function wire(d) {
    d.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => quiet(call('climate', 'set_hvac_mode', { entity_id: E.aircon, hvac_mode: b.dataset.mode })); });
    d.querySelectorAll('[data-temp]').forEach((b) => {
      b.onclick = () => {
        const a = get(E.aircon)?.attributes ?? {};
        if (a.temperature == null) return;
        const v = Math.min(a.max_temp ?? 32, Math.max(a.min_temp ?? 16, Math.round((a.temperature + Number(b.dataset.temp)) * 10) / 10));
        quiet(call('climate', 'set_temperature', { entity_id: E.aircon, temperature: v }));
      };
    });
  });
}

// ---- Camera ----
const camPaused = new Set();
let liveTimer = 0;
function camUrl(id) {
  const pic = get(id)?.attributes?.entity_picture;
  return isLocalImage(pic, location.origin) ? `${pic}${pic.includes('?') ? '&' : '?'}_ts=${Date.now()}` : null;
}
function refreshCam() {
  if (camPaused.size) return;
  // Sub-view camera tiles: re-read entity_picture (its token rotates) and bust the cache.
  document.querySelectorAll('#subview img[data-cam]').forEach((img) => { const u = camUrl(img.dataset.cam); if (u) img.src = u; });
  const url = camUrl(E.camera);
  const img = $('#camimg');
  if (url) img.src = url;
  const s = get(E.camera);
  $('#camtime').textContent = s ? `Updated ${fmtTime(new Date(s.last_updated), tz)}` : '';
}
$('#camimg').addEventListener('error', (e) => e.target.classList.add('err'));
$('#camimg').addEventListener('load', (e) => { e.target.classList.remove('err'); e.target.hidden = false; });
// Live view: HA's MJPEG stream (camera_proxy_stream), which <img> plays natively and every camera
// supports (HA falls back to fast stills for cameras without MJPEG). If the stream fails, poll snapshots.
let liveImg = null;
function streamUrl(id) {
  const pic = get(id)?.attributes?.entity_picture;
  return isLocalImage(pic, location.origin) && pic.includes('/api/camera_proxy/') ? pic.replace('/api/camera_proxy/', '/api/camera_proxy_stream/') : null;
}
function startLive(img, ids) {
  liveImg = img;
  const id = ids.find((i) => streamUrl(i));
  const poll = () => { const u = ids.map(camUrl).find(Boolean); if (u) img.src = u; };
  img.onerror = () => { img.onerror = null; console.warn('kiosk-home: live stream failed, showing snapshots'); poll(); liveTimer = setInterval(poll, 2000); };
  if (id) img.src = streamUrl(id); else img.onerror();
}
const liveMarkup = (name) => `<img id="live" alt="${esc(name)} live view" style="display:block;width:100%;aspect-ratio:16/9;object-fit:contain;margin-top:12px;border-radius:6px;background:var(--well)">`;
function liveCamSheet(id) {
  const name = get(id)?.attributes?.friendly_name ?? 'Camera';
  openSheet(`<h2>${esc(name)}</h2>${liveMarkup(name)}`, (d) => startLive(d.querySelector('#live'), [id]));
}
function camSheet() {
  openSheet(`<h2>Front Door</h2>${liveMarkup('Front door')}
    <div class="acts"><button class="tile b" data-act="go" data-arg="#security">${ic('shield')}Open Security</button></div>`, (d) => startLive(d.querySelector('#live'), [E.cameraLive, E.camera]));
}
// Closing the sheet must end the stream, or the tablet keeps downloading video in the background.
function stopLiveCam() {
  clearInterval(liveTimer); liveTimer = 0;
  if (liveImg) { liveImg.onerror = null; liveImg.removeAttribute('src'); liveImg = null; }
}

// Sub-view actions get the same context as their render.
for (const v of Object.values(VIEWS)) for (const [k, fn] of Object.entries(v.actions ?? {})) ACTIONS[k] = (arg) => fn(arg, viewCtx);

// ---- Click delegation ----
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]');
  if (t && !t.disabled) { ACTIONS[t.dataset.act]?.(t.dataset.arg); return; }
  if (e.target.closest('#cam')) ACTIONS.cam();
});

// ---- Scaling, screensaver and visibility ----
function fit() {
  const cs = getComputedStyle(document.documentElement);
  const inset = (n) => parseFloat(cs.getPropertyValue(`--ks-content-inset-${n}`)) || 0;
  const w = window.innerWidth - inset('left') - inset('right');
  const h = window.innerHeight - inset('top') - inset('bottom');
  const stage = $('#stage');
  stage.style.setProperty('--fit', String(Math.min(w / 1280, h / 800)));
  stage.style.left = `${inset('left') + w / 2}px`;
  stage.style.top = `${inset('top') + h / 2}px`;
}

// ---- Data ----
async function subscribeCalendar() {
  const start = new Date();
  const end = new Date(start.getTime() + 14 * 86400000);
  const norm = (v) => (typeof v === 'string' ? v : v?.dateTime ?? v?.date);
  try {
    await conn.subscribeMessage((msg) => {
      events = (msg.events ?? []).map((ev) => {
        const s = norm(ev.start);
        return { summary: ev.summary, location: ev.location, start: s?.length === 10 ? `${s}T00:00:00` : s, allDay: s?.length === 10 };
      }).filter((ev) => new Date(ev.start).getTime() >= Date.now() - 3600_000 || ev.allDay)
        .sort((a, b) => new Date(a.start) - new Date(b.start));
      renderAll();
    }, { type: 'calendar/event/subscribe', entity_id: E.calendar, start: start.toISOString(), end: end.toISOString() });
  } catch (err) {
    console.warn(`kiosk-home: calendar subscribe failed (${errorCode(err)})`);
    events = [];
    renderAll();
  }
}

function entityIds(allStates) {
  const ids = new Set([...Object.values(E), ...LIGHT_POOL, ...SECURITY_CONTACTS, ...BINS.map((b) => b.id)]);
  PEOPLE.forEach((p) => [p.id, p.battery, p.charge].forEach((i) => ids.add(i)));
  CARS.forEach((c) => [c.tracker, c.battery, c.chargingPower, c.chargingFlag].filter(Boolean).forEach((i) => ids.add(i)));
  mediaIds = allStates.map((s) => s.entity_id).filter((id) => id.startsWith('media_player.'));
  mediaIds.forEach((i) => ids.add(i));
  ids.add('switch.bedroom_tv');
  viewEntityIds().forEach((i) => ids.add(i));
  return [...ids];
}

async function boot() {
  injectIcons();
  fit();
  addEventListener('resize', fit);
  showMessage('Connecting to Home Assistant…');
  try {
    ({ conn, via } = await connect({ onRetry: () => showMessage(MESSAGES.unreachable, 'retry') }));
  } catch (err) {
    if (err instanceof FatalConnectError) { console.warn(`kiosk-home: ${err.kind}`); showMessage(err.message, 'error'); return; }
    throw err;
  }
  const [cfg, all] = await Promise.all([conn.sendMessagePromise({ type: 'get_config' }).catch(() => null), conn.sendMessagePromise({ type: 'get_states' })]);
  if (cfg?.time_zone) tz = cfg.time_zone;
  const ids = entityIds(all);
  const wanted = new Set(ids);
  for (const s of all) if (wanted.has(s.entity_id)) states.set(s.entity_id, s);
  console.info(`kiosk-home: ${ids.length} entities via ${via}, time zone ${tz}`);

  tick(); setInterval(tick, 1000);
  addEventListener('hashchange', onRoute);
  onRoute();
  $('#message').hidden = true;

  let replace = true;
  conn.addEventListener('ready', () => { replace = true; const c = $('#conn'); if (c) c.textContent = ''; });
  conn.addEventListener('disconnected', () => { const c = $('#conn'); if (c) c.textContent = 'Reconnecting…'; });
  conn.addEventListener('reconnect-error', () => showMessage(via === 'kiosk-satellite' ? MESSAGES.ksAuth : MESSAGES.noSession, 'error'));
  await conn.subscribeMessage((msg) => {
    const changed = applyEntityDiff(states, msg, replace);
    replace = false;
    if (changed.size) renderAll();
    if (changed.has(E.camera)) refreshCam();
  }, { type: 'subscribe_entities', entity_ids: ids });
  subscribeCalendar();

  // Banner durations and appliance countdowns move with time, not just state.
  setInterval(renderAll, 30_000);
  refreshCam();
  setInterval(refreshCam, CAMERA_REFRESH_MS);
  const still = () => document.documentElement.classList.toggle('still', camPaused.size > 0);
  document.addEventListener('visibilitychange', () => { if (document.hidden) camPaused.add('hidden'); else { camPaused.delete('hidden'); refreshCam(); } still(); });
  if (inKioskSatellite()) {
    const onKs = (s) => { if (s?.screensaver?.active) camPaused.add('saver'); else { camPaused.delete('saver'); refreshCam(); } still(); };
    addEventListener('kiosksatellite:kiosk-state', (e) => onKs(e.detail));
    quiet(Promise.resolve(ks.getKioskState?.()).then(onKs));
  }
}

boot().catch((err) => {
  console.error(`kiosk-home: start-up failed (${errorCode(err)})`);
  showMessage(`Something went wrong loading this page (${errorCode(err)}). Reload to try again.`, 'error');
});
