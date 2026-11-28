// Sub-views ported from master.yaml (security, lights, homeclimate, living-room, garage, kidsroom,
// outdoor, laundry, music). Each view: { ids, render(c), actions? }. `c` is the context from app.js.
import { energyHud } from './energyhud.js?v=40';

// ---- Shared helpers ----
const st = (c, id) => c.get(id)?.state;
const on = (c, id) => st(c, id) === 'on';
const off = (c, id) => c.isUnavailable(c.get(id));
const num = (c, id) => { const v = parseFloat(st(c, id)); return Number.isFinite(v) ? v : null; };
const unit = (c, id) => c.get(id)?.attributes?.unit_of_measurement ?? '';
const fname = (c, id, fallback) => fallback ?? c.get(id)?.attributes?.friendly_name ?? id;
const cap = (s) => String(s ?? '—').replace(/_/g, ' ').replace(/^\w/, (x) => x.toUpperCase());
const pct = (s) => (s?.attributes?.brightness != null ? Math.round(s.attributes.brightness / 2.55) : null);
const valueText = (c, id, round = false) => {
  const v = num(c, id);
  if (v === null) return off(c, id) ? 'Unavailable' : cap(st(c, id));
  return `${round ? Math.round(v) : v}${unit(c, id) ? ` ${unit(c, id)}` : ''}`;
};

function head(c, { icon, title, sub = '', right = '' }) {
  return `<header class="vhead b"><span class="well">${c.ic(icon)}</span><div><h1>${c.esc(title)}</h1>${sub ? `<div class="sub-line">${sub}</div>` : ''}</div><span class="grow"></span>${right}</header>`;
}
const chip = (c, { icon, text, alert = false, on: lit = false, act = '', arg = '' }) =>
  `<${act ? 'button' : 'span'} class="chip b${alert ? ' alert' : ''}${lit ? ' on' : ''}"${act ? ` data-act="${act}" data-arg="${c.esc(arg)}"` : ''}>${c.ic(icon)}<span>${c.esc(text)}</span></${act ? 'button' : 'span'}>`;
const panel = (c, { title, sub = '', icon, right = '', body, cls = '', style = '' }) =>
  `<section class="panel b ${cls}" style="${style}"><div class="phead">${icon ? `<span class="well">${c.ic(icon)}</span>` : ''}<div><h2 class="name">${c.esc(title)}</h2>${sub ? `<span class="sub">${sub}</span>` : ''}</div><span class="grow"></span>${right}</div>${body}</section>`;
const grid = (cols, html) => `<div class="grid" style="--cols:${cols}">${html}</div>`;
const cols = (spec, html) => `<div class="vbody" style="grid-template-columns:${spec}">${html}</div>`;

/** A toggle tile for a light/switch/input_boolean. */
const toggleTile = (c, id, name, icon) => {
  const s = c.get(id);
  const p = pct(s);
  const sub = c.isUnavailable(s) ? 'Unavailable' : s.state === 'on' ? (p != null ? `${p}%` : 'On') : 'Off';
  return c.tile({ act: 'toggle', arg: id, icon, name: fname(c, id, name), sub, on: s?.state === 'on', off: c.isUnavailable(s), hold: id });
};
/** A read-only door/contact tile: open reads as an alert. */
const doorTile = (c, id, name, icon = 'door') => {
  const s = c.get(id);
  return c.tile({ act: 'noop', icon, name, sub: c.isUnavailable(s) ? 'Unavailable' : s.state === 'on' ? 'Open' : 'Closed', alert: s?.state === 'on', off: c.isUnavailable(s) });
};
const camImg = (c, id, name, live = true) => {
  const s = c.get(id);
  const pic = s?.attributes?.entity_picture;
  // When Home Assistant last updated the camera, as on the Home camera card.
  const upd = s?.last_updated ? `Updated ${c.fmtTime(new Date(s.last_updated), c.tz())}` : '';
  const hint = off(c, id) ? 'Unavailable' : live ? 'Tap for live' : '';
  return `<button class="camtile b" data-act="cam-live" data-arg="${id}">${pic ? `<img data-cam="${id}" src="${c.esc(pic)}" alt="${c.esc(name)} camera">` : ''}<span class="cap"><span class="camname">${c.esc(name)}${upd && !off(c, id) ? `<small class="upd">${upd}</small>` : ''}</span><small>${hint}</small></span></button>`;
};
const meter = (v) => `<span class="meter" style="--lvl:${Math.max(0, Math.min(100, v ?? 0))}%"></span>`;
const twoTap = (c, key, text) => c.label(key, text);

