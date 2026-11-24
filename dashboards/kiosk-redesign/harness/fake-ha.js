/* Simulated Home Assistant for design mock-ups of kiosk-home.
   Injected before the page loads. It poses as Kiosk Satellite's shared connection
   (window.kioskSatellite.ha.createSocket) and answers the websocket messages the page sends:
   get_config, get_states, subscribe_entities, calendar/event/subscribe and call_service.
   All states are sample data, not read from a real Home Assistant. */
(() => {
  const at = (minsAgo) => new Date(Date.now() - minsAgo * 60000).toISOString();
  const S = (entity_id, state, attributes = {}, minsAgo = 30) =>
    ({ entity_id, state: String(state), attributes, last_changed: at(minsAgo), last_updated: at(minsAgo), context: { id: 'x', parent_id: null, user_id: null } });
  const W = (id, v, name) => S(id, v, { unit_of_measurement: 'W', friendly_name: name });
  const L = (id, on, name, bri = 200) => S(id, on ? 'on' : 'off', { friendly_name: name, supported_color_modes: ['brightness'], ...(on ? { brightness: bri } : {}) });
  const SW = (id, on, name) => S(id, on ? 'on' : 'off', { friendly_name: name });
  const B = (id, on, name, minsAgo) => S(id, on ? 'on' : 'off', { friendly_name: name, device_class: 'door' }, minsAgo);
  const inMin = (m) => new Date(Date.now() + m * 60000).toISOString();

  const states = [
    S('weather.north_lakes_weather', 'partlycloudy', { temperature: 27, humidity: 58, temperature_unit: '°C', friendly_name: 'Griffin' }),
    S('sun.sun', 'above_horizon', { elevation: 24, rising: false, friendly_name: 'Sun' }),
    SW('input_boolean.quiet_hour', false, 'Quiet hour'), SW('input_boolean.alert_banner_snooze', false, 'Snooze'),
    SW('input_boolean.keep_garage_door_open', false, 'Keep garage open'), SW('input_boolean.keep_side_door_open', false, 'Keep side open'),
    B('binary_sensor.garage_door_sensor_contact', false, 'Garage door'), B('binary_sensor.side_door_contact', false, 'Side door'),
    B('binary_sensor.crimsafe_door_contact', false, 'Security door'), B('binary_sensor.front_door_contact', false, 'Front door'),
    B('binary_sensor.patio_door_contact', false, 'Patio door'), B('binary_sensor.laundrydoorsensor_contact', false, 'Laundry door'),
    B('binary_sensor.hallwaydoorsensor_contact', false, 'Hallway door'),
    S('sensor.side_battery', 15, { unit_of_measurement: '%', friendly_name: 'Side camera battery' }, 95),
    S('sensor.robbie_dock_dock_error', 'ok', { friendly_name: 'Dock error' }), S('vacuum.robbie', 'docked', { friendly_name: 'Robbie', battery_level: 100 }),
    S('scene.good_night', '2026-11-23T22:01:00+00:00', { friendly_name: 'Good Night' }), SW('switch.festive_lights', false, 'Festive Light'),
    S('input_text.announce_message', '', { friendly_name: 'Announce message' }),
    S('input_select.announce_speaker', 'Kitchen', { options: ['Kitchen', 'Living Room', 'Everywhere'], friendly_name: 'Announce speaker' }),
    S('input_number.announce_volume', 0.5, { friendly_name: 'Announce volume' }),
    S('cover.garage_door_v2', 'closed', { friendly_name: 'Garage Door', device_class: 'garage' }), L('light.garage_light', false, 'Garage Downlight'),
    S('input_select.garage_door_state', 'closed', { options: ['open', 'closed'] }), SW('input_boolean.front_door', false, 'Front door'),
    S('alarm_control_panel.home_alarm', 'disarmed', { friendly_name: 'Home Alarm', code_format: null, code_arm_required: false, supported_features: 63 }),
    S('media_player.tv', 'off', { friendly_name: 'TV' }),
    S('media_player.media_apple_tv', 'playing', { friendly_name: 'Media Apple TV', media_title: 'Bluey', app_name: 'ABC iview' }),
    S('media_player.hubs_bedroom_apple_tv', 'off', { friendly_name: 'Bedroom Apple TV' }),
    S('climate.living_room', 'cool', { friendly_name: 'Aircon', temperature: 24, current_temperature: 26, hvac_action: 'cooling', hvac_modes: ['off', 'cool', 'heat', 'dry', 'fan_only', 'auto'] }),
    S('calendar.supar_family', 'off', { friendly_name: 'SuPar Family' }),
    S('camera.front_door_snapshot_2', 'idle', { friendly_name: 'Front Door', entity_picture: '/api/camera_proxy/camera.front_door_snapshot_2?token=demo' }, 1),
    S('camera.front_door_live_view_2', 'streaming', { friendly_name: 'Front Door live', entity_picture: '/api/camera_proxy/camera.front_door_live_view_2?token=demo' }),
    S('sensor.washer_current_status', 'wash', { friendly_name: 'Washer' }), S('sensor.washer_remaining_time', inMin(42)),
    S('sensor.dryer_current_status', 'power_off', { friendly_name: 'Dryer' }), S('sensor.dryer_remaining_time', 'unknown'),
    S('select.grid_import_tariff', 'shoulder', { options: ['peak', 'shoulder', 'off_peak'] }),
    S('sensor.current_energy_rate', 0.32, { unit_of_measurement: '$/kWh' }),
    S('sensor.daily_import_cost', 3.18, { unit_of_measurement: '$' }), S('sensor.daily_solar_credit', 1.24, { unit_of_measurement: '$' }),
    S('sensor.electricity_bill_to_date', 96.4, { unit_of_measurement: '$' }), S('sensor.electricity_estimated_bill', 168.2, { unit_of_measurement: '$' }),
    W('sensor.sh50rs_a21c2106894_mppt_total_power', 4800, 'Solar'), W('sensor.sh50rs_a21c2106894_purchased_power', 0, 'Import'),
    W('sensor.sh50rs_a21c2106894_total_export_active_power', 1650, 'Export'),
    W('sensor.sonic_charger_power', 0, 'Tesla charger'), W('sensor.kia_charger_power', 1900, 'Kia charger'),
    SW('binary_sensor.shanaya_room_occupancy_status', false, 'Shanaya'), SW('binary_sensor.samar_room_occupancy_new', true, 'Samar'),
    SW('switch.bedroom_tv', false, 'Bedroom TV'),
    S('person.sushenmathur', 'home', { friendly_name: 'Sushen', entity_picture: '/api/image/serve/person-sushen/512x512' }),
    S('person.paro', 'Paro - Work', { friendly_name: 'Paro', entity_picture: '/api/image/serve/person-paro/512x512' }),
    S('sensor.sushen_iphone_battery_level', 64, { unit_of_measurement: '%' }), S('sensor.sushen_iphone_battery_state', 'Not Charging'),
    S('sensor.paro_phone_battery', 23, { unit_of_measurement: '%' }), S('sensor.paro_iphone_battery_state', 'Charging'),
    S('device_tracker.kia_gps_location', 'home', { friendly_name: 'Sorento' }), S('input_number.kia_battery_estimate', 78, { unit_of_measurement: '%' }),
    S('device_tracker.tesla', 'home', { friendly_name: 'Bluey' }), S('sensor.sonic_battery', 46, { unit_of_measurement: '%' }),
    SW('binary_sensor.sonic_charging', false, 'Bluey charging'),
    SW('input_boolean.kia_onroad', false, 'Kia on road'), SW('input_boolean.tesla_onroad', false, 'Tesla on road'),
    L('light.kitchen_pendants', true, 'Kitchen Pendants', 210), L('light.dining_light', false, 'Dining'),
    L('light.sonoff_1000dbd8b7', true, 'Media Room', 150), L('light.tall_lamp', true, 'Tall Lamp', 110),
    L('light.corridor_light', false, 'Corridor'), L('light.hallway_light', false, 'Hallway'),
    L('light.kitchenled', true, 'Kitchen Bench'), L('light.kitchen_downlights', false, 'Kitchen Downlights'),
    L('light.aarlo_samar_cam', false, 'Samar Night Light'), SW('switch.sonoff_1000e54df1', false, 'Sonoff'),
    L('light.driveway_light', false, 'Driveway Floodlight'), SW('switch.sonoff_1000905c71', false, 'Door Downlight'),
    SW('switch.sonoff_100053e676', false, 'Outdoor Lights'), SW('switch.patio_lights', true, 'Patio Lights'),
    L('light.backyard_light', false, 'Backyard Spotlight'), L('light.laundry_light', false, 'Laundry Spotlight'),
    S('sensor.general_waste', 2, { friendly_name: 'General waste' }), S('sensor.garden_organics', 9, { friendly_name: 'Garden organics' }),
    S('sensor.recycling', 2, { friendly_name: 'Recycling' }),
  ];
  const byId = new Map(states.map((s) => [s.entity_id, s]));
  const day = (d, hh = 0, mm = 0) => { const t = new Date(); t.setDate(t.getDate() + d); t.setHours(hh, mm, 0, 0); return t.toISOString(); };
  const ymd = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };
  const calendar = [
    { summary: 'Swimming lessons', start: day(0, 17, 30), end: day(0, 18, 15), location: 'Aquatic centre' },
    { summary: 'Bin night', start: ymd(1), end: ymd(2) },
    { summary: 'Dinner with the Kapoors', start: day(3, 19, 0), end: day(3, 21, 0) },
  ];

  const compress = (s) => ({ s: s.state, a: s.attributes, c: s.context.id, lc: Date.parse(s.last_changed) / 1000, lu: Date.parse(s.last_updated) / 1000 });

  class FakeSocket {
    constructor() { this.haVersion = '2025.11.0'; this.l = { message: [], close: [] }; this.subs = []; }
    addEventListener(t, f) { (this.l[t] ||= []).push(f); }
    removeEventListener(t, f) { this.l[t] = (this.l[t] || []).filter((x) => x !== f); }
    emit(obj) { const data = JSON.stringify(obj); setTimeout(() => (this.l.message || []).forEach((f) => f({ data })), 0); }
    close() { (this.l.close || []).forEach((f) => f({})); }
    result(id, result) { this.emit({ id, type: 'result', success: true, result }); }
    send(raw) {
      const m = JSON.parse(raw);
      switch (m.type) {
        case 'get_config': return this.result(m.id, { time_zone: 'Australia/Brisbane', location_name: 'Home', unit_system: { temperature: '°C' }, version: this.haVersion });
        case 'get_states': return this.result(m.id, states);
        case 'subscribe_entities': {
          this.result(m.id, null); this.subs.push(m.id);
          const a = {}; (m.entity_ids || [...byId.keys()]).forEach((id) => { if (byId.has(id)) a[id] = compress(byId.get(id)); });
          return this.emit({ id: m.id, type: 'event', event: { a } });
        }
        case 'calendar/event/subscribe':
          this.result(m.id, null);
          return this.emit({ id: m.id, type: 'event', event: { events: calendar } });
        case 'call_service': {
          this.result(m.id, { context: { id: 'y' } });
          const ids = [].concat(m.target?.entity_id ?? m.service_data?.entity_id ?? []);
          const next = { turn_on: 'on', turn_off: 'off' }[m.service];
          ids.forEach((id) => {
            const s = byId.get(id); if (!s) return;
            const v = next ?? (m.service === 'toggle' ? (s.state === 'on' ? 'off' : 'on') : null);
            if (!v) return;
            s.state = v; s.last_changed = s.last_updated = new Date().toISOString();
            this.subs.forEach((sid) => this.emit({ id: sid, type: 'event', event: { c: { [id]: { '+': { s: v, lc: Date.now() / 1000, lu: Date.now() / 1000 } } } } }));
          });
          return;
        }
        case 'unsubscribe_events': case 'supported_features': case 'ping':
          return this.emit(m.type === 'ping' ? { id: m.id, type: 'pong' } : { id: m.id, type: 'result', success: true, result: null });
        default:
          return this.emit({ id: m.id, type: 'result', success: false, error: { code: 'not_supported', message: m.type } });
      }
    }
  }
  window.kioskSatellite = { platform: 'kiosksatellite', ha: { createSocket: async () => new FakeSocket() }, getKioskState: () => ({ screensaver: { active: false } }) };
})();
