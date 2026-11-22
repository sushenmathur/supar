// Run with: node --test tests/kiosk-test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  extractEntities, mergeExtractions, isStrategyDashboard, fallbackEntities, groupByArea, groupByDomain,
  parseDashParam, applyEntityDiff, redact, redactUrl, binarySensorText, stepValue, climateStep,
  isLocalImage, UNASSIGNED,
} from '../../homeassistant/www/kiosk-test/entities.js';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const cards = fixture('dashboard-cards.json');
const strategy = fixture('dashboard-strategy.json');
const known = new Set(fixture('states.json'));
const services = Object.entries(fixture('services.json')).flatMap(([d, s]) => Object.keys(s).map((n) => `${d}.${n}`));
const registries = fixture('registries.json');

const EXPECTED = [
  'light.kitchen_main', 'fan.kitchen', 'sensor.kitchen_temperature', 'binary_sensor.kitchen_motion',
  'cover.garage_door', 'lock.front_door', 'sensor.front_door_battery', 'light.hallway',
  'sensor.outdoor_temperature', 'sensor.dotted_power', 'sensor.living_humidity', 'switch.coffee_machine',
  'scene.movie_night', 'climate.lounge', 'media_player.lounge_speaker',
];

test('extracts every referenced entity in first-seen order, without duplicates', () => {
  const { entities } = extractEntities(cards, known, { services });
  assert.deepEqual(entities, EXPECTED);
});

test('finds entities inside each card style', () => {
  const { entities } = extractEntities(cards, known, { services });
  const has = (id) => assert.ok(entities.includes(id), id);
  has('light.kitchen_main'); // Bubble pop-up `cards:`
  has('binary_sensor.kitchen_motion'); // horizontal-buttons-stack `1_entity`
  has('sensor.kitchen_temperature'); // `sub_button`
  has('sensor.outdoor_temperature'); // button-card JS `states['sensor.x']`
  has('sensor.living_humidity'); // Mushroom Jinja `states('sensor.y')`
  has('media_player.lounge_speaker'); // `entities:` object entry
  has('climate.lounge'); // `entities:` string entry
  has('sensor.front_door_battery'); // `variables:`
  has('sensor.dotted_power'); // `hass.states.sensor.x`
  has('scene.movie_night'); // after a newline escape in a template
});

test('reports non-existent entities of known domains as missing, but not service names', () => {
  const { missing } = extractEntities(cards, known, { services });
  assert.deepEqual(missing, ['light.old_lamp']);
  const withoutServices = extractEntities(cards, known).missing;
  assert.ok(withoutServices.includes('light.turn_on'));
});

test('ignores entities not in the state machine and unknown domains', () => {
  const { entities, missing } = extractEntities({ a: 'foo.bar', b: 'camera.gone' }, known);
  assert.deepEqual(entities, []);
  assert.deepEqual(missing, ['camera.gone']);
});

test('merges several dashboards keeping first-seen order', () => {
  const merged = mergeExtractions([
    { entities: ['light.a', 'light.b'], missing: ['light.x'] },
    { entities: ['light.b', 'light.c'], missing: ['light.x', 'light.y'] },
  ]);
  assert.deepEqual(merged, { entities: ['light.a', 'light.b', 'light.c'], missing: ['light.x', 'light.y'] });
});

test('detects strategy dashboards and falls back to visible entities', () => {
  assert.equal(isStrategyDashboard(strategy), true);
  assert.equal(isStrategyDashboard(cards), false);
  assert.deepEqual(extractEntities(strategy, known).entities, []);
  const all = fallbackEntities(known, registries.entities);
  assert.equal(all.length, known.size - 1);
  assert.ok(!all.includes('sensor.unused_hidden'));
  assert.equal(fallbackEntities(known, null).length, known.size);
});

test('groups by entity area, then device area, then unassigned; sorted by name', () => {
  const ids = extractEntities(cards, known, { services }).entities.filter((id) => !id.startsWith('s'));
  const groups = groupByArea(['sensor.kitchen_temperature', ...ids], registries);
  assert.deepEqual(groups.map((g) => g.id), ['garage', 'kitchen', 'lounge', UNASSIGNED]);
  const byId = Object.fromEntries(groups.map((g) => [g.id, g]));
  assert.deepEqual(byId.kitchen.entityIds, ['light.kitchen_main', 'fan.kitchen']);
  assert.deepEqual(byId.lounge.entityIds, ['sensor.kitchen_temperature', 'climate.lounge']);
  assert.equal(byId.lounge.name, 'lounge room');
  assert.deepEqual(byId.garage.entityIds, ['cover.garage_door']);
  // No registry entry, device without area, and an area that no longer exists.
  assert.deepEqual(byId[UNASSIGNED].entityIds, [
    'binary_sensor.kitchen_motion', 'lock.front_door', 'light.hallway', 'media_player.lounge_speaker',
  ]);
});

