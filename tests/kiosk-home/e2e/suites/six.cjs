const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', NAME = process.env.NAME || 'kiosk-home', PAGE = BASE + '/local/' + NAME + (process.env.SINGLE ? '.html' : '/index.html');
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
const set = (id, s) => fetch(`${BASE}/__state?id=${id}&s=${encodeURIComponent(s)}`);
const calls = async () => (await (await fetch(BASE + '/__log')).json()).calls;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: process.env.SCHEME || 'light' });
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  await p.goto(PAGE); await sleep(1500);
  const SHOT = process.env.SHOT;
  // 1. Hallway door: a grey note on the banner, day or night, not a warning.
  await set('binary_sensor.garage_door_sensor_contact', 'off'); await set('cover.garage_door_v2', 'closed'); await set('binary_sensor.side_door_contact', 'off');
  await set('sun.sun', 'above_horizon'); await set('binary_sensor.hallwaydoorsensor_contact', 'on'); await sleep(600);
  let bn = await p.evaluate(() => ({ cls: document.querySelector('#banner').className, t: document.querySelector('#banner').innerText.replace(/\s+/g, ' ') }));
  check('hallway open (daytime) shows on the banner as a grey note', /note/.test(bn.cls) && !/alert/.test(bn.cls) && /Hallway door open/.test(bn.t), JSON.stringify(bn));
  if (SHOT) await p.locator('#banner').screenshot({ path: SHOT + '-banner.png' });
  await set('binary_sensor.side_door_contact', 'on'); await sleep(500);
  bn = await p.evaluate(() => ({ cls: document.querySelector('#banner').className, t: document.querySelector('#banner').innerText.replace(/\s+/g, ' ') }));
  check('with a real alert, the hallway door is listed after it', /alert/.test(bn.cls) && /Side door open/.test(bn.t) && /Also: Hallway door/.test(bn.t), bn.t);
  await set('binary_sensor.side_door_contact', 'off'); await set('binary_sensor.hallwaydoorsensor_contact', 'off'); await sleep(500);
  check('all clear once it closes', /All clear/.test(await p.locator('#banner').innerText()));
  // 2. Bins
  const bins = await p.$$eval('#util .binico', (els) => els.map((e) => [e.classList[1], e.querySelector('use, path, svg') ? 1 : 0, getComputedStyle(e).color]));
  check('bins show coloured icons', bins.length > 0 && bins.every(([c, has]) => ['r', 'y', 'g'].includes(c) && has), JSON.stringify(bins));
  if (SHOT) await p.locator('#util .tile').first().screenshot({ path: SHOT + '-bins.png' });
  // 5. Aircon
  const ac = await p.$eval('#media [data-act="aircon"]', (e) => ({ n: e.querySelector('.name').textContent, s: e.querySelector('.sub').textContent }));
  check('aircon tile reads Living Aircon and room temperature', ac.n === 'Living Aircon' && /^Room \d/.test(ac.s), JSON.stringify(ac));
  // 6. Energy flows
  const fl = await p.$$eval('#energy .flowline', (els) => els.map((e) => { const i = e.querySelector('i'); return { cls: e.className, h: e.getBoundingClientRect().height, w: Math.round(e.getBoundingClientRect().width), anim: getComputedStyle(i).animationName, bg: getComputedStyle(i).backgroundColor }; }));
  check('flow lines are tracks with a sliding pill', fl.length === 2 && fl.every((f) => f.h === 6 && f.w > 40 && /flowpill/.test(f.anim)), JSON.stringify(fl));
  const wells = await p.$$eval('#energy .node .well', (els) => els.map((e) => getComputedStyle(e).backgroundImage.startsWith('linear-gradient')));
  check('flow icons have tinted wells', wells.length === 3 && wells.every(Boolean));
  if (SHOT) await p.locator('#energy').screenshot({ path: SHOT + '-energy.png' });
  // 3. Garage door card: open → confirm sheet; Cancel does nothing.
  await set('cover.garage_door_v2', 'open'); await set('binary_sensor.garage_door_sensor_contact', 'on'); await sleep(500);
  let n = (await calls()).length;
  await p.locator('#gdoor [data-act="garage-toggle"]').click(); await sleep(500);
  check('garage card (open) asks first, with the camera', /Close the garage door\?/.test(await p.locator('#sheet h2').textContent()) && await p.locator('#sheet #live').count() === 1);
  if (SHOT) await p.locator('#sheet').screenshot({ path: SHOT + '-garage.png' });
  check('the sheet button reads Cancel', (await p.locator('#sheet .close').textContent()) === 'Cancel');
  await p.locator('#sheet .close').click(); await sleep(300);
  check('Cancel closes without closing the door', (await calls()).length === n && !(await p.locator('#sheet').evaluate((d) => d.open)));
  // Garage closed → tapping the card opens it with the two-tap confirm.
  await set('cover.garage_door_v2', 'closed'); await set('binary_sensor.garage_door_sensor_contact', 'off'); await sleep(500);
  n = (await calls()).length;
  await p.locator('#gdoor [data-act="garage-toggle"]').click(); await sleep(200);
  check('closed garage: first tap only arms', (await calls()).length === n && /Tap again/.test(await p.locator('#gdoor').textContent()));
  await p.locator('#gdoor [data-act="garage-toggle"]').click(); await sleep(300);
  check('closed garage: second tap opens it', (await calls()).at(-1) === 'cover.open_cover');
  // Security view Close also confirms.
  await p.evaluate(() => (location.hash = 'security')); await sleep(800);
  n = (await calls()).length;
  await p.locator('#subview [data-act="close-garage"]').first().click(); await sleep(400);
  check('Security view Close asks first', /Close the garage door\?/.test(await p.locator('#sheet h2').textContent()) && (await calls()).length === n);
  await p.locator('#sheet [data-sheet="garage-go"]').click(); await sleep(300);
  check('and closes after confirming', (await calls()).at(-1) === 'cover.close_cover');
  // 4. Alarm dial (look)
  await p.evaluate(() => (location.hash = 'home')); await sleep(600);
  await p.locator('#alarm [data-act="alarm-arm-home"]').click(); await sleep(300);
  for (const k of ['1', '2']) await p.locator(`#sheet [data-key="${k}"]`).click(); await sleep(600);
  check('alarm dial: Arm home preselected, Arm away offered', await p.locator('#sheet [data-chip="alarm_arm_home"].on').count() === 1 && await p.locator('#sheet [data-chip="alarm_arm_away"]').count() === 1);
  if (SHOT) await p.locator('#sheet').screenshot({ path: SHOT + '-alarm.png' });
  await p.locator('#sheet [data-chip="alarm_arm_away"]').click(); for (const k of ['3', '4', 'ok']) await p.locator(`#sheet [data-key="${k}"]`).click(); await sleep(500);
  check('switching to Arm away arms away', (await calls()).at(-1) === 'alarm_control_panel.alarm_arm_away' && /Armed away/.test(await p.locator('#lpmsg').textContent()));
  await sleep(1900); check('dial closes after arming', !(await p.locator('#sheet').evaluate((d) => d.open)));
  console.log(R.join('\n')); await b.close(); process.exit(R.some((r) => r.startsWith('FAIL')) ? 1 : 0);
})();
