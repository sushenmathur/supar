#!/usr/bin/env node
// Visual regression for the kiosk pages: takes the same screenshots every run (fixed clock, fixed data,
// animations off) and compares them with the approved baselines in baseline/<page>/.
//
//   node tests/kiosk-home/visual/run.mjs             compare; failures write actual + diff images to output/
//   node tests/kiosk-home/visual/run.mjs --update    accept the current look as the new baselines
//   node tests/kiosk-home/visual/run.mjs --page kiosk-home --shot home-light,alarm
//
// Baselines are JPEG (quality 85) to keep the repo small; the comparison ignores compression noise.
// Uses the single-file builds (rebuild them first). Needs Playwright with Chromium and the e2e folder's
// npm install. A shot fails when more than 0.2% of its pixels differ noticeably (anti-aliasing is ignored).
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = 8123, BASE = `http://localhost:${PORT}`;
const FIXED = Date.UTC(2026, 10, 24, 0, 30); // Tue 24 Nov 2026, 10:30 am in Brisbane
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const UPDATE = process.argv.includes('--update');
const pages = (arg('--page') ?? 'kiosk-home,kiosk-home-glass').split(',');
const onlyShots = arg('--shot')?.split(',');
const MAX_DIFF = 0.002;

// [name, colour scheme, hash route, steps after load]
const set = (id, s) => fetch(`${BASE}/__state?id=${id}&s=${encodeURIComponent(s)}`);
const SHOTS = [
  ['home-light', 'light', ''],
  ['home-dark', 'dark', ''],
  ['lights', 'light', 'lights'],
  ['climate', 'light', 'homeclimate', async () => { await set('climate.bed_ac', 'heat'); await set('climate.samar_room', 'heat_cool'); await set('climate.shanaya_room', 'fan_only'); }],
  ['climate-dark', 'dark', 'homeclimate', async () => { await set('climate.bed_ac', 'heat'); await set('climate.samar_room', 'heat_cool'); await set('climate.shanaya_room', 'fan_only'); }],
  ['security', 'light', 'security'],
  ['kids', 'light', 'kidsroom'],
  ['energy-hud', 'light', 'energy-dashboard'],
  ['lost-phone', 'light', '', async (p) => { await p.locator('[data-act="lost-phone"]').click(); for (const k of '12') await p.locator(`[data-key="${k}"]`).click(); }],
  ['alarm', 'light', '', async (p) => { await p.locator('#alarm [data-act="alarm-arm-home"]').click(); for (const k of '123') await p.locator(`[data-key="${k}"]`).click(); }],
  ['garage-close', 'light', '', async (p) => { await p.locator('#banner [data-act="close-garage"]').click(); await p.waitForFunction(() => (document.querySelector('#live')?.dataset.status ?? '') !== '' || document.querySelector('#live')?.dataset.live, null, { timeout: 15000 }); }],
  ['tv-remote', 'light', '', async (p) => { const b = await p.locator('#media [data-act="tv"]').boundingBox(); await p.mouse.move(b.x + 20, b.y + 20); await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up(); }, { MOCK_TV: '1' }],
  ['robbie', 'light', '', async (p) => { await p.locator('#actions [data-act="robbie"]').click(); }],
  ['banner-amber', 'light', '', async () => { await set('binary_sensor.side_door_contact', 'off'); await set('input_boolean.keep_garage_door_open', 'on'); }],
  ['banner-grey-dark', 'dark', '', async () => { await set('binary_sensor.side_door_contact', 'off'); await set('binary_sensor.garage_door_sensor_contact', 'off'); await set('cover.garage_door_v2', 'closed'); await set('binary_sensor.hallwaydoorsensor_contact', 'on'); }],
  ['media', 'light', '', async (p) => { await p.locator('#rooms [data-act="media"]').click(); await p.waitForFunction(() => [...document.querySelectorAll('#sheet img')].every((i) => i.complete)); }, { MOCK_MEDIA: '1' }],
  ['media-dark', 'dark', '', async (p) => { await p.locator('#rooms [data-act="media"]').click(); await p.waitForFunction(() => [...document.querySelectorAll('#sheet img')].every((i) => i.complete)); }, { MOCK_MEDIA: '1' }],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function startMock(env = {}) {
  const p = spawn(process.execPath, [join(HERE, '../e2e/mock-ha.mjs')], { env: { ...process.env, PORT: String(PORT), MOCK_NOW: String(FIXED), ...env }, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { await fetch(`${BASE}/__log`); return p; } catch { await sleep(100); } }
  p.kill(); throw new Error('mock Home Assistant did not start');
}

// Compare two screenshots in the browser (canvas), return the share of pixels that differ and a diff image.
async function compare(page, a, b) {
  return page.evaluate(async ([a64, b64]) => {
    const load = (b) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = `data:image/jpeg;base64,${b}`; });
    const [ia, ib] = await Promise.all([load(a64), load(b64)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { share: 1, size: [ia.width, ia.height, ib.width, ib.height] };
    const c = (img) => { const cv = new OffscreenCanvas(img.width, img.height); const x = cv.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height); };
    const da = c(ia), db = c(ib), out = new ImageData(ia.width, ia.height);
    let n = 0;
    for (let i = 0; i < da.data.length; i += 4) {
      const d = Math.max(Math.abs(da.data[i] - db.data[i]), Math.abs(da.data[i + 1] - db.data[i + 1]), Math.abs(da.data[i + 2] - db.data[i + 2]));
      if (d > 40) { n++; out.data[i] = 255; out.data[i + 3] = 255; } else { out.data[i] = out.data[i + 1] = out.data[i + 2] = da.data[i] * 0.3 + 160; out.data[i + 3] = 255; }
    }
    const cv = new OffscreenCanvas(ia.width, ia.height); cv.getContext('2d').putImageData(out, 0, 0);
    const blob = await cv.convertToBlob({ type: 'image/png' });
    const u8 = new Uint8Array(await blob.arrayBuffer()); let bin = '';
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
    const diff = btoa(bin);
    return { share: n / (da.data.length / 4), diff };
  }, [a.toString('base64'), b.toString('base64')]);
}

const browser = await chromium.launch();
const tool = await browser.newPage();
let failed = 0, done = 0;
rmSync(join(HERE, 'output'), { recursive: true, force: true });
for (const name of pages) {
  mkdirSync(join(HERE, 'baseline', name), { recursive: true });
  for (const [shot, scheme, route, steps, mockEnv] of SHOTS) {
    if (onlyShots && !onlyShots.includes(shot)) continue;
    const mock = await startMock(mockEnv);
    // The pages go dark by the sun, so a dark shot is taken after sunset.
    if (scheme === 'dark') await set('sun.sun', 'below_horizon');
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: scheme, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(FIXED);
    await page.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
    await page.goto(`${BASE}/local/${name}.html${route ? `#${route}` : ''}`);
    await page.waitForFunction(() => document.querySelector('#stage') && !document.querySelector('#message:not([hidden]) p')?.textContent.includes('Loading'), null, { timeout: 10000 }).catch(() => {});
    await sleep(1200);
    if (steps) { await steps(page); await sleep(900); }
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ animations: 'disabled', caret: 'hide', type: 'jpeg', quality: 85 });  // JPEG keeps the repo small
    await ctx.close(); mock.kill(); await sleep(150);
    const file = join(HERE, 'baseline', name, `${shot}.jpg`);
    done++;
    if (UPDATE || !existsSync(file)) { writeFileSync(file, png); console.log(`${UPDATE ? 'updated' : 'new    '} ${name}/${shot}`); continue; }
    const r = await compare(tool, readFileSync(file), png);
    if (r.share <= MAX_DIFF) { console.log(`ok      ${name}/${shot} (${(r.share * 100).toFixed(3)}% differs)`); continue; }
    failed++;
    const out = join(HERE, 'output', name); mkdirSync(out, { recursive: true });
    writeFileSync(join(out, `${shot}.actual.jpg`), png);
    if (r.diff) writeFileSync(join(out, `${shot}.diff.png`), Buffer.from(r.diff, 'base64'));
    console.log(`FAIL    ${name}/${shot}: ${(r.share * 100).toFixed(2)}% of pixels differ${r.size ? ` (size ${r.size.join('x')})` : ''}; see output/${name}/${shot}.*.png`);
  }
}
await browser.close();
console.log(`\n${failed ? `${failed} of ${done} shots differ from the baselines` : `${done} shots match`}${UPDATE ? ' (baselines updated)' : ''}`);
process.exit(failed ? 1 : 0);
