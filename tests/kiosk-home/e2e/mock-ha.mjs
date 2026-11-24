// Fake Home Assistant for the kiosk pages' end-to-end and visual tests (www/kiosk-home, www/kiosk-home-glass).
// Serves /local/ from homeassistant/www and speaks enough of the websocket API: states, subscribe_entities,
// services (logged at /__log), calendar, camera streams (HLS fixtures, a WebRTC relay), images.
// Env: PORT (8123) · SCENE alert|calm · MOCK_NOW fixed epoch ms (visual tests) · MOCK_TV · MOCK_LONG ·
//      MOCK_ALARM_CODE (the alarm has its own code, 1234) · MOCK_ALARM_SILENT (own code, wrong ones ignored
//      silently, like Alarmo) · MOCK_NO_ALARM_SCRIPT · MOCK_ALARM_MISMATCH (script OK, alarm's own code differs).
// Test hooks: GET /__state?id=&s= changes a state; GET /__log returns the service calls.
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../homeassistant/www');
const FIX = join(HERE, 'fixtures');
// A fixed clock for visual tests, so durations and dates render the same every run.
const NOW_MS = () => (process.env.MOCK_NOW ? Number(process.env.MOCK_NOW) : Date.now());
const PORT = Number(process.env.PORT ?? 8123);
const SCENE = process.env.SCENE ?? 'alert';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const log = { calls: [], camera: 0 };
const now = () => NOW_MS() / 1000;
const ago = (min) => now() - min * 60;
const alert = SCENE === 'alert';

const S = {};
const set = (id, s, a = {}, lcMinAgo = 30) => { S[id] = { s: String(s), a, lc: ago(lcMinAgo) }; };
set('weather.north_lakes_weather', 'partlycloudy', { temperature: 27.4, friendly_name: 'North Lakes' });
set('sun.sun', 'above_horizon');
set('input_boolean.quiet_hour', 'off'); set('input_boolean.alert_banner_snooze', 'off');
set('input_boolean.keep_garage_door_open', 'off'); set('input_boolean.keep_side_door_open', 'off');
set('binary_sensor.garage_door_sensor_contact', alert ? 'on' : 'off', { device_class: 'garage_door' }, 12);
set('binary_sensor.side_door_contact', alert ? 'on' : 'off', {}, 3);
for (const id of ['crimsafe_door_contact', 'front_door_contact', 'patio_door_contact', 'laundrydoorsensor_contact', 'hallwaydoorsensor_contact']) set(`binary_sensor.${id}`, 'off');
set('sensor.side_battery', '64', { unit_of_measurement: '%' });
set('sensor.robbie_dock_dock_error', 'ok');
set('vacuum.robbie', 'docked', { friendly_name: 'Robbie' });
set('scene.good_night', '2026-11-22T21:30:00+00:00', { friendly_name: 'Good Night' });
set('switch.festive_lights', 'off', { friendly_name: 'Festive Lights' });
set('input_text.announce_message', ''); set('input_select.announce_speaker', 'Kitchen', { options: ['Home', 'Kitchen', 'Media Room'] });
set('input_number.announce_volume', '0.6');
set('cover.garage_door_v2', alert ? 'open' : 'closed', { device_class: 'garage' }, 12);
set('light.garage_light', alert ? 'on' : 'off', { friendly_name: 'Garage Light' });
set('input_select.garage_door_state', alert ? 'Open' : 'Closed');
set('input_boolean.front_door', 'off');
set('alarm_control_panel.home_alarm', 'disarmed', { code_format: process.env.MOCK_ALARM_CODE || process.env.MOCK_ALARM_SILENT ? 'number' : null, code_arm_required: !!(process.env.MOCK_ALARM_CODE || process.env.MOCK_ALARM_SILENT), friendly_name: 'Home Alarm' });
if (process.env.MOCK_TV) set('media_player.tv', 'on', { friendly_name: 'TV', app_name: 'Netflix', source: 'Netflix', media_title: 'The Crown', volume_level: 0.23, is_volume_muted: false,
  source_list: ['Netflix', 'Prime Video', 'Stremio', 'YouTube', 'HDMI 1', 'HDMI 2', 'Live TV', 'Spotify'] });
