// Run with: node --test tests/kiosk-home
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../../homeassistant/www/kiosk-home/home.js';
import { applyEntityDiff } from '../../homeassistant/www/kiosk-home/state.js';
import './glass.test.mjs'; // the glass page's own checks run with these

const NOW = Date.parse('2026-11-23T08:00:00Z');
const ago = (min) => new Date(NOW - min * 60000).toISOString();
/** Build a get(id) from {id: [state, attributes?, minutesAgo?]}. */
function world(spec) {
  const m = new Map(Object.entries(spec).map(([id, [s, a = {}, mins = 60]]) => [id, { entity_id: id, state: s, attributes: a, last_changed: ago(mins) }]));
  return (id) => m.get(id);
}

test('alerts sort by priority and keep insertion order for ties', () => {
  const get = world({
    'binary_sensor.garage_door_sensor_contact': ['on', {}, 12],
    'binary_sensor.side_door_contact': ['on', {}, 3],
    'input_boolean.keep_side_door_open': ['on'],
    'input_boolean.quiet_hour': ['on'],
    'sun.sun': ['below_horizon'],
    'binary_sensor.front_door_contact': ['on'],
  });
  const list = H.alerts(get).map((a) => a.msg);
  assert.deepEqual(list, ['Garage door open', 'Front door open', 'Side door kept open', 'Quiet hour on']);
});

test('banner wording matches the dashboard', () => {
  const get = world({ 'binary_sensor.garage_door_sensor_contact': ['on', {}, 12], 'binary_sensor.side_door_contact': ['on', {}, 3] });
  const b = H.banner(get, NOW);
  assert.equal(b.title, 'Garage door open');
  assert.equal(b.sub, '12 min · Also: Side door');
  assert.equal(b.level, 'urgent');
  const quiet = H.banner(world({ 'input_boolean.quiet_hour': ['on', {}, 75] }), NOW);
  assert.equal(quiet.sub, '1 h 15 min · Automated announcements suppressed');
  assert.equal(quiet.level, 'warn');
  assert.equal(H.banner(world({}), NOW).level, 'calm');
});

test('snoozing hides only the snoozable alerts', () => {
  const spec = { 'sun.sun': ['below_horizon'], 'binary_sensor.patio_door_contact': ['on'], 'binary_sensor.garage_door_sensor_contact': ['on'] };
  assert.equal(H.alerts(world(spec)).length, 2);
  const snoozed = H.alerts(world({ ...spec, 'input_boolean.alert_banner_snooze': ['on'] }));
  assert.deepEqual(snoozed.map((a) => a.msg), ['Garage door open']);
  assert.equal(H.bannerButtons(world(spec)).snooze, true);
});

test('light slots replace the longest-off favourites with lights on elsewhere', () => {
  const get = world({
    'light.kitchen_pendants': ['on'], 'light.dining_light': ['off', {}, 300], 'light.sonoff_1000dbd8b7': ['off', {}, 100],
    'light.tall_lamp': ['on'], 'light.corridor_light': ['off', {}, 50], 'light.hallway_light': ['on'],
    'light.kitchenled': ['on', {}, 20], 'switch.patio_lights': ['on', {}, 5],
  });
  assert.deepEqual(H.lightSlots(get), ['light.kitchen_pendants', 'light.kitchenled', 'switch.patio_lights', 'light.tall_lamp', 'light.corridor_light', 'light.hallway_light']);
  assert.equal(H.lightsOn(get), 5);
});

test('energy maths follows the dashboard card', () => {
  const kw = { unit_of_measurement: 'kW' };
  const get = world({
    'sensor.sh50rs_a21c2106894_mppt_total_power': ['2.86', kw], 'sensor.sh50rs_a21c2106894_purchased_power': ['0', { unit_of_measurement: 'W' }],
    'sensor.sh50rs_a21c2106894_total_export_active_power': ['1.42', kw], 'sensor.sonic_charger_power': ['0'], 'sensor.kia_charger_power': ['0'],
    'select.grid_import_tariff': ['shoulder'], 'sensor.current_energy_rate': ['0.3245'], 'sensor.daily_import_cost': ['3.112'],
  });
  const e = H.energy(get);
  assert.equal(e.grid.label, 'Exporting');
  assert.equal(e.grid.value, '1.4 kW');
  assert.equal(e.home, '1.4 kW');
  assert.equal(e.self, 100);
  assert.equal(e.tariff, 'Shoulder · $0.32/kWh');
  assert.equal(e.today, '$3.11');
  assert.equal(e.sold, '$0.00');
});

test('rooms: an open garage is an alert; laundry and media labels', () => {
  const get = world({
    'cover.garage_door_v2': ['open'], 'light.garage_light': ['on'],
    'sensor.washer_current_status': ['wash'], 'sensor.dryer_current_status': ['power_off'],
    'media_player.kitchen_speaker': ['playing', { friendly_name: 'Kitchen speaker' }], 'media_player.browser_x': ['playing'],
    'binary_sensor.samar_room_occupancy_new': ['on'], 'light.aarlo_samar_cam': ['on'],
  });
  const r = H.rooms(get, ['media_player.kitchen_speaker', 'media_player.browser_x']);
  assert.equal(r.garage.alert, true);
  assert.equal(r.garage.label, 'Door open');
  assert.equal(r.laundry.label, 'Washer running');
  assert.equal(r.media.label, 'Kitchen speaker playing');
  assert.equal(r.kids.label, 'Samar in · 1 on');
});