// ---- Lights ----
const LIGHT_ROOMS = [
  { title: 'Living & Kitchen', icon: 'sofa', lights: [
    ['light.dining_light', 'Dining', 'pendant', 1], ['light.tall_lamp', 'Tall Lamp', 'lamp', 1], ['light.kitchen_pendants', 'Pendants', 'pendant', 1],
    ['light.kitchenled', 'Kitchen Bench', 'downlight', 1], ['light.sonoff_1000dbd8b7', 'Media Downlights', 'downlight', 1], ['light.kitchen_downlights', 'Kitchen Downlights', 'downlight', 0]] },
  { title: 'Hallways, Bedrooms & Garage', icon: 'kids', lights: [
    ['light.corridor_light', 'Corridor', 'downlight', 1], ['light.aarlo_samar_cam', 'Samar Night Light', 'downlight', 1], ['light.hallway_light', 'Hallway Light', 'downlight', 0],
    ['switch.sonoff_1000e54df1', null, 'downlight', 0], ['light.garage_light', 'Garage Downlight', 'downlight', 0]] },
  { title: 'Outdoor', icon: 'tree', lights: [
    ['light.driveway_light', 'Driveway Floodlight', 'spot', 0], ['switch.sonoff_1000905c71', 'Door Downlight', 'downlight', 0], ['switch.sonoff_100053e676', 'Outdoor Lights', 'bulb', 0],
    ['switch.patio_lights', 'Patio Lights', 'sparkle', 0], ['light.backyard_light', 'Backyard Spotlight', 'spot', 0], ['light.laundry_light', 'Laundry Spotlight', 'spot', 0], ['switch.festive_lights', 'Festive Light', 'sparkle', 0]] },
];
const ALL_LIGHTS = LIGHT_ROOMS.flatMap((r) => r.lights.map((l) => l[0]));

const lights = {
  ids: [...ALL_LIGHTS, 'scene.good_evening', 'scene.good_night'],
  render(c) {
    const n = ALL_LIGHTS.filter((id) => on(c, id)).length;
    const right = `<div class="seg">
      <button data-act="call" data-arg="scene.turn_on|scene.good_evening">${c.ic('sun')}Evening</button>
      <button data-act="call-confirm" data-arg="scene.turn_on|scene.good_night">${c.ic('moon')}${twoTap(c, 'scene.turn_on|scene.good_night', 'Night')}</button>
      <button data-act="call-confirm" data-arg="homeassistant.turn_off|${ALL_LIGHTS.join(',')}">${c.ic('stop')}${twoTap(c, `homeassistant.turn_off|${ALL_LIGHTS.join(',')}`, 'All off')}</button></div>`;
    const rooms = LIGHT_ROOMS.map((r) => {
      const ids = r.lights.map((l) => l[0]);
      const lit = ids.filter((id) => on(c, id));
      const levels = lit.map((id) => pct(c.get(id))).filter((v) => v != null);
      const lv = levels.length ? Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) : null;
      const sub = lit.length ? `${lit.length} of ${ids.length} on${lv != null ? ` · ${lv}%` : ''}` : 'All off';
      const sw = `<button class="switch-btn${lit.length ? ' on' : ''}" data-act="call" data-arg="homeassistant.${lit.length ? 'turn_off' : 'turn_on'}|${ids.join(',')}" aria-label="${lit.length ? 'Turn all off' : 'Turn all on'}"><i></i></button>`;
      const tiles = r.lights.map(([id, name, icon, dim]) => {
        const t = toggleTile(c, id, name, icon);
        return dim && on(c, id) ? `<div class="dimwrap">${t}<button class="dimbtn b" data-act="dim" data-arg="${id}" aria-label="Brightness">${c.ic('sun')}</button></div>` : t;
      }).join('');
      return panel(c, { title: r.title, icon: r.icon, sub, right: sw, body: `<span class="share" style="--lvl:${Math.round((lit.length / ids.length) * 100)}%" aria-hidden="true"></span>` + grid(1, tiles) });
    }).join('');
    return head(c, { icon: 'bulb', title: 'Lighting', sub: `<b class="num">${n}</b> of ${ALL_LIGHTS.length} lights on`, right }) + cols('repeat(3, minmax(0, 1fr))', rooms);
  },
  actions: {
    dim(id, c) {
      c.openSheet(`<h2>${c.esc(fname(c, id))}</h2><p>Brightness</p><div class="acts">${[10, 25, 50, 75, 100].map((p) => `<button class="tile b" data-act="call" data-arg="light.turn_on|${id}|${JSON.stringify({ brightness_pct: p }).replace(/"/g, '&quot;')}">${p}%</button>`).join('')}</div>`);
    },
  },
};

// ---- Climate ----
const CLIMATE_ROOMS = [
  ['Living Room', 'sensor.living_room_inside_temperature', 'climate.living_room'],
  ['Bedroom', 'sensor.bedroom_roomtemp_temperature', 'climate.bed_ac'],
  ['Samar Room', 'sensor.aarlo_temperature_samar_cam', 'climate.samar_room'],
  ['Shanaya Room', 'sensor.shanayaroomtemp_temperature', 'climate.shanaya_room'],
];
const AVG_SOURCES = ['sensor.living_room_inside_temperature', 'sensor.aarlo_temperature_samar_cam', 'sensor.shanayaroomtemp_temperature', 'sensor.bedroom_temperature_temperature'];
const AC_TIMERS = [['Living AC', 'timer.ac_off_living'], ['Bedroom AC', 'timer.ac_off_bedroom'], ['Samar Room AC', 'timer.ac_off_samar'], ['Shanaya Room AC', 'timer.ac_off_shanaya']];