else set('media_player.tv', 'off', { friendly_name: 'TV' });
set('media_player.kitchen_speaker', 'playing', { friendly_name: 'Kitchen speaker', media_title: 'Song' });
set('media_player.browser_tablet', 'playing', { friendly_name: 'Browser' });
set('switch.bedroom_tv', 'off');
set('climate.living_room', 'cool', { hvac_modes: ['off', 'cool', 'heat', 'dry', 'fan_only', 'auto'], hvac_action: 'cooling', temperature: 24, current_temperature: 26, target_temp_step: 0.5, min_temp: 16, max_temp: 30 });
set('calendar.supar_family', 'off');
set('camera.front_door_snapshot_2', 'idle', { entity_picture: '/api/camera_proxy/camera.front_door_snapshot_2?token=secret1' }, 1);
set('camera.front_door_live_view_2', 'streaming', { entity_picture: '/api/camera_proxy/camera.front_door_live_view_2?token=secret2' });
set('sensor.washer_current_status', alert ? 'wash' : 'power_off');
set('sensor.washer_remaining_time', new Date(NOW_MS() + 18 * 60000 + 30000).toISOString());
set('sensor.dryer_current_status', 'power_off'); set('sensor.dryer_remaining_time', 'unknown');
set('select.grid_import_tariff', 'shoulder'); set('sensor.current_energy_rate', '0.3245');
set('sensor.daily_import_cost', '3.112'); set('sensor.daily_solar_credit', '1.94'); set('sensor.electricity_bill_to_date', '116.4'); set('sensor.electricity_estimated_bill', '171.83');
set('sensor.sh50rs_a21c2106894_mppt_total_power', '2.86', { unit_of_measurement: 'kW' });
set('sensor.sh50rs_a21c2106894_purchased_power', '0', { unit_of_measurement: 'W' });
set('sensor.sh50rs_a21c2106894_total_export_active_power', '1.42', { unit_of_measurement: 'kW' });
set('sensor.home_power_consumption', '3300', { unit_of_measurement: 'W' }); set('sensor.bluey_charger_power', '2000', { unit_of_measurement: 'W' }); set('sensor.bluey_battery_level', '91', { unit_of_measurement: '%' }); set('sensor.bluey_battery_range', '371', { unit_of_measurement: 'km' });
set('sensor.daily_energy_net', '0.10'); set('sensor.sh50rs_a21c2106894_daily_grid_import', '3.2', { unit_of_measurement: 'kWh' }); set('sensor.solar_export_energy_daily', '17.3', { unit_of_measurement: 'kWh' }); set('sensor.sh50rs_a21c2106894_daily_self_consumption_rate', '39', { unit_of_measurement: '%' });
set('sensor.electricity_billing_day', '8'); set('sensor.electricity_days_remaining', '22'); set('input_number.electricity_last_bill', '142.30'); set('sensor.dashboard_night_mode', 'off'); set('sensor.grid_direction', 'exporting'); set('sensor.tesla_grid_charging_cost_today', '0.00'); set('sensor.kia_grid_charging_cost_today', '0.00');
set('sensor.sonic_charger_power', '0', { unit_of_measurement: 'W' }); set('sensor.kia_charger_power', '0', { unit_of_measurement: 'W' });
set('binary_sensor.shanaya_room_occupancy_status', 'off'); set('binary_sensor.samar_room_occupancy_new', 'on');
set('person.sushenmathur', 'home', { friendly_name: 'Sushen Mathur' }); set('person.paro', 'Paro - Work', { friendly_name: 'Paro' });
set('sensor.sushen_iphone_battery_level', '64', { unit_of_measurement: '%' }); set('sensor.sushen_iphone_battery_state', 'Charging');
set('sensor.paro_phone_battery', '18', { unit_of_measurement: '%' }); set('sensor.paro_iphone_battery_state', 'Not Charging');
set('sensor.sushen_phone_battery_status', 'Charging'); set('sensor.paro_phone_battery_status', 'unavailable');
set('device_tracker.kia_gps_location', 'home'); set('input_number.kia_battery_estimate', '100');
set('device_tracker.tesla', 'not_home'); set('sensor.sonic_battery', '42'); set('binary_sensor.sonic_charging', 'off');
set('sensor.general_waste', '2', { unit_of_measurement: 'days' }); set('sensor.recycling', '2', { unit_of_measurement: 'days' }); set('sensor.garden_organics', '9', { unit_of_measurement: 'days' });
const lights = { 'light.kitchen_pendants': ['on', 204, 50], 'light.dining_light': ['off', null, 300], 'light.sonoff_1000dbd8b7': ['off', null, 200], 'light.tall_lamp': ['on', 153, 40],
  'light.corridor_light': ['off', null, 400], 'light.hallway_light': ['off', null, 500], 'light.kitchenled': ['on', 255, 20], 'light.kitchen_downlights': ['off', null, 60],
  'light.aarlo_samar_cam': ['off', null, 60], 'switch.sonoff_1000e54df1': ['off', null, 60], 'light.driveway_light': ['off', null, 60], 'switch.sonoff_1000905c71': ['off', null, 60],
  'switch.sonoff_100053e676': ['off', null, 60], 'switch.patio_lights': ['on', null, 10], 'light.backyard_light': ['off', null, 60], 'light.laundry_light': ['off', null, 60] };
