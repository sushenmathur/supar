// Bake the DOM that kit JS generates (icon sprite + icons, camera art, clock) into each option file, in place.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  for (const f of fs.readdirSync(__dirname).filter(f => /^option-.*\.html$/.test(f))) {
    const file = path.join(__dirname, f);
    await p.goto('file://' + file, { waitUntil: 'load' });
    const html = await p.evaluate(() => {
      const d = document.documentElement;
      d.setAttribute('data-baked', ''); d.removeAttribute('data-mode'); d.classList.remove('shot');
      if (!d.className) d.removeAttribute('class');
      document.getElementById('stage').removeAttribute('style');
      document.querySelectorAll('[aria-pressed]').forEach(e => e.removeAttribute('aria-pressed'));
      return '<!doctype html>\n' + d.outerHTML;
    });
    fs.writeFileSync(file, html);
    console.log('baked:', f, Math.round(html.length / 1024) + ' KB');
  }
  await b.close();
})();
