const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', PAGE = BASE + (process.env.SINGLE ? '/local/' + (process.env.NAME || 'kiosk-home') + '.html' : '/local/' + (process.env.NAME || 'kiosk-home') + '/index.html');
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
const log = async () => (await (await fetch(BASE + '/__log')).json());
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 }, hasTouch: true });
  const logs = []; p.on('console', m => logs.push(m.type() + ': ' + m.text())); p.on('pageerror', e => logs.push('pageerror: ' + e.message));
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  await p.goto(PAGE); await sleep(1300);
  // 1. car pop-ups
  await p.locator('#cars [data-act="car"]').first().click(); await sleep(300);
  const s1 = await p.locator('#sheet').innerText();
  check('Sorento pop-up', /Sorento/.test(s1) && /Charge power/.test(s1) && /On road/.test(s1) && /Location/.test(s1), s1.split('\n').slice(0, 3).join(' | '));
  await p.locator('#sheet [data-arg="input_boolean.kia_onroad"]').click(); await sleep(300);
  check('Sorento pop-up updates live', /Driving/.test(await p.locator('#sheet').innerText()));
  await p.keyboard.press('Escape'); await sleep(200);
  await p.locator('#cars [data-act="car"]').nth(1).click(); await sleep(300);
  const n0 = (await log()).calls.length;
  await p.locator('#sheet [data-arg="lock.unlock|lock.bluey_lock"]').click(); await sleep(200);
  check('Bluey lock arms in pop-up', (await log()).calls.length === n0 && /Tap again/.test(await p.locator('#sheet').innerText()));
  await p.locator('#sheet [data-arg="lock.unlock|lock.bluey_lock"]').click(); await sleep(300);
  check('Bluey unlock on second tap', (await log()).calls.at(-1) === 'lock.unlock');
  await p.keyboard.press('Escape'); await sleep(200);
  check('car badges: Kia wordmark + Tesla mark', await p.locator('#cars .well.kia svg').count() === 1 && await p.locator('#cars .well.tesla svg').count() === 1);
  // 2. live camera uses the live entity
  const hls0 = (await log()).hls ?? 0;
  await p.locator('#cam').click();
  await p.waitForFunction(() => { const v = document.querySelector('#sheet #live video'); return v && v.currentTime > 0.3; }, null, { timeout: 15000 }).catch(() => {});
  const v = await p.evaluate(() => { const el = document.querySelector('#sheet #live video'); return el ? { t: el.currentTime, w: el.videoWidth, status: document.querySelector('#sheet #live').dataset.status } : null; });
  check('front door pop-up plays HLS video for camera.front_door_live_view_2', v && v.t > 0.3 && v.w === 480 && (await log()).hls > hls0, JSON.stringify(v));
  check('status overlay clears once playing', v && v.status === '');
  await p.keyboard.press('Escape'); await sleep(600);
  check('video torn down on close', await p.evaluate(() => !document.querySelector('#sheet video')) || (await p.evaluate(() => !document.querySelector('#sheet').open)));
  // 3. avatars, 4. Griffin
  check('avatars from person pictures', await p.locator('#people img.avatar').count() === 2);
  check('weather says Griffin', /Griffin/.test(await p.locator('#wx').innerText()));
  // 5. hold a light for details (touch + mouse), no toggle
  const tileSel = '#lights [data-hold="light.kitchen_pendants"]';
  const n1 = (await log()).calls.length;
  const box = await p.locator(tileSel).boundingBox();
  await p.mouse.move(box.x + 30, box.y + 30); await p.mouse.down(); await sleep(650); await p.mouse.up(); await sleep(250);
  check('hold opens light details', /Kitchen Pendants/.test(await p.locator('#sheet').innerText()) && await p.locator('#sheet').evaluate(d => d.open));
  check('hold does not toggle', (await log()).calls.length === n1);
  await p.locator('#sheet button', { hasText: '50%' }).click(); await sleep(300);
  check('details brightness preset', (await log()).calls.at(-1) === 'light.turn_on' && /50%/.test(await p.locator('#sheet').innerText()));
  await p.keyboard.press('Escape'); await sleep(200);
  await p.locator(tileSel).click(); await sleep(250);
  check('normal tap still toggles', (await log()).calls.at(-1) === 'homeassistant.toggle');
  // hold on Lights view tile too
  await p.evaluate(() => { location.hash = 'lights'; }); await sleep(400);
  const vb = await p.locator('#subview [data-act="toggle"][data-hold="light.dining_light"]').boundingBox();
  await p.mouse.move(vb.x + 20, vb.y + 20); await p.mouse.down(); await sleep(650); await p.mouse.up(); await sleep(250);
  check('hold works on Lights view', /Dining/.test(await p.locator('#sheet h2').innerText()));
  check('console clean', !logs.some(l => /pageerror|error:/.test(l)), logs.filter(l => /error/.test(l)).join(' | '));
  console.log(R.join('\n'));
  await b.close();
})();