for (const [id, [s, b, m]] of Object.entries(lights)) set(id, s, b != null ? { brightness: b } : {}, m);
set('switch.sonoff_1000e54df1', process.env.MOCK_LONG ? 'on' : 'off', { friendly_name: 'Bedroom Downlights' });
for (const id of ['button.robbie_kitchen_clean', 'button.robbie_media_clean', 'button.robbie_media_kitchen2', 'button.robbie_coffee_station_clean', 'button.robbie_tiled_area_clean', 'button.robbie_hallways']) set(id, 'unknown');


// ---- Sub-view entities ----
set('light.hallway_light', 'off'); set('light.corridor_light', 'off'); set('light.dining_light', 'off'); set('light.sonoff_1000dbd8b7', 'off');
set('scene.good_evening', 'x'); set('switch.festive_lights', 'off');
set('sensor.living_room_inside_temperature', '25.8', { unit_of_measurement: '°C' }); set('sensor.bedroom_roomtemp_temperature', '24.1', { unit_of_measurement: '°C' });
set('sensor.bedroom_temperature_temperature', '24.0', { unit_of_measurement: '°C' }); set('sensor.aarlo_temperature_samar_cam', '23.4', { unit_of_measurement: '°C' });
set('sensor.shanayaroomtemp_temperature', '22.9', { unit_of_measurement: '°C' });
for (const id of ['climate.bed_ac', 'climate.samar_room', 'climate.shanaya_room']) set(id, id === 'climate.samar_room' ? 'cool' : 'off', { hvac_modes: ['off', 'cool', 'heat', 'dry', 'fan_only', 'auto'], temperature: 23, current_temperature: 24, target_temp_step: 0.5, min_temp: 16, max_temp: 30, hvac_action: id === 'climate.samar_room' ? 'cooling' : 'off' });
for (const id of ['timer.ac_off_living', 'timer.ac_off_bedroom', 'timer.ac_off_samar', 'timer.ac_off_shanaya']) set(id, 'idle');
S['timer.ac_off_samar'] = { s: 'active', a: { finishes_at: new Date(NOW_MS() + 47 * 60000).toISOString(), remaining: '0:47:00' }, lc: now() };
set('input_select.ac_timer_target', 'Living AC', { options: ['Living AC', 'Bedroom AC', 'Samar Room AC', 'Shanaya Room AC'] });
set('input_select.ac_timer_preset', '1 hour', { options: ['30 minutes', '1 hour', '2 hours', 'Custom'] });
set('script.ac_off_timer_start', 'off'); set('script.ac_off_timer_cancel', 'off');
for (const id of ['camera.driveway_live_view', 'camera.garage_live_view', 'camera.patio_live_view', 'camera.backyard_live_view', 'camera.laundry_live_view', 'camera.side_live_view', 'camera.aarlo_samar_cam', 'camera.shanaya_cam_live_view'])
  set(id, 'streaming', { entity_picture: `/api/camera_proxy/${id}?token=t`, friendly_name: id.split('.')[1].replace(/_/g, ' ') });