test('groups by domain when registries are unavailable', () => {
  const groups = groupByDomain(['light.a', 'binary_sensor.b', 'light.c']);
  assert.deepEqual(groups, [
    { id: 'binary_sensor', name: 'Binary Sensor', entityIds: ['binary_sensor.b'] },
    { id: 'light', name: 'Light', entityIds: ['light.a', 'light.c'] },
  ]);
});

test('parses the ?dash= override', () => {
  assert.equal(parseDashParam(''), null);
  assert.deepEqual(parseDashParam('?dash=dashboard-hub,default'), ['dashboard-hub', null]);
  assert.deepEqual(parseDashParam('?dash=a,%20b'), ['a', 'b']);
});

test('applies subscribe_entities messages and reports only what changed', () => {
  const states = new Map();
  let changed = applyEntityDiff(states, {
    a: {
      'light.a': { s: 'on', a: { brightness: 255, friendly_name: 'A' }, c: 'ctx1', lc: 1700000000 },
      'light.b': { s: 'off', a: {}, c: 'ctx2', lc: 1700000000, lu: 1700000100 },
    },
  }, true);
  assert.deepEqual([...changed].sort(), ['light.a', 'light.b']);
  const before = states.get('light.b');

  changed = applyEntityDiff(states, { c: { 'light.a': { '+': { s: 'off', lc: 1700000500 }, '-': { a: ['brightness'] } } } });
  assert.deepEqual([...changed], ['light.a']);
  assert.equal(states.get('light.a').state, 'off');
  assert.deepEqual(states.get('light.a').attributes, { friendly_name: 'A' });
  assert.equal(states.get('light.a').last_changed, new Date(1700000500 * 1000).toISOString());
  assert.equal(states.get('light.b'), before, 'untouched entities keep their object');

  changed = applyEntityDiff(states, { r: ['light.b'] });
  assert.deepEqual([...changed], ['light.b']);
  assert.equal(states.has('light.b'), false);

  // After a reconnect the first message replaces everything.
  states.set('light.stale', { state: 'on' });
  changed = applyEntityDiff(states, { a: { 'light.a': { s: 'on', a: {}, lc: 1 } } }, true);
  assert.ok(changed.has('light.stale'));
  assert.deepEqual([...states.keys()], ['light.a']);
});

test('redacts secrets in attributes and URLs', () => {
  assert.equal(redactUrl('/api/camera_proxy/camera.x?token=abc123&w=640'), '/api/camera_proxy/camera.x?token=••••&w=640');
  assert.equal(redactUrl('https://h/x?a=1&API_KEY=z#f'), 'https://h/x?a=1&API_KEY=••••#f');
  const out = redact({
    entity_picture: '/api/image?access_token=xyz',
    access_token: 'xyz',
    nested: { password: 'p', ok: 'fine', list: ['/a?key=k'] },
    count: 3,
  });
  assert.deepEqual(out, {
    entity_picture: '/api/image?access_token=••••',
    access_token: '••••',
    nested: { password: '••••', ok: 'fine', list: ['/a?key=••••'] },
    count: 3,
  });
});

test('words binary sensors by device class', () => {
  assert.equal(binarySensorText('on', 'door'), 'Open');
  assert.equal(binarySensorText('off', 'garage_door'), 'Closed');
  assert.equal(binarySensorText('on', 'motion'), 'Detected');
  assert.equal(binarySensorText('off', 'occupancy'), 'Clear');
  assert.equal(binarySensorText('on', undefined), 'On');
  assert.equal(binarySensorText('unavailable', 'door'), 'Unavailable');
});

test('steps numbers within bounds at the step precision', () => {
  assert.equal(stepValue(21.5, 0.5, 1), 22);
  assert.equal(stepValue(0.3, 0.1, 1), 0.4);
  assert.equal(stepValue(30, 1, 1, 0, 30), 30);
  assert.equal(stepValue(0, 5, -1, 0, 100), 0);
  assert.equal(climateStep({ target_temp_step: 1 }), 1);
  assert.equal(climateStep({}), 0.5);
});

test('only loads images from Home Assistant itself', () => {
  assert.equal(isLocalImage('/api/camera_proxy/camera.x?token=t', 'http://ha.local:8123'), true);
  assert.equal(isLocalImage('http://ha.local:8123/api/x', 'http://ha.local:8123'), true);
  assert.equal(isLocalImage('https://cdn.example.com/art.jpg', 'http://ha.local:8123'), false);
  assert.equal(isLocalImage('//cdn.example.com/art.jpg', 'http://ha.local:8123'), false);
  assert.equal(isLocalImage(undefined, 'x'), false);
});
