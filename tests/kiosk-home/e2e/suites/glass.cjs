// Glass page checks: ticker, calendar stamps, Arm buttons, right column spacing, kids rooms, no overflow. Needs MOCK_LONG=1.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', PAGE = BASE + '/local/kiosk-home-glass' + (process.env.SINGLE ? '.html' : '/index.html');
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  await p.goto(PAGE); await p.waitForTimeout(1800);
  const t = await p.evaluate(() => { const n = [...document.querySelectorAll('.name.tick')].find((e) => /Bedroom/.test(e.textContent)); return n && { tk: n.style.getPropertyValue('--tk'), anim: getComputedStyle(n.firstChild).animationName }; });
  check('long light name ticks', t && parseFloat(t.tk) < 0 && t.anim === 'tk', JSON.stringify(t));
  const short = await p.$$eval('#lights .name.tick', (els) => els.map((e) => e.textContent));
  check('only overflowing names tick', short.length === 1, short.join(','));
  const cal = await p.$$eval('#cal .ev', (els) => els.map((e) => e.querySelector('.d.none') ? 'same' : e.querySelector('.d').textContent));
  check('one date stamp per day', cal[1] === 'same' && cal[0] !== 'same', cal.join(' | '));
  const ab = await p.$eval('#alarm .abtn', (e) => { const s = getComputedStyle(e); return { bg: s.backgroundColor, border: s.borderTopColor }; });
  check('Arm buttons have a visible fill and edge', /0\.9|255, 255, 255\)/.test(ab.bg) && ab.border !== 'rgba(0, 0, 0, 0)', JSON.stringify(ab));
  const gaps = await p.$$eval('.s3 > *', (els) => els.map((e) => e.getBoundingClientRect()).slice(1).map((r, i, a) => 0));
  const col = await p.$$eval('.s3 > *', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.top, r.bottom]; }));
  check('right column cards never overlap', col.every((c, i) => i === 0 || c[0] >= col[i - 1][1] + 8), JSON.stringify(col.map((c) => c.map(Math.round))));
  const over = async () => p.evaluate(() => [...document.querySelectorAll('.b, .abtn, .chip')].filter((e) => e.offsetParent && e.scrollHeight - e.clientHeight > 1).map((e) => e.className.slice(0, 24) + ':' + e.textContent.trim().slice(0, 20)));
  const o1 = await over(); check('no card overflows on Home', !o1.length, o1.join(' | '));
  await p.evaluate(() => (location.hash = 'kidsroom')); await p.waitForTimeout(900);
  const kid = await p.evaluate(() => ({ cams: [...document.querySelectorAll('.panel.kid .camtile')].map((e) => [Math.round(e.getBoundingClientRect().width), Math.round(e.getBoundingClientRect().height)]),
    chips: [...document.querySelectorAll('.panel.kid .chip')].map((e) => Math.round(e.getBoundingClientRect().height)) }));
  check('kids cameras equal and large', kid.cams.length === 2 && kid.cams[0][1] === kid.cams[1][1] && kid.cams[0][1] > 300, JSON.stringify(kid.cams));
  check('kids chips compact, one row', kid.chips.every((h) => h === 48), kid.chips.join(','));
  const o2 = await over(); check('no card overflows on Kids Rooms', !o2.length, o2.join(' | '));
  await fetch(BASE + '/__state?id=sun.sun&s=below_horizon'); await fetch(BASE + '/__state?id=binary_sensor.hallwaydoorsensor_contact&s=on'); await p.waitForTimeout(600);
  await p.evaluate(() => (location.hash = '')); await p.waitForTimeout(800);
  check('hallway door shows on the Home banner at night', /Hallway door/.test(await p.locator('#banner').innerText()), (await p.locator('#banner').innerText()).replace(/\n/g, ' '));
  console.log(R.join('\n')); await b.close(); process.exit(R.some((r) => r.startsWith('FAIL')) ? 1 : 0);
})();
