// Music tab: inside Kiosk Satellite it opens the kiosk's own player through its ESPHome entities (Now Playing while
// a track is loaded, the Music Library otherwise), picking this kiosk's entities among several; outside Kiosk
// Satellite, or without the entities (MODE=none), it shows Music Assistant as before.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', NAME = process.env.NAME || 'kiosk-home', PAGE = BASE + '/local/' + NAME + (process.env.SINGLE ? '.html' : '/index.html');
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = async () => (await (await fetch(BASE + '/__log')).json()).data ?? [];
const KS = `window.kioskSatellite={platform:'kiosksatellite',st:{screensaver:{active:false},mediaPlayer:{state:'idle'}},setInteractionActive(){return Promise.resolve(true)},
 getKioskState(){return Promise.resolve(this.st)},getDeviceInfo(){return Promise.resolve({name:'Kitchen Tablet'})},
 ha:{createSocket(){return new Promise((res)=>{const ws=new WebSocket(location.origin.replace(/^http/,'ws')+'/api/websocket');ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='auth_required')ws.send(JSON.stringify({type:'auth',access_token:'k'}));if(m.type==='auth_ok'){ws.onmessage=null;ws.haVersion=m.ha_version;res(ws)}}})}}};`;
const tokens = () => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 }));
(async () => {
  const b = await chromium.launch();
  const open = async (init) => { const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.addInitScript(init); await p.goto(PAGE); await sleep(1500); return { p, errs }; };
  const tab = (p) => p.locator('#tabs .tab', { hasText: 'Music' });
  const { p, errs } = await open(KS);
  if (process.env.MODE === 'none') {
    check('no kiosk entities: Music tab still goes to Music Assistant', await tab(p).evaluate((t) => t.tagName === 'A' && t.getAttribute('href') === '#music'));
  } else {
    check('in Kiosk Satellite the Music tab opens the kiosk player', await tab(p).evaluate((t) => t.tagName === 'BUTTON' && t.dataset.act === 'ks-music'));
    let n = (await log()).length; await tab(p).click(); await sleep(300);
    let c = (await log()).slice(n);
    check('nothing loaded: opens the Music Library (this kiosk\'s)', c.length === 1 && c[0].svc === 'button.press' && c[0].data.entity_id === 'button.ks_kitchen_tablet_show_music_library', JSON.stringify(c));
    check('stays on the page', (await p.evaluate(() => location.hash)) !== '#music');
    await p.evaluate(() => { window.kioskSatellite.st = { screensaver: { active: false }, mediaPlayer: { state: 'playing', title: 'Song' } }; dispatchEvent(new CustomEvent('kiosksatellite:kiosk-state', { detail: window.kioskSatellite.st })); });
    n = (await log()).length; await tab(p).click(); await sleep(300); c = (await log()).slice(n);
    check('a track playing: opens Now Playing (this kiosk\'s)', c.length === 1 && c[0].svc === 'switch.turn_on' && c[0].data.entity_id === 'switch.ks_kitchen_tablet_now_playing', JSON.stringify(c));
    await p.evaluate(() => dispatchEvent(new CustomEvent('kiosksatellite:kiosk-state', { detail: { screensaver: { active: false }, mediaPlayer: { state: 'paused' } } })));
    n = (await log()).length; await tab(p).click(); await sleep(300); c = (await log()).slice(n);
    check('paused counts as loaded', c[0]?.svc === 'switch.turn_on', JSON.stringify(c));
  }
  const out = await open(tokens);
  check('outside Kiosk Satellite: Music Assistant as before', await tab(out.p).evaluate((t) => t.tagName === 'A' && t.getAttribute('href') === '#music'));
  check('no page errors', !errs.length && !out.errs.length, [...errs, ...out.errs].join(' | '));
  await b.close(); console.log(R.join('\n')); process.exit(R.some((r) => r.startsWith('FAIL')) ? 1 : 0);
})().catch((e) => { console.log(R.join('\n')); console.log('FAIL crashed: ' + e.message); process.exit(1); });
