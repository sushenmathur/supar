#!/usr/bin/env node
// End-to-end regression for the kiosk pages. Runs every suite in suites/ against both pages
// (www/kiosk-home and www/kiosk-home-glass) and both builds (the folder and the single .html file), each
// against a fresh fake Home Assistant (mock-ha.mjs), so no state leaks from one suite into the next.
//
//   node tests/kiosk-home/e2e/run.mjs                 everything
//   node tests/kiosk-home/e2e/run.mjs --page kiosk-home --suite alarm,tv
//   node tests/kiosk-home/e2e/run.mjs --quick         folder builds only
//
// Needs Playwright with Chromium, and `npm install` in this folder (for ws). Rebuild the single files first
// (node tools/kiosk-home/build-single.mjs [--name kiosk-home-glass]). Exits 1 if anything fails.
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = 8123;
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const pages = (arg('--page') ?? 'kiosk-home,kiosk-home-glass').split(',');
const only = arg('--suite')?.split(',');
const builds = process.argv.includes('--quick') ? [''] : ['', '1'];

// [suite, mock env, run env, pages it applies to (default all), builds (default all)]
const SUITES = [
  ['home'], ['views'], ['fixes'], ['fit'], ['live'], ['charging'], ['energy'], ['six'], ['bins'],
  ['tv', { MOCK_TV: '1' }], ['media', { MOCK_MEDIA: '1' }], ['banner'], ['theme'], ['music', { MOCK_KS_MUSIC: '1' }], ['music', {}, { MODE: 'none' }],
  ['cars', {}, { LOGOS: '1' }], ['cars', { MOCK_NO_LOGOS: '1' }, { LOGOS: '' }],
  ['person', { MOCK_PERSON: '1' }], ['robbie', { MOCK_ROBBIE: '1' }],
  ['single', {}, {}, null, ['']],                         // loads the single file itself
  ['glass', { MOCK_LONG: '1' }, {}, ['kiosk-home-glass']],
  // Alarm keypad, every way it can be set up (see suites/alarm.cjs).
  ['alarm', {}, { MODE: 'script' }], ['alarm', { MOCK_ALARM_CODE: '1' }, { MODE: 'panel' }], ['alarm', { MOCK_ALARM_SILENT: '1' }, { MODE: 'silent' }],
  ['alarm', { MOCK_ALARM_SILENT: '1', MOCK_NO_ALARM_SCRIPT: '1' }, { MODE: 'direct' }], ['alarm', { MOCK_NO_ALARM_SCRIPT: '1' }, { MODE: 'missing' }],
  ['alarm', { MOCK_ALARM_MISMATCH: '1' }, { MODE: 'mismatch' }],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function startMock(env) {
  const p = spawn(process.execPath, [join(HERE, 'mock-ha.mjs')], { env: { ...process.env, PORT: String(PORT), ...env }, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { await fetch(`http://localhost:${PORT}/__log`); return p; } catch { await sleep(100); } }
  p.kill(); throw new Error('mock Home Assistant did not start');
}
function runSuite(file, env) {
  return new Promise((done) => {
    const p = spawn(process.execPath, [file], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = ''; p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { out += d; });
    p.on('close', (code) => done({ code, out }));
  });
}

let failed = 0, passed = 0;
for (const name of pages) {
  for (const [suite, mockEnv = {}, runEnv = {}, onlyPages, onlyBuilds] of SUITES) {
    if (only && !only.includes(suite)) continue;
    if (onlyPages && !onlyPages.includes(name)) continue;
    for (const single of onlyBuilds ?? builds) {
      const mock = await startMock(mockEnv);
      const { code, out } = await runSuite(join(HERE, 'suites', `${suite}.cjs`), { NAME: name, SINGLE: single, ...runEnv });
      mock.kill(); await sleep(150);
      const p = (out.match(/^PASS/gm) ?? []).length, f = out.split('\n').filter((l) => l.startsWith('FAIL'));
      passed += p;
      const label = `${name}${single ? '.html' : '/'} ${suite}${runEnv.MODE ? `:${runEnv.MODE}` : ''}`;
      if (code === 0 && !f.length && p) console.log(`ok    ${label} (${p})`);
      else { failed++; console.log(`FAIL  ${label} (exit ${code})\n${(f.length ? f.join('\n') : out.trim().split('\n').slice(-8).join('\n')).replace(/^/gm, '      ')}`); }
    }
  }
}
console.log(`\n${failed ? `${failed} suite run(s) failed` : 'all suites passed'} · ${passed} checks passed`);
process.exit(failed ? 1 : 0);
