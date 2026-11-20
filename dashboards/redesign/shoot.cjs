// Render each redesign option (day + night) to previews/*.png at 1600x1000.
// Usage: node shoot.cjs [file-filter]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const dir = __dirname, only = process.argv[2] || '';
  const files = fs.readdirSync(dir).filter(f => f.startsWith('option-') && f.endsWith('.html') && f.includes(only));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  for (const f of files) for (const m of ['day', 'night']) {
    await p.goto(`file://${dir}/${f}?shot&mode=${m}`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${dir}/previews/${f.replace('.html', '')}-${m}.png` });
  }
  await b.close();
})();
