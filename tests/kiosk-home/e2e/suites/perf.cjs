const { chromium } = require('playwright');
const route = process.argv[2] || 'home';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: process.env.RM || 'no-preference' });
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  // Simulate a mid-range Android tablet.
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Performance.enable');
  await p.addInitScript((css) => { if (!css) return; addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = css; document.head.append(s); }); }, process.env.OFF || '');
  await p.goto('http://localhost:8123/local/' + (process.env.NAME || 'kiosk-home') + '/index.html#' + route); await p.waitForTimeout(2500);
  const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const a = await m();
  // Idle window with one live state change per second (like a busy HA instance).
  for (let i = 0; i < 6; i++) { await fetch(`http://localhost:8123/__state?id=sensor.sh50rs_a21c2106894_mppt_total_power&s=${(2.5 + i / 10).toFixed(2)}`); await p.waitForTimeout(1000); }
  const z = await m();
  const d = (k) => +(z[k] - a[k]).toFixed(3);
  const fps = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(Math.round(n / 2)); }; requestAnimationFrame(f); }));
  console.log(JSON.stringify({ route, layouts: d('LayoutCount'), styleRecalcs: d('RecalcStyleCount'), layoutMs: Math.round(d('LayoutDuration') * 1000), styleMs: Math.round(d('RecalcStyleDuration') * 1000), scriptMs: Math.round(d('ScriptDuration') * 1000), taskMs: Math.round(d('TaskDuration') * 1000), rafFps: fps, nodes: z.Nodes, heapMB: +(z.JSHeapUsedSize / 1048576).toFixed(1) }));
  await b.close();
})();
