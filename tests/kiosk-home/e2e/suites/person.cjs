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
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });
    page.setDefaultTimeout(10000);
    const errors = [], external = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (req) => { if (/^https?:/.test(req.url()) && new URL(req.url()).origin !== BASE) external.push(req.url()); });
    await page.clock.setFixedTime(new Date('2026-11-26T10:00:00Z'));
    await page.addInitScript(() => {
      window.kioskSatellite = {
        platform: 'kiosksatellite', setInteractionActive: () => Promise.resolve(true),
        ha: { createSocket: () => new Promise((resolve) => {
          const socket = new WebSocket(location.origin.replace(/^http/, 'ws') + '/api/websocket');
          socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'auth_required') socket.send(JSON.stringify({ type: 'auth', access_token: 'mock' }));
            if (msg.type === 'auth_ok') { socket.onmessage = null; socket.haVersion = msg.ha_version; resolve(socket); }
          };
        }) },
      };
    });
    await page.goto(PAGE);
    const sushen = page.locator('#people [data-arg="person.sushenmathur"]');
    const paro = page.locator('#people [data-arg="person.paro"]');
    const map = page.getByRole('tab', { name: 'Map' });
    const activity = page.getByRole('tab', { name: 'Activity' });
    const dialog = page.getByRole('dialog');
    const mapCredit = dialog.locator('.person-map-credit');
    const status = dialog.locator('.person-map-status');
    const marker = dialog.locator('.person-marker');
    await sushen.focus();
    await sushen.press('Enter');
    await mapCredit.waitFor();
    check('keyboard opens the selected person with the map active', await dialog.getAttribute('aria-labelledby') === 'person-title' &&
      await dialog.locator('h2').textContent() === 'Sushen' && await map.getAttribute('aria-selected') === 'true' && await marker.isVisible());
    let state = await log();
    check('map uses the HA proxy around the reported position and refreshes a refused credential',
      state.mapAccess === 2 && state.personTiles.includes('/api/map_tiles/raster/15/17476/16384.png'));
    check('history is requested only when Activity opens', !state.personHistory);
    await dialog.getByRole('button', { name: 'Zoom in' }).click();
    await mapCredit.waitFor();
    check('zoom requests the next tile level', (await log()).personTiles.some((path) => path.includes('/raster/16/')));
    const bounds = await dialog.locator('.person-map-viewport').boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2 + 90, bounds.y + bounds.height / 2 + 70, { steps: 3 });
    await page.mouse.up();
    const away = await marker.evaluate((pin) => pin.style.left);
    await dialog.getByRole('button', { name: 'Recentre on person' }).click();
    check('drag moves the pin relative to the viewport and recentre restores it', away !== await marker.evaluate((pin) => pin.style.left));
    await fetch(BASE + '/__person_location?longitude=20&state=not_home');
    await page.waitForFunction(() => document.querySelector('#person-summary').textContent.startsWith('Away'));
    await mapCredit.waitFor();
    check('live state and position update the open map', (await log()).personTiles.includes('/api/map_tiles/raster/16/36408/32768.png'));
    await map.focus();
    await map.press('ArrowRight');
    await dialog.locator('.person-events li').first().waitFor();
    state = await log();
    check('Activity requests only this person and starts at midnight in the HA timezone',
      state.personHistory.length === 1 && JSON.stringify(state.personHistory[0]) === JSON.stringify({
        entityIds: ['person.sushenmathur'], start: '2026-11-25T14:00:00.000Z', noAttributes: true,
      }));
    check('timeline and newest-first log deduplicate attribute-only entries',
      await dialog.locator('.person-segment').count() === 4 &&
      (await dialog.locator('.person-events strong').allTextContents()).join(',') === 'Home,Office,Away' &&
      (await dialog.locator('.person-events time').first().textContent()).includes('3:00:00'));
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.dataset.arg === 'person.sushenmathur');
    check('closing restores focus to the card after a live re-render', await sushen.evaluate((card) => card === document.activeElement));
    await paro.click();
    await status.waitFor();
    check('a different person with missing coordinates gets a location message',
      await dialog.locator('h2').textContent() === 'Paro' && await status.textContent() === 'Location unavailable.' && !await marker.isVisible());
    await activity.click();
    await page.waitForFunction(() => document.querySelector('.person-activity-status').textContent === 'No recorded activity today.');
    check('empty history has its own message and stays scoped to that person',
      (await log()).personHistory.at(-1).entityIds[0] === 'person.paro');
    await dialog.getByRole('button', { name: 'Close location' }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.route('**/api/map_tiles/raster/**', (route) => route.fulfill({ status: 503 }));
    await sushen.click();
    await page.waitForFunction(() => document.querySelector('.person-map-status').textContent.startsWith('Map tiles unavailable.'));
    check('failed tiles leave the person marker and do not prevent activity', await marker.isVisible());
    await activity.click();
    await dialog.locator('.person-events li').first().waitFor();
    check('popup has no external HTTP requests or JavaScript errors', !external.length && !errors.length);
  } finally {
    await browser.close();
  }
})().catch((error) => { console.log('FAIL crashed: ' + error.message); process.exitCode = 1; });
