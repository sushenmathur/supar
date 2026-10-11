import { chromium } from '/tmp/claude-0/-home-user-supar/c3967fd4-802f-5f58-9549-01e6af9f615b/scratchpad/pw/node_modules/playwright-core/index.mjs';
import path from 'path'; import fs from 'fs'; import url from 'url';
const here = path.dirname(url.fileURLToPath(import.meta.url));
const exe = fs.readdirSync('/opt/pw-browsers').filter(d=>d.startsWith('chromium-'))[0];
const browser = await chromium.launch({ executablePath: `/opt/pw-browsers/${exe}/chrome-linux/chrome`, args:['--no-sandbox'] });
const scenes = ['day','warning','alert','confirm','announce','saver','night'];
fs.mkdirSync(path.join(here,'previews/proto'),{recursive:true});
for (const theme of ['light','dark']) for (const s of scenes) {
  const page = await browser.newPage({ viewport:{width:1600,height:1000}});
  await page.goto(`file://${here}/proto/home.html?scene=${s}&theme=${theme}`);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(here,`previews/proto/${s}-${theme}.png`) });
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  await page.close();
}
await browser.close(); console.log('done');
