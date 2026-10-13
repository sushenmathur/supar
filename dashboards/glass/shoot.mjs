// Renders the glass mockups to previews/*.png (headless Chromium). Usage: node shoot.mjs
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'path'; import fs from 'fs'; import url from 'url';
const here = path.dirname(url.fileURLToPath(import.meta.url));
const exe = fs.readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium-'))[0];
const b = await chromium.launch({ executablePath: `/opt/pw-browsers/${exe}/chrome-linux/chrome`, args: ['--no-sandbox'] });
const shots = [
  ['home', 'light', [], 'home-light'], ['home', 'dark', [], 'home-dark'],
  ['home', 'light', ['#b-alert'], 'home-light-alert'], ['home', 'dark', ['#b-pop'], 'home-dark-popup'],
  ['home', 'dark', ['[data-toggle="lite"]'], 'home-dark-lite'], ['home', 'light', ['[data-toggle="nofilter"]'], 'home-light-nofilter'],
  ['views', 'light', [], 'views-light'], ['views', 'dark', [], 'views-dark'],
  ['reference-card', 'light', [], 'reference-card'],
];
for (const [page, theme, clicks, out] of shots) {
  const ctx = await b.newContext({ viewport: { width: page === 'home' ? 1600 : 1500, height: page === 'home' ? 1090 : 1200 }, colorScheme: theme });
  const p = await ctx.newPage();
  await p.goto(`file://${here}/${page}.html`);
  for (const c of clicks) await p.click(c);
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(here, 'previews', out + '.png'), fullPage: page !== 'home' });
  await ctx.close();
}
await b.close();
