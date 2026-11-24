// Media pop-up (the Media tile): players listed once each, playing first, the hero's controls, the list's
// buttons, volume, power (TV via its own logic, the bedroom Apple TV via switch.bedroom_tv), the TV remote,
// artwork through Home Assistant only, and the progress clock. Needs MOCK_MEDIA=1.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', NAME = process.env.NAME || 'kiosk-home', PAGE = BASE + '/local/' + NAME + (process.env.SINGLE ? '.html' : '/index.html');
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
const log = async () => (await (await fetch(BASE + '/__log')).json()).data ?? [];
const lastCall = async () => (await log()).slice(-1)[0];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 }, hasTouch: true });
  const outside = []; p.on('request', (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) outside.push(r.url()); });
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  await p.goto(PAGE); await p.waitForTimeout(1500);
  const S = '#sheet.mediasheet';
  await p.locator('#rooms [data-act="media"]').click(); await p.waitForTimeout(400);
  check('Media tile opens the pop-up', await p.locator(S).count() === 1 && await p.locator('#sheet').evaluate((d) => d.open));
  const names = await p.locator(`${S} .mrow .who b`).allInnerTexts();
  check('lists each player once, playing first, then paused, idle, off', JSON.stringify(names) === JSON.stringify(['Media Apple TV', 'Spotify', 'Kitchen speaker', 'Bedroom Google TV', 'TV', 'Bedroom Apple TV']), JSON.stringify(names));
  check('one bedroom Apple TV', names.filter((n) => /Bedroom Apple TV/.test(n)).length === 1);
  check('heading summary', /2 playing/.test(await p.locator(`${S} .mhead`).innerText()), await p.locator(`${S} .mhead`).innerText());
  check('first playing player selected', /Media Apple TV/.test(await p.locator(`${S} .mrow.sel`).innerText()) && /The Creek/.test(await p.locator(`${S} .mttl`).innerText()) && /Bluey/.test(await p.locator(`${S} .mttl`).innerText()));
  check('source badge and equaliser', /Media Apple TV · Disney\+/.test(await p.locator(`${S} .msrc`).innerText()) && await p.locator(`${S} .meq`).count() === 1);
  check('artwork comes through Home Assistant', await p.locator(`${S} .mart img`).evaluate((i) => i.complete && i.naturalWidth > 0 && i.getAttribute('src').startsWith('/api/media_player_proxy/')));
  check('playing rows say so', /Playing · Here Comes the Sun · The Beatles/.test(await p.locator(`${S} .mrow`).nth(1).innerText()));
  check('bedroom Apple TV off by its power switch', /Off · Bedroom TV power off/.test(await p.locator(`${S} .mrow`).nth(5).innerText()) && await p.locator(`${S} .mrow`).nth(5).evaluate((r) => r.classList.contains('off')));
  // Progress clock: 2:41 at load, moves on while playing.
  const t0 = await p.locator(`${S} .m0`).innerText(); await p.waitForTimeout(2100); const t1 = await p.locator(`${S} .m0`).innerText();
  check('progress clock runs while playing', /^2:4\d$/.test(t0) && t1 !== t0 && /7:02/.test(await p.locator(`${S} .mprog`).innerText()), `${t0} → ${t1}`);
  // Hero controls.
  const hero = [['[aria-label="Pause"]', 'media_player.media_pause', {}], ['[aria-label="Next"]', 'media_player.media_next_track', {}], ['[aria-label="Previous"]', 'media_player.media_previous_track', {}],
    ['[aria-label="Mute"]', 'media_player.volume_mute', { is_volume_muted: true }], ['[aria-label="Volume up"]', 'media_player.volume_up', {}]];
  for (const [sel, svc, data] of hero) {
    await p.locator(`${S} .mhero ${sel}`).click(); await p.waitForTimeout(200);
    const c = await lastCall(); check(`hero ${sel} → ${svc}`, c.svc === svc && c.data.entity_id === 'media_player.media_apple_tv' && Object.entries(data).every(([k, v]) => c.data[k] === v), JSON.stringify(c));
  }
  check('paused player shows Play', await p.locator(`${S} .mhero [aria-label="Play"]`).count() === 1);
  check('muted shows Unmute', await p.locator(`${S} .mhero [aria-label="Unmute"].on`).count() === 1);
  // Volume slider: set on release.
  const sl = p.locator(`${S} [data-mvol]`); const bx = await sl.boundingBox();
  await p.mouse.click(bx.x + bx.width * 0.8, bx.y + bx.height / 2); await p.waitForTimeout(300);
  let c = await lastCall(); check('volume slider sets the volume', c.svc === 'media_player.volume_set' && c.data.entity_id === 'media_player.media_apple_tv' && c.data.volume_level > 0.7 && c.data.volume_level < 0.9, JSON.stringify(c));
  check('volume label follows', /^(7\d|8\d)%$/.test(await p.locator(`${S} .mpct`).innerText()), await p.locator(`${S} .mpct`).innerText());
  // Select another player from the list.
  await p.locator(`${S} .mrow .who`, { hasText: 'Spotify' }).click(); await p.waitForTimeout(300);
  check('tapping a row selects it', /Spotify/.test(await p.locator(`${S} .mrow.sel`).innerText()) && /Here Comes the Sun/.test(await p.locator(`${S} .mttl`).innerText()));
  check('Spotify artwork', await p.locator(`${S} .mart img`).evaluate((i) => i.getAttribute('src').includes('spotify')));
  // A row's own button acts without selecting.
  const sp = p.locator(`${S} .mrow`, { hasText: 'Kitchen speaker' });
  await sp.locator('.mini').click(); await p.waitForTimeout(300);
  c = await lastCall(); check('row play button plays the paused speaker', c.svc === 'media_player.media_play' && c.data.entity_id === 'media_player.kitchen_speaker', JSON.stringify(c));
  check('row button leaves the selection alone', /Spotify/.test(await p.locator(`${S} .mrow.sel`).innerText()));
  // Power: idle Google TV turns off; bedroom Apple TV via its switch; TV wakes with its script.
  await p.locator(`${S} .mrow`, { hasText: 'Bedroom Google TV' }).locator('.mini').click(); await p.waitForTimeout(200);
  c = await lastCall(); check('Google TV power → media_player.turn_off', c.svc === 'media_player.turn_off' && c.data.entity_id === 'media_player.bedroom_google_tv', JSON.stringify(c));
  await p.locator(`${S} .mrow`, { hasText: 'Bedroom Apple TV' }).locator('.mpill').click(); await p.waitForTimeout(300);
  c = await lastCall(); check('Bedroom Apple TV "Turn on" → switch.bedroom_tv', c.svc === 'switch.turn_on' && c.data.entity_id === 'switch.bedroom_tv', JSON.stringify(c));
  check('bedroom row updates live once powered', !/power off/.test(await p.locator(`${S} .mrow`, { hasText: 'Bedroom Apple TV' }).innerText()));
  await p.locator(`${S} .mrow .who`, { hasText: /^TV/ }).click(); await p.waitForTimeout(300);
  check('TV selected, controls disabled while off', /TV/.test(await p.locator(`${S} .mrow.sel`).innerText()) && await p.locator(`${S} .mhero [aria-label="Next"]`).isDisabled());
  await p.locator(`${S} .mhero .rk.pw`).click(); await p.waitForTimeout(400);
  c = await lastCall(); check('TV power wakes it with script.media_tv_power', c.svc === 'script.turn_on' && c.data.entity_id === 'script.media_tv_power', JSON.stringify(c));
  // Keyboard: Enter on a row selects it.
  await p.locator(`${S} .mrow`, { hasText: 'Kitchen speaker' }).focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  check('Enter on a row selects it', /Kitchen speaker/.test(await p.locator(`${S} .mrow.sel`).innerText()));
  // Remote pill opens the TV remote.
  await p.locator(`${S} .mrow`, { hasText: /^\s*TV/ }).locator('.mpill').click(); await p.waitForTimeout(400);
  check('TV Remote button opens the remote', await p.locator('#sheet.tvsheet .dpad').count() === 1 && await p.locator('#sheet.mediasheet').count() === 0);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.locator('#rooms [data-act="media"]').click(); await p.waitForTimeout(300);
  check('reopens with the first playing player selected', /Spotify|Media Apple TV|Kitchen/.test(await p.locator(`${S} .mrow.sel`).innerText()) && await p.locator(`${S} .mrow.sel`).count() === 1);
  check('no requests outside Home Assistant', outside.length === 0, outside.join(' '));
  check('no page errors', errors.length === 0, errors.join(' | '));
  await b.close(); console.log(R.join('\n')); process.exit(R.some((r) => r.startsWith('FAIL')) ? 1 : 0);
})().catch((e) => { console.log(R.join('\n')); console.log('FAIL crashed: ' + e.message); process.exit(1); });
