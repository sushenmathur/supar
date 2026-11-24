// Ports of the hubhome cards' logic (master.yaml). Pure: each function takes `get(id)` → state object.
import { E, FAV, LIGHT_POOL, LIGHT_META, ROOM_LIGHTS, SECURITY_CONTACTS, MEDIA, BINS } from './config.js?v=14';

const st = (get, id) => get(id)?.state;
const on = (get, id) => st(get, id) === 'on';
const numOf = (get, id) => { const v = parseFloat(st(get, id)); return Number.isFinite(v) ? v : NaN; };
const changedAt = (get, id) => new Date(get(id)?.last_changed || 0).getTime();
export const titleCase = (s) => String(s).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const BAD_DOCK = (v) => Boolean(v) && !['ok', 'unavailable', 'unknown'].includes(v);

// ---- Alert banner ----

/** The banner's alert list, sorted by priority (1 = most urgent); ties keep insertion order. */
export function alerts(get) {
  const list = [];
  const push = (a) => list.push(a);
  const snoozed = on(get, E.snooze);
  const front = on(get, E.frontContact);
  const screen = on(get, E.screenContact);
  if (on(get, E.garageContact)) {
    const kept = on(get, E.keepGarage);
    push({ p: kept ? 3 : 1, id: E.garageContact, msg: kept ? 'Garage door kept open' : 'Garage door open', icon: 'garage' });
  }
  if (on(get, E.sideContact)) {
    const kept = on(get, E.keepSide);
    push({ p: kept ? 3 : 1, id: E.sideContact, msg: kept ? 'Side door kept open' : 'Side door open', icon: 'door' });
  }
  if (screen) push({ p: 1, id: E.screenContact, msg: front ? 'Front and security doors open' : 'Security door open', icon: 'shield' });
  if (!snoozed) {
    const night = st(get, E.sun) === 'below_horizon';
    if (night && front && !screen) push({ p: 2, id: E.frontContact, msg: 'Front door open', icon: 'door' });
    if (night && on(get, E.patioContact)) push({ p: 3, id: E.patioContact, msg: 'Patio door open', icon: 'door' });
    if (night && on(get, E.laundryContact)) push({ p: 3, id: E.laundryContact, msg: 'Laundry door open', icon: 'door' });
    if (BAD_DOCK(st(get, E.robbieDock))) push({ p: 3, id: E.robbieDock, msg: 'Roborock water tank empty', icon: 'robot' });
    const bat = numOf(get, E.sideBattery);
    if (!Number.isNaN(bat) && bat < 20) push({ p: 3, id: E.sideBattery, msg: 'Side camera battery low', icon: 'alert' });
  }
  if (on(get, E.quietHour)) push({ p: 4, quiet: true, id: E.quietHour, msg: 'Quiet hour on', icon: 'bellOff' });
  return list.map((a, i) => ({ ...a, i })).sort((a, b) => a.p - b.p || a.i - b.i);
}

