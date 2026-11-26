const { chromium } = require('playwright');
const base = 'http://localhost:8123';
const name = process.env.NAME || 'kiosk-home';
const pagePath = '/local/' + name + (process.env.SINGLE ? '.html' : '/index.html');
const set = (id, s) => fetch(`${base}/__state?id=${id}&s=${s}`);
const check = (label, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) process.exitCode = 1;
};

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, hasTouch: true, timezoneId: 'UTC' });
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await set('sensor.general_waste', '2026-12-01');
    await set('sensor.garden_organics', '2026-12-01');
    await set('sensor.recycling', '2026-12-08');
    await page.addInitScript(() => {
      if (!localStorage.getItem('hassTokens')) {
        localStorage.setItem('hassTokens', JSON.stringify({
          hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x',
          refresh_token: 'r', expires: Date.parse('2026-12-15T00:00:00Z'),
        }));
      }
    });
    const clock = (iso) => page.clock.setFixedTime(new Date(iso));
    await clock('2026-11-30T05:59:00Z');
    await page.goto(base + pagePath);
    const bins = page.locator('.bin-tile');
    const reminder = bins.locator('.bin-reminder');
    const alert = () => bins.evaluate(el => el.classList.contains('alert'));
    await bins.waitFor();
    await page.evaluate(() => document.fonts.ready);
    check('inactive before Monday 4 pm in the HA time zone', !await alert() && await bins.isDisabled());
    const layout = () => bins.evaluate(el => {
      const row = el.querySelector('.bin-summary').getBoundingClientRect();
      const day = el.querySelector('.bin-day').getBoundingClientRect();
      const icons = el.querySelector('.binicons').getBoundingClientRect();
      return {
        width: el.offsetWidth, height: el.offsetHeight, isLeft: Math.abs(day.left - row.left) < 1,
        isRight: Math.abs(icons.right - row.right) < 1, gap: icons.left - day.right,
        glyphs: [...el.querySelectorAll('.binico .ic')].map(ic => ic.getBoundingClientRect().width),
      };
    });
    const regular = await layout();
    check('compact row keeps Tue left and both enlarged icons right',
      regular.width === 88 && regular.isLeft && regular.isRight && regular.gap >= 2 &&
      regular.glyphs.length === 2 && regular.glyphs.every(width => width >= 18) &&
      await bins.locator('.bin-day').textContent() === 'Tue');

    await clock('2026-11-30T06:00:00Z');
    await page.locator('.bin-tile.alert').waitFor();
    check('Monday 4 pm turns on the reminder without growing the tile',
      await reminder.textContent() === 'Put bins out' && (await layout()).height === regular.height);
    await bins.tap();
    await page.locator('.bin-tile.done').waitFor();
    check('tap clears the red alert and marks bins out',
      !await alert() && await bins.getAttribute('aria-pressed') === 'true' &&
      await reminder.textContent() === 'Bins out ✓' && (await layout()).height === regular.height);
    await page.reload();
    await page.locator('.bin-tile.done').waitFor();
    check('dismissal survives reload', !await alert() && await reminder.textContent() === 'Bins out ✓');

    await clock('2026-11-30T21:59:00Z');
    await page.waitForFunction(() => document.querySelector('#clock').textContent === '7:59');
    check('Tuesday 7:59 am retains the Monday dismissal', await bins.getAttribute('aria-pressed') === 'true');
    await bins.focus();
    await bins.press('Space');
    await page.locator('.bin-tile.alert').waitFor();
    check('keyboard undo restores the alert and keeps focus', await bins.evaluate(el => el === document.activeElement));
    await bins.tap();
    await page.locator('.bin-tile.done').waitFor();
    await clock('2026-11-30T22:00:00Z');
    await page.locator('.bin-tile:disabled').waitFor();
    check('Tuesday 8 am ends the reminder and removes the toggle', !await alert() && await reminder.count() === 0);

    await clock('2026-12-07T06:00:00Z');
    await page.locator('.bin-tile.alert').waitFor();
    check('the next Monday shows a new alert', await reminder.textContent() === 'Put bins out');
    await set('sensor.general_waste', '2026-12-08');
    await set('sensor.garden_organics', '2026-12-08');
    await page.locator('.bin-tile.three-bins').waitFor();
    check('three bins keep every icon visible in the compact tile',
      await bins.locator('.binico').count() === 3 && (await layout()).height === regular.height &&
      await bins.locator('.binicons').evaluate(icons => {
        const row = icons.getBoundingClientRect();
        const tile = icons.closest('button').getBoundingClientRect();
        return row.left >= tile.left && row.right <= tile.right;
      }));
    const log = await (await fetch(base + '/__log')).json();
    check('bin actions send no HA service calls and cause no page errors', log.calls.length === 0 && errors.length === 0);
  } finally {
    await browser.close();
  }
})().catch(e => { console.log('FAIL ' + e.stack); process.exitCode = 1; });
