import { chromium } from '/tmp/claude-0/-home-user-supar/c3967fd4-802f-5f58-9549-01e6af9f615b/scratchpad/pw/node_modules/playwright-core/index.mjs';
import path from 'path'; import fs from 'fs'; import url from 'url';
const here=path.dirname(url.fileURLToPath(import.meta.url));
const exe=fs.readdirSync('/opt/pw-browsers').filter(d=>d.startsWith('chromium-'))[0];
const b=await chromium.launch({executablePath:`/opt/pw-browsers/${exe}/chrome-linux/chrome`,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1500,height:900},deviceScaleFactor:1.2});
await p.goto(`file://${here}/greeting-header-options.html`); await p.waitForTimeout(400);
for (const id of ['A','B']) await p.locator('#'+id).screenshot({path:path.join(here,`previews/header-option-${id}.png`)});
await b.close();
