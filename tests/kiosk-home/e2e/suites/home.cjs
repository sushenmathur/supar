const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', PAGE = BASE + '/local/' + (process.env.NAME || 'kiosk-home') + (process.env.SINGLE ? '.html' : '/index.html');
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
const calls = async () => (await (await fetch(BASE + '/__log')).json()).calls;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const tokens = () => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 }));
const KS = (sharing, version = '2026.11.32+375') => `window.kioskSatellite={platform:'kiosksatellite',version:${JSON.stringify(version)},ia:[],setInteractionActive(active,reason){this.ia.push([active,reason]);return Promise.resolve(true)},getKioskState(){return Promise.resolve({screensaver:{active:false}})},
 ha:{createSocket(){ if(!${sharing}) return Promise.reject(2); return new Promise((res)=>{const ws=new WebSocket(location.origin.replace(/^http/,'ws')+'/api/websocket');ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='auth_required')ws.send(JSON.stringify({type:'auth',access_token:'k'}));if(m.type==='auth_ok'){ws.onmessage=null;ws.haVersion=m.ha_version;res(ws)}}})}}};`;
(async () => {
  const b = await chromium.launch();
  const page = async (init) => { const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const logs = []; p.on('console', m => logs.push(m.type() + ': ' + m.text())); p.on('pageerror', e => logs.push('pageerror: ' + e.message)); await p.addInitScript(init); await p.goto(PAGE); await sleep(1200); return { p, logs }; };

  const { p, logs } = await page(tokens);
  // light toggle via slot
  const firstOff = p.locator('#lights button.light:not(.on)').first();
  const id = await firstOff.getAttribute('data-arg'); await firstOff.click(); await sleep(300);
  check('light toggles and repaints', await p.locator(`#lights [data-arg="${id}"]`).evaluate(e => e.classList.contains('on')), id);
  check('toggle used homeassistant.toggle', (await calls()).at(-1) === 'homeassistant.toggle');
  // close garage: a confirmation with the garage camera, then close
  let n = (await calls()).length;
  await p.locator('#banner [data-act="close-garage"]').click(); await sleep(400);
  check('close door asks first, with the garage camera', await p.locator('#sheet').evaluate((d) => d.open) && /Close the garage door\?/.test(await p.locator('#sheet h2').textContent()) && await p.locator('#sheet #live').count() === 1 && /in the way/.test(await p.locator('#sheet .gwarn').textContent()));
  check('no call before confirming', (await calls()).length === n);
  await p.locator('#sheet [data-sheet="garage-go"]').click(); await sleep(300);
  check('cover.close_cover after confirming', (await calls()).at(-1) === 'cover.close_cover' && !(await p.locator('#sheet').evaluate((d) => d.open)));
  check('banner updates after close', /Side door open/.test(await p.locator('#banner').textContent()), (await p.locator('#banner b').textContent()));
  check('garage room no longer alert', !(await p.locator('#rooms [data-arg="#garage"]').evaluate(e => e.classList.contains('alert'))));
  // alarm: the keypad dial for the code
  const enter = async (digits) => { for (const k of [...digits, 'ok']) await p.locator(`#sheet [data-key="${k}"]`).click(); };
  await p.locator('[data-act="alarm-arm-away"]').click(); await sleep(300);
  check('arm away opens the code dial', await p.locator('#sheet #lpdial').count() === 1 && await p.locator('#sheet [data-chip="alarm_arm_away"].on').count() === 1);
  n = (await calls()).length;
  await enter('9999'); await sleep(300);
  check('wrong alarm code shows Access denied', /Access denied/.test(await p.locator('#lpmsg').textContent()) && /Disarmed/.test(await p.locator('#alarm').textContent()));
  await sleep(1000); await enter('1234'); await sleep(400);
  check('arm away', (await calls()).at(-1) === 'alarm_control_panel.alarm_arm_away' && /Armed away/.test(await p.locator('#alarm').textContent()));
  await sleep(1900);
  await p.locator('[data-act="alarm-disarm"]').click(); await sleep(300);
  check('disarm offers only Disarm', await p.locator('#sheet [data-chip]').count() === 1 && await p.locator('#sheet [data-chip="alarm_disarm"]').count() === 1);
  await enter('1234'); await sleep(400);
  check('disarm', /Disarmed/.test(await p.locator('#alarm').textContent()));
  await sleep(1900);
  // front door unlock requires confirm
  n = (await calls()).length;
  await p.locator('[data-act="front-toggle"]').click(); await sleep(150);
  check('unlock arms first', (await calls()).length === n && /Tap again/.test(await p.locator('#fdoor').textContent()));
  await sleep(3300);
  check('unlock disarms after 3 s', /Front door/.test(await p.locator('#fdoor .name').textContent()));
  // announce sheet
  await p.locator('[data-act="announce"]').click(); await sleep(200);
  await p.fill('#msg', 'Dinner is ready'); await p.locator('[data-sheet="say"]').click(); await sleep(300);
  const c = await calls();
  check('announce sequence', c.slice(-3).join(',') === 'input_select.select_option,input_text.set_value,script.turn_on', c.slice(-3).join(','));
  check('sheet closed', !(await p.locator('#sheet').evaluate(d => d.open)));
  // lost phone (dial on kiosk-home, plain keypad on the glass copy)
  await p.locator('[data-act="lost-phone"]').click(); await sleep(200);
  const dialUI = await p.locator('#lpdial').count() > 0, GO = dialUI ? 'ok' : 'go';
  for (const k of ['9', '9', '9']) await p.locator(`[data-key="${k}"]`).click();
  if (dialUI) {
    await sleep(650);
    const dv = await p.evaluate(() => ({ filled: document.querySelectorAll('.lpseg.f').length, hub: document.querySelector('#lphub').textContent, rot: document.querySelector('#lpwheel').style.transform, cur: document.querySelector('.lpdg.cur')?.dataset.d }));
    check('dial turns to the digit and fills a segment per digit', dv.filled === 3 && dv.hub === '9' && dv.rot === 'rotate(-324deg)' && dv.cur === '9', JSON.stringify(dv));
    await p.locator('[data-key="ok"]').click(); await sleep(150);
    check('needs all four digits', /all 4 digits/.test(await p.locator('#lpmsg').textContent()));
  }
  await p.locator('[data-key="9"]').click(); await p.locator(`[data-key="${GO}"]`).click();
  await sleep(300); check('wrong passcode message', /wrong passcode/i.test(await p.locator('#lpmsg').textContent()), await p.locator('#lpmsg').textContent());
  if (dialUI) { check('dial shows the wrong code in red', await p.locator('#lpdial.bad').count() === 1); await sleep(900); }
  for (const k of ['1', '2', '3', '4', GO]) await p.locator(`[data-key="${k}"]`).click();
  await sleep(300); check('right passcode', /Alert sent to Sushen/.test(await p.locator('#lpmsg').textContent()));
  if (dialUI) check('dial turns green', await p.locator('#lpdial.good').count() === 1);
  await sleep(1900); check('lost phone closes', !(await p.locator('#sheet').evaluate(d => d.open)));
  // aircon sheet warmer
  await p.locator('[data-act="aircon"]').click(); await sleep(200);
  await p.locator('[data-temp]').last().click(); await sleep(300);
  check('aircon warmer', (await calls()).at(-1) === 'climate.set_temperature' && /24\.5°/.test(await p.locator('#media').textContent()), await p.locator('#media').textContent());
  await p.keyboard.press('Escape');
  // external change
  await fetch(BASE + '/__state?id=binary_sensor.front_door_contact&s=on'); await sleep(300);
  check('external front door open shows', /Open/.test(await p.locator('#fdoor').textContent()) && (await p.locator('#tabs .count').last().textContent()) !== '');
  check('camera refreshed', (await (await fetch(BASE + '/__log')).json()).camera >= 1);
  check('console clean', !logs.some(l => /error|secret|token=/.test(l)), logs.join(' | '));

  for (const [version, reason] of [['2026.11.32+375', 'settings'], ['2026.11.31', 'media'], ['', 'media']]) {
    const ks = await page(KS(true, version));
    const before = (await calls()).length;
    await ks.p.locator('[data-act="wifi"]').click();
    await ks.p.locator('#sheet [data-act="sheet-close"]').click();
    await ks.p.waitForFunction(() => window.kioskSatellite.ia.length >= 2);
    const interaction = await ks.p.evaluate(() => window.kioskSatellite.ia);
    check(`KS ${version || 'without a version'}: popup brackets with ${reason} and sends no HA service call`,
      await ks.p.locator('#lights button').count() === 6 &&
      JSON.stringify(interaction) === JSON.stringify([[true, reason], [false, reason]]) &&
      (await calls()).length === before, JSON.stringify(interaction));
    await ks.p.close();
  }
  const off = await page(KS(false));
  check('KS off: sharing message', /Share Home Assistant connection/.test(await off.p.locator('#message').textContent()));
  const none = await page(() => {});
  check('no session: sign-in message', /Keep me logged in/.test(await none.p.locator('#message').textContent()));
  console.log(R.join('\n'));
  await b.close();
})();