export function minutesText(mins) {
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

/** Title, sub-line and level for the banner, matching the dashboard's wording. */
export function banner(get, now = Date.now()) {
  const list = alerts(get);
  if (!list.length) return { level: 'calm', title: 'All clear', sub: 'Doors closed · no alerts', icon: 'check', list };
  const top = list[0];
  const mins = Math.max(0, Math.round((now - changedAt(get, top.id)) / 60000));
  const dur = minutesText(mins);
  const more = list.slice(1).filter((a) => !a.quiet).map((a) => a.msg.replace(/ open$/, '')).join(' · ');
  const sub = top.quiet
    ? `${dur} · Automated announcements suppressed${more ? ` · Also: ${more}` : ''}`
    : more ? `${dur} · Also: ${more}` : `For ${dur}`;
  const level = top.p === 1 ? 'urgent' : top.p === 2 || top.p === 4 ? 'warn' : 'info';
  return { level, title: top.msg, sub, icon: top.icon, list };
}

/** Which banner buttons show. */
export function bannerButtons(get) {
  const night = st(get, E.sun) === 'below_horizon';
  const snoozable = night && [E.frontContact, E.patioContact, E.laundryContact].some((id) => on(get, id))
    || BAD_DOCK(st(get, E.robbieDock))
    || numOf(get, E.sideBattery) < 20;
  return {
    close: on(get, E.garageContact) && st(get, E.garageCover) === 'open',
    keepGarage: on(get, E.garageContact),
    keepSide: on(get, E.sideContact),
    snooze: !on(get, E.snooze) && snoozable,
    endQuiet: on(get, E.quietHour),
  };
}

// ---- Header ----

export function greeting(hour) {
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

const CONDITIONS = {
  'clear-night': 'Clear night', cloudy: 'Cloudy', exceptional: 'Exceptional', fog: 'Fog', hail: 'Hail', lightning: 'Lightning',
  'lightning-rainy': 'Thunderstorms', partlycloudy: 'Partly cloudy', pouring: 'Pouring', rainy: 'Rainy', snowy: 'Snowy',
  'snowy-rainy': 'Sleet', sunny: 'Sunny', windy: 'Windy', 'windy-variant': 'Windy',
};
export function conditionText(state) {
  if (!state || state === 'unavailable' || state === 'unknown') return '';
  return CONDITIONS[state] ?? titleCase(state);
}

/** Icon key for the weather state (day/night aware). */
export function weatherIcon(state, night) {
  if (state === 'clear-night' || (state === 'sunny' && night)) return 'moon';
  if (state === 'sunny') return 'sun';
  if (state === 'partlycloudy') return night ? 'cloud' : 'cloudsun';
  if (['rainy', 'pouring', 'hail', 'lightning', 'lightning-rainy', 'snowy', 'snowy-rainy'].includes(state)) return 'rain';
  return 'cloud';
}

export function personPlace(state) {
  return { home: 'Home', not_home: 'Away', 'Sushen - Work': 'Office', 'Paro - Work': 'Work', Gym: 'Gym' }[state] ?? (state || '—');
}

/** Battery colour band used across the dashboard: low <20, mid <50, ok otherwise. */
export function batteryBand(pct) {
  if (!Number.isFinite(pct)) return 'none';
  return pct < 20 ? 'low' : pct < 50 ? 'mid' : 'ok';
}

export function carLabel(get, car) {
  const t = st(get, car.tracker);
  const place = t === 'home' ? 'Home' : t === 'not_home' ? 'Away' : (t || '—');
  const pct = numOf(get, car.battery);
  const charging = car.chargingFlag ? on(get, car.chargingFlag) : numOf(get, car.chargingPower) > 10;
  return { place, pct: Number.isNaN(pct) ? null : Math.round(pct), charging };
}

// ---- Rooms ----

const lightCount = (get, ids) => ids.filter((id) => on(get, id)).length;
const countLabel = (n) => (n ? `${n} on` : 'All off');
const MACHINE_OFF = ['power_off', 'unavailable', 'unknown'];

export function rooms(get, mediaIds = []) {
  const living = lightCount(get, ROOM_LIGHTS.living);
  const kidsLights = lightCount(get, ROOM_LIGHTS.kids);
  const inRoom = [on(get, E.shanaya) && 'Shanaya', on(get, E.samar) && 'Samar'].filter(Boolean);
  const outdoor = lightCount(get, ROOM_LIGHTS.outdoor);

  const cover = st(get, E.garageCover);
  const door = { open: 'Door open', closed: 'Door closed', opening: 'Door opening', closing: 'Door closing' }[cover] ?? `Door ${cover ?? '—'}`;
  const gl = st(get, E.garageLight);
  const glText = gl === 'on' ? 'Light on' : gl === 'off' ? 'Light off' : 'Light unavailable';
  const garageOpen = cover === 'open' || cover === 'opening' || on(get, E.garageContact);

  const washer = !MACHINE_OFF.includes(st(get, E.washer) ?? 'unknown');
  const dryer = !MACHINE_OFF.includes(st(get, E.dryer) ?? 'unknown');
  const laundry = washer && dryer ? 'Washer & dryer on' : washer ? 'Washer running' : dryer ? 'Dryer running' : 'Idle';

  const media = mediaLabel(get, mediaIds);
  return {
    living: { label: countLabel(living), on: living > 0 },
    kids: { label: inRoom.length ? `${inRoom.join(' & ')} in · ${countLabel(kidsLights)}` : countLabel(kidsLights), on: kidsLights > 0 },
    // An open garage reads as an alert here, as it does in the banner and security column.
    garage: { label: garageOpen ? door : `${titleCase(door.replace('Door ', ''))} · ${glText.replace('Light ', 'light ')}`, on: gl === 'on', alert: garageOpen },
    outdoor: { label: countLabel(outdoor), on: outdoor > 0 },
    laundry: { label: laundry, on: washer || dryer },
    media,
  };
}

/** The Media tile: players playing (minus skipped ones) and switched-on TVs whose player is idle. */
export function mediaLabel(get, allIds = null) {
  const ids = allIds ?? [];
  const playing = ids.filter((id) => id.startsWith('media_player.') && !MEDIA.skip.some((p) => id.startsWith(p)) && st(get, id) === 'playing')
    .map((id) => MEDIA.names[id] ?? get(id)?.attributes?.friendly_name ?? id);
  const parts = [];
  if (playing.length === 1) parts.push(`${playing[0]} playing`);
  else if (playing.length > 1) parts.push(`${playing.length} playing: ${playing.join(', ')}`);
  for (const [sw, { name, player }] of Object.entries(MEDIA.switches)) {
    if (on(get, sw) && st(get, player) !== 'playing') parts.push(`${name} on`);
  }
  return { label: parts.join(' · ') || 'All off', on: playing.length > 0 || Object.keys(MEDIA.switches).some((sw) => on(get, sw)) };
}

// ---- Lights ----

/** The six favourite-light slots, with off favourites replaced by lights that are on elsewhere. */
export function lightSlots(get) {
  const t = (id) => changedAt(get, id);
  const extras = LIGHT_POOL.filter((id) => !FAV.includes(id) && on(get, id)).sort((a, b) => t(a) - t(b));
  const order = FAV.filter((f) => !on(get, f)).sort((a, b) => t(a) - t(b));
  const shown = extras.slice(Math.max(0, extras.length - order.length));
  const map = FAV.slice();
  shown.forEach((e, i) => { map[FAV.indexOf(order[i])] = e; });
  return map;
}

export function lightName(get, id) {
  return LIGHT_META[id]?.[0] ?? get(id)?.attributes?.friendly_name ?? id;
}

export const lightsOn = (get) => LIGHT_POOL.filter((id) => on(get, id)).length;
export const securityOpen = (get) => SECURITY_CONTACTS.filter((id) => on(get, id)).length;

// ---- Energy ----

export function watts(s) {
  const v = parseFloat(s?.state);
  if (!Number.isFinite(v)) return 0;
  const unit = String(s?.attributes?.unit_of_measurement ?? '').toLowerCase();
  return Math.abs(unit === 'kw' ? v * 1000 : v);
}
export const fmtW = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)} kW` : `${Math.round(v)} W`);
const money = (get, id) => `$${(Number.isFinite(numOf(get, id)) ? numOf(get, id) : 0).toFixed(2)}`;

export function energy(get) {
  const w = (id) => watts(get(id));
  const solar = w(E.solarPower);
  const imp = w(E.importPower);
  const exp = w(E.exportPower);
  const tesla = w(E.teslaCharger);
  const kia = w(E.kiaCharger);
  const house = Math.max(0, solar + imp - exp - tesla - kia);
  const load = house + tesla + kia;
  const self = load > 0 ? Math.round(Math.min(1, solar / load) * 100) : 0;
  const rate = parseFloat(st(get, E.rate));
  const tariff = st(get, E.tariff);
  return {
    tariff: [tariff && !['unknown', 'unavailable'].includes(tariff) ? titleCase(tariff) : null, Number.isFinite(rate) && rate ? `$${rate.toFixed(2)}/kWh` : null].filter(Boolean).join(' · '),
    today: money(get, E.costToday), sold: money(get, E.solarCredit), bill: money(get, E.billToDate), estimate: money(get, E.billEstimate),
    grid: { value: fmtW(exp || imp), label: exp > 0 ? 'Exporting' : imp > 0 ? 'From grid' : 'Grid idle', dir: exp > 0 ? 'out' : imp > 0 ? 'in' : 'idle' },
    home: fmtW(load),
    solar: { value: fmtW(solar), active: solar > 0 },
    tesla: { value: fmtW(tesla), charging: tesla > 0 },
    kia: { value: fmtW(kia), charging: kia > 0 },
    self,
  };
}

// ---- Appliances, Robbie, bins ----

const MACHINE_WORDS = { rinse_hold: 'Rinse hold', cool_down: 'Cooling', steam_softening: 'Steam', wrinkle_care: 'Wrinkle care' };

export function machine(get, statusId, endId, now = Date.now()) {
  const s = st(get, statusId);
  if (!s || s === 'power_off' || s === 'unavailable') return { label: 'Off', on: false };
  const word = MACHINE_WORDS[s] ?? titleCase(s);
  const end = st(get, endId);
  let mins = 0;
  if (end && !['unknown', 'unavailable', 'none', ''].includes(end)) {
    const t = new Date(end).getTime();
    if (Number.isFinite(t)) mins = Math.floor((t - now) / 60000);
  }
  return { label: mins > 0 ? `${word} · ${mins} min left` : word, short: mins > 0 ? `${mins} min left` : word, on: true };
}

export function robbie(get) {
  const v = st(get, E.robbie);
  const dk = st(get, E.robbieDock);
  const dockErr = BAD_DOCK(dk) && v !== 'error';
  if (dockErr) return { label: titleCase(dk), alert: true, on: false };
  const words = { docked: 'Docked', cleaning: 'Cleaning', returning: 'Returning', paused: 'Paused', error: 'Error' };
  return { label: words[v] ?? titleCase(v ?? '—'), alert: v === 'error', on: v === 'cleaning' || v === 'returning' };
}

/**
 * Next bin collection. The wheelie-bin sensors aren't defined in this repo, so read whichever shape
 * they have: a number of days, a date, or a `days`/`days_to`/`date` attribute. Unknown shapes are skipped.
 */
export function nextBins(get, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const daysUntil = (s) => {
    if (!s || ['unknown', 'unavailable'].includes(s.state)) return null;
    const a = s.attributes ?? {};
    for (const v of [a.days, a.days_to, a.daysTo, s.state]) {
      const n = Number(v);
      if (v !== '' && v !== null && v !== undefined && Number.isFinite(n)) return n;
    }
    for (const v of [a.date, a.next_date, a.next_collection, s.state]) {
      const t = Date.parse(v);
      if (Number.isFinite(t)) { const d = new Date(t); return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - start) / 86400000); }
    }
    if (/today/i.test(s.state)) return 0;
    if (/tomorrow/i.test(s.state)) return 1;
    return null;
  };
  const due = BINS.map((b) => ({ ...b, days: daysUntil(get(b.id)) })).filter((b) => b.days !== null && b.days >= 0);
  if (!due.length) return null;
  const min = Math.min(...due.map((b) => b.days));
  const when = min === 0 ? 'Today' : min === 1 ? 'Tomorrow' : new Date(start + min * 86400000).toLocaleDateString('en-AU', { weekday: 'short' });
  return { when, bins: due.filter((b) => b.days === min) };
}

// ---- Security ----

export function alarmState(state) {
  const words = { disarmed: 'Disarmed', armed_home: 'Armed home', armed_away: 'Armed away', armed_night: 'Armed night', arming: 'Arming', pending: 'Pending', triggered: 'Triggered' };
  return { label: words[state] ?? titleCase(state ?? '—'), armed: Boolean(state) && state.startsWith('armed'), alert: state === 'triggered' || state === 'pending' };
}

export function frontDoor(get) {
  const unlocked = st(get, E.frontDoor) !== 'off';
  const open = on(get, E.frontContact);
  return { label: `${unlocked ? 'Unlocked' : 'Locked'} · ${open ? 'Open' : 'Closed'}`, alert: unlocked || open, unlocked };
}

/** Time-of-day phase for the page's ambient tint: night, dawn, dusk or day (from sun.sun). */
export function skyPhase(sun) {
  if (!sun) return 'day';
  if (sun.state === 'below_horizon') return 'night';
  const el = Number(sun.attributes?.elevation);
  if (Number.isFinite(el) && el < 12) return sun.attributes?.rising ? 'dawn' : 'dusk';
  return 'day';
}