function climateBlock(c, climateId, modes = null) {
  const s = c.get(climateId);
  const a = s?.attributes ?? {};
  const range = a.temperature == null && a.target_temp_low != null;
  const target = a.temperature;
  const list = modes ?? a.hvac_modes ?? ['off', 'cool', 'heat'];
  const unav = c.isUnavailable(s);
  return `<div class="clim">
    <div class="kv"><span>Aircon</span><span>${unav ? 'Unavailable' : cap(a.hvac_action ?? s.state)}</span></div>
    <div class="temprow">${range || unav ? `<span class="sub">${range ? `${a.target_temp_low}–${a.target_temp_high}°` : '—'}</span>` : `
      <button class="sq b" data-act="temp" data-arg="${climateId}|-1" aria-label="Cooler">${c.ic('minus')}</button>
      <span class="big num">${target ?? '—'}°</span>
      <button class="sq b" data-act="temp" data-arg="${climateId}|1" aria-label="Warmer">${c.ic('plus')}</button>`}</div>
    <div class="seg">${list.map((m) => `<button class="${s?.state === m ? 'cur' : ''}" data-act="call" data-arg="climate.set_hvac_mode|${climateId}|${JSON.stringify({ hvac_mode: m }).replace(/"/g, '&quot;')}"${unav ? ' disabled' : ''}>${cap(m)}</button>`).join('')}</div></div>`;
}

export function averageTemp(values) {
  const v = values.filter((x) => Number.isFinite(x));
  if (!v.length) return null;
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
}

