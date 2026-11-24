// Car cards: the logo images from /config/www/images (kialogo.png, teslalogo.png) when they load (LOGOS=1), and the
// built-in Kia wordmark and Tesla T when they don't (LOGOS='', with the mock's MOCK_NO_LOGOS).
const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', NAME = process.env.NAME || 'kiosk-home', PAGE = BASE + '/local/' + NAME + (process.env.SINGLE ? '.html' : '/index.html');
const LOGOS = !!process.env.LOGOS;
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} [${LOGOS ? 'logos' : 'no logos'}] ${n}${x ? ' (' + x + ')' : ''}`);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  await p.goto(PAGE); await p.waitForTimeout(1600);
  const cars = await p.$$eval('#cars .car .well', (els) => els.map((w) => {
    const img = w.querySelector('img'), svg = w.querySelector('svg');
    return { cls: w.className, src: img?.getAttribute('src'), img: img ? getComputedStyle(img).display : null, svg: svg ? getComputedStyle(svg).display : null, w: img?.naturalWidth ?? 0 };
  }));
  check('both cars have a badge', cars.length === 2, JSON.stringify(cars));
  check('logo paths are /local/images/kialogo.png and teslalogo.png', cars[0]?.src === '/local/images/kialogo.png' && cars[1]?.src === '/local/images/teslalogo.png');
  if (LOGOS) check('logos shown, built-in marks hidden', cars.every((c) => /haslogo/.test(c.cls) && c.img === 'block' && c.svg === 'none' && c.w > 0), JSON.stringify(cars));
  else check('no logos: built-in marks shown, no broken images', cars.every((c) => !/haslogo/.test(c.cls) && c.img === 'none' && c.svg !== 'none'), JSON.stringify(cars));
  // Re-render (a state change) keeps the badge right.
  await fetch(`${BASE}/__state?id=sensor.sonic_charger_power&s=1500`); await p.waitForTimeout(700);
  const again = await p.$$eval('#cars .car .well', (els) => els.map((w) => /haslogo/.test(w.className)));
  check('still right after the cards re-render', again.every((h) => h === LOGOS), JSON.stringify(again));
  if (process.env.SHOT) await p.locator('#cars').screenshot({ path: process.env.SHOT });
  console.log(R.join('\n')); await b.close(); process.exit(R.some((r) => r.startsWith('FAIL')) ? 1 : 0);
})();
