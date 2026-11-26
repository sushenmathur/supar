const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', PAGE = BASE + (process.env.SINGLE ? '/local/' + (process.env.NAME || 'kiosk-home') + '.html' : '/local/' + (process.env.NAME || 'kiosk-home') + '/index.html');
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
const log = async () => (await (await fetch(BASE + '/__log')).json()).calls;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 }, hasTouch: true });
  const logs = []; p.on('console', m => logs.push(m.type() + ': ' + m.text())); p.on('pageerror', e => logs.push('pageerror: ' + e.message));
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  await p.goto(PAGE); await sleep(1200);
  const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await sleep(350); };
  // Room tile from Home navigates by hash
  await p.locator('#rooms [data-arg="#garage"]').click(); await sleep(350);
  check('room tile opens #garage view', p.url().endsWith('#garage') && !(await p.locator('#subview').isHidden()));
  // Rooms tab sheet
  await p.locator('[data-act="rooms"]').click(); await sleep(200);
  await p.locator('#sheet [data-arg="#kidsroom"]').click(); await sleep(350);
  check('Rooms sheet navigates', p.url().endsWith('#kidsroom'));
  // Lights
  await go('lights');
  await p.locator('#subview [data-act="toggle"][data-arg="light.dining_light"]').click(); await sleep(250);
  check('lights view toggle', (await log()).at(-1) === 'homeassistant.toggle' && await p.locator('#subview [data-act="toggle"][data-arg="light.dining_light"]').evaluate(e => e.classList.contains('on')));
  await p.locator('#subview [data-act="dim"][data-arg="light.tall_lamp"]').click(); await sleep(200);
  await p.locator('#sheet [data-act="call"]').nth(1).click(); await sleep(250);
  check('brightness preset', (await log()).at(-1) === 'light.turn_on' && /25%/.test(await p.locator('#subview [data-act="toggle"][data-arg="light.tall_lamp"]').textContent()));
  await p.keyboard.press('Escape');
  const sw = p.locator('#subview .switch-btn').nth(2); await sw.click(); await sleep(250);
  check('room master switch', /homeassistant\.turn_(on|off)/.test((await log()).at(-1)));
  const n0 = (await log()).length;
  const alloff = p.locator('#subview button', { hasText: 'All off' }); await alloff.click(); await sleep(150);
  check('All off needs second tap', (await log()).length === n0 && /Tap again/.test(await p.locator('#subview .vhead').textContent()));
  await p.locator('#subview button', { hasText: 'Tap again' }).click(); await sleep(300);
  check('All off turns everything off', (await log()).at(-1) === 'homeassistant.turn_off' && /0<\/b> of 18/.test(await p.locator('#subview .vhead').innerHTML()));
  // Floor plan pins must stay over their anchors while pressed, so the tap can land.
  await go('living-room');
  const pins = p.locator('.plan [data-act="toggle"]');
  const ids = await pins.evaluateAll((buttons) => buttons.map((button) => button.dataset.arg));
  check('floor plan shows all five light controls', ids.length === 5);
  for (const id of ids) {
    const selector = `.plan [data-arg="${id}"]`;
    const pin = p.locator(selector);
    const centre = ({ x, y, width, height }) => [x + width / 2, y + height / 2];
    const [x, y] = centre(await pin.boundingBox());
    const requestCount = (await log()).length;
    await p.mouse.move(x, y);
    await p.mouse.down();
    const [pressedX, pressedY] = centre(await pin.boundingBox());
    await p.mouse.up();
    const lit = (on) => p.waitForFunction(
      ({ selector, on }) => document.querySelector(selector)?.classList.contains('on') === on,
      { selector, on }, { timeout: 1500 },
    ).then(() => true, () => false);
    const turnedOn = await lit(true);
    await pin.tap();
    const turnedOff = await lit(false);
    const calls = (await (await fetch(BASE + '/__log')).json()).data.slice(requestCount);
    check(`floor plan ${id} stays in place and toggles on and off with mouse and touch`,
      Math.hypot(pressedX - x, pressedY - y) <= 2 && turnedOn && turnedOff && calls.length === 2 &&
      calls.every(({ svc, data }) => svc === 'homeassistant.toggle' && data.entity_id === id),
      `pressed shift: ${Math.hypot(pressedX - x, pressedY - y).toFixed(1)}px; on: ${turnedOn}; off: ${turnedOff}; calls: ${calls.length}`);
  }
  // Climate
  await go('homeclimate');
  await p.locator('#subview [data-act="temp"][data-arg="climate.bed_ac|1"]').click(); await sleep(250);
  check('climate +', (await log()).at(-1) === 'climate.set_temperature' && /23\.5°/.test(await p.locator('#subview').textContent()));
  await p.locator('#subview .panel').nth(1).locator('.seg button', { hasText: 'Cool' }).click(); await sleep(250);
  check('climate mode', (await log()).at(-1) === 'climate.set_hvac_mode');
  await p.locator('#subview [data-act="ac-timer"]').click(); await sleep(200);
  await p.selectOption('#sheet select[data-select="input_select.ac_timer_target"]', 'Bedroom AC'); await sleep(200);
  check('AC timer room select', (await log()).at(-1) === 'input_select.select_option');
  await p.locator('#sheet button', { hasText: 'Start' }).click(); await sleep(200);
  check('AC timer start', (await log()).at(-1) === 'script.turn_on');
  await p.keyboard.press('Escape');
  // Security
  await go('security');
  const n1 = (await log()).length;
  await p.locator('#subview button', { hasText: 'Unlock' }).click(); await sleep(150);
  check('unlock arms', (await log()).length === n1);
  await p.locator('#subview button', { hasText: 'Tap again' }).click(); await sleep(250);
  check('lock.unlock on second tap', (await log()).at(-1) === 'lock.unlock');
  await p.locator('#subview .camtile').first().click(); await sleep(400);
  check('camera tile opens live sheet', await p.locator('#sheet #live').isVisible());
  await p.keyboard.press('Escape'); await sleep(300);
  // Garage
  await go('garage');
  await p.locator('#subview [data-arg="input_boolean.keep_garage_door_open"]').click(); await sleep(250);
  check('keep open toggles', (await log()).at(-1) === 'homeassistant.toggle');
  // Music: Music Assistant panel embedded
  await go('music'); await sleep(500);
  const fr = p.frameLocator('#subview iframe.embed');
  check('music embeds Music Assistant', (await p.locator('#subview iframe.embed').getAttribute('src')) === '/d5369777_music_assistant' && /Music Assistant/.test(await fr.locator('#ma').textContent()));
  // Live camera from Security: MJPEG stream plays, sheet is centred, stream stops on close
  await go('security');
  await p.locator('#subview .camtile').nth(1).click(); await sleep(900);
  await p.waitForFunction(() => { const v = document.querySelector('#sheet #live video'); return v && v.currentTime > 0.3; }, null, { timeout: 15000 }).catch(() => {});
  const live = await p.evaluate(() => { const i = document.querySelector('#sheet #live video'); const r = document.querySelector('#sheet').getBoundingClientRect(); return { src: i ? 'video' : 'none', w: i ? i.videoWidth : 0, cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2) }; });
  check('live view plays HLS video', live.src === 'video' && live.w === 480, JSON.stringify(live));
  check('sheet centred', Math.abs(live.cx - 640) < 3 && Math.abs(live.cy - 400) < 3, `${live.cx},${live.cy}`);
  await p.keyboard.press('Escape'); await sleep(600);
  check('video torn down with the sheet', await p.evaluate(() => !document.querySelector('#sheet').open && !document.querySelector('#sheet video')));
  // Back home
  await go('home');
  check('home renders again', await p.locator('#rooms .tile').count() === 6 && await p.locator('#subview').isHidden());
  check('no reload across routes', logs.filter(l => /kiosk-home(-glass)? loaded/.test(l)).length === 1);
  const noise = (l) => /Failed to load resource.*404|HLS failed/.test(l); /* mock has no HLS server */
  check('console clean', !logs.some(l => /error|warn/i.test(l) && !noise(l)), logs.filter(l => /error|warn/i.test(l) && !noise(l)).join(' | '));
  console.log(R.join('\n'));
  await b.close();
})();
