// Dark mode by the sun: dark after sunset and light after sunrise, live without a reload, whatever the tablet is
// set to; and the page dark by the sun looks the same as the tablet in dark mode (no dark style left out).
const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', NAME = process.env.NAME || 'kiosk-home', PAGE = BASE + '/local/' + NAME + (process.env.SINGLE ? '.html' : '/index.html');
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const set = (id, s) => fetch(`${BASE}/__state?id=${id}&s=${encodeURIComponent(s)}`);
const auth = () => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 }));
(async () => {
  const b = await chromium.launch();
  await set('sun.sun', 'above_horizon');
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' })).newPage();
  await p.addInitScript(auth); await p.goto(PAGE); await sleep(1500);
  const look = () => p.evaluate(() => ({ theme: document.documentElement.dataset.theme, bg: getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() }));
  let day = await look();
  check('daytime: light, even with the tablet set to dark', day.theme === 'light', JSON.stringify(day));
  const loads = []; p.on('framenavigated', () => loads.push(1));
  await set('sun.sun', 'below_horizon'); await sleep(600);
  const night = await look();
  check('sunset: switches to dark live', night.theme === 'dark' && night.bg !== day.bg, JSON.stringify(night));
  if (NAME === 'kiosk-home-glass') {
    await p.locator('#actions [data-act="robbie"]').click();
    const sheetLook = () => p.locator('#sheet').evaluate((sheet) => {
      const style = getComputedStyle(sheet);
      return [style.backgroundColor, style.backdropFilter, getComputedStyle(sheet, '::backdrop').backgroundColor];
    });
    const dark = await sheetLook();
    check('dark pop-ups use 55% translucency, 4px blur and 5% backdrop dim',
      dark.join('|') === 'rgba(25, 22, 20, 0.45)|blur(4px) saturate(1.35)|rgba(19, 15, 13, 0.05)', dark.join(' | '));
    await set('sun.sun', 'above_horizon');
    await p.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    const light = await sheetLook();
    check('open pop-ups switch to 40% translucency, 7px blur and 12% backdrop dim at sunrise',
      light.join('|') === 'rgba(250, 246, 241, 0.6)|blur(7px) saturate(1.35)|rgba(19, 15, 13, 0.12)', light.join(' | '));
    await p.keyboard.press('Escape');
    await set('sun.sun', 'below_horizon');
    await p.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  }
  await p.evaluate(() => { location.hash = '#living-room'; }); await sleep(600);
  check('floor plan uses the dark image', /cbbd3b46/.test(await p.locator('.plan img').getAttribute('src')));
  await set('sun.sun', 'above_horizon'); await sleep(600);
  check('sunrise: back to light', (await look()).theme === 'light');
  check('floor plan back to the light image', /4f758541/.test(await p.locator('.plan img').getAttribute('src')));
  check('no reloads', loads.length <= 1, String(loads.length));
  // Parity: dark by the sun (tablet light) vs the tablet in dark mode, pixel for pixel.
  await set('sun.sun', 'below_horizon');
  const tool = await b.newPage();
  for (const route of ['', 'lights', 'homeclimate', 'security', 'kidsroom', 'laundry']) {
    const shot = async (scheme) => { const c = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: scheme, reducedMotion: 'reduce' }); const q = await c.newPage();
      await q.clock.setFixedTime(Date.UTC(2026, 10, 24, 0, 30)); await q.addInitScript(auth); await q.goto(PAGE + (route ? '#' + route : '')); await sleep(1500);
      const s = await q.screenshot({ animations: 'disabled' }); await c.close(); return s.toString('base64'); };
    const [a, bb] = [await shot('dark'), await shot('light')];
    const diff = await tool.evaluate(async ([a, b]) => { const L = (x) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + x; });
      const [ia, ib] = await Promise.all([L(a), L(b)]); const g = (i) => { const c = new OffscreenCanvas(i.width, i.height).getContext('2d'); c.drawImage(i, 0, 0); return c.getImageData(0, 0, i.width, i.height).data; };
      const da = g(ia), db = g(ib); let n = 0; for (let k = 0; k < da.length; k += 4) if (Math.max(Math.abs(da[k] - db[k]), Math.abs(da[k + 1] - db[k + 1]), Math.abs(da[k + 2] - db[k + 2])) > 40) n++; return n / (da.length / 4); }, [a, bb]);
    check(`${route || 'home'}: dark by the sun matches the tablet's dark mode`, diff < 0.0005, `${(diff * 100).toFixed(3)}% differ`);
  }
  await b.close(); console.log(R.join('\n')); process.exit(R.some((r) => r.startsWith('FAIL')) ? 1 : 0);
})().catch((e) => { console.log(R.join('\n')); console.log('FAIL crashed: ' + e.message); process.exit(1); });
