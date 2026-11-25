// SuPar Home, live block print page for Kiosk Satellite. Boot, rendering, actions and sheets.
import { VERSION, E, PEOPLE, CARS, NAV, ROOM_ROUTES, MORE, MUSIC_PANEL, KS_MUSIC, MEDIA_PLAYERS, THEME, ROBBIE_ROOMS, ROBBIE_IMAGE, TV_SOURCES, WIFI_QR, LIGHT_META, LIGHT_POOL, SECURITY_CONTACTS, BINS, CAMERA_REFRESH_MS, CONFIRM_WINDOW_MS } from './config.js?v=33';
import { connect, FatalConnectError, MESSAGES, inKioskSatellite, errorCode } from './connection.js?v=33';
import { applyEntityDiff, isUnavailable, isLocalImage } from './state.js?v=33';
import * as H from './home.js?v=33';
import { injectIcons, ic, weatherArt } from './icons.js?v=33';
import { VIEWS, viewEntityIds } from './views.js?v=33';
import { callService as hawsCallService } from './vendor/haws.mjs?v=33';

console.info(`kiosk-home-glass loaded v${VERSION}`);

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
const tile = ({ act, arg = '', icon, name, sub, on = false, alert = false, off = false, cls = '', key, hold }) =>
  `<button class="tile b ${cls}${on ? ' on' : ''}${alert ? ' alert' : ''}${off ? ' unavailable' : ''}" data-act="${act}" data-arg="${esc(arg)}"${hold ? ` data-hold="${esc(hold)}"` : ''}${off ? ' disabled' : ''}${cls.includes('spin') ? ` style="--ph:__PH9600__"` : ''}>
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
      if (r === 'music' && ksMusic.nowPlaying + ksMusic.library) return `<button class="tab" data-act="ks-music">${ic(icon)}${name}</button>`;
      if (r === 'more' || r === 'rooms') return `<button class="tab${here}" data-act="${r}">${ic(icon)}${name}${badge}</button>`;
      return `<a class="tab${here}" href="#${r}">${ic(icon)}${name}${badge}</a>`;
    }).join('') + `<span class="grow"></span><span class="conn" id="conn"></span>`;
  },

  wx() {
    const w = get(E.weather);
    const t = parseFloat(w?.attributes?.temperature);
    const night = get(E.sun)?.state === 'below_horizon';
    document.documentElement.dataset.sky = H.skyPhase(get(E.sun));
    return `${weatherArt(H.weatherIcon(w?.state, night))}<b class="num">${Number.isFinite(t) ? Math.round(t) : '–'}°</b><span>${esc(H.conditionText(w?.state) || 'Weather unavailable')}<br>Griffin</span>`;
  },

  people() {
    return PEOPLE.map((p) => {
      const s = get(p.id);
      const first = (s?.attributes?.friendly_name ?? p.id.split('.')[1]).split(' ')[0];
      const place = H.personPlace(s?.state);
      const batt = parseFloat(get(p.battery)?.state);
      const charging = H.isCharging(get, p.charge);
      const band = H.batteryBand(batt);
      const pic = s?.attributes?.entity_picture;
      const face = isLocalImage(pic, location.origin) ? `<img class="avatar" src="${esc(pic)}" alt="">` : esc(first[0] ?? '?');
      const hasPic = face.startsWith('<img');
      return `<div class="person b"><span class="mono${hasPic ? ' pic' : ''}" style="${hasPic ? '' : `background:${p.colour}`}">${face}</span>
        <span><span class="name">${esc(first)}</span><span class="where${place === 'Home' ? '' : ' away'}">${esc(place)}</span></span>
        <span class="batt num${band === 'low' ? ' low' : ''}${charging ? ' chg' : ''}" title="${charging ? 'Charging' : ''}">${Number.isFinite(batt) ? `${Math.round(batt)}%` : '—'}<i style="--lvl:${Number.isFinite(batt) ? Math.round(batt) : 0}%">${charging ? '<b class="fillup"></b>' : ''}</i></span></div>`;
    }).join('');
  },

  cal() {
    if (events === null) return '<p class="empty">Loading…</p>';
    const upcoming = events.slice(0, 3);
    if (!upcoming.length) return '<p class="empty">Nothing in the next two weeks.</p>';
    let prevDay = '';
    return upcoming.map((ev) => {
      const start = new Date(ev.start);
      const allDay = ev.allDay;
      const time = allDay ? 'All day' : fmtTime(start, tz);
      const day = start.toLocaleDateString('en-AU', { timeZone: tz, weekday: 'short' }).toUpperCase();
      const date = start.toLocaleDateString('en-AU', { timeZone: tz, day: 'numeric' });
      const today = start.toLocaleDateString('en-AU', { timeZone: tz }) === new Date().toLocaleDateString('en-AU', { timeZone: tz });
      // One date stamp per day: a second event on the same day lines up under the first without repeating it.
      const key = start.toLocaleDateString('en-AU', { timeZone: tz });
      const same = key === prevDay; prevDay = key;
      return `<div class="ev${same ? ' same' : ''}">${same ? '<div class="d none" aria-hidden="true"></div>' : `<div class="d num${today ? ' today' : ''}"><small>${today ? 'TODAY' : day}</small>${date}</div>`}<div><span class="name">${esc(ev.summary)}</span><span class="sub">${esc(time)}${ev.location ? ` · ${esc(ev.location)}` : ''}</span></div></div>`;
    }).join('');
  },

  cars() {
    return CARS.map((c, i) => {
      const l = H.carLabel(get, c);
      const sub = [l.place, l.pct !== null ? `${l.pct}%` : null, l.charging ? 'charging' : null].filter(Boolean).join(' · ');
      return `<button class="car b${l.charging ? ' on' : ''}" data-act="car" data-arg="${i}">${carBadge(c)}<span><span class="name">${c.name}</span><span class="sub">${esc(sub)}</span></span></button>`;
    }).join('');
  },

  banner() {
    const b = H.banner(get);
    const btn = H.bannerButtons(get);
    const el = $('#banner');
    // Colour by the highest priority: red (urgent), amber (warn), grey (note).
    el.classList.toggle('alert', b.level === 'urgent');
    el.classList.toggle('warn', b.level === 'warn');
    el.classList.toggle('calm', b.level === 'calm');
    el.classList.toggle('note', b.level === 'note');
    const ctl = (show, act, text, cls = 'line', key) => (show ? `<button class="btn ${key && armed.has(key) ? 'armed' : cls}" data-act="${act}">${esc(key ? label(key, text) : text)}</button>` : '');
    const keepOn = (id) => (get(id)?.state === 'on' ? 'solid' : 'line');
    return `<span class="well">${ic(b.icon)}</span>
      <span class="grow"><span class="track"><b>${esc(b.title)}</b><span class="sub">${esc(b.sub)}</span>${b.chips.length ? '<span class="sep"></span>' : ''}${b.chips.map((c) => `<span class="chip ${c.level}">${ic(c.icon)}${esc(c.text)}</span>`).join('')}</span></span>
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
      + t('outdoor', 'tree', 'Outdoor', r.outdoor) + t('laundry', 'washer', 'Laundry', r.laundry)
      + tile({ act: 'media', icon: 'tv', name: 'Media', sub: r.media.label, on: r.media.on });
  },

  media() {
    const tv = get(E.tv);
    const tvOn = tv && !['off', 'unavailable', 'unknown'].includes(tv.state);
    const tvSub = tvOn ? [tv.attributes.app_name ?? tv.attributes.source, tv.attributes.media_title].filter(Boolean).join(' · ') || 'On' : 'Off';
    const ac = get(E.aircon);
    const acOn = ac && !['off', 'unavailable', 'unknown'].includes(ac.state);
    const target = ac?.attributes?.temperature;
    // Room temperature first; while running, the mode and target after it.
    const room = ac?.attributes?.current_temperature;
    const acSub = `${room != null ? `Room ${room}°` : 'Room —'}${acOn ? ` · ${H.conditionText(ac.attributes.hvac_action) || ac.state.replace(/_/g, ' ')}${target != null ? ` ${target}°` : ''}` : ''}`;
    return tile({ act: 'tv', icon: 'tv', name: 'TV', sub: tvSub, on: tvOn, off: isUnavailable(tv), hold: 'act:tv-remote' })
      + tile({ act: 'aircon', icon: 'snow', name: 'Living Aircon', sub: acSub, on: acOn, off: isUnavailable(ac) });
  },

  lights() {
    const slots = H.lightSlots(get);
    const n = H.lightsOn(get);
    return `<h2 class="head">Lights <span class="num">${n} of ${LIGHT_POOL.length} on in the house</span></h2>` + slots.map((id) => {
      const s = get(id);
      const isOn = s?.state === 'on';
      const bri = s?.attributes?.brightness;
      const sub = isUnavailable(s) ? 'Unavailable' : isOn ? (bri != null ? `${Math.round((bri / 255) * 100)}%` : 'On') : 'Off';
      return `<button class="light b${isOn ? ' on' : ''}${isUnavailable(s) ? ' unavailable' : ''}" data-act="toggle" data-arg="${id}" data-hold="${id}"${isUnavailable(s) ? ' disabled' : ''}>
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
        <div class="node n-grid"><span class="well">${ic('tower')}</span><b>${e.grid.value}</b><span class="sub">${e.grid.label}</span></div>
        <span class="flowline ${e.grid.dir === 'in' ? 'to-right imp' : e.grid.dir === 'out' ? 'to-left exp' : 'idle'}"><i style="${phase(2200)}"></i></span>
        <div class="node n-home"><span class="well">${ic('home')}</span><b>${e.home}</b><span class="sub">Home</span></div>
        <span class="flowline ${e.solar.active ? 'to-left exp' : 'idle'}"><i style="${phase(2200)}"></i></span>
        <div class="node n-solar"><span class="well">${ic(e.solar.active ? 'sun' : 'moon')}</span><b>${e.solar.value}</b><span class="sub">Solar</span></div>
      </div>
      <div>${[['Tesla', e.tesla], ['Kia', e.kia]].map(([n, v]) => `<div class="evrow num${v.charging ? ' chg' : ''}">${v.charging ? `<span class="evbolt" style="animation-delay:__PH1400__">${ic('bolt')}</span>` : ''}${n} <span class="sub">${v.charging ? 'Charging' : 'Not charging'}</span><em>${v.value}</em></div>`).join('')}</div>
      <div class="selfp num">Self-powered<i style="--lvl:${e.self}%"></i><b>${e.self}%</b></div>`;
  },

  util() {
    const bins = H.nextBins(get);
    const w = H.machine(get, E.washer, E.washerEnd);
    const d = H.machine(get, E.dryer, E.dryerEnd);
    // Bin icons in the bin's colour: general (red bin), recycling (yellow recycle), garden organics (green leaf).
    const BIN_ICON = { r: 'bin', y: 'recycle', g: 'leaf' };
    const lids = bins ? `<span class="binicons">${bins.bins.map((b) => `<span class="binico ${b.lid}" title="${esc(b.label)}">${ic(BIN_ICON[b.lid] ?? 'bin')}</span>`).join('')}</span>` : '';
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
// Tile names too long for their tile scroll gently (a ticker) instead of being cut off.
// Only names that overflow get it, and it is transform-only, paused with the rest under html.still.
function tickers(root) {
  for (const n of root.querySelectorAll('button.b .name:not(.tick)')) {
    if (n.scrollWidth <= n.clientWidth + 1 && n.scrollHeight <= n.clientHeight + 1) continue;
    n.classList.add('tick');
    n.innerHTML = `<span class="tk">${n.innerHTML}</span>`;
    const dist = n.scrollWidth - n.clientWidth;
    if (dist <= 1) { n.classList.remove('tick'); n.innerHTML = n.firstChild.innerHTML; continue; }
    n.style.setProperty('--tk', `${-dist - 4}px`);
    n.style.setProperty('--tkd', `${Math.max(7, 4 + dist / 12).toFixed(1)}s`);
  }
}
document.fonts?.ready.then(() => tickers(document.body));

function renderAll() {
  if (pending) return;
  pending = requestAnimationFrame(() => {
    pending = 0;
    applyTheme();
    // A live sheet (cars, light details) re-renders with state, like a region.
    if (liveSheet && sheet().open && !sliding) {
      const h = liveSheet();
      if (h !== lastSheet) { lastSheet = h; sheet().innerHTML = h + CLOSE; mediaClock(); }
    }
    for (const [name, fn] of Object.entries(regions)) {
      // Home regions only render while Home is on screen; the sub-view only while one is.
      if (name !== 'tabs' && (name === 'subview') === (route === 'home')) continue;
      const html = fn();
      if (last.get(name) === html) continue;
      last.set(name, html);
      const el = document.getElementById(name);
      if (el) { el.innerHTML = fillPhase(html); tickers(el); if (name === 'banner') bannerTicker(el); }
    }
  });
}

// The banner scrolls like a ticker when its alerts don't fit: a copy follows the text round, transform only
// (paused with everything else under html.still). Short text stays still.
function bannerTicker(el) {
  const g = el.querySelector('.grow'), t = g?.querySelector('.track');
  if (!t) return;
  g.classList.remove('tick');
  if (t.scrollWidth <= g.clientWidth + 1) return;
  t.innerHTML += `<span class="gap" aria-hidden="true"></span><span class="copy" aria-hidden="true">${t.innerHTML}</span>`;
  const shift = t.querySelector('.copy').offsetLeft;
  t.style.setProperty('--tk', `${-shift}px`);
  t.style.setProperty('--tkd', `${Math.max(8, shift / 45).toFixed(1)}s`);
  g.classList.add('tick');
}
addEventListener('resize', () => { const el = $('#banner'); if (el) { last.delete('banner'); renderAll(); } });

// Dark after sunset, light after sunrise (THEME 'sun'), whatever the tablet is set to. Until sun.sun is known,
// and with THEME 'system', the tablet's own setting applies.
function applyTheme() {
  const sun = get(E.sun)?.state;
  const want = THEME === 'sun' && (sun === 'below_horizon' || sun === 'above_horizon') ? (sun === 'below_horizon' ? 'dark' : 'light') : null;
  const root = document.documentElement;
  if (want && root.dataset.theme !== want) { root.dataset.theme = want; root.style.colorScheme = want; if (route !== 'home') last.delete('subview'); }
  if (!want && root.dataset.theme) { delete root.dataset.theme; root.style.colorScheme = ''; }
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
  // The energy HUD shows the time too: redraw it when the minute changes while it's on screen.
  if (hm !== tick.hm) { tick.hm = hm; if (route === 'energy-dashboard') { last.delete('subview'); renderAll(); } }
  // Only touch the DOM when text changes: every write costs a restyle, more so while animations run.
  const put = (sel, v) => { const el = $(sel); if (el.textContent !== v) el.textContent = v; };
  put('#ampm', ap.toUpperCase());
  const hour = Number(now.toLocaleString('en-AU', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }));
  put('#hello', `${H.greeting(hour)}, ${now.toLocaleDateString('en-AU', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' })}`);
  put('#india', fmtTime(now, 'Asia/Kolkata'));
  put('#austin', fmtTime(now, 'America/Chicago'));
  mediaClock();
}

// ---- Actions ----
const sheet = () => $('#sheet');
const CLOSE = '<button class="btn line close b" data-act="sheet-close">Close</button>';
let liveSheet = null;
let lastSheet = '';
function openSheet(html, onOpen) {
  const d = sheet();
  liveSheet = null;
  d.innerHTML = html + CLOSE;
  if (!d.open) { d.showModal(); if (inKioskSatellite()) quiet(Promise.resolve(ks.setInteractionActive?.(true, 'dashboard'))); }
  onOpen?.(d);
}
function closeSheet() { if (sheet().open) sheet().close(); }
sheet().addEventListener('close', () => { liveSheet = null; stopLiveCam(); sheet().replaceChildren(); sheet().classList.remove('fitcam', 'lpsheet', 'tvsheet', 'mediasheet'); mediaSel = null; sliding = false; sheet().style.width = ''; if (inKioskSatellite()) quiet(Promise.resolve(ks.setInteractionActive?.(false, 'dashboard'))); });
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
  car: (i) => openLive(() => carSheet(CARS[Number(i)])),
  info: (id) => openLive(() => infoSheet(id)),
  'call-confirm': (arg) => confirmOr(arg, () => ACTIONS.call(arg)),
  toggle: (arg) => quiet(call('homeassistant', 'toggle', { entity_id: arg })),
  'good-night': () => confirmOr('good-night', () => quiet(call('scene', 'turn_on', { entity_id: E.goodNight }))),
  'close-garage': () => garageCloseSheet(),
  'keep-garage': () => quiet(call('input_boolean', 'toggle', { entity_id: E.keepGarage })),
  'keep-side': () => quiet(call('input_boolean', 'toggle', { entity_id: E.keepSide })),
  snooze: () => quiet(call('input_boolean', 'toggle', { entity_id: E.snooze })),
  'end-quiet': () => quiet(call('input_boolean', 'turn_off', { entity_id: E.quietHour })),
  // Closing always asks first, with the garage camera; opening keeps the two-tap confirm.
  'garage-toggle': () => {
    const cover = get(E.garageCover);
    const open = ['open', 'opening'].includes(cover?.state) || get(E.garageContact)?.state === 'on';
    if (open) garageCloseSheet(); else confirmOr('garage-toggle', () => quiet(call('cover', 'open_cover', { entity_id: E.garageCover })));
  },
  'front-toggle': () => {
    // Unlocking asks for a second tap; locking doesn't.
    const unlock = get(E.frontDoor)?.state === 'off';
    const run = () => quiet(call('input_boolean', 'toggle', { entity_id: E.frontDoor }));
    if (unlock) confirmOr('front-toggle', run); else run();
  },
  // TV power: while it's on, turn it off through the LG webOS integration; while it's off, run
  // script.media_tv_power, which wakes it (webOS can't switch itself on).
  tv: () => {
    const on = !['off', 'unavailable', 'unknown', undefined].includes(get(E.tv)?.state);
    quiet(on ? call('media_player', 'turn_off', { entity_id: E.tv }) : call('script', 'turn_on', { entity_id: 'script.media_tv_power' }));
  },
  'tv-remote': () => { sheet().classList.remove('mediasheet'); openLive(tvRemoteSheet); sheet().classList.add('tvsheet'); },
  // The Music tab in Kiosk Satellite: the kiosk's Music Library (its Now Playing view only if there's no library
  // button). Falls back to the Music Assistant view if the kiosk doesn't respond.
  'ks-music': () => {
    const fallback = () => { location.hash = '#music'; };
    if (ksMusic.library) quiet(call('button', 'press', { entity_id: ksMusic.library }).catch(fallback));
    else if (ksMusic.nowPlaying) quiet(call('switch', 'turn_on', { entity_id: ksMusic.nowPlaying }).catch(fallback));
    else fallback();
  },
  media: () => { openLive(mediaSheet); sheet().classList.add('mediasheet'); },
  'media-sel': (id) => { mediaSel = id; renderAll(); },
  'media-power': (id) => {
    const p = H.mediaPlayers(get).find((x) => x.id === id);
    if (!p) return;
    if (p.remote) return ACTIONS.tv();
    // A device with its own power switch (the bedroom TV) is switched there.
    if (p.power) return quiet(call('switch', p.powerOn ? 'turn_off' : 'turn_on', { entity_id: p.power }));
    quiet(call('media_player', p.isOn ? 'turn_off' : 'turn_on', { entity_id: id }));
  },
  'tv-button': (button) => quiet(call('webostv', 'button', { entity_id: E.tv, button })),
  'tv-source': (source) => quiet(call('media_player', 'select_source', { entity_id: E.tv, source })),
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

// A combination-lock dial beside a keypad (from dashboards/lost-phone-dial.html on the design branch), shared by
// Lost Phone and the alarm. Each digit turns the dial and fills a segment; ✓ calls submit(code, chip), which
// resolves to { ok: true | false | undefined, msg }: true turns the dial green and closes, false shakes it red.
function lpDial() {
  let g = '';
  for (let i = 0; i < 120; i++) {
    const long = i % 12 === 0, len = long ? 14 : i % 3 === 0 ? 9 : 5;
    g += `<line x1="180" y1="34" x2="180" y2="${34 + len}" class="lptick${long ? ' l' : ''}" transform="rotate(${i * 3} 180 180)"/>`;
  }
  for (let d = 0; d < 10; d++) {
    const a = d * 36, x = 180 + 108 * Math.sin(a * Math.PI / 180), y = 180 - 108 * Math.cos(a * Math.PI / 180);
    g += `<text class="lpdg" data-d="${d}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" transform="rotate(${a} ${x.toFixed(1)} ${y.toFixed(1)})">${d}</text>`;
  }
  return g;
}
function lpArcs(n, total) {
  let s = '';
  const p = (a) => [180 + 168 * Math.cos(a * Math.PI / 180), 180 + 168 * Math.sin(a * Math.PI / 180)].map((v) => v.toFixed(1)).join(' ');
  const gap = total > 6 ? 4 : 8;
  for (let i = 0; i < total; i++) {
    const a0 = -90 + i * (360 / total) + gap, a1 = -90 + (i + 1) * (360 / total) - gap;
    s += `<path class="lpseg${i < n ? ' f' : ''}" d="M${p(a0)} A168 168 0 0 1 ${p(a1)}"/>`;
  }
  return s;
}
function dialSheet({ title, prompt = 'Enter passcode', chips = [], chip, minLen = 4, maxLen = 4, okLabel = 'Send', cls = '', submit }) {
  let code = '';
  let busy = false;
  let pick = chip ?? chips[0]?.[0];
  const segs = () => Math.max(minLen, Math.min(maxLen, code.length));
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'x', '0', 'ok'];
  openSheet(`<h2>${esc(title)}</h2>
    <div class="lp">
      <div class="lpleft">
        <div class="lpdial" id="lpdial"><div class="lpptr"></div>
          <svg viewBox="0 0 360 360" aria-hidden="true"><defs><radialGradient id="lpface" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#3a302a"/><stop offset="1" stop-color="#14100d"/></radialGradient></defs>
            <g id="lparcs">${lpArcs(0, minLen)}</g><circle cx="180" cy="180" r="150" fill="url(#lpface)"/><g id="lpwheel">${lpDial()}</g></svg>
          <div class="lphub num" id="lphub">–</div></div>
        <p class="lpmsg" id="lpmsg" role="status" aria-live="polite">${esc(prompt)}</p>
      </div>
      <div class="lpright">
        ${chips.length ? `<div class="lpwho${chips.length === 1 ? ' one' : ''}">${chips.map(([v, text, icon]) => `<button class="tile b${v === pick ? ' on' : ''}" data-chip="${esc(v)}" aria-pressed="${v === pick}">${ic(icon)}<span>${esc(text)}</span></button>`).join('')}</div>` : ''}
        <div class="lppad">${keys.map((k) => `<button class="lpkey${k === 'ok' ? ' ok' : k === 'x' ? ' cl' : ''}" data-key="${k}" aria-label="${k === 'ok' ? esc(okLabel) : k === 'x' ? 'Clear' : k}">${k === 'x' ? '✕' : k === 'ok' ? '✓' : k}</button>`).join('')}</div>
      </div>
    </div>`, (d) => {
    d.classList.add('lpsheet');
    if (cls) d.classList.add(cls);
    const $d = (s) => d.querySelector(s);
    const dial = $d('#lpdial'), wheel = $d('#lpwheel'), hub = $d('#lphub'), msg = $d('#lpmsg');
    const say = (t, c = '') => { msg.textContent = t; msg.className = `lpmsg ${c}`; };
    const arcs = () => { $d('#lparcs').innerHTML = lpArcs(code.length, segs()); };
    const turn = (n) => {
      wheel.style.transform = `rotate(${-n * 36}deg)`;
      d.querySelectorAll('.lpdg').forEach((e) => e.classList.toggle('cur', e.dataset.d === String(n)));
      hub.textContent = n;
    };
    const reset = () => { code = ''; arcs(); hub.textContent = '–'; d.querySelectorAll('.lpdg.cur').forEach((e) => e.classList.remove('cur')); dial.className = 'lpdial'; };
    const press = async (k) => {
      if (busy) return;
      dial.classList.remove('bad');
      if (/^\d$/.test(k)) { if (code.length < maxLen) { code += k; turn(+k); arcs(); say(prompt); } return; }
      if (k === 'x') { reset(); say(prompt); return; }
      if (code.length < minLen) { say(minLen === maxLen ? `Enter all ${minLen} digits` : `Enter at least ${minLen} digits`); return; }
      busy = true; say('Checking…');
      const r = await submit(code, pick).catch((err) => ({ ok: undefined, msg: `Error: ${String(err?.message ?? errorCode(err)).slice(0, 40)}` }));
      if (r.ok === true) {
        dial.classList.add('good'); say(r.msg, 'good');
        setTimeout(() => { busy = false; closeSheet(); }, 1800);
      } else if (r.ok === false) {
        dial.classList.add('bad'); say(r.msg, 'bad');
        setTimeout(() => { reset(); dial.classList.add('bad'); setTimeout(() => dial.classList.remove('bad'), 500); busy = false; }, 900);
      } else { reset(); say(r.msg, 'bad'); busy = false; }
    };
    d.querySelectorAll('[data-chip]').forEach((b) => {
      b.onclick = () => { pick = b.dataset.chip; d.querySelectorAll('[data-chip]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); };
    });
    d.querySelectorAll('[data-key]').forEach((b) => { b.onclick = () => press(b.dataset.key); });
    d.onkeydown = (e) => {
      if (/^\d$/.test(e.key)) { e.preventDefault(); press(e.key); } else if (e.key === 'Backspace') press('x'); else if (e.key === 'Enter' && !e.target.closest?.('button')) press('ok');
    };
  });
}

// Lost Phone: four digits, then ✓ calls script.lost_phone, which checks the passcode in Home Assistant.
function lostPhoneSheet() {
  dialSheet({
    title: 'Lost Phone', chips: [['Sushen', 'Sushen', 'phone'], ['Paro', 'Paro', 'phone']], okLabel: 'Send alert',
    submit: async (code, phone) => {
      try {
        const res = await conn.sendMessagePromise({ type: 'call_service', domain: 'script', service: 'lost_phone', service_data: { passcode: code, phone }, return_response: true });
        const ok = res?.response?.ok;
        if (ok === undefined) return { ok: undefined, msg: 'Not confirmed: update the script' };
        return ok ? { ok: true, msg: `Alert sent to ${phone}` } : { ok: false, msg: 'Access denied: wrong passcode' };
      } catch (err) {
        if (/passcode|denied/i.test(err?.message ?? '')) return { ok: false, msg: 'Access denied: wrong passcode' };
        throw err;
      }
    },
  });
}

// Home alarm: the same dial and keypad for the alarm code. Disarmed: choose Arm home or Arm away; armed: Disarm.
const ALARM_WORDS = { alarm_arm_home: ['Arm home', 'home', 'Armed home'], alarm_arm_away: ['Arm away', 'away', 'Armed away'], alarm_disarm: ['Disarm', 'lock', 'Disarmed'] };
// Success means the alarm actually changed, not that the call was accepted: some integrations (Alarmo, for one)
// quietly ignore a wrong code and still answer the call as successful. Arming counts once the alarm is arming
// (exit delay) or armed in the chosen mode; disarming once it's disarmed.
function alarmChanged(svc, ms = 8000) {
  const want = svc === 'alarm_disarm' ? ['disarmed'] : ['arming', svc === 'alarm_arm_home' ? 'armed_home' : 'armed_away'];
  const t0 = Date.now();
  return new Promise((resolve) => {
    const tick = () => { if (want.includes(get(E.alarm)?.state)) resolve(true); else if (Date.now() - t0 > ms) resolve(false); else setTimeout(tick, 200); };
    tick();
  });
}
function alarmCall(service) {
  const s = get(E.alarm);
  const arming = service !== 'alarm_disarm';
  const chips = (arming ? ['alarm_arm_home', 'alarm_arm_away'] : ['alarm_disarm']).map((k) => [k, ALARM_WORDS[k][0], ALARM_WORDS[k][1]]);
  const fmt = s?.attributes?.code_format;
  dialSheet({
    title: 'Home Alarm', prompt: 'Enter alarm code', chips, chip: service, minLen: 4, maxLen: 8, okLabel: arming ? 'Arm' : 'Disarm', cls: 'alarmsheet',
    // The code is checked by Home Assistant, never by the page (anything in the page can be read without signing
    // in). script.alarm_keypad (homeassistant/dashboard/alarm-keypad-script.yaml) is the authority: it compares the
    // code with alarm_keypad_code in secrets.yaml and only then arms or disarms, passing the code on to the alarm.
    // Only if that script isn't installed does the page send the code to the alarm itself (when it has a code).
    // Either way, success means the alarm actually changed state.
    submit: async (code, svc) => {
      const DENIED = { ok: false, msg: 'Access denied: wrong passcode' };
      try {
        const res = await conn.sendMessagePromise({ type: 'call_service', domain: 'script', service: 'alarm_keypad', service_data: { request: svc.replace('alarm_', ''), code }, return_response: true });
        const ok = res?.response?.ok;
        if (ok === false) return DENIED;
        if (ok !== true) return { ok: undefined, msg: 'Not confirmed: update script.alarm_keypad' };
        return (await alarmChanged(svc)) ? { ok: true, msg: ALARM_WORDS[svc][2] } : { ok: undefined, msg: "The alarm didn't change: check its own code matches" };
      } catch (err) {
        const missing = /not found|not_found|unknown/i.test(`${err?.code ?? ''} ${err?.message ?? ''}`);
        if (!missing) { if (/code|denied/i.test(err?.message ?? '')) return DENIED; throw err; }
      }
      // No script: fall back to the alarm's own code, if it has one.
      if (!fmt) return { ok: undefined, msg: 'Code check not set up: add script.alarm_keypad' };
      try {
        await conn.sendMessagePromise({ type: 'call_service', domain: 'alarm_control_panel', service: svc, service_data: { entity_id: E.alarm, code } });
      } catch (err) {
        if (/code/i.test(err?.message ?? '') || err?.code === 'invalid_code') return DENIED;
        throw err;
      }
      return (await alarmChanged(svc)) ? { ok: true, msg: ALARM_WORDS[svc][2] } : DENIED;
    },
  });
}

// ---- Media pop-up ----
// Left: the selected player, large (artwork, what's on, progress, controls, volume). Right: every player in
// MEDIA_PLAYERS, playing first; tap one to select it. Live: it redraws as the players change; the progress
// clock runs from tick() (mediaClock) so the sheet's HTML only changes when a player does.
let mediaSel = null;
let sliding = false;
function mediaSheet() {
  const players = H.mediaPlayers(get);
  const p = players.find((x) => x.id === mediaSel) ?? players.find((x) => x.playing) ?? players[0];
  mediaSel = p.id;  // stays selected while it's open, even if it stops playing
  const sv = (svc, icon, labelText, bit, cls = '', data = '') => `<button class="rk ${cls}" data-act="call" data-arg="media_player.${svc}|${p.id}|${data.replace(/"/g, '&quot;')}" aria-label="${labelText}"${p.isOn && p.can(bit) ? '' : ' disabled'}>${ic(icon)}</button>`;
  const art = (x, cls) => `<span class="${cls}">${ic(x.icon)}${x.isOn && isLocalImage(x.pic, location.origin) ? `<img src="${esc(x.pic)}" alt="" onerror="this.remove()">` : ''}</span>`;
  const t = p.dur > 0 && p.pos != null && p.isOn;
  const pause = p.playing && p.can(H.MF.PAUSE);
  const hero = `<div class="mhero">
      <div class="mart${p.playing ? ' playing' : ''}">${art(p, 'mpic')}<span class="msrc">${esc([p.name, p.isOn ? p.app : ''].filter(Boolean).join(' · '))}</span>${p.playing ? '<span class="meq" aria-hidden="true"><i></i><i></i><i></i></span>' : ''}</div>
      <div class="mttl"><b>${esc((p.isOn && (p.title || p.app)) || p.name)}</b><span>${esc(p.isOn ? (p.title ? p.by || p.app : p.sub) : p.sub)}</span></div>
      ${t ? `<div class="mprog num" data-mclock data-pos="${p.pos}" data-at="${esc(p.at ?? '')}" data-dur="${p.dur}" data-run="${p.playing ? 1 : ''}"><span class="m0">${H.clockTime(p.pos)}</span><span class="mbar"><i></i></span><span>${H.clockTime(p.dur)}</span></div>` : ''}
      <div class="mctl">
        <button class="rk pw${p.isOn ? ' on' : ''}" data-act="media-power" data-arg="${p.id}" aria-label="Power"${p.unavailable ? ' disabled' : ''}>${ic('power')}</button>
        ${sv('media_previous_track', 'prev', 'Previous', H.MF.PREVIOUS)}
        ${sv(pause ? 'media_pause' : 'media_play', pause ? 'pause' : 'play', pause ? 'Pause' : 'Play', pause ? H.MF.PAUSE : H.MF.PLAY, 'big')}
        ${sv('media_next_track', 'next', 'Next', H.MF.NEXT)}
        ${sv('volume_mute', 'mute', p.muted ? 'Unmute' : 'Mute', H.MF.VOLUME_MUTE, p.muted ? 'on' : '', JSON.stringify({ is_volume_muted: !p.muted }))}
      </div>
      <div class="mvol">${sv('volume_down', 'volDown', 'Volume down', H.MF.VOLUME_STEP | H.MF.VOLUME_SET)}
        <input type="range" min="0" max="100" step="1" value="${p.vol ?? 0}" data-mvol="${p.id}" aria-label="Volume"${p.isOn && p.vol != null && p.can(H.MF.VOLUME_SET) ? '' : ' disabled'} style="--v:${p.vol ?? 0}%">
        ${sv('volume_up', 'volUp', 'Volume up', H.MF.VOLUME_STEP | H.MF.VOLUME_SET)}<span class="mpct num">${p.vol != null && p.isOn ? `${p.vol}%` : '—'}</span></div>
    </div>`;
  const row = (x) => {
    const mini = (act, arg, icon, labelText, cls = '', dis = false) => `<button class="mini ${cls}" data-act="${act}" data-arg="${esc(arg)}" aria-label="${labelText}"${dis ? ' disabled' : ''}>${ic(icon)}</button>`;
    const btn = x.remote ? `<button class="mpill" data-act="tv-remote" aria-label="TV remote">${ic('remote')}Remote</button>`
      : x.playing && x.can(H.MF.PAUSE) ? mini('call', `media_player.media_pause|${x.id}|`, 'pause', `Pause ${x.name}`, 'on')
        : x.state === 'paused' ? mini('call', `media_player.media_play|${x.id}|`, 'play', `Play ${x.name}`)
          : x.power && x.powerOn === false ? `<button class="mpill" data-act="media-power" data-arg="${x.id}">${ic('power')}Turn on</button>`
            : mini('media-power', x.id, 'power', `Power ${x.name}`, x.isOn ? 'pw' : '', x.unavailable);
    return `<div class="mrow${x.id === p.id ? ' sel' : ''}${x.isOn ? '' : ' off'}" role="button" tabindex="0" data-act="media-sel" data-arg="${x.id}" aria-pressed="${x.id === p.id}">
      ${art(x, `mthumb${x.isOn && isLocalImage(x.pic, location.origin) ? ' pic' : ''}`)}<span class="who"><b>${esc(x.name)}</b><span class="${x.playing ? 'playing' : ''}">${esc(x.sub)}</span></span><span class="macts">${btn}</span></div>`;
  };
  return `<div class="mhead"><h2>Media</h2><span>${esc(H.mediaSummary(players))}</span></div>
    <div class="mgrid">${hero}<div class="mlist">${players.map(row).join('')}</div></div>`;
}
/** Moves the media pop-up's progress clock on, once a second. */
function mediaClock() {
  const el = sheet().open && sheet().querySelector('[data-mclock]');
  if (!el) return;
  const d = el.dataset;
  const sec = H.mediaElapsed({ pos: Number(d.pos), at: d.at, dur: Number(d.dur), playing: Boolean(d.run) });
  if (sec == null) return;
  const t = H.clockTime(sec);
  const m0 = el.querySelector('.m0');
  if (m0.textContent !== t) m0.textContent = t;
  el.querySelector('.mbar i').style.transform = `scaleX(${(sec / Number(d.dur)).toFixed(4)})`;
}
// The volume slider: the label follows the finger; the volume is set on release. While it's held the sheet
// doesn't redraw, so a state update can't snatch it.
sheet().addEventListener('pointerdown', (e) => { if (e.target.matches?.('[data-mvol]')) sliding = true; });
document.addEventListener('pointerup', () => { if (sliding) { sliding = false; renderAll(); } }, true);
sheet().addEventListener('input', (e) => {
  const r = e.target.closest?.('[data-mvol]'); if (!r) return;
  r.style.setProperty('--v', `${r.value}%`);
  const pct = r.parentNode.querySelector('.mpct'); if (pct) pct.textContent = `${r.value}%`;
});
sheet().addEventListener('change', (e) => {
  const r = e.target.closest?.('[data-mvol]'); if (!r) return;
  sliding = false;
  quiet(call('media_player', 'volume_set', { entity_id: r.dataset.mvol, volume_level: Number(r.value) / 100 }));
});

// TV remote, from the Media TV pop-up (lg-remote-control): arrows and OK, back/home/menu, colour buttons,
// power, volume, channels, playback and sources. Live: it redraws as the TV's state changes.
function tvRemoteSheet() {
  const tv = get(E.tv);
  const a = tv?.attributes ?? {};
  const on = tv && !['off', 'unavailable', 'unknown'].includes(tv.state);
  const off = on ? '' : ' disabled';
  const btn = (k, icon, labelText, cls = '') => `<button class="rk ${cls}" data-act="tv-button" data-arg="${k}" aria-label="${labelText}"${off}>${icon ? ic(icon) : esc(labelText)}</button>`;
  const svc = (s, icon, labelText, data = '', cls = '') => `<button class="rk ${cls}" data-act="call" data-arg="media_player.${s}|${E.tv}|${data.replace(/"/g, '&quot;')}" aria-label="${labelText}"${off}>${ic(icon)}</button>`;
  const vol = a.volume_level != null ? Math.round(a.volume_level * 100) : null;
  const status = isUnavailable(tv) ? 'Unavailable' : on ? [a.app_name ?? a.source, a.media_title].filter(Boolean).join(' · ') || 'On' : 'Off';
  const list = (a.source_list ?? []).filter((x) => !TV_SOURCES.some(([n]) => n === x));
  return `<div class="tvhead"><h2>Media TV</h2><p>${esc(status)}${vol != null && on ? ` · volume ${vol}%${a.is_volume_muted ? ' (muted)' : ''}` : ''}</p></div>
    <div class="tvr">
      <div class="tvl">
        <div class="dpad">${btn('UP', 'up', 'Up', 'u')}${btn('LEFT', 'left', 'Left', 'l')}${btn('ENTER', '', 'OK', 'ok')}${btn('RIGHT', 'chevron', 'Right', 'r')}${btn('DOWN', 'down', 'Down', 'd')}</div>
        <div class="rrow">${btn('BACK', 'back', 'Back')}${btn('HOME', 'home', 'Home')}${btn('MENU', 'more', 'Menu')}</div>
        <div class="rrow colours">${['RED', 'GREEN', 'YELLOW', 'BLUE'].map((c) => `<button class="rk cb ${c.toLowerCase()}" data-act="tv-button" data-arg="${c}" aria-label="${c.toLowerCase()}"${off}></button>`).join('')}</div>
      </div>
      <div class="tvrt">
        <div class="rrow">
          <button class="rk pw${on ? ' on' : ''}" data-act="tv" aria-label="Power">${ic('power')}</button>
          ${svc('volume_mute', 'mute', a.is_volume_muted ? 'Unmute' : 'Mute', JSON.stringify({ is_volume_muted: !a.is_volume_muted }), a.is_volume_muted ? 'on' : '')}
          ${svc('volume_down', 'volDown', 'Volume down')}${svc('volume_up', 'volUp', 'Volume up')}
        </div>
        <div class="rrow">${btn('CHANNELDOWN', 'minus', 'Channel down')}<span class="rlbl">CH</span>${btn('CHANNELUP', 'plus', 'Channel up')}
          ${svc('media_previous_track', 'prev', 'Previous')}${svc('media_play_pause', tv?.state === 'playing' ? 'pause' : 'play', 'Play or pause')}${svc('media_next_track', 'next', 'Next')}</div>
        <div class="srcs">${TV_SOURCES.map(([src, name, colour]) => `<button class="tile b src${a.source === src ? ' on' : ''}" data-act="tv-source" data-arg="${esc(src)}"${off}><i style="background:${colour}"></i>${esc(name)}</button>`).join('')}</div>
        ${list.length ? `<select id="tvsrc" aria-label="All sources"${off}><option value="">All sources…</option>${list.map((x) => `<option${a.source === x ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select>` : ''}
      </div>
    </div>`;
}
document.addEventListener('change', (e) => { if (e.target.id === 'tvsrc' && e.target.value) ACTIONS['tv-source'](e.target.value); });

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

// A drawing of a Roborock Qrevo (round body, LiDAR turret, dark front bumper) for Robbie's pop-up.
const QREVO_SVG = `<svg class="rbimg" viewBox="0 0 160 112" role="img" aria-label="Robbie, a Roborock Qrevo">
  <ellipse cx="80" cy="98" rx="66" ry="9" fill="rgba(0,0,0,.14)"/>
  <path d="M16 60v16c0 12.2 28.7 22 64 22s64-9.8 64-22V60" fill="#d5dae4"/>
  <path d="M18 74c4 11 30 19 62 19s58-8 62-19" fill="none" stroke="#2c303b" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="80" cy="60" rx="64" ry="23" fill="#f6f7fa" stroke="#c3c9d5" stroke-width="1.5"/>
  <ellipse cx="80" cy="60" rx="52" ry="17" fill="none" stroke="#e3e7ee" stroke-width="1.5"/>
  <path d="M63 54v-11h34v11c0 3.3-7.6 6-17 6s-17-2.7-17-6z" fill="#2c303b"/>
  <ellipse cx="80" cy="43" rx="17" ry="6" fill="#454b5b"/>
  <path d="M66 49.5c4 1.6 9 2.4 14 2.4s10-.8 14-2.4" fill="none" stroke="#7d8597" stroke-width="1.5"/>
  <ellipse cx="80" cy="69" rx="7" ry="2.6" fill="#c3c9d5"/>
  <circle cx="80" cy="69" r="1.3" fill="#2fbfa0"/>
</svg>`;

function robbieSheet() {
  const r = H.robbie(get);
  const cleaning = get(E.robbie)?.state === 'cleaning';
  const pic = ROBBIE_IMAGE ? `<img class="rbimg" src="${esc(ROBBIE_IMAGE)}" alt="Robbie, a Roborock Qrevo">` : QREVO_SVG;
  openSheet(`<div class="rbhead">${pic}<div><h2>Robbie</h2><p>${esc(r.label)}</p><small>Roborock Qrevo</small></div></div>
    <div class="acts">
      <button class="tile b" data-svc="vacuum.${cleaning ? 'pause' : 'start'}">${ic(cleaning ? 'pause' : 'play')}${cleaning ? 'Pause' : 'Start'}</button>
      <button class="tile b" data-svc="vacuum.return_to_base">${ic('home')}Dock</button>
      <button class="tile b" data-svc="vacuum.stop">${ic('stop')}Stop</button>
    </div>
    <div class="acts">${ROBBIE_ROOMS.map(([id, name, icon]) => `<button class="tile b" data-press="${id}">${ic(icon ?? 'robot')}${esc(name)}</button>`).join('')}</div>`, (d) => {
    d.querySelectorAll('[data-svc]').forEach((b) => { const [dom, svc] = b.dataset.svc.split('.'); b.onclick = () => quiet(call(dom, svc, { entity_id: E.robbie })); });
    d.querySelectorAll('[data-press]').forEach((b) => { b.onclick = () => quiet(call('button', 'press', { entity_id: b.dataset.press }).then(closeSheet)); });
    // A missing or unreadable photo falls back to the drawing.
    d.querySelector('img.rbimg')?.addEventListener('error', (e) => { e.target.outerHTML = QREVO_SVG; }, { once: true });
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
// ---- Live camera ----
// The pop-up always streams the camera entity it was opened for, the same way Home Assistant's own
// camera dialog does: ask HA for an HLS stream (camera/stream) and play it with hls.js (or natively).
// Arlo cameras only give a still image any other way, so MJPEG and snapshots are last resorts.
// hls.js (~370 KB) is loaded the first time a camera pop-up opens, never at page start.
let live = null;
let hlsLib = null;
async function loadHls() {
  if (hlsLib) return hlsLib;
  const inline = document.getElementById('hls-src'); // single-file build: base64 text, not parsed until now
  const url = inline
    ? URL.createObjectURL(new Blob([Uint8Array.from(atob(inline.textContent.trim()), (ch) => ch.charCodeAt(0))], { type: 'text/javascript' }))
    : './vendor/hls.light.min.mjs?v=33';
  hlsLib = (await import(url)).default;
  return hlsLib;
}
function camToken(id) {
  const a = get(id)?.attributes ?? {};
  if (a.access_token) return a.access_token;
  const m = /[?&]token=([^&]+)/.exec(a.entity_picture ?? '');
  return m ? decodeURIComponent(m[1]) : null;
}
const errText = (e) => (typeof e === 'number' ? `connection error ${e}` : [e?.code, e?.message].filter(Boolean).join(': ') || String(e));

/**
 * Plays a camera the way HA's own camera dialog does: ask which live formats it supports
 * (camera/capabilities), try WebRTC if offered, then HLS (hls.js), and only then fall back to
 * MJPEG / snapshots, showing HA's reason on screen so a failure can be diagnosed.
 */
async function startLive(box, id) {
  stopLiveCam();
  live = { box, timers: [], cleanups: [] };
  const mine = live;
  const alive = () => live === mine;
  const status = (text) => { if (alive()) box.dataset.status = text; };
  const show = (el) => { if (alive()) { box.replaceChildren(el); mine.el = el; } };
  const reasons = [];
  // Size the pop-up to the camera's real resolution, as large as the screen allows (no letterboxing).
  const fit = (w, h) => {
    if (!alive() || !w || !h) return;
    const d = sheet();
    const chrome = d.offsetHeight - box.offsetHeight; // title, buttons and padding
    const pad = 52; // sheet padding (24 + 24) and key-line borders
    const maxW = innerWidth - 32 - pad;
    const maxH = innerHeight - 48 - chrome;
    const k = Math.min(maxW / w, maxH / h);
    const bw = Math.round(w * k);
    box.style.aspectRatio = `${w} / ${h}`;
    box.style.width = `${bw}px`;
    d.style.width = `${Math.max(bw + pad, 360)}px`;
    d.classList.add('fitcam');
  };
  const onLive = (via) => { if (alive()) { status(''); box.dataset.live = via; } };

  const snapshots = () => {
    if (!alive()) return;
    const img = document.createElement('img');
    img.alt = 'Latest snapshot';
    img.addEventListener('load', () => fit(img.naturalWidth, img.naturalHeight), { once: true });
    const poll = () => { const u = camUrl(id); if (u) img.src = u; };
    poll(); mine.timers.push(setInterval(poll, 2000));
    show(img);
  };
  const fallback = () => {
    if (!alive()) return;
    const why = reasons.join(' · ') || 'no live format';
    console.warn(`kiosk-home: no live view for ${id}: ${why}`);
    status(`No live view (${why}). Showing the latest image.`);
    const token = camToken(id);
    if (!token) return snapshots();
    const img = document.createElement('img');
    img.alt = 'Latest image';
    img.addEventListener('load', () => fit(img.naturalWidth, img.naturalHeight), { once: true });
    img.onerror = () => { img.onerror = null; snapshots(); };
    img.src = `/api/camera_proxy_stream/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`;
    show(img);
  };
  // Resolves true once video plays, false on error or after `ms`.
  const waitPlaying = (video, ms) => new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), ms);
    mine.timers.push(t);
    video.addEventListener('playing', () => { clearTimeout(t); resolve(true); }, { once: true });
    mine.fail = () => { clearTimeout(t); resolve(false); };
  });
  const newVideo = () => {
    const v = document.createElement('video');
    Object.assign(v, { muted: true, autoplay: true, playsInline: true });
    v.addEventListener('loadedmetadata', () => fit(v.videoWidth, v.videoHeight));
    v.setAttribute('aria-label', 'Live view');
    return v;
  };

  async function tryWebRtc() {
    status('Starting live view (WebRTC)…');
    let cfg = {};
    try { cfg = await conn.sendMessagePromise({ type: 'camera/webrtc/get_client_config', entity_id: id }); } catch (e) { reasons.push(`WebRTC config: ${errText(e)}`); return false; }
    if (!alive()) return true;
    const pc = new RTCPeerConnection(cfg.configuration ?? {});
    mine.cleanups.push(() => pc.close());
    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });
    if (cfg.dataChannel) pc.createDataChannel(cfg.dataChannel);
    const video = newVideo();
    const stream = new MediaStream();
    pc.ontrack = (e) => { stream.addTrack(e.track); video.srcObject = stream; };
    let sessionId = null;
    const queued = [];
    const sendCandidate = (c) => quiet(conn.sendMessagePromise({ type: 'camera/webrtc/candidate', entity_id: id, session_id: sessionId, candidate: c }));
    pc.onicecandidate = (e) => { if (!e.candidate) return; const c = e.candidate.toJSON(); if (sessionId) sendCandidate(c); else queued.push(c); };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const playing = waitPlaying(video, 20000);
    try {
      const unsub = await conn.subscribeMessage((m) => {
        if (m.type === 'session') { sessionId = m.session_id; queued.splice(0).forEach(sendCandidate); }
        else if (m.type === 'answer') quiet(pc.setRemoteDescription({ type: 'answer', sdp: m.answer }));
        else if (m.type === 'candidate') quiet(pc.addIceCandidate(m.candidate));
        else if (m.type === 'error') { reasons.push(`WebRTC: ${m.code}: ${m.message}`); mine.fail?.(); }
      }, { type: 'camera/webrtc/offer', entity_id: id, offer: offer.sdp });
      mine.cleanups.push(() => quiet(Promise.resolve(unsub())));
    } catch (e) { reasons.push(`WebRTC offer: ${errText(e)}`); return false; }
    show(video);
    if (await playing) { onLive('WebRTC'); return true; }
    if (!reasons.some((r) => r.startsWith('WebRTC'))) reasons.push('WebRTC: no video within 20 s');
    pc.close();
    return false;
  }

  async function tryHls() {
    status('Starting live view…');
    let url;
    try { url = (await conn.sendMessagePromise({ type: 'camera/stream', entity_id: id }))?.url; } catch (e) { reasons.push(`HLS: ${errText(e)}`); return false; }
    if (!alive()) return true;
    if (!url) { reasons.push('HLS: no stream URL'); return false; }
    const video = newVideo();
    // Arlo cameras can take 10 to 20 seconds to start streaming.
    const playing = waitPlaying(video, 25000);
    let Hls = null;
    try { Hls = await loadHls(); } catch (e) { reasons.push(`HLS player: ${errText(e)}`); }
    if (!alive()) return true;
    if (Hls?.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, backBufferLength: 30, maxBufferLength: 10 });
      mine.hls = hls;
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) { reasons.push(`HLS: ${d.details}`); hls.destroy(); mine.hls = null; mine.fail?.(); } });
      hls.loadSource(url);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.onerror = () => { reasons.push('HLS: native playback failed'); mine.fail?.(); };
      video.src = url;
    } else { reasons.push('HLS: not supported on this device'); return false; }
    show(video);
    if (await playing) { onLive('HLS'); return true; }
    if (!reasons.some((r) => r.startsWith('HLS'))) reasons.push('HLS: no video within 25 s');
    return false;
  }

  let types = ['hls'];
  try { types = (await conn.sendMessagePromise({ type: 'camera/capabilities', entity_id: id }))?.frontend_stream_types ?? types; }
  catch (e) { reasons.push(`capabilities: ${errText(e)}`); }
  if (!alive()) return;
  if (types.includes('web_rtc') && await tryWebRtc()) return;
  if (!alive()) return;
  if (types.includes('hls') && await tryHls()) return;
  if (!types.includes('hls') && !types.includes('web_rtc')) reasons.push(`camera offers ${types.join(', ') || 'no'} live formats`);
  fallback();
}
const liveBox = '<div class="livebox" id="live"></div>';
// Close the garage door: show the garage camera and a warning, and close only on an explicit confirm.
function garageCloseSheet() {
  openSheet(`<h2>Close the garage door?</h2>
    <p class="gwarn" role="alert">${ic('alert')}<span>Check the camera: make sure nothing and no one is in the way of the door before closing it.</span></p>
    ${liveBox}
    <div class="acts"><button class="tile b alert" data-sheet="garage-go">${ic('garage')}<span>Close garage door</span></button></div>`, (d) => {
    d.querySelector('.close').textContent = 'Cancel';
    startLive(d.querySelector('#live'), E.garageCamera);
    d.querySelector('[data-sheet="garage-go"]').onclick = () => { quiet(call('cover', 'close_cover', { entity_id: E.garageCover })); closeSheet(); };
  });
}
function liveCamSheet(id) {
  const name = get(id)?.attributes?.friendly_name ?? 'Camera';
  openSheet(`<h2>${esc(name)}</h2>${liveBox}`, (d) => startLive(d.querySelector('#live'), id));
}
function camSheet() {
  // The Home card shows the snapshot camera; its pop-up streams the live-view camera.
  openSheet(`<h2>Front Door</h2>${liveBox}
    <div class="acts"><button class="tile b" data-act="go" data-arg="#security">${ic('shield')}Open Security</button></div>`, (d) => startLive(d.querySelector('#live'), E.cameraLive));
}
// Closing the sheet must end the stream, or the tablet keeps downloading video in the background.
function stopLiveCam() {
  clearInterval(liveTimer); liveTimer = 0;
  if (!live) return;
  live.timers.forEach((t) => { clearInterval(t); clearTimeout(t); });
  live.hls?.destroy();
  live.cleanups?.forEach((f) => { try { f(); } catch { /* already closed */ } });
  const el = live.el;
  if (el) { el.onerror = null; if (el.tagName === 'VIDEO') el.pause(); el.removeAttribute('src'); if (el.tagName === 'VIDEO') el.load(); }
  live = null;
}

// ---- Live sheets: cars and entity details ----
function openLive(fn) {
  openSheet(fn());
  liveSheet = fn;
  lastSheet = '';
}

/** Card badge: a Kia wordmark for the Sorento, a Tesla photo thumbnail for Bluey. */
/** Car card badge: the car's logo image (c.logo, from /config/www/images/) once it loads; until then, or if it's
 *  missing, a built-in Kia wordmark or Tesla T. */
function carBadge(c) {
  const mark = c.brand === 'tesla' ? '<svg viewBox="0 0 24 24"><path d="M3 5.6c2.9-1.5 5.9-2.3 9-2.3s6.1.8 9 2.3l-.7 1.3c-1.8-.9-3.7-1.4-5.7-1.6L12 9.2 9.4 5.3c-2 .2-3.9.7-5.7 1.6z"/><path d="M9.9 6.9 12 10.4l2.1-3.5c.8.1 1.6.2 2.3.4L12 21 7.6 7.3c.7-.2 1.5-.3 2.3-.4z"/></svg>'
    : '<svg viewBox="0 0 44 18"><text x="22" y="14" text-anchor="middle">KIA</text></svg>';
  const logo = c.logo ? `<img src="${esc(c.logo)}" alt="" onload="this.parentNode.classList.add('haslogo')">` : '';
  return `<span class="well logo ${c.brand}" aria-hidden="true">${logo}${mark}</span>`;
}

function carSheet(c) {
  const l = H.carLabel(get, c);
  const st = (id) => get(id)?.state;
  const val = (id) => { const s = get(id); const v = parseFloat(s?.state); return Number.isFinite(v) ? `${Math.round(v * 10) / 10}${s.attributes?.unit_of_measurement ? ` ${s.attributes.unit_of_measurement}` : ''}` : (s?.state ?? '—'); };
  const chip = ([kind, id, name, icon]) => {
    switch (kind) {
      case 'toggle': return tile({ act: 'toggle', arg: id, icon, name, sub: st(id) === 'on' ? 'On' : 'Off', on: st(id) === 'on', off: isUnavailable(get(id)) });
      case 'onroad': return tile({ act: 'toggle', arg: id, icon, name, sub: st(id) === 'on' ? 'Driving' : 'Parked', on: st(id) === 'on' });
      case 'home': return tile({ act: 'noop', icon, name, sub: st(id) === 'on' ? 'At home' : 'Away' });
      case 'charging': return tile({ act: 'noop', icon, name, sub: st(id) === 'on' ? 'Charging' : 'Idle', on: st(id) === 'on' });
      case 'lock': { const svc = st(id) === 'locked' ? 'unlock' : 'lock'; const key = `lock.${svc}|${id}`; return tile({ act: 'call-confirm', arg: key, key, icon, name, sub: H.titleCase?.(st(id)) ?? st(id), alert: st(id) === 'unlocked' }); }
      case 'boot': { const key = `cover.toggle|${id}`; return tile({ act: 'call-confirm', arg: key, key, icon, name, sub: st(id) ?? '—', alert: st(id) === 'open' }); }
      default: return tile({ act: 'noop', icon, name, sub: val(id) });
    }
  };
  const onroad = st(c.onroad) === 'on';
  return `<h2>${esc(c.name)}</h2><p>${esc(l.place)} · ${onroad ? 'Driving' : 'Parked'} · ${l.charging ? 'Charging' : 'Not charging'}</p>
    <img class="carphoto" src="${c.image}" alt="${esc(c.name)}">
    <div class="kv"><span>Battery</span><span>${l.pct != null ? `${l.pct}%` : '—'}</span></div>
    <span class="meter" style="--lvl:${l.pct ?? 0}%"></span>
    <div class="acts">${c.chips.map(chip).join('')}</div>`;
}

/** Details for a held tile: state, last change, on/off and, for dimmable lights, brightness. */
function infoSheet(id) {
  const s = get(id);
  const a = s?.attributes ?? {};
  const name = H.lightName(get, id);
  const on = s?.state === 'on';
  const dimmable = id.startsWith('light.') && (a.supported_color_modes ?? []).some((m) => m !== 'onoff');
  const bri = a.brightness != null ? Math.round(a.brightness / 2.55) : null;
  const ago = s ? H.minutesText(Math.max(0, Math.round((Date.now() - Date.parse(s.last_changed)) / 60000))) : '';
  const presets = dimmable ? `<div class="acts">${[10, 25, 50, 75, 100].map((p) => `<button class="tile b${on && bri === p ? ' on' : ''}" data-act="call" data-arg="light.turn_on|${id}|${JSON.stringify({ brightness_pct: p }).replace(/"/g, '&quot;')}">${p}%</button>`).join('')}</div>` : '';
  return `<h2>${esc(name)}</h2><p>${isUnavailable(s) ? 'Unavailable' : on ? `On${bri != null ? ` · ${bri}%` : ''}` : 'Off'}${ago ? ` · changed ${ago} ago` : ''}</p>
    <div class="acts"><button class="tile b${on ? ' on' : ''}" data-act="toggle" data-arg="${id}"${isUnavailable(s) ? ' disabled' : ''}>${ic(on ? 'bulb' : 'moon')}${on ? 'Turn off' : 'Turn on'}</button></div>
    ${presets}<p class="sub-line" style="margin-top:12px">${esc(id)}</p>`;
}

// Sub-view actions get the same context as their render.
for (const v of Object.values(VIEWS)) for (const [k, fn] of Object.entries(v.actions ?? {})) ACTIONS[k] = (arg) => fn(arg, viewCtx);

// ---- Press and hold for details ([data-hold]) ----
let holdTimer = 0;
let held = false;
document.addEventListener('pointerdown', (e) => {
  const h = e.target.closest('[data-hold]');
  held = false;
  clearTimeout(holdTimer);
  // data-hold="<entity>" opens its details; data-hold="act:<action>" runs that action (the TV remote).
  if (h) holdTimer = setTimeout(() => { held = true; const v = h.dataset.hold; if (v.startsWith('act:')) ACTIONS[v.slice(4)]?.(); else ACTIONS.info(v); }, 500);
});
// Cards and HUD panels that act as links or buttons open with Enter or Space, like a button.
document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[role="link"][data-act], [role="button"][data-act]:not(button)')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });  // SVG has no .click()
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) document.addEventListener(ev, () => clearTimeout(holdTimer), true);
document.addEventListener('contextmenu', (e) => { if (e.target.closest('[data-hold]')) e.preventDefault(); });

// ---- Click delegation ----
document.addEventListener('click', (e) => {
  if (held) { held = false; e.preventDefault(); return; }
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

// The kiosk's own music entities (KS_MUSIC), found by name when not set: this kiosk's, if there are several.
const ksMusic = { nowPlaying: '', library: '' };
let ksMedia = null;
async function findKsMusic(allStates) {
  if (!inKioskSatellite()) return;
  const all = allStates.map((x) => x.entity_id);
  let name = '';
  try { name = String((await ks.getDeviceInfo?.())?.name ?? ''); } catch { /* not offered */ }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const pick = (set, re) => {
    if (set) return all.includes(set) ? set : '';
    const found = all.filter((id) => re.test(id));
    return found.length === 1 ? found[0] : (slug && found.find((id) => id.includes(`_${slug}_`) || id.includes(`.ks_${slug}_`))) || '';
  };
  ksMusic.nowPlaying = pick(KS_MUSIC.nowPlaying, /^switch\..*_now_playing$/);
  ksMusic.library = pick(KS_MUSIC.library, /^button\..*_show_music_library$/);
  console.info(`kiosk-home: Music tab uses ${ksMusic.nowPlaying || ksMusic.library ? 'Kiosk Satellite\'s player' : 'Music Assistant'}`);
  last.delete('tabs'); renderAll();
}

function entityIds(allStates) {
  const ids = new Set([...Object.values(E), ...LIGHT_POOL, ...SECURITY_CONTACTS, ...BINS.map((b) => b.id)]);
  PEOPLE.forEach((p) => [p.id, p.battery, ...[].concat(p.charge)].forEach((i) => ids.add(i)));
  CARS.forEach((c) => [c.tracker, c.battery, c.chargingPower, c.chargingFlag].filter(Boolean).forEach((i) => ids.add(i)));
  mediaIds = allStates.map((s) => s.entity_id).filter((id) => id.startsWith('media_player.'));
  mediaIds.forEach((i) => ids.add(i));
  ids.add('switch.bedroom_tv');
  MEDIA_PLAYERS.forEach((m) => [...m.ids, m.power].filter(Boolean).forEach((i) => ids.add(i)));
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
  quiet(findKsMusic(all));
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
    const onKs = (s) => { ksMedia = s?.mediaPlayer ?? null; if (s?.screensaver?.active) camPaused.add('saver'); else { camPaused.delete('saver'); refreshCam(); } still(); };
    addEventListener('kiosksatellite:kiosk-state', (e) => onKs(e.detail));
    quiet(Promise.resolve(ks.getKioskState?.()).then(onKs));
  }
}

boot().catch((err) => {
  console.error(`kiosk-home: start-up failed (${errorCode(err)})`);
  showMessage(`Something went wrong loading this page (${errorCode(err)}). Reload to try again.`, 'error');
});
