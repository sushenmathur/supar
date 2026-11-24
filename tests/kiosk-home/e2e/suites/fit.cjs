const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', PAGE = BASE + (process.env.SINGLE ? '/local/' + (process.env.NAME || 'kiosk-home') + '.html' : '/local/' + (process.env.NAME || 'kiosk-home') + '/index.html');
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  await p.goto(PAGE + '#security'); await p.waitForTimeout(1300);
  const ids = await p.$$eval('#subview .camtile[data-act="cam-live"]', els => els.map(e => e.dataset.arg));
  check('security view has 7 cameras', ids.length === 7, ids.join(','));
  for (const id of ids) {
    await p.locator(`#subview [data-arg="${id}"]`).click();
    const ok = await p.waitForFunction(() => { const box = document.querySelector('#live'); return box && box.style.width && (box.dataset.live || (box.dataset.status || '') !== ''); }, null, { timeout: 15000 }).then(() => true, () => false);
    await p.waitForTimeout(250);
    const m = await p.evaluate(() => {
      const box = document.querySelector('#live'), d = document.querySelector('#sheet');
      const v = box.querySelector('video'), i = box.querySelector('img:not([hidden])');
      const w = v ? v.videoWidth : i ? i.naturalWidth : 0, h = v ? v.videoHeight : i ? i.naturalHeight : 0;
      const r = box.getBoundingClientRect(), s = d.getBoundingClientRect();
      return { live: box.dataset.live || '', status: box.dataset.status || '', media: [w, h], box: [Math.round(r.width), Math.round(r.height)],
        inside: s.left >= 0 && s.top >= 0 && s.right <= innerWidth && s.bottom <= innerHeight };
    });
    const fits = m.media[0] && Math.abs(m.box[0] / m.box[1] - m.media[0] / m.media[1]) < 0.02;
    check(`${id} pop-up framed to its video`, ok && fits && m.inside, JSON.stringify(m));
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  }
  console.log(R.join('\n')); await b.close(); process.exit(R.some(r => r.startsWith('FAIL')) ? 1 : 0);
})();
