// People card: option C fill-up animation while charging; status sensor first, iPhone sensor as backup.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', NAME = process.env.NAME || 'kiosk-home', PAGE = BASE + '/local/' + NAME + (process.env.SINGLE ? '.html' : '/index.html');
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
const set = (id, s) => fetch(`${BASE}/__state?id=${id}&s=${encodeURIComponent(s)}`);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: process.env.SCHEME || 'light' });
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  await p.goto(PAGE); await p.waitForTimeout(1500);
  const state = () => p.$$eval('#people .person', (els) => els.map((e) => { const b = e.querySelector('.batt'), f = b.querySelector('.fillup');
    return { name: e.querySelector('.name').textContent, chg: b.classList.contains('chg'), anim: f ? getComputedStyle(f).animationName : null }; }));
  let s = await state();
  check('Sushen charging (status sensor) animates', s[0].chg && s[0].anim === 'fillup', JSON.stringify(s[0]));
  check('Paro: status unavailable, backup Not Charging, no animation', !s[1].chg && s[1].anim === null, JSON.stringify(s[1]));
  if (process.env.SHOT) { await p.waitForTimeout(1500); await p.locator('#people').screenshot({ path: process.env.SHOT }); }
  await set('sensor.paro_iphone_battery_state', 'Charging'); await p.waitForTimeout(500);
  s = await state(); check('Paro: backup Charging used while status unavailable', s[1].chg && s[1].anim === 'fillup', JSON.stringify(s[1]));
  await set('sensor.paro_phone_battery_status', 'Not Charging'); await p.waitForTimeout(500);
  s = await state(); check('Paro: status back and Not Charging wins over backup', !s[1].chg, JSON.stringify(s[1]));
  await set('sensor.sushen_phone_battery_status', 'unavailable'); await set('sensor.sushen_iphone_battery_state', 'Not Charging'); await p.waitForTimeout(500);
  s = await state(); check('Sushen: status unavailable, backup Not Charging stops it', !s[0].chg && s[0].anim === null, JSON.stringify(s[0]));
  const ani = await p.evaluate(() => [...document.querySelectorAll('.fillup')].map((f) => getComputedStyle(f).transitionProperty));
  console.log(R.join('\n')); await b.close(); process.exit(R.some((r) => r.startsWith('FAIL')) ? 1 : 0);
})();
