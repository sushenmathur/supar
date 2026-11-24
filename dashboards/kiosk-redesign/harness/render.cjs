// Render kiosk-home with simulated Home Assistant data, optionally with a theme override.
// Usage: NODE_PATH=$(npm root -g) node render.cjs [theme ...]     (theme = file name in ../themes without .css, or "current")
// Writes ../previews/<theme>-light.png and -dark.png (1280x800), and ../snapshots/<theme>.html (static, script-free).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const HERE = __dirname, ROOT = path.resolve(HERE, '..');
const PAGE = fs.readFileSync(path.join(HERE, 'kiosk-home.current.html'), 'utf8');
const FAKE = fs.readFileSync(path.join(HERE, 'fake-ha.js'), 'utf8');
const NOW = new Date('2026-11-24T16:32:00+10:00'); // Tuesday afternoon, Brisbane

const avatar = (letter, a, b) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="120" height="120" fill="url(#g)"/><text x="60" y="78" font-family="Arial,sans-serif" font-size="54" font-weight="700" fill="#fff" text-anchor="middle">${letter}</text></svg>`;
const porch = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa3ad"/><stop offset="1" stop-color="#6b737c"/></linearGradient><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9c2b4"/><stop offset="1" stop-color="#8d877b"/></linearGradient><radialGradient id="s" cx="70%" cy="0%" r="70%"><stop offset="0" stop-color="#fff6e0" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="640" height="400" fill="url(#w)"/><polygon points="0,400 230,250 470,250 640,400" fill="url(#p)"/><rect x="20" y="40" width="190" height="300" rx="6" fill="#7a4a2e"/><rect x="34" y="54" width="162" height="272" rx="4" fill="#3d4550"/>${Array.from({ length: 13 }, (_, i) => `<line x1="34" x2="196" y1="${70 + i * 20}" y2="${70 + i * 20}" stroke="#56606b" stroke-width="2"/>`).join('')}<rect x="420" y="30" width="160" height="230" fill="#c5c8cc"/>${Array.from({ length: 8 }, (_, r) => Array.from({ length: 4 }, (_, c) => `<rect x="${424 + c * 40 + (r % 2) * 20}" y="${34 + r * 28}" width="36" height="24" rx="2" fill="#d8dbde"/>`).join('')).join('')}<rect x="250" y="190" width="70" height="60" rx="30" fill="#4f7a46"/><rect width="640" height="400" fill="url(#s)"/></svg>`;
const car = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#e8ecf2"/><path d="M80 330c0-30 20-50 50-58l60-60c14-14 30-20 50-20h80c22 0 40 8 54 24l46 52c30 6 52 28 52 56v36H80z" fill="${body}"/><circle cx="160" cy="368" r="38" fill="#222"/><circle cx="360" cy="368" r="38" fill="#222"/><path d="M215 220h70v52h-110zM305 220h40l40 52h-80z" fill="#cfe3f5"/></svg>`;
const IMG = (url) => {
  if (url.includes('person-sushen')) return avatar('S', '#f59e0b', '#ef4444');
  if (url.includes('person-paro')) return avatar('P', '#8b5cf6', '#ec4899');
  if (url.includes('camera')) return porch;
  if (url.includes('b0801eee')) return car('#5b6470');
  if (url.includes('cdd510be')) return car('#e9eef5');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#ccd"/></svg>`;
};

function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      if (req.url.startsWith('/api/')) { rsp.writeHead(200, { 'content-type': 'image/svg+xml' }); return rsp.end(IMG(req.url)); }
      const theme = new URL(req.url, 'http://x').searchParams.get('theme');
      let html = PAGE;
      if (theme && theme !== 'current') {
        const css = fs.readFileSync(path.join(ROOT, 'themes', `${theme}.css`), 'utf8');
        html = html.replace('</head>', `<style id="theme-override">\n${css}\n</style>\n</head>`);
      }
      rsp.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); rsp.end(html);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

(async () => {
  const themes = process.argv.slice(2).length ? process.argv.slice(2) : ['current', ...fs.readdirSync(path.join(ROOT, 'themes')).filter((f) => f.endsWith('.css')).map((f) => f.slice(0, -4))];
  const srv = await serve(); const port = srv.address().port;
  const b = await chromium.launch();
  fs.mkdirSync(path.join(ROOT, 'snapshots'), { recursive: true });
  for (const theme of themes) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: scheme, timezoneId: 'Australia/Brisbane', locale: 'en-AU' });
      const p = await ctx.newPage();
      const logs = [];
      p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.text()); });
      p.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
      await p.clock.setFixedTime(NOW);
      await p.addInitScript(FAKE);
      await p.goto(`http://127.0.0.1:${port}/?theme=${theme}`, { waitUntil: 'networkidle' });
      await p.waitForFunction(() => document.querySelector('#message')?.hidden === true, null, { timeout: 8000 }).catch(() => logs.push('page did not finish loading'));
      await p.waitForTimeout(600);
      await p.screenshot({ path: path.join(ROOT, 'previews', `${theme}-${scheme}.png`) });
      if (scheme === 'light') {
        // Static snapshot: rendered DOM with images inlined and scripts removed, so it opens anywhere.
        const html = await p.evaluate(async () => {
          for (const img of document.querySelectorAll('img[src]')) {
            try { const r = await fetch(img.src); const t = await r.text(); img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(t))); } catch {}
          }
          document.querySelectorAll('script').forEach((s) => s.remove());
          const st = document.getElementById('stage'); if (st) { st.style.left = ''; st.style.top = ''; st.style.removeProperty('--fit'); }
          return '<!doctype html>\n' + document.documentElement.outerHTML;
        });
        const fit = `<script>(()=>{const s=document.getElementById('stage');const f=()=>{s.style.setProperty('--fit',Math.min(innerWidth/1280,innerHeight/800));s.style.left=innerWidth/2+'px';s.style.top=innerHeight/2+'px'};addEventListener('resize',f);f()})()</script>`;
        // CSS-only fallback scale for viewers that block scripts (steps of 5%).
        const steps = Array.from({ length: 15 }, (_, i) => 1 - i * 0.05).map((s) => `@media (max-width:${Math.round(1280 * s)}px),(max-height:${Math.round(800 * s)}px){.stage{--fit:${(s - 0.05).toFixed(2)}}}`).join('\n');
        fs.writeFileSync(path.join(ROOT, 'snapshots', `${theme}.html`), html.replace('</head>', `<style>${steps}</style></head>`).replace('</body>', fit + '</body>'));
      }
      console.log(theme, scheme, logs.length ? logs.join(' | ') : 'ok');
      await ctx.close();
    }
  }
  await b.close(); srv.close();
})();
