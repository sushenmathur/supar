import { chromium } from '/tmp/claude-0/-home-user-supar/c3967fd4-802f-5f58-9549-01e6af9f615b/scratchpad/pw/node_modules/playwright-core/index.mjs';
import path from 'path'; import fs from 'fs'; import url from 'url';
const here=path.dirname(url.fileURLToPath(import.meta.url));
const exe=fs.readdirSync('/opt/pw-browsers').filter(d=>d.startsWith('chromium-'))[0];
const b=await chromium.launch({executablePath:`/opt/pw-browsers/${exe}/chrome-linux/chrome`,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1000,height:900},deviceScaleFactor:1.5});
await p.goto(`file://${here}/kia-chip-options.html`); await p.waitForTimeout(500);
await p.screenshot({path:path.join(here,'previews/kia-chip-options.png'),fullPage:true}); await b.close();
