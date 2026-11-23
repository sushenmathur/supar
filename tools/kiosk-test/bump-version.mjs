#!/usr/bin/env node
// Bumps the kiosk test page version so normal browsers pick up a deploy after one reload.
//
//   node tools/kiosk-test/bump-version.mjs        # 1 → 2
//   node tools/kiosk-test/bump-version.mjs 7      # set to 7
//   node tools/kiosk-test/bump-version.mjs --dir homeassistant/www/kiosk-home   # another page
//
// Rewrites VERSION in config.js and every `?v=<n>` on imports, the stylesheet and the
// script tag in the page folder (vendor/ excluded: it is not edited by hand).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

const args = process.argv.slice(2);
const dirAt = args.indexOf('--dir');
const repo = new URL('../../', import.meta.url).pathname;
const dir = dirAt >= 0 ? resolve(repo, args.splice(dirAt, 2)[1]) : resolve(repo, 'homeassistant/www/kiosk-test');
const configPath = join(dir, 'config.js');
const config = readFileSync(configPath, 'utf8');
const current = config.match(/export const VERSION = '([^']+)'/)?.[1];
if (!current) throw new Error('VERSION not found in config.js');
const next = args[0] ?? String(Number(current) + 1);
if (!/^[\w.-]+$/.test(next)) throw new Error(`bad version: ${next}`);

let changed = 0;
for (const name of readdirSync(dir)) {
  if (!/\.(js|html)$/.test(name)) continue;
  const path = join(dir, name);
  const before = readFileSync(path, 'utf8');
  let after = before.replace(/(\.(?:js|mjs|css)\?v=)[\w.-]+/g, `$1${next}`);
  if (name === 'config.js') after = after.replace(/export const VERSION = '[^']+'/, `export const VERSION = '${next}'`);
  if (after !== before) { writeFileSync(path, after); changed++; }
}
console.log(`${basename(dir)} version ${current} → ${next} (${changed} files updated)`);
