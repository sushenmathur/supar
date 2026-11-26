import { test } from 'node:test';
import assert from 'node:assert/strict';

for (const page of ['kiosk-home', 'kiosk-home-glass']) {
  const { personPoint, localDayStart, stateChanges } = await import(`../../homeassistant/www/${page}/person.js`);
  test(`${page}: person map accepts zero coordinates and rejects missing, stale and out-of-range positions`, () => {
    const state = (latitude, longitude, value = 'home') => ({ state: value, attributes: { latitude, longitude } });
    assert.deepEqual(personPoint(state(0, 0)), [0, 0]);
    assert.equal(personPoint(state(0, null)), null);
    assert.equal(personPoint(state(91, 0)), null);
    assert.equal(personPoint(state(0, -181)), null);
    assert.equal(personPoint(state(0, 0, 'unavailable')), null);
  });
  test(`${page}: history starts on the HA local date even when the UTC date or daylight saving differs`, () => {
    const start = (now, zone) => new Date(localDayStart(Date.parse(now), zone)).toISOString();
    assert.equal(start('2026-11-25T15:00:00Z', 'Australia/Brisbane'), '2026-11-25T14:00:00.000Z');
    assert.equal(start('2026-10-04T02:00:00Z', 'Australia/Sydney'), '2026-10-03T14:00:00.000Z');
    assert.equal(start('2026-04-05T03:00:00Z', 'Australia/Sydney'), '2026-04-04T13:00:00.000Z');
  });
  test(`${page}: history retains the initial state, sorts changes and ignores attribute updates or invalid rows`, () => {
    assert.deepEqual(stateChanges([
      { s: 'home', lu: 3 }, { s: 'Away', lu: 6 }, null, { s: 'wrong', lu: 13 },
      { s: 'home', lu: 12, lc: 10 }, { s: 'Away', lu: 8 }, { s: 'unknown', lu: NaN },
    ], 4000, 12000), [
      { state: 'home', time: 4000 }, { state: 'Away', time: 6000 }, { state: 'home', time: 10000 },
    ]);
    assert.deepEqual(stateChanges({}, 4000, 12000), []);
  });
}
