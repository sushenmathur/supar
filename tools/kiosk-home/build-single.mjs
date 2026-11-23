#!/usr/bin/env node
// Builds homeassistant/www/kiosk-home/ into ONE self-contained file, homeassistant/www/kiosk-home.html,
// for installs where only single files can be uploaded (e.g. the HA File editor add-on).
// Scripts are bundled with esbuild, the stylesheet and Hind fonts are inlined as data URIs.
//
//   node tools/kiosk-home/build-single.mjs        (needs network once for `npx esbuild`)
import { readFileSync, writeFileSync, mkdtempSync, readdirSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const repo = resolve(new URL('../../', import.meta.url).pathname);
const src = join(repo, 'homeassistant/www/kiosk-home');
const out = join(repo, 'homeassistant/www/kiosk-home.html');

// Copy the modules to a temp dir with the ?v= cache-busting queries removed, so esbuild can resolve them.
const tmp = mkdtempSync(join(tmpdir(), 'kiosk-home-'));
mkdirSync(join(tmp, 'vendor'));
for (const name of readdirSync(src).filter((n) => n.endsWith('.js'))) {
  writeFileSync(join(tmp, name), readFileSync(join(src, name), 'utf8').replace(/(\.m?js)\?v=[\w.-]+/g, '$1'));
}
copyFileSync(join(src, 'vendor/haws.mjs'), join(tmp, 'vendor/haws.mjs'));
execFileSync('npx', ['--yes', 'esbuild@0.24.2', join(tmp, 'app.js'), '--bundle', '--format=esm', '--minify', '--legal-comments=none', `--outfile=${join(tmp, 'bundle.js')}`], { stdio: 'inherit' });
const js = readFileSync(join(tmp, 'bundle.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
rmSync(tmp, { recursive: true, force: true });

const css = readFileSync(join(src, 'styles.css'), 'utf8').replace(/url\("fonts\/([\w.-]+\.woff2)"\)/g, (_, f) =>
  `url("data:font/woff2;base64,${readFileSync(join(src, 'fonts', f)).toString('base64')}")`);

let html = readFileSync(join(src, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="styles\.css\?v=[\w.-]+">/, () => `<style>\n${css}\n</style>`);
html = html.replace(/<script type="module" src="app\.js\?v=[\w.-]+"[\s\S]*?><\/script>/, () => `<script type="module">\n${js}\n</script>`);
if (/src="app\.js|href="styles\.css/.test(html)) throw new Error('index.html structure changed; update build-single.mjs');
html = html.replace('<head>', '<head>\n<!-- Built from homeassistant/www/kiosk-home/ by tools/kiosk-home/build-single.mjs. Do not edit; rebuild. -->');
writeFileSync(out, html);
console.log(`wrote ${out} (${Math.round(html.length / 1024)} KB)`);
