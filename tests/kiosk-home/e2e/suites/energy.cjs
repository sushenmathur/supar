// Home Energy card flow colours, direction and speed, plus the in-page Energy HUD.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', NAME = process.env.NAME || 'kiosk-home', PAGE = BASE + '/local/' + NAME + (process.env.SINGLE ? '.html' : '/index.html');
const SHOT = process.env.SHOT; const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
const set = (id, s) => fetch(`${BASE}/__state?id=${id}&s=${encodeURIComponent(s)}`);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  await p.goto(PAGE); await p.waitForTimeout(1500);
  const colours = () => p.$$eval('#energy .flowline', (els) => els.map((e) => e.className.replace('flowline ', '') + ':' + getComputedStyle(e.firstElementChild).backgroundColor));
  const c1 = await colours();
  check('exporting: both lines yellow', c1.length === 2 && c1.every((c) => /exp:rgb\(232, 178, 0\)/.test(c)), c1.join(' | '));
  if (SHOT) await p.locator('#energy').screenshot({ path: SHOT + '-export.png' });
  await set('sensor.sh50rs_a21c2106894_total_export_active_power', '0'); await set('sensor.sh50rs_a21c2106894_purchased_power', '2400'); await p.waitForTimeout(600);
  const c2 = await colours();
  check('importing: grid line purple', /imp:rgb\(124, 58, 237\)/.test(c2[0]) && /to-right/.test(c2[0]), c2.join(' | '));
  if (SHOT) await p.locator('#energy').screenshot({ path: SHOT + '-import.png' });

  const imp = 'sensor.sh50rs_a21c2106894_purchased_power';
  const exp = 'sensor.sh50rs_a21c2106894_total_export_active_power';
  const solar = 'sensor.sh50rs_a21c2106894_mppt_total_power';
  const gridPower = (value) => p.waitForFunction((value) => document.querySelector('#energy .n-grid b').textContent === value, value, { timeout: 5000 });
  const gridLine = p.locator('#energy [data-flow="grid"]');
  const solarLine = p.locator('#energy [data-flow="solar"]');
  const duration = (line) => line.locator('i').evaluate((el) => parseFloat(getComputedStyle(el).animationDuration));
  const gridPosition = () => gridLine.locator('i').evaluate((el) => {
    const progress = el.getAnimations()[0].effect.getComputedTiming().progress;
    return el.parentElement.classList.contains('to-left') ? 1 - progress : progress;
  });

  await set(solar, '2.7'); await set(imp, '1600'); await gridPower('1.6 kW');
  check('solar and grid supply the home together',
    /to-right imp/.test(await gridLine.getAttribute('class')) &&
    /to-left exp/.test(await solarLine.getAttribute('class')) &&
    await p.locator('#energy .n-home b').textContent() === '4.3 kW' &&
    await duration(solarLine) < await duration(gridLine));

  await set(imp, '250'); await gridPower('250 W');
  const slowImport = await duration(gridLine);
  await p.evaluate(() => document.documentElement.classList.add('still'));
  const beforeSpeed = await gridPosition();
  await set(imp, '6000'); await gridPower('6.0 kW');
  const fastImport = await duration(gridLine);
  const afterSpeed = await gridPosition();
  check('larger imports move faster', fastImport < slowImport);
  check('the paused pulse keeps its position when speed changes', Math.abs(beforeSpeed - afterSpeed) < 0.02);
  await set(exp, '6.25'); await gridPower('250 W');
  const afterReverse = await gridPosition();
  check('the single grid pulse reverses with the net surplus and keeps its position',
    /to-left exp/.test(await gridLine.getAttribute('class')) && Math.abs(afterSpeed - afterReverse) < 0.02);
  const slowExport = await duration(gridLine);
  await p.evaluate(() => document.documentElement.classList.remove('still'));

  await set(solar, '7.1'); await set(imp, '0'); await set(exp, '6'); await gridPower('6.0 kW');
  check('larger exports move faster and the home uses the rest of the solar',
    await duration(gridLine) < slowExport && await p.locator('#energy .n-home b').textContent() === '1.1 kW');
  await set(exp, '0'); await gridPower('0 W');
  check('balanced home and solar leave the grid still and the solar line moving',
    await gridLine.locator('i').isHidden() && await solarLine.locator('i').isVisible() && await duration(solarLine) > 0);
  await p.emulateMedia({ reducedMotion:'reduce' });
  check('reduced motion keeps the active solar pulse still',
    await solarLine.locator('i').isVisible() && await solarLine.locator('i').evaluate((el) => getComputedStyle(el).animationName) === 'none');
  await p.emulateMedia({ reducedMotion:'no-preference' });
  await set(solar, '2.86'); await set(imp, '2400'); await gridPower('2.4 kW');
  await p.locator('#energy').click(); await p.waitForTimeout(900);
  check('tapping the Energy card opens #energy-dashboard', (await p.evaluate(() => location.hash)) === '#energy-dashboard' && await p.locator('#home-body').isHidden());
  await p.waitForTimeout(600);
  const hud = await p.evaluate(() => { const r = document.querySelector('.hud').getBoundingClientRect(); return {
    iframes: document.querySelectorAll('#subview iframe').length, hots: document.querySelectorAll('.hud .hot').length, w: Math.round(r.width), h: Math.round(r.height),
    text: document.querySelector('.hud-svg').textContent.replace(/\s+/g, ' '), anim: [...document.querySelectorAll('.hud-anim .hud-flow')].map((e) => e.getAttribute('stroke')),
    fonts: [document.fonts.check('700 20px Rajdhani'), document.fonts.check('700 20px "JetBrains Mono"')] }; });
  check('HUD drawn in the page (no iframe, no HA header)', hud.iframes === 0 && hud.w > 1200 && hud.h > 650, JSON.stringify({ w: hud.w, h: hud.h, iframes: hud.iframes }));
  check('every panel is tappable', hud.hots === 16, String(hud.hots));
  check('live values shown', /SOLAR/.test(hud.text) && /GRID/.test(hud.text) && /TESLA/.test(hud.text) && /KIA/.test(hud.text) && /BILL TO DATE/.test(hud.text) && /TARIFF NOW/.test(hud.text), hud.text.slice(0, 120));
  check('bundled fonts load (no Google Fonts)', hud.fonts.every(Boolean), JSON.stringify(hud.fonts));
  check('flows animate on their own layer', hud.anim.length >= 2, hud.anim.join(','));
  const fr = await p.evaluate(() => performance.getEntriesByType('resource').map((r) => new URL(r.name).host).filter((h) => h !== location.host));
  check('no requests outside Home Assistant', fr.length === 0, fr.join(','));
  await p.locator('.hud .hot[data-arg="sensor.electricity_bill_to_date"]').click(); await p.waitForTimeout(400);
  check('tapping a panel opens its details', /electricity_bill_to_date|Bill/i.test(await p.locator('#sheet').innerText()) && await p.locator('#sheet').evaluate((d) => d.open));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  if (SHOT) await p.screenshot({ path: SHOT + '-view.png' });
  await p.locator('.hud-home').click(); await p.waitForTimeout(500);
  check('HOME button goes back to Home', (await p.evaluate(() => location.hash)) === '#home' && await p.locator('#home-body').isVisible());
  await p.evaluate(() => (location.hash = 'energy-dashboard')); await p.waitForTimeout(600);
  await p.locator('.hud .hot[data-arg="#home"]').click(); await p.waitForTimeout(500);
  check('Home card in the HUD goes back to Home', (await p.evaluate(() => location.hash)) === '#home');
  await p.locator('#energy').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  check('Enter on the Energy card opens it too', (await p.evaluate(() => location.hash)) === '#energy-dashboard');
  await p.locator('.hud .hot[data-arg="sensor.daily_import_cost"]').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  check('Enter on a HUD panel opens its details', await p.locator('#sheet').evaluate((d) => d.open));
  console.log(R.join('\n')); await b.close(); process.exit(R.some((r) => r.startsWith('FAIL')) ? 1 : 0);
})();