test('washer countdown and Robbie dock errors', () => {
  const get = world({
    'sensor.washer_current_status': ['rinse_hold'], 'sensor.washer_remaining_time': [new Date(NOW + 18.5 * 60000).toISOString()],
    'vacuum.robbie': ['docked'], 'sensor.robbie_dock_dock_error': ['water_empty'],
  });
  assert.equal(H.machine(get, 'sensor.washer_current_status', 'sensor.washer_remaining_time', NOW).label, 'Rinse hold · 18 min left');
  assert.deepEqual(H.robbie(get), { label: 'Water Empty', alert: true, on: false });
});

test('next bins reads days, dates and words', () => {
  const today = new Date('2026-11-23T09:00:00');
  const get = world({ 'sensor.general_waste': ['2'], 'sensor.recycling': ['2026-11-25'], 'sensor.garden_organics': ['Tomorrow'] });
  const b = H.nextBins(get, today);
  assert.equal(b.when, 'Tomorrow');
  assert.deepEqual(b.bins.map((x) => x.label), ['Garden']);
  assert.equal(H.nextBins(world({}), today), null);
});

test('subscribe_entities diffs update only what changed', () => {
  const states = new Map();
  applyEntityDiff(states, { a: { 'light.a': { s: 'off', a: {}, lc: 1 }, 'light.b': { s: 'on', a: {}, lc: 1 } } }, true);
  const b = states.get('light.b');
  const changed = applyEntityDiff(states, { c: { 'light.a': { '+': { s: 'on', lc: 2 } } } });
  assert.deepEqual([...changed], ['light.a']);
  assert.equal(states.get('light.b'), b);
});

import { averageTemp, acTimerText, dryingText, VIEWS, viewEntityIds } from '../../homeassistant/www/kiosk-home/views.js';

test('climate badge: average of numeric sources only', () => {
  assert.equal(averageTemp([25.8, null, 23.4, Number.NaN]), 24.6);
  assert.equal(averageTemp([null]), null);
});

test('AC off timer picks the soonest active timer', () => {
  const now = Date.parse('2026-11-23T08:00:00Z');
  const t = (mins, state = 'active') => ({ state, attributes: { finishes_at: new Date(now + mins * 60000).toISOString() } });
  assert.deepEqual(acTimerText([['Living AC', t(95)], ['Samar Room AC', t(47)], ['Bedroom AC', t(5, 'idle')]], now), { text: 'Samar Room AC · 47m', active: true });
  assert.deepEqual(acTimerText([['Living AC', t(125)]], now), { text: 'Living AC · 2h 5m', active: true });
  assert.equal(acTimerText([], now).active, false);
});

test('laundry drying advice follows the badge thresholds', () => {
  assert.equal(dryingText({ state: 'rainy', attributes: { humidity: 40 } }).level, 'bad');
  assert.equal(dryingText({ state: 'sunny', attributes: { humidity: 80 } }).level, 'bad');
  assert.equal(dryingText({ state: 'sunny', attributes: { humidity: 64 } }).level, 'mid');
  assert.equal(dryingText({ state: 'sunny', attributes: { humidity: 40 } }).level, 'good');
});

test('every master.yaml sub-view has a route', () => {
  // The master.yaml sub-views, plus the in-page Energy dashboard opened from the Energy card.
  assert.deepEqual(Object.keys(VIEWS).sort(), ['energy-dashboard', 'garage', 'homeclimate', 'kidsroom', 'laundry', 'lights', 'living-room', 'music', 'outdoor', 'security']);
  assert.ok(viewEntityIds().includes('lock.front_door_lock'));
});

test('charging reads the phone status sensor, then the iPhone backup when it is missing or unavailable', () => {
  const ids = ['sensor.sushen_phone_battery_status', 'sensor.sushen_iphone_battery_state'];
  const w = (a, b) => world({ ...(a !== undefined ? { [ids[0]]: [a] } : {}), ...(b !== undefined ? { [ids[1]]: [b] } : {}) });
  assert.equal(H.isCharging(w('Charging', 'Not Charging'), ids), true);
  assert.equal(H.isCharging(w('Not Charging', 'Charging'), ids), false, 'primary wins when it has a state');
  assert.equal(H.isCharging(w('unavailable', 'Charging'), ids), true, 'backup when primary is unavailable');
  assert.equal(H.isCharging(w('unknown', 'charging'), ids), true);
  assert.equal(H.isCharging(w(undefined, 'Charging'), ids), true, 'backup when primary is missing');
  assert.equal(H.isCharging(w('unavailable', 'unavailable'), ids), false);
  assert.equal(H.isCharging(w('Full', undefined), ids), false);
  assert.equal(H.isCharging(world({ 'sensor.x': ['Charging'] }), 'sensor.x'), true, 'a single id still works');
});
