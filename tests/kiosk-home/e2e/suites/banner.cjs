// Alert banner: one entry per priority, coloured by the highest (red, amber, grey), lower priorities as chips,
// night-only doors, and the ticker when it doesn't fit.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', NAME = process.env.NAME || 'kiosk-home', PAGE = BASE + '/local/' + NAME + (process.env.SINGLE ? '.html' : '/index.html');
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const set = (id, s) => fetch(`${BASE}/__state?id=${id}&s=${encodeURIComponent(s)}`);
const DOORS = ['binary_sensor.garage_door_sensor_contact', 'binary_sensor.side_door_contact', 'binary_sensor.front_door_contact', 'binary_sensor.crimsafe_door_contact',
  'binary_sensor.patio_door_contact', 'binary_sensor.laundrydoorsensor_contact', 'binary_sensor.hallwaydoorsensor_contact', 'input_boolean.keep_garage_door_open', 'input_boolean.keep_side_door_open'];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  await p.goto(PAGE); await sleep(1500);
  const scene = async (on, sun = 'below_horizon') => {
    for (const id of DOORS) await set(id, on.includes(id.split('.')[1].replace(/_door.*|door.*|_contact/g, '')) ? 'on' : 'off');
    await set('sun.sun', sun); await set('input_boolean.quiet_hour', 'off'); await set('sensor.robbie_dock_dock_error', 'ok'); await sleep(500);
    return p.evaluate(() => { const el = document.querySelector('#banner'); const t = el.querySelector('.track');
      return { cls: el.className, title: t.querySelector('b').textContent, chips: [...t.querySelectorAll(':scope > .chip')].map((c) => `${c.classList[1]}:${c.textContent}`), tick: el.querySelector('.grow').classList.contains('tick') }; });
  };
  let s = await scene([]);
  check('all clear', /calm/.test(s.cls) && s.title === 'All clear', JSON.stringify(s));
  s = await scene(['side'], 'above_horizon');
  check('one door: stays still', !s.tick && s.title === 'Side door open', JSON.stringify(s));
  s = await scene(['garage', 'side']);
  check('garage + side: one red entry', /\balert\b/.test(s.cls) && s.title === 'Garage and side doors open' && !s.chips.length, JSON.stringify(s));
  s = await scene(['garage', 'keep_garage']);
  check('garage kept open: amber', /\bwarn\b/.test(s.cls) && !/\balert\b/.test(s.cls) && s.title === 'Garage door kept open', JSON.stringify(s));
  s = await scene(['patio', 'laundry']);
  check('patio + laundry at night: amber, grouped', /\bwarn\b/.test(s.cls) && s.title === 'Patio and laundry doors open', JSON.stringify(s));
  s = await scene(['patio', 'laundry', 'front'], 'above_horizon');
  check('patio, laundry and front door alone: not in the day', /calm/.test(s.cls), JSON.stringify(s));
  s = await scene(['front']);
  check('front door, security closed: grey at night', /\bnote\b/.test(s.cls) && s.title === 'Front door open', JSON.stringify(s));
  s = await scene(['front', 'crimsafe'], 'above_horizon');
  check('front + security: red, day too', /\balert\b/.test(s.cls) && s.title === 'Front and security doors open', JSON.stringify(s));
  s = await scene(['hallway'], 'above_horizon');
  check('hallway: grey, any time', /\bnote\b/.test(s.cls) && s.title === 'Hallway door open', JSON.stringify(s));
  s = await scene(['garage', 'patio', 'hallway']);
  check('red wins; lower priorities are chips in their colours', /\balert\b/.test(s.cls) && s.title === 'Garage door open' && JSON.stringify(s.chips) === JSON.stringify(['warn:Patio door', 'note:Hallway door']), JSON.stringify(s));
  check('several alerts that don\'t fit scroll', s.tick);
  await set('sensor.robbie_dock_dock_error', 'water_box_empty'); await sleep(400);
  check('Robbie water tank: amber chip', await p.locator('#banner .track > .chip.warn', { hasText: 'Roborock water tank empty' }).count() === 1, await p.locator('#banner').innerText());
  s = await scene(['garage', 'side', 'front', 'crimsafe', 'patio', 'laundry', 'hallway']);
  check('too much to fit: red, and it scrolls', /\balert\b/.test(s.cls) && s.title === 'Garage, side, front and security doors open' && s.tick, JSON.stringify(s));
  const moving = await p.evaluate(async () => { const t = document.querySelector('#banner .track'); const a = getComputedStyle(t).transform; await new Promise((r) => setTimeout(r, 600)); return a !== getComputedStyle(t).transform; });
  check('the ticker moves', moving);
  check('Close door and Keep buttons still there', await p.locator('#banner [data-act="close-garage"]').count() === 1 && await p.locator('#banner [data-act="keep-side"]').count() === 1);
  check('no page errors', errors.length === 0, errors.join(' | '));
  await b.close(); console.log(R.join('\n')); process.exit(R.some((r) => r.startsWith('FAIL')) ? 1 : 0);
})().catch((e) => { console.log(R.join('\n')); console.log('FAIL crashed: ' + e.message); process.exit(1); });
