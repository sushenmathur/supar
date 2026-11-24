// The Warm Stone Glass page (www/kiosk-home-glass/) shares its logic with kiosk-home; these cover what differs.
// Run with: node --test tests/kiosk-home
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../../homeassistant/www/kiosk-home-glass/home.js';

const world = (spec) => (id) => (id in spec ? { entity_id: id, state: spec[id], attributes: {}, last_changed: new Date().toISOString() } : undefined);

test('hallway door raises a night alert, like patio and laundry', () => {
  const night = world({ 'sun.sun': 'below_horizon', 'binary_sensor.hallwaydoorsensor_contact': 'on' });
  assert.deepEqual(G.alerts(night).map((a) => a.msg), ['Hallway door open']);
  assert.equal(G.bannerButtons(night).snooze, true);
  const day = world({ 'sun.sun': 'above_horizon', 'binary_sensor.hallwaydoorsensor_contact': 'on' });
  assert.deepEqual(G.alerts(day), []);
  const snoozed = world({ 'sun.sun': 'below_horizon', 'binary_sensor.hallwaydoorsensor_contact': 'on', 'input_boolean.alert_banner_snooze': 'on' });
  assert.deepEqual(G.alerts(snoozed), []);
});

test('banner says all clear only when the hallway door is closed too', () => {
  assert.equal(G.banner(world({ 'sun.sun': 'below_horizon', 'binary_sensor.hallwaydoorsensor_contact': 'off' })).title, 'All clear');
  assert.equal(G.banner(world({ 'sun.sun': 'below_horizon', 'binary_sensor.hallwaydoorsensor_contact': 'on' })).title, 'Hallway door open');
});

test('glass page: charging uses the status sensor, then the iPhone backup', () => {
  const ids = ['sensor.paro_phone_battery_status', 'sensor.paro_iphone_battery_state'];
  assert.equal(G.isCharging(world({ [ids[0]]: 'unavailable', [ids[1]]: 'Charging' }), ids), true);
  assert.equal(G.isCharging(world({ [ids[0]]: 'Not Charging', [ids[1]]: 'Charging' }), ids), false);
});