set('binary_sensor.patiopresencesensor_occupancy', 'off'); set('binary_sensor.patio_motion', 'off'); set('binary_sensor.backyard_motion', 'on');
set('lock.front_door_lock', 'locked');
set('binary_sensor.corridormotionsensor_occupancy', 'off'); set('binary_sensor.hallwaymotionsensor_occupancy', 'on'); set('binary_sensor.dining_sensor_vibration', 'off');
set('binary_sensor.tesla_at_home', 'off'); set('binary_sensor.kia_at_home', 'on'); set('binary_sensor.garagemotionsensor_occupancy', 'off');
set('sensor.garagemotionsensor_device_temperature', '28', { unit_of_measurement: '°C' });
set('input_boolean.tesla_onroad', 'on'); set('sensor.sonic_range_rated', '187.6', { unit_of_measurement: 'km' }); set('sensor.bluey_charge_energy_added', '22.4', { unit_of_measurement: 'kWh' });
set('lock.bluey_lock', 'locked'); set('cover.bluey_trunk', 'closed'); set('input_boolean.kia_onroad', 'off'); set('sensor.kia_last_charge_added', '18.1', { unit_of_measurement: 'kWh' }); set('switch.kia_charger', 'off');
set('media_player.aarlo_samar_cam', 'idle'); set('input_boolean.shanaya_motion_detected', 'off'); set('binary_sensor.shanaya_presence_sensor_presence', 'off');
set('binary_sensor.patio_door', 'off'); set('switch.single_adaptor_pc190ha_socket_1', 'off');
set('binary_sensor.0x0c2a6ffffe3be7d5_water_leak', 'off'); set('sensor.laundry_plug_energy', '0.84', { unit_of_measurement: 'kWh' }); set('input_number.energy_rate_day', '0.32');
set('input_number.wm_last_duration', '62'); set('input_datetime.wm_last_start', '2026-11-23 15:40:00'); set('automation.washing_completed_notification', 'on');
set('switch.dryer_power', 'off'); set('input_number.dm_last_duration', '48'); set('input_datetime.dm_last_start', '2026-11-22 10:05:00'); set('automation.washing_machine_finished_announcement', 'on');
S['weather.north_lakes_weather'].a.humidity = 64;
set('media_player.home_speakers', 'paused', { friendly_name: 'Home speakers', media_title: 'Morning playlist', volume_level: 0.4 });
S['media_player.kitchen_speaker'].a.volume_level = 0.55; S['media_player.kitchen_speaker'].a.media_artist = 'Band';

