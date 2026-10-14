import { chromium } from '/tmp/claude-0/-home-user-supar/c3967fd4-802f-5f58-9549-01e6af9f615b/scratchpad/pw/node_modules/playwright-core/index.mjs';
import path from 'path'; import fs from 'fs'; import url from 'url';
const here=path.dirname(url.fileURLToPath(import.meta.url));
const exe=fs.readdirSync('/opt/pw-browsers').filter(d=>d.startsWith('chromium-'))[0];
const b=await chromium.launch({executablePath:`/opt/pw-browsers/${exe}/chrome-linux/chrome`,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1540,height:500},deviceScaleFactor:1.5});
await p.goto(`file://${here}/glass-subtle-preview.html`); await p.waitForTimeout(700);
await p.screenshot({path:path.join(here,'previews/glass-subtle-preview.png'),fullPage:true}); await b.close();
