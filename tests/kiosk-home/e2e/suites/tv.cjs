// TV remote on long press, quick sources, and the pulsing charge bolt on the Energy card. Needs MOCK_TV=1.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', NAME = process.env.NAME || 'kiosk-home', PAGE = BASE + '/local/' + NAME + (process.env.SINGLE ? '.html' : '/index.html');
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
const log = async () => (await (await fetch(BASE + '/__log')).json()).data ?? [];
const lastCall = async () => (await log()).slice(-1)[0];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 }, hasTouch: true, colorScheme: process.env.SCHEME || 'light' });
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  await p.goto(PAGE); await p.waitForTimeout(1500);
  const tv = p.locator('#media [data-act="tv"]');
  // Short tap: power, as before.
  const n0 = (await log()).length; await tv.click(); await p.waitForTimeout(300);
  const c0 = (await log()).slice(n0);
  check('tap still toggles TV power', c0.length === 1 && c0[0].svc === 'script.turn_on' && c0[0].data.entity_id === 'script.media_tv_power' && !(await p.locator('#sheet').evaluate((d) => d.open)), JSON.stringify(c0));
  // Long press: the remote.
  const box = await tv.boundingBox(); await p.mouse.move(box.x + 30, box.y + 20); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); await p.waitForTimeout(300);
  check('long press opens the remote', await p.locator('#sheet.tvsheet .dpad').count() === 1 && /Media TV/.test(await p.locator('#sheet').innerText()));
  const n1 = (await log()).length; check('releasing the long press does not also toggle power', (await log()).slice(n1 - 1).every((c) => c.svc !== 'script.turn_on' || n1 === 1) );
  check('shows what is on and the volume', /Netflix · The Crown · volume 23%/.test(await p.locator('.tvhead').innerText()), await p.locator('.tvhead').innerText());
  if (process.env.SHOT) await p.locator('#sheet').screenshot({ path: process.env.SHOT });
  const tests = [['[data-arg="UP"]', 'webostv.button', { button: 'UP' }], ['.dpad .ok', 'webostv.button', { button: 'ENTER' }], ['[data-arg="BACK"]', 'webostv.button', { button: 'BACK' }],
    ['[data-arg="HOME"]', 'webostv.button', { button: 'HOME' }], ['[data-arg="RED"]', 'webostv.button', { button: 'RED' }], ['[data-arg="CHANNELUP"]', 'webostv.button', { button: 'CHANNELUP' }],
    ['[aria-label="Volume up"]', 'media_player.volume_up', {}], ['[aria-label="Mute"]', 'media_player.volume_mute', { is_volume_muted: true }],
    ['[aria-label="Play or pause"]', 'media_player.media_play_pause', {}], ['.src[data-arg="YouTube"]', 'media_player.select_source', { source: 'YouTube' }]];
  for (const [sel, svc, data] of tests) {
    await p.locator(`#sheet ${sel}`).click(); await p.waitForTimeout(150);
    const c = await lastCall(); const ok = c.svc === svc && c.data.entity_id === 'media_player.tv' && Object.entries(data).every(([k, v]) => c.data[k] === v);
    check(`${sel} → ${svc}`, ok, JSON.stringify(c));
  }
  check('current source highlighted', await p.locator('#sheet .src.on[data-arg="Netflix"]').count() === 1);
  await p.locator('#tvsrc').selectOption('HDMI 1'); await p.waitForTimeout(150);
  let c = await lastCall(); check('All sources list selects HDMI 1', c.svc === 'media_player.select_source' && c.data.source === 'HDMI 1', JSON.stringify(c));
  await p.locator('#sheet .rk.pw').click(); await p.waitForTimeout(150);
  c = await lastCall(); check('power button uses script.media_tv_power', c.svc === 'script.turn_on' && c.data.entity_id === 'script.media_tv_power', JSON.stringify(c));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  check('remote closes and the sheet is clean', !(await p.locator('#sheet').evaluate((d) => d.open)) && !(await p.locator('#sheet').evaluate((d) => d.classList.contains('tvsheet'))));
  // TV off: arrows disabled, power still works.
  await fetch(`${BASE}/__state?id=media_player.tv&s=off`); await p.waitForTimeout(400);
  await tv.dispatchEvent('pointerdown'); await p.waitForTimeout(650); await tv.dispatchEvent('pointerup'); await p.waitForTimeout(300);
  check('TV off: controls disabled except power', await p.locator('#sheet [data-arg="UP"]').isDisabled() && await p.locator('#sheet .rk.pw').isEnabled());
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // Charging bolt on the Energy card.
  await fetch(`${BASE}/__state?id=sensor.sonic_charger_power&s=2000`); await p.waitForTimeout(600);
  const ev = await p.$$eval('#energy .evrow', (els) => els.map((e) => ({ chg: e.classList.contains('chg'), bolt: e.querySelector('.evbolt') ? getComputedStyle(e.querySelector('.evbolt')).animationName : null, t: e.textContent.trim().replace(/\s+/g, ' ') })));
  check('charging car gets a pulsing bolt', ev[0].chg && ev[0].bolt === 'evpulse', JSON.stringify(ev[0]));
  check('idle car has none', !ev[1].chg && ev[1].bolt === null, JSON.stringify(ev[1]));
  if (process.env.SHOT) await p.locator('#energy').screenshot({ path: process.env.SHOT.replace('.png', '-energy.png') });
  console.log(R.join('\n')); await b.close(); process.exit(R.some((r) => r.startsWith('FAIL')) ? 1 : 0);
})();
