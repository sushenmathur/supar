const { chromium } = require('playwright');
const BASE = 'http://localhost:8123';
const NAME = process.env.NAME || 'kiosk-home';
const PAGE = BASE + '/local/' + NAME + (process.env.SINGLE ? '.html' : '/index.html');
const log = async () => (await fetch(BASE + '/__log')).json();
const check = (name, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) process.exitCode = 1;
};

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(7000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({
      hassUrl: location.origin, clientId: location.origin + '/', access_token: 'mock',
      refresh_token: 'mock', expires: Date.now() + 3e6,
    })));
    await page.goto(PAGE);
    const robbie = page.locator('#actions [data-act="robbie"]');
    const dialog = page.getByRole('dialog');
    const heading = (name) => dialog.getByRole('heading', { name, exact: true });
    const button = (name) => dialog.getByRole('button', { name, exact: true });
    const start = button('Start cleaning');
    await robbie.click();
    await heading('Docked').waitFor();
    check('overview shows live battery, charging and cleaning stats', /79% · Charging/.test(await dialog.innerText()) &&
      /38 min/.test(await dialog.innerText()) && /42 m²/.test(await dialog.innerText()));
    check('dock and stop are disabled while docked', await button('Dock').isDisabled() && await button('Stop').isDisabled());
    const fan = dialog.getByLabel('Fan speed');
    await fan.selectOption('quiet');
    await button('Locate').click();
    const controls = (await log()).data;
    check('fan and locate target Robbie', controls.some(({ svc, data }) => svc === 'vacuum.set_fan_speed' &&
      data.entity_id === 'vacuum.robbie' && data.fan_speed === 'quiet') &&
      controls.some(({ svc, data }) => svc === 'vacuum.locate' && data.entity_id === 'vacuum.robbie'));

    await button('Cleaning By area').click();
    await button('Try again').click();
    await button('Guest').waitFor();
    const areaButtons = dialog.getByRole('group', { name: 'Areas to clean' }).getByRole('button');
    check('loads mapped HA names only and excludes empty, deleted and unmapped areas',
      (await areaButtons.allTextContents()).map((s) => s.trim()).join(',') === 'Guest,Living Room');
    check('Start is disabled with no selection', await start.isDisabled());
    await button('Guest').click();
    await button('Living Room').click();
    check('both selected areas stay pressed', await button('Guest').getAttribute('aria-pressed') === 'true' &&
      await button('Living Room').getAttribute('aria-pressed') === 'true');
    await page.keyboard.press('Escape');
    await heading('Robbie').waitFor();
    check('Escape returns to Robbie and restores focus', await button('Cleaning By area').evaluate((node) => document.activeElement === node));
    await button('Cleaning By area').click();
    await start.click();
    await page.getByText('Couldn’t start cleaning.', { exact: false }).waitFor();
    check('failed service keeps the picker and selection open for retry', await start.isEnabled() &&
      await button('Guest').getAttribute('aria-pressed') === 'true');
    await start.click();
    await heading('Cleaning').waitFor();
    const jobs = (await log()).data.filter(({ svc }) => svc === 'vacuum.clean_area');
    check('each attempt sends one native service call with HA area IDs', jobs.length === 2 && jobs.every(({ data }) =>
      data.entity_id === 'vacuum.robbie' && data.cleaning_area_id.join(',') === 'area_41,area_91'));
    await button('Pause').click();
    await heading('Paused').waitFor();
    await button('Resume').click();
    await heading('Cleaning').waitFor();
    await button('Dock').click();
    await heading('Returning').waitFor();
    await button('Stop').click();
    await heading('Idle').waitFor();
    check('pause, resume, dock and stop update the open overview', true);
    await button('Close Robbie').click();

    await page.evaluate(() => { location.hash = 'living-room'; });
    await page.locator('#subview [data-act="robbie"]').click();
    await heading('Robbie').waitFor();
    check('Robbie also opens from the Living Room panel', await dialog.isVisible());
    check('no browser errors', errors.length === 0);
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