export function acTimerText(timers, now = Date.now()) {
  let best = null;
  for (const [room, s] of timers) {
    if (s?.state !== 'active' || !s.attributes?.finishes_at) continue;
    const left = Math.max(0, (Date.parse(s.attributes.finishes_at) - now) / 1000);
    if (!best || left < best.left) best = { room, left };
  }
  if (!best) return { text: 'AC timer', active: false };
  const mins = Math.ceil(best.left / 60);
  return { text: `${best.room} · ${mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`}`, active: true };
}

/** An aircon's running mode as a haze colour and a word, or null while it's off or unavailable. */
export function acMode(state) {
  const m = { cool: ['cool', 'Cooling'], heat: ['heat', 'Heating'], heat_cool: ['heatcool', 'Heat/cool'], auto: ['heatcool', 'Auto'],
    fan_only: ['fan', 'Fan only'], dry: ['dry', 'Drying'] }[state];
  return m ? { cls: m[0], label: m[1] } : null;
}

const homeclimate = {
  ids: [...new Set([...CLIMATE_ROOMS.flatMap((r) => [r[1], r[2]]), ...AVG_SOURCES, ...AC_TIMERS.map((t) => t[1]),
    'input_select.ac_timer_target', 'input_select.ac_timer_preset', 'script.ac_off_timer_start', 'script.ac_off_timer_cancel'])],
  render(c) {
    const avg = averageTemp(AVG_SOURCES.map((id) => num(c, id)));
    const band = avg == null ? '' : avg < 22 ? 'cool' : avg < 27 ? '' : 'hot';
    const timer = acTimerText(AC_TIMERS.map(([r, id]) => [r, c.get(id)]));
    const right = chip(c, { icon: 'thermo', text: avg == null ? 'No data' : `Average ${avg}°`, alert: band === 'hot' })
      + chip(c, { icon: 'timer', text: timer.text, on: timer.active, act: 'ac-timer' });
    // A running aircon's panel gets a soft haze in its mode's colour (blue cool, red heat, amber heat/cool,
    // teal fan only, violet dry) and the mode under its name, so it's clear at a glance which are on.
    const rooms = CLIMATE_ROOMS.map(([name, sensor, climate]) => {
      const mode = acMode(c.get(climate)?.state);
      const target = c.get(climate)?.attributes?.temperature;
      return panel(c, {
        title: name, icon: 'thermo', cls: mode ? `ac ac-${mode.cls}` : '',
        sub: mode ? `<span class="acmode">${mode.label}${target != null ? ` · ${target}°` : ''}</span>` : '',
        body: `${mode ? '<span class="haze" aria-hidden="true"></span>' : ''}<div class="big num" style="font-size:52px">${num(c, sensor) ?? '—'}<small style="font-size:22px">°</small></div><span class="sub">Room temperature</span>${climateBlock(c, climate)}`,
      });
    }).join('');
    return head(c, { icon: 'thermo', title: 'Climate', right: `<div class="seg">${right}</div>` }) + cols('repeat(4, minmax(0, 1fr))', rooms);
  },
  actions: {
    'ac-timer'(_, c) {
      const sel = (id, label) => {
        const s = c.get(id);
        return `<label class="sub">${label}</label><select data-select="${id}">${(s?.attributes?.options ?? []).map((o) => `<option${o === s.state ? ' selected' : ''}>${c.esc(o)}</option>`).join('')}</select>`;
      };
      const running = AC_TIMERS.map(([room, id]) => { const s = c.get(id); return `<span>${room}</span><span>${s?.state === 'active' ? cap(s.attributes.remaining ?? 'Active') : cap(s?.state ?? 'Idle')}</span>`; }).join('');
      c.openSheet(`<h2>AC off timer</h2>${sel('input_select.ac_timer_target', 'Room')}${sel('input_select.ac_timer_preset', 'Duration')}
        <div class="acts"><button class="tile b on" data-act="call" data-arg="script.turn_on|script.ac_off_timer_start">${c.ic('timer')}Start</button>
        <button class="tile b" data-act="call" data-arg="script.turn_on|script.ac_off_timer_cancel">${c.ic('stop')}Cancel</button></div>
        <h2 style="font-size:16px;margin-top:16px">Running timers</h2><div class="kv" style="margin-top:8px">${running}</div>`, (d) => {
        d.querySelectorAll('[data-select]').forEach((s) => { s.onchange = () => c.call('input_select', 'select_option', { entity_id: s.dataset.select, option: s.value }); });
      });
    },
  },
};

// ---- Security ----
const DOORS = [['binary_sensor.front_door_contact', 'Front'], ['binary_sensor.crimsafe_door_contact', 'Screen'], ['binary_sensor.garage_door_sensor_contact', 'Garage'],
  ['binary_sensor.hallwaydoorsensor_contact', 'Hallway'], ['binary_sensor.patio_door_contact', 'Patio'], ['binary_sensor.side_door_contact', 'Side'], ['binary_sensor.laundrydoorsensor_contact', 'Laundry']];
const CAMERAS = [['camera.driveway_live_view', 'Driveway'], ['camera.front_door_live_view_2', 'Front Door'], ['camera.garage_live_view', 'Garage'], ['camera.patio_live_view', 'Patio'],
  ['camera.backyard_live_view', 'Backyard'], ['camera.laundry_live_view', 'Laundry'], ['camera.side_live_view', 'Side Access']];
const SEC_BADGES = [['binary_sensor.patiopresencesensor_occupancy', 'Patio presence'], ['binary_sensor.patio_motion', 'Patio motion'], ['binary_sensor.backyard_motion', 'Backyard motion']];

function alarmPanel(c) {
  const id = 'alarm_control_panel.home_alarm';
  const a = c.H.alarmState(st(c, id));
  const unav = off(c, id);
  const b = (act, icon, text) => `<button class="abtn" data-act="${act}"${unav ? ' disabled' : ''}>${c.ic(icon)}${text}</button>`;
  return panel(c, { title: 'Home Alarm', icon: 'shield', sub: `<span class="${a.armed || a.alert ? '' : 'ok'}">${a.label}</span>`, cls: a.alert ? 'alert' : '',
    body: `<div class="btns" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${a.armed || a.alert ? b('alarm-disarm', 'lock', 'Disarm') : b('alarm-arm-home', 'home', 'Arm home') + b('alarm-arm-away', 'away', 'Arm away')}</div>` });
}

const security = {
  ids: [...DOORS.map((d) => d[0]), ...CAMERAS.map((d) => d[0]), ...SEC_BADGES.map((d) => d[0]), 'alarm_control_panel.home_alarm', 'cover.garage_door_v2', 'lock.front_door_lock'],
  render(c) {
    const open = DOORS.filter(([id]) => on(c, id)).length;
    const right = `<div class="seg">${SEC_BADGES.map(([id, name]) => chip(c, { icon: 'eye', text: `${name}: ${on(c, id) ? 'Detected' : off(c, id) ? 'Unavailable' : 'Clear'}`, on: on(c, id) })).join('')}</div>`;
    const cover = st(c, 'cover.garage_door_v2');
    const garage = panel(c, { title: 'Garage door', icon: 'garage', sub: cap(cover), cls: cover === 'open' || cover === 'opening' ? 'alert' : '',
      body: `<div class="seg"><button data-act="call-confirm" data-arg="cover.open_cover|cover.garage_door_v2">${twoTap(c, 'cover.open_cover|cover.garage_door_v2', 'Open')}</button><button data-act="call" data-arg="cover.stop_cover|cover.garage_door_v2">Stop</button><button data-act="close-garage">Close</button></div>` });
    const lk = st(c, 'lock.front_door_lock');
    const lock = panel(c, { title: 'Front door lock', icon: 'lock', sub: cap(lk), cls: lk === 'unlocked' || lk === 'open' ? 'alert' : '',
      body: `<div class="seg"><button data-act="call" data-arg="lock.lock|lock.front_door_lock">Lock</button><button data-act="call-confirm" data-arg="lock.unlock|lock.front_door_lock">${twoTap(c, 'lock.unlock|lock.front_door_lock', 'Unlock')}</button></div>` });
    const doors = panel(c, { title: 'Doors', icon: 'door', sub: open ? `${open} open` : 'All closed', body: grid(3, DOORS.map(([id, n]) => doorTile(c, id, n)).join('')) });
    const cams = panel(c, { title: 'Cameras', icon: 'camera', cls: 'fill', body: `<div class="camgrid">${CAMERAS.map(([id, n]) => camImg(c, id, n)).join('')}</div>` });
    return head(c, { icon: 'shield', title: 'Security & Access', right })
      + cols('minmax(0, 1fr) minmax(0, 1.45fr)', `<div class="stackv">${alarmPanel(c)}<div class="pair2">${garage}${lock}</div>${doors}</div>${cams}`);
  },
};

// ---- Living room ----
const PLAN = [['light.dining_light', 'Dining', 40, 40], ['light.tall_lamp', 'Lamp', 4, 61], ['light.kitchen_pendants', 'Pendants', 75, 39],
  ['light.kitchen_downlights', 'Downlights', 88, 21], ['light.kitchenled', 'Bench', 90, 66]];
const ROBBIE_BTNS = [['button.robbie_kitchen_clean', 'Kitchen'], ['button.robbie_media_clean', 'Media Room'], ['button.robbie_media_kitchen2', 'Media & Kitchen'],
  ['button.robbie_coffee_station_clean', 'Coffee Station'], ['button.robbie_tiled_area_clean', 'Mop Tiled Area']];
const LR_BADGES = [['binary_sensor.corridormotionsensor_occupancy', 'Corridor'], ['binary_sensor.hallwaymotionsensor_occupancy', 'Hallway'], ['binary_sensor.dining_sensor_vibration', 'Dining table']];

const livingRoom = {
  ids: [...PLAN.map((p) => p[0]), 'climate.living_room', 'vacuum.robbie', ...ROBBIE_BTNS.map((b) => b[0]), ...LR_BADGES.map((b) => b[0])],
  render(c) {
    const t = document.documentElement.dataset.theme;  // set by the sun (app.js applyTheme), else the tablet's setting
    const dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    const img = dark ? '/api/image/serve/cbbd3b4658275dd38c08c3e87ddacc41/512x512' : '/api/image/serve/4f7585416645db017d4cdb7d40e9bb2a/512x512';
    const pins = PLAN.map(([id, name, x, y]) => `<button class="pin b${on(c, id) ? ' on' : ''}" style="left:${x}%;top:${y}%" data-act="toggle" data-arg="${id}" data-hold="${id}" aria-label="${name}">${c.ic('bulb')}<span>${name}</span></button>`).join('')
      + `<button class="pin b${['off', 'unavailable'].includes(st(c, 'climate.living_room')) ? '' : ' on'}" style="left:8%;top:22%" data-act="go" data-arg="#homeclimate" aria-label="Aircon">${c.ic('snow')}<span>Aircon</span></button>`;
    const plan = panel(c, { title: 'Floor plan', icon: 'rooms', cls: 'fill', body: `<div class="plan"><img src="${img}" alt="Living, kitchen and dining floor plan">${pins}</div>` });
    const v = st(c, 'vacuum.robbie');
    const r = c.H.robbie(c.get);
    const robbie = panel(c, { title: 'Robbie', icon: 'robot', sub: r.label, cls: r.alert ? 'alert' : '',
      right: chip(c, { icon: 'chevron', text: 'Details', act: 'robbie' }),
      body: `<div class="seg"><button data-act="call" data-arg="vacuum.${v === 'cleaning' ? 'pause' : 'start'}|vacuum.robbie">${c.ic(v === 'cleaning' ? 'pause' : 'play')}${v === 'cleaning' ? 'Pause' : 'Start'}</button>
        <button data-act="call" data-arg="vacuum.return_to_base|vacuum.robbie">${c.ic('home')}Dock</button><button data-act="call" data-arg="vacuum.stop|vacuum.robbie">${c.ic('stop')}Stop</button></div>`
        + grid(1, ROBBIE_BTNS.map(([id, n]) => c.tile({ act: 'call', arg: `button.press|${id}`, icon: 'robot', name: n, sub: 'Clean' })).join('')) });
    const right = `<div class="seg">${LR_BADGES.map(([id, n]) => chip(c, { icon: 'eye', text: `${n}: ${on(c, id) ? 'Detected' : 'Clear'}`, on: on(c, id) })).join('')}</div>`;
    return head(c, { icon: 'sofa', title: 'Living, Kitchen & Dining', right }) + cols('minmax(0, 1.7fr) minmax(0, 1fr)', plan + robbie);
  },
};

// ---- Garage ----
function vehicle(c, { title, image, battery, tracker, onroad, charging, chips }) {
  const t = st(c, tracker);
  const place = !t || ['unknown', 'unavailable'].includes(t) ? 'Unknown' : t === 'home' ? 'Home' : t === 'not_home' ? 'Away' : t;
  const b = num(c, battery);
  const driving = on(c, onroad);
  return panel(c, { title, icon: 'car', sub: `${c.esc(place)} · ${driving ? 'Driving' : 'Parked'}`, cls: charging ? 'on' : '',
    body: `<img class="carimg" src="${image}" alt="${title}">
      <div class="kv"><span>Battery</span><span>${b != null ? `${Math.round(b)}%` : '—'}</span></div>${meter(b)}
      <div class="kv"><span>Charging</span><span>${charging ? 'Charging' : 'Not charging'}</span></div>${grid(2, chips)}` });
}

const garage = {
  ids: ['cover.garage_door_v2', 'light.garage_light', 'input_boolean.keep_garage_door_open', 'binary_sensor.tesla_at_home', 'binary_sensor.kia_at_home',
    'binary_sensor.garage_door_sensor_contact', 'binary_sensor.hallwaydoorsensor_contact', 'binary_sensor.garagemotionsensor_occupancy', 'sensor.garagemotionsensor_device_temperature',
    'camera.garage_live_view', 'sensor.sonic_battery', 'device_tracker.tesla', 'input_boolean.tesla_onroad', 'binary_sensor.sonic_charging', 'sensor.sonic_range_rated',
    'sensor.bluey_charge_energy_added', 'lock.bluey_lock', 'cover.bluey_trunk', 'input_number.kia_battery_estimate', 'device_tracker.kia_gps_location', 'input_boolean.kia_onroad',
    'sensor.kia_charger_power', 'sensor.kia_last_charge_added', 'switch.kia_charger'],
  render(c) {
    const cover = st(c, 'cover.garage_door_v2');
    const right = `<div class="seg">${chip(c, { icon: 'garage', text: `Door sensor: ${on(c, 'binary_sensor.garage_door_sensor_contact') ? 'Open' : 'Closed'}`, alert: on(c, 'binary_sensor.garage_door_sensor_contact') })}
      ${chip(c, { icon: 'door', text: `Hallway door: ${on(c, 'binary_sensor.hallwaydoorsensor_contact') ? 'Open' : 'Closed'}`, alert: on(c, 'binary_sensor.hallwaydoorsensor_contact') })}
      ${chip(c, { icon: 'eye', text: `Motion: ${on(c, 'binary_sensor.garagemotionsensor_occupancy') ? 'Detected' : 'Clear'}`, on: on(c, 'binary_sensor.garagemotionsensor_occupancy') })}
      ${chip(c, { icon: 'thermo', text: valueText(c, 'sensor.garagemotionsensor_device_temperature') })}</div>`;
    const door = panel(c, { title: 'Garage door', icon: 'garage', sub: `${cap(cover)} · cars: ${[on(c, 'binary_sensor.tesla_at_home') && 'Bluey', on(c, 'binary_sensor.kia_at_home') && 'Kia'].filter(Boolean).join(' & ') || 'none'}`,
      cls: cover === 'open' || cover === 'opening' ? 'alert' : '',
      body: `<div class="seg"><button data-act="call-confirm" data-arg="cover.open_cover|cover.garage_door_v2">${twoTap(c, 'cover.open_cover|cover.garage_door_v2', 'Open')}</button><button data-act="call" data-arg="cover.stop_cover|cover.garage_door_v2">Stop</button><button data-act="close-garage">Close</button></div>`
        + grid(2, toggleTile(c, 'light.garage_light', 'Light', 'downlight') + toggleTile(c, 'input_boolean.keep_garage_door_open', 'Keep open', 'garage'))
        + camImg(c, 'camera.garage_live_view', 'Garage') });
    const bluey = vehicle(c, { title: 'Bluey', image: '/api/image/serve/cdd510be49f2493bc87fd540c01cea69/512x512', battery: 'sensor.sonic_battery', tracker: 'device_tracker.tesla',
      onroad: 'input_boolean.tesla_onroad', charging: on(c, 'binary_sensor.sonic_charging'),
      chips: c.tile({ act: 'noop', icon: 'gauge', name: 'Range', sub: valueText(c, 'sensor.sonic_range_rated', true) })
        + c.tile({ act: 'noop', icon: 'bolt', name: 'Last charge', sub: valueText(c, 'sensor.bluey_charge_energy_added') })
        + c.tile({ act: 'call-confirm', arg: `lock.${st(c, 'lock.bluey_lock') === 'locked' ? 'unlock' : 'lock'}|lock.bluey_lock`, key: `lock.${st(c, 'lock.bluey_lock') === 'locked' ? 'unlock' : 'lock'}|lock.bluey_lock`, icon: 'lock', name: 'Lock', sub: cap(st(c, 'lock.bluey_lock')), alert: st(c, 'lock.bluey_lock') === 'unlocked' })
        + c.tile({ act: 'call-confirm', arg: 'cover.toggle|cover.bluey_trunk', key: 'cover.toggle|cover.bluey_trunk', icon: 'car', name: 'Boot', sub: cap(st(c, 'cover.bluey_trunk')), alert: st(c, 'cover.bluey_trunk') === 'open' }) });
    const kiaPower = num(c, 'sensor.kia_charger_power');
    const kia = vehicle(c, { title: 'Kia', image: '/api/image/serve/b0801eee9b5f2d6fcf7972d71f0d7711/512x512', battery: 'input_number.kia_battery_estimate', tracker: 'device_tracker.kia_gps_location',
      onroad: 'input_boolean.kia_onroad', charging: kiaPower != null && kiaPower > 10,
      chips: c.tile({ act: 'noop', icon: 'plug', name: 'Charge power', sub: valueText(c, 'sensor.kia_charger_power') })
        + c.tile({ act: 'noop', icon: 'bolt', name: 'Last charge', sub: valueText(c, 'sensor.kia_last_charge_added') })
        + toggleTile(c, 'switch.kia_charger', 'Charger', 'plug')
        + c.tile({ act: 'toggle', arg: 'input_boolean.kia_onroad', icon: 'car', name: 'On road', sub: on(c, 'input_boolean.kia_onroad') ? 'Driving' : 'Parked', on: on(c, 'input_boolean.kia_onroad') }) });
    return head(c, { icon: 'garage', title: 'Garage', right }) + cols('repeat(3, minmax(0, 1fr))', door + bluey + kia);
  },
};

// ---- Kids rooms ----
function kidPanel(c, { title, icon, chips, camera, climate }) {
  return panel(c, { title, icon, cls: 'fill kid', body: `<div class="seg">${chips}</div>${camImg(c, camera, title)}${climateBlock(c, climate, ['cool', 'heat', 'off'])}` });
}
const kidsroom = {
  ids: ['sensor.aarlo_temperature_samar_cam', 'binary_sensor.samar_room_occupancy_new', 'light.aarlo_samar_cam', 'light.tall_lamp', 'media_player.aarlo_samar_cam',
    'camera.aarlo_samar_cam', 'climate.samar_room', 'sensor.shanayaroomtemp_temperature', 'binary_sensor.shanaya_presence_sensor_presence',
    'input_boolean.shanaya_motion_detected', 'camera.shanaya_cam_live_view', 'climate.shanaya_room'],
  render(c) {
    const samar = kidPanel(c, { title: 'Samar Room', icon: 'kids', camera: 'camera.aarlo_samar_cam', climate: 'climate.samar_room',
      chips: chip(c, { icon: 'thermo', text: valueText(c, 'sensor.aarlo_temperature_samar_cam') })
        + chip(c, { icon: 'eye', text: on(c, 'binary_sensor.samar_room_occupancy_new') ? 'In room' : 'Empty', on: on(c, 'binary_sensor.samar_room_occupancy_new') })
        + chip(c, { icon: 'moon', text: 'Night light', on: on(c, 'light.aarlo_samar_cam'), act: 'toggle', arg: 'light.aarlo_samar_cam' })
        + chip(c, { icon: 'lamp', text: `Lamp ${on(c, 'light.tall_lamp') ? 'on' : 'off'}`, on: on(c, 'light.tall_lamp'), act: 'toggle', arg: 'light.tall_lamp' })
        + chip(c, { icon: 'music', text: `Noise ${st(c, 'media_player.aarlo_samar_cam') === 'playing' ? 'on' : 'off'}`, on: st(c, 'media_player.aarlo_samar_cam') === 'playing' }) });
    const shanaya = kidPanel(c, { title: 'Shanaya Room', icon: 'kids', camera: 'camera.shanaya_cam_live_view', climate: 'climate.shanaya_room',
      chips: chip(c, { icon: 'thermo', text: valueText(c, 'sensor.shanayaroomtemp_temperature') })
        + chip(c, { icon: 'eye', text: on(c, 'binary_sensor.shanaya_presence_sensor_presence') ? 'Present' : 'Empty', on: on(c, 'binary_sensor.shanaya_presence_sensor_presence') })
        + chip(c, { icon: 'kids', text: `Occupancy ${on(c, 'input_boolean.shanaya_motion_detected') ? 'on' : 'off'}`, on: on(c, 'input_boolean.shanaya_motion_detected'), act: 'toggle', arg: 'input_boolean.shanaya_motion_detected' }) });
    return head(c, { icon: 'kids', title: 'Kids Rooms' }) + cols('repeat(2, minmax(0, 1fr))', samar + shanaya);
  },
};

// ---- Outdoor ----
const outdoor = {
  ids: ['switch.patio_lights', 'light.backyard_light', 'binary_sensor.patio_door', 'binary_sensor.patiopresencesensor_occupancy', 'binary_sensor.patio_motion',
    'input_boolean.front_door', 'switch.sonoff_1000905c71', 'switch.sonoff_100053e676', 'light.driveway_light', 'switch.single_adaptor_pc190ha_socket_1',
    'binary_sensor.side_door_contact', 'binary_sensor.laundrydoorsensor_contact', 'input_boolean.keep_side_door_open', 'light.laundry_light'],
  render(c) {
    const front = c.H.frontDoor(c.get);
    const p1 = panel(c, { title: 'Backyard & Patio', icon: 'tree',
      sub: `Presence: ${on(c, 'binary_sensor.patiopresencesensor_occupancy') ? 'detected' : 'clear'} · motion: ${on(c, 'binary_sensor.patio_motion') ? 'detected' : 'clear'}`,
      body: grid(1, toggleTile(c, 'switch.patio_lights', 'Patio Lights', 'sparkle') + toggleTile(c, 'light.backyard_light', 'Spotlight', 'spot') + doorTile(c, 'binary_sensor.patio_door', 'Patio Door')) });
    const p2 = panel(c, { title: 'Front', icon: 'home',
      body: grid(1, c.tile({ act: 'front-toggle', icon: front.unlocked ? 'door' : 'lock', name: 'Front Door', sub: front.label, alert: front.alert, key: 'front-toggle' })
        + toggleTile(c, 'switch.sonoff_1000905c71', 'Door Downlight', 'downlight') + toggleTile(c, 'switch.sonoff_100053e676', 'Outdoor Lights', 'bulb')
        + toggleTile(c, 'light.driveway_light', 'Driveway', 'spot') + toggleTile(c, 'switch.single_adaptor_pc190ha_socket_1', 'Outdoor Plug', 'plug')) });
    const p3 = panel(c, { title: 'Side & Laundry', icon: 'door',
      body: grid(1, doorTile(c, 'binary_sensor.side_door_contact', 'Side Door') + doorTile(c, 'binary_sensor.laundrydoorsensor_contact', 'Laundry Door')
        + toggleTile(c, 'input_boolean.keep_side_door_open', 'Keep Side Door Open', 'door') + toggleTile(c, 'light.laundry_light', 'Laundry Spotlight', 'spot')) });
    return head(c, { icon: 'tree', title: 'Outdoor' }) + cols('repeat(3, minmax(0, 1fr))', p1 + p2 + p3);
  },
};

// ---- Laundry ----
export function dryingText(weather) {
  const w = weather?.state;
  const h = parseFloat(weather?.attributes?.humidity) || 0;
  const r = parseFloat(weather?.attributes?.rain_rate) || 0;
  if (['rainy', 'pouring', 'snowy', 'snowy-rainy', 'lightning-rainy', 'hail'].includes(w) || r > 0 || h > 75) return { text: 'Drying: poor, use the dryer', level: 'bad' };
  if (h > 60) return { text: 'Drying: OK', level: 'mid' };
  return { text: 'Drying: good', level: 'good' };
}
const LEAK = 'binary_sensor.0x0c2a6ffffe3be7d5_water_leak';
const fmtDate = (c, id) => { const s = st(c, id); const t = Date.parse(s); return Number.isFinite(t) ? new Date(t).toLocaleString('en-AU', { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : '—'; };

const laundry = {
  ids: ['weather.north_lakes_weather', LEAK, 'binary_sensor.laundrydoorsensor_contact', 'sensor.washer_current_status', 'sensor.washer_remaining_time', 'sensor.laundry_plug_energy',
    'input_number.energy_rate_day', 'input_number.wm_last_duration', 'input_datetime.wm_last_start', 'automation.washing_completed_notification',
    'sensor.dryer_current_status', 'sensor.dryer_remaining_time', 'switch.dryer_power', 'input_number.dm_last_duration', 'input_datetime.dm_last_start', 'automation.washing_machine_finished_announcement'],
  render(c) {
    const dry = dryingText(c.get('weather.north_lakes_weather'));
    const right = `<div class="seg">${chip(c, { icon: dry.level === 'bad' ? 'rain' : 'sun', text: dry.text, alert: dry.level === 'bad', on: dry.level === 'good' })}
      ${chip(c, { icon: 'drop', text: on(c, LEAK) ? 'Water leak' : 'No leak', alert: on(c, LEAK) })}
      ${chip(c, { icon: 'door', text: `Laundry door: ${on(c, 'binary_sensor.laundrydoorsensor_contact') ? 'Open' : 'Closed'}`, alert: on(c, 'binary_sensor.laundrydoorsensor_contact') })}</div>`;
    const w = c.H.machine(c.get, 'sensor.washer_current_status', 'sensor.washer_remaining_time');
    const energy = num(c, 'sensor.laundry_plug_energy');
    const rate = num(c, 'input_number.energy_rate_day');
    const washer = panel(c, { title: 'Washer', icon: 'washer', sub: w.label, cls: w.on ? 'on' : '',
      body: `<div class="kv"><span>Last run</span><span>${num(c, 'input_number.wm_last_duration') ?? '—'} min</span><span>Last started</span><span>${fmtDate(c, 'input_datetime.wm_last_start')}</span>
        <span>Energy</span><span>${energy != null ? `${energy} ${unit(c, 'sensor.laundry_plug_energy')}` : '—'}</span><span>Cost</span><span>${energy != null && rate != null ? `$${(energy * rate).toFixed(2)}` : '—'}</span></div>`
        + grid(1, toggleTile(c, 'automation.washing_completed_notification', 'Notify when done', 'megaphone')) });
    const d = c.H.machine(c.get, 'sensor.dryer_current_status', 'sensor.dryer_remaining_time');
    const dryer = panel(c, { title: 'Dryer', icon: 'dryer', sub: d.label, cls: d.on ? 'on' : '',
      body: `<div class="kv"><span>Last run</span><span>${num(c, 'input_number.dm_last_duration') ?? '—'} min</span><span>Last started</span><span>${fmtDate(c, 'input_datetime.dm_last_start')}</span></div>`
        + grid(1, toggleTile(c, 'switch.dryer_power', 'Dryer power', 'plug') + toggleTile(c, 'automation.washing_machine_finished_announcement', 'Notify when done', 'megaphone')) });
    return head(c, { icon: 'washer', title: 'Laundry', right }) + cols('repeat(2, minmax(0, 1fr))', washer + dryer);
  },
};

// ---- Music: the Music Assistant panel, embedded so the tab bar stays to come back ----
const music = {
  ids: [],
  render(c) {
    return head(c, { icon: 'music', title: 'Music', right: `<a class="btn line b" href="${c.musicPanel}" style="display:flex;align-items:center;text-decoration:none;color:inherit">Open full screen</a>` })
      + `<div class="vbody"><iframe class="embed b" src="${c.musicPanel}" title="Music Assistant" allow="autoplay; fullscreen"></iframe></div>`;
  },
};

export const VIEWS = { lights, homeclimate, security, 'living-room': livingRoom, garage, kidsroom, outdoor, laundry, music, 'energy-dashboard': energyHud };
export const viewEntityIds = () => [...new Set(Object.values(VIEWS).flatMap((v) => v.ids))];