// Live-view camera with no entity_picture (only an access token), as Arlo live entities can be.
S['camera.front_door_live_view_2'] = { s: 'idle', a: { access_token: 'livetoken', supported_features: 2, friendly_name: 'Front Door live view' }, lc: now() };
S['person.sushenmathur'].a.entity_picture = '/api/image/serve/sushenface/512x512';
S['person.paro'].a.entity_picture = '/api/image/serve/paroface/512x512';
S['light.kitchen_pendants'].a.supported_color_modes = ['brightness'];
const full = (id) => ({ s: S[id].s, a: S[id].a, c: 'ctx', lc: S[id].lc });
const asState = (id) => ({ entity_id: id, state: S[id].s, attributes: S[id].a, last_changed: new Date(S[id].lc * 1000).toISOString(), last_updated: new Date(S[id].lc * 1000).toISOString(), context: { id: 'c' } });
const subs = new Set();
let peer = null;
let webrtcSub = null;
function change(id, s, a) {
  const plus = { lc: now() };
  if (s !== undefined) { S[id].s = s; plus.s = s; }
  if (a) { Object.assign(S[id].a, a); plus.a = a; }
  S[id].lc = plus.lc;
  for (const sub of subs) if (!sub.ids || sub.ids.includes(id)) sub.send({ c: { [id]: { '+': plus } } });
}
const flip = (id) => change(id, S[id].s === 'on' ? 'off' : 'on');

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/hls/')) {
    const f = join(FIX, (url.pathname.includes('front_door') ? 'hls-square' : 'hls'), url.pathname.split('/').pop());
    if (!existsSync(f)) { res.writeHead(404); return res.end(); }
    log.hls = (log.hls ?? 0) + 1;
    res.writeHead(200, { 'content-type': f.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp4' });
    return res.end(readFileSync(f));
  }
  if (url.pathname.startsWith('/api/camera_proxy_stream/')) {
    log.streamsOpen = (log.streamsOpen ?? 0) + 1; log.streamsActive = (log.streamsActive ?? 0) + 1;
    res.writeHead(200, { 'content-type': 'multipart/x-mixed-replace; boundary=frame', 'cache-control': 'no-store' });
    const frame = () => { res.write(`--frame\r\nContent-Type: image/png\r\nContent-Length: ${png.length}\r\n\r\n`); res.write(png); res.write('\r\n'); };
    frame(); const t = setInterval(frame, 400);
    req.on('close', () => { clearInterval(t); log.streamsActive--; });
    return;
  }
  if (url.pathname === '/d5369777_music_assistant') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<!doctype html><title>MA</title><h1 id=ma>Music Assistant</h1>'); }
  if (url.pathname === '/energy-new/energy') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<!doctype html><title>Energy</title><body style="font:20px sans-serif;padding:24px"><h1 id=en>Energy dashboard</h1><p>Home Assistant energy-new/energy view</p></body>'); }
  const face = /\/api\/image\/serve\/(sushenface|paroface)\//.exec(url.pathname);
  if (face) { res.writeHead(200, { 'content-type': 'image/png' }); return res.end(readFileSync(join(FIX, face[1] === 'sushenface' ? 'avatar-1.png' : 'avatar-2.png'))); }
  if (url.pathname.startsWith('/api/camera_proxy/') || url.pathname.startsWith('/api/image/serve/')) {
    if (url.pathname.includes('snapshot')) log.camera++;
    res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' }); return res.end(png);
  }
  // Stand-ins for files that live in /config/www/images on the real Home Assistant (MOCK_NO_LOGOS: no car logos).
  const img = /^\/local\/images\/(energy-dashboard-bg1|energy-dashboard-bg-night|kialogo|teslalogo)\.png$/.exec(url.pathname);
  if (img && process.env.MOCK_NO_LOGOS && /logo/.test(img[1])) { res.writeHead(404); return res.end(); }
  if (img && !existsSync(join(ROOT, 'images', img[1] + '.png'))) { res.writeHead(200, { 'content-type': 'image/png' }); return res.end(readFileSync(join(FIX, 'images', img[1] + '.png'))); }
  if (url.pathname.startsWith('/local/')) {
    const file = join(ROOT, decodeURIComponent(url.pathname.slice(7)));
    if (file.startsWith(ROOT) && existsSync(file) && statSync(file).isFile()) {
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' }); return res.end(readFileSync(file));
    }
  }
  if (url.pathname === '/__state') { change(url.searchParams.get('id'), url.searchParams.get('s')); res.writeHead(200); return res.end('ok'); }
  if (url.pathname === '/__log') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(log)); }
  res.writeHead(404); res.end('not found');
});

const wss = new WebSocketServer({ server, path: '/api/websocket' });
wss.on('connection', (ws) => {
  const send = (m) => ws.send(JSON.stringify(m));
  send({ type: 'auth_required', ha_version: '2026.11.0' });
  let authed = false;
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (!authed && msg.type === 'camera-peer') { peer = { send }; ws.on('close', () => { peer = null; }); return; }
    if (peer && peer.send === send) { const sub = webrtcSub; if (sub) { if (msg.answer) sub({ type: 'answer', answer: msg.answer }); if (msg.candidate) sub({ type: 'candidate', candidate: msg.candidate }); } return; }
    if (!authed) { authed = true; return send({ type: 'auth_ok', ha_version: '2026.11.0' }); }
    const ok = (result = null) => send({ id: msg.id, type: 'result', success: true, result });
    switch (msg.type) {
      case 'supported_features': return ok();
      case 'get_config': return ok({ time_zone: 'Australia/Brisbane' });
      case 'get_states': return ok(Object.keys(S).map(asState));
      case 'subscribe_entities': {
        const sub = { ids: msg.entity_ids, send: (event) => send({ id: msg.id, type: 'event', event }) };
        subs.add(sub); ws.on('close', () => subs.delete(sub)); ok();
        const a = {}; for (const id of Object.keys(S)) if (!sub.ids || sub.ids.includes(id)) a[id] = full(id);
        return sub.send({ a });
      }
      case 'calendar/event/subscribe': {
        ok();
        const d = (days, h, m) => { const t = new Date(NOW_MS()); t.setDate(t.getDate() + days); t.setHours(h, m, 0, 0); return t.toISOString(); };
        const day = (days) => { const t = new Date(NOW_MS()); t.setDate(t.getDate() + days); return t.toISOString().slice(0, 10); };
        return send({ id: msg.id, type: 'event', event: { events: [
          { summary: 'Dental appointment Paro', start: d(1, 14, 40), end: d(1, 15, 30), location: 'Albany Hills Dental Albany Creek' },
          { summary: 'Samar – SportsX Class', start: d(1, 15, 10), end: d(1, 16, 0), location: 'Living Faith Primary School' },
          { summary: 'Bin night', start: day(2), end: day(3) },
          { summary: 'Paro: dentist', start: d(3, 9, 15), end: d(3, 10, 0) },
          { summary: 'Later thing', start: d(6, 9, 0), end: d(6, 10, 0) },
        ] } });
      }
      case 'camera/capabilities': return ok({ frontend_stream_types: msg.entity_id === 'camera.patio_live_view' ? ['web_rtc'] : ['hls'] });
      case 'camera/stream':
        if (msg.entity_id === 'camera.garage_live_view') return send({ id: msg.id, type: 'result', success: false, error: { code: 'start_stream_failed', message: 'Arlo did not return a stream URL' } });
        return ok({ url: `/api/hls/${msg.entity_id}/master_playlist.m3u8` });
      case 'camera/webrtc/get_client_config': return ok({ configuration: { iceServers: [] } });
      case 'camera/webrtc/offer': {
        ok();
        const ev = (event) => send({ id: msg.id, type: 'event', event });
        webrtcSub = ev; log.webrtc = (log.webrtc ?? 0) + 1;
        ev({ type: 'session', session_id: 's1' });
        if (peer) peer.send({ offer: msg.offer }); else ev({ type: 'error', code: 'webrtc_offer_failed', message: 'no camera peer' });
        return;
      }
      case 'camera/webrtc/candidate': if (peer) peer.send({ candidate: msg.candidate }); return ok();
      case 'call_service': {
        log.calls.push(`${msg.domain}.${msg.service}`);
        (log.data ??= []).push({ svc: `${msg.domain}.${msg.service}`, data: msg.service_data ?? {} });
        const id = msg.service_data?.entity_id ?? msg.target?.entity_id;
        const alarmTo = { alarm_arm_home: 'armed_home', alarm_arm_away: 'armed_away', alarm_disarm: 'disarmed' };
        if (msg.domain === 'alarm_control_panel') {
          // Like HA: a panel without code_format accepts any code; one with a code (MOCK_ALARM_CODE, 1234) checks it.
          // MOCK_ALARM_SILENT: like Alarmo, a wrong code is accepted as a call but the alarm doesn't change.
          if (process.env.MOCK_ALARM_SILENT && msg.service_data?.code !== '1234') return ok({ context: { id: 'c' } });
          if (process.env.MOCK_ALARM_CODE && msg.service_data?.code !== '1234') return send({ id: msg.id, type: 'result', success: false, error: { code: 'service_validation_error', message: 'Invalid alarm code provided' } });
          setTimeout(() => change('alarm_control_panel.home_alarm', alarmTo[msg.service]), 100);
          return ok({ context: { id: 'c' } });
        }
        if (msg.domain === 'script' && msg.service === 'alarm_keypad') {
          if (process.env.MOCK_NO_ALARM_SCRIPT) return send({ id: msg.id, type: 'result', success: false, error: { code: 'not_found', message: 'Action script.alarm_keypad not found' } });
          // homeassistant/dashboard/alarm-keypad-script.yaml with the secret 1234
          if (msg.service_data?.code !== '1234') return ok({ context: { id: 'c' }, response: { ok: false, reason: 'Incorrect code' } });
          log.calls.push(`alarm_control_panel.alarm_${msg.service_data.request}`);
          // MOCK_ALARM_MISMATCH: the alarm's own code differs from the secret, so it silently ignores the call.
          if (!process.env.MOCK_ALARM_MISMATCH) setTimeout(() => change('alarm_control_panel.home_alarm', alarmTo[`alarm_${msg.service_data.request}`]), 100);
          return ok({ context: { id: 'c' }, response: { ok: true } });
        }
        if (msg.domain === 'script' && msg.service === 'lost_phone') {
          return ok({ context: { id: 'c' }, response: { ok: msg.service_data.passcode === '1234' } });
        }
        setTimeout(() => {
          if (msg.service === 'toggle' && S[id]) {
            if (id === 'cover.garage_door_v2') { const o = S[id].s === 'open'; change(id, o ? 'closed' : 'open'); change('binary_sensor.garage_door_sensor_contact', o ? 'off' : 'on'); }
            else flip(id);
          }
          if (msg.service === 'close_cover') { change(id, 'closed'); change('binary_sensor.garage_door_sensor_contact', 'off'); change('input_select.garage_door_state', 'Closed'); }
          for (const one of [].concat(id ?? [])) { if (msg.service === 'turn_off' && S[one]) change(one, 'off'); if (msg.service === 'turn_on' && S[one] && /^(light|switch)\./.test(one)) change(one, 'on', msg.service_data.brightness_pct ? { brightness: Math.round(msg.service_data.brightness_pct * 2.55) } : undefined); }
          if (msg.service === 'set_hvac_mode') change(id, msg.service_data.hvac_mode);
          if (msg.service === 'open_cover') { change(id, 'open'); }
          if (msg.service === 'turn_on' && id?.startsWith('input_boolean')) change(id, 'on');
          if (msg.service === 'alarm_arm_away') change(id, 'armed_away');
          if (msg.service === 'alarm_arm_home') change(id, 'armed_home');
          if (msg.service === 'alarm_disarm') change(id, 'disarmed');
          if (msg.service === 'set_temperature') change(id, undefined, { temperature: msg.service_data.temperature });
        }, 20);
        return ok({ context: { id: 'c' } });
      }
      default: return send({ id: msg.id, type: 'result', success: false, error: { code: 'unknown_command', message: msg.type } });
    }
  });
});
server.listen(PORT, () => console.log(`mock home (${SCENE}) on ${PORT}`));
