// Shared behaviour for the Home dashboard option mock-ups (static, sample data).
// - Scales the 1280×800 stage to fit the window.
// - Theme: follows the system, with a manual Light/Dark/Auto override (key T or the theme button).
// - Clocks tick in Brisbane, India and Austin time.
// - [data-toggle] elements toggle .on; [data-confirm] buttons need a second tap within 3 s.
// - [data-light] elements feed the "lights on" counters ([data-lights-on]).
// - Elements with [data-swap] replay a swap animation when their text changes.

const ICONS = {
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 9.5V20h5v-5h4v5h5V9.5"/>',
  rooms: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h9M12 3v18M16 12v4"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
  shield: '<path d="m12 3 8 3.5V12c0 4.6-3.3 8.3-8 9-4.7-.7-8-4.4-8-9V6.5z"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  megaphone: '<path d="M3 10v4h3l7 4V6L6 10z"/><path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a7.5 7.5 0 0 1 0 11"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r=".9"/>',
  robot: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v3"/>',
  sofa: '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2z"/><path d="M5 18v2M19 18v2"/>',
  kids: '<circle cx="8" cy="7" r="2.5"/><circle cx="16" cy="9" r="2"/><path d="M4 20v-4a4 4 0 0 1 8 0v4M13 20v-3a3 3 0 0 1 6 0v3"/>',
  garage: '<path d="M3 9.5 12 4l9 5.5V20H3z"/><path d="M7 20v-8h10v8M7 14.5h10M7 17h10"/>',
  tree: '<path d="M12 21v-5"/><path d="M12 3c-3.5 0-6 3-6 6.5 0 3 2.5 5.5 6 5.5s6-2.5 6-5.5C18 6 15.5 3 12 3z"/>',
  washer: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><circle cx="12" cy="13" r="4.5"/><path d="M7.5 6h1M11 6h1"/>',
  tv: '<rect x="2.5" y="4.5" width="19" height="13" rx="2"/><path d="M8 21h8"/>',
  snow: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>',
  pendant: '<path d="M12 2v6"/><path d="M6 14a6 6 0 0 1 12 0z"/><path d="M10.5 17a1.5 1.5 0 0 0 3 0"/>',
  lamp: '<path d="M8 3h8l3 8H5z"/><path d="M12 11v9M8 21h8"/>',
  downlight: '<path d="M5 6h14"/><path d="M7 6a5 5 0 0 0 10 0"/><path d="M9 15l-1 2M15 15l1 2M12 15.5V18"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  car: '<path d="M5 16V12l2-5h10l2 5v4"/><path d="M3 16h18v2H3z"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/><path d="M5 12h14"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',
  door: '<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17"/><path d="M3 21h18"/><circle cx="15" cy="12" r=".9"/>',
  bin: '<path d="M4 6h16M9 6V4h6v2"/><path d="M6 6l1 15h10l1-15"/><path d="M10 10v7M14 10v7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  cloudsun: '<path d="M8 3v1.5M3.5 7.5H2M4.6 4.1l1 1M12.4 4.1l-1 1"/><path d="M5 11a4 4 0 0 1 7.6-1.7"/><path d="M8 20h10a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 9 12.5 3.8 3.8 0 0 0 8 20z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  tower: '<path d="M12 2 7 22M12 2l5 20M8.5 15h7M9.8 9.5h4.4M5 6h14"/>',
  dryer: '<rect x="4" y="2.5" width="16" height="19" rx="2"/><circle cx="12" cy="13" r="4.5"/><path d="M10 12c1-1 3 1 4 0"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  plug: '<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0z"/><path d="M12 17v5"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>',
};

function injectIcons() {
  const defs = Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${defs}</svg>`);
}

// ---- Stage scaling ----
function fit() {
  const stage = document.querySelector('.stage');
  if (!stage) return;
  const s = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
  stage.style.setProperty('--fit', String(s));
}

// ---- Theme ----
const THEMES = ['auto', 'light', 'dark'];
function setTheme(t) {
  const root = document.documentElement;
  if (t === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
  try { localStorage.setItem('home-2026-theme', t); } catch {}
  document.querySelectorAll('[data-theme-label]').forEach((n) => { n.textContent = t === 'auto' ? 'Auto' : t[0].toUpperCase() + t.slice(1); });
}
function cycleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'auto';
  setTheme(THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]);
}

// ---- Clocks (Brisbane, India, Austin) ----
function clocks() {
  const now = new Date();
  const fmt = (tz, o) => now.toLocaleString('en-AU', { timeZone: tz, ...o });
  const set = (sel, v) => document.querySelectorAll(sel).forEach((n) => { if (n.textContent !== v) { n.textContent = v; swap(n); } });
  const t = fmt('Australia/Brisbane', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?(am|pm)$/i, '');
  set('[data-clock]', t);
  set('[data-ampm]', fmt('Australia/Brisbane', { hour: 'numeric', hour12: true }).replace(/[\d\s]/g, '').toUpperCase());
  set('[data-date]', fmt('Australia/Brisbane', { weekday: 'long', day: 'numeric', month: 'long' }));
  set('[data-date-short]', fmt('Australia/Brisbane', { weekday: 'short', day: 'numeric', month: 'short' }));
  set('[data-india]', fmt('Asia/Kolkata', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', ' '));
  set('[data-austin]', fmt('America/Chicago', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', ' '));
  const h = Number(fmt('Australia/Brisbane', { hour: 'numeric', hourCycle: 'h23' }));
  set('[data-greeting]', h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
}

function swap(n) {
  if (!n.hasAttribute('data-swap')) return;
  n.classList.remove('swapping');
  void n.offsetWidth;
  n.classList.add('swapping');
}

// ---- Lights counter ----
function countLights() {
  const all = document.querySelectorAll('[data-light]');
  const on = [...all].filter((n) => n.classList.contains('on')).length;
  document.querySelectorAll('[data-lights-on]').forEach((n) => { const v = String(on); if (n.textContent !== v) { n.textContent = v; swap(n); } });
  document.querySelectorAll('[data-lights-total]').forEach((n) => { n.textContent = String(all.length); });
}

// ---- Interactions ----
function wire() {
  document.addEventListener('click', (e) => {
    const conf = e.target.closest('[data-confirm]');
    if (conf) {
      e.stopPropagation();
      if (conf.dataset.armed) {
        clearTimeout(Number(conf.dataset.armed));
        delete conf.dataset.armed;
        conf.classList.remove('armed');
        conf.textContent = conf.dataset.done || conf.dataset.label;
        conf.closest('[data-alert]')?.classList.add('resolved');
        return;
      }
      conf.dataset.label = conf.textContent;
      conf.textContent = 'Tap again';
      conf.classList.add('armed');
      conf.dataset.armed = String(setTimeout(() => {
        delete conf.dataset.armed; conf.classList.remove('armed'); conf.textContent = conf.dataset.label;
      }, 3000));
      return;
    }
    const t = e.target.closest('[data-toggle]');
    if (t) {
      t.classList.toggle('on');
      t.setAttribute('aria-pressed', String(t.classList.contains('on')));
      const st = t.querySelector('[data-state]');
      if (st) {
        const [onText, offText] = (t.dataset.toggle || 'On|Off').split('|');
        st.textContent = t.classList.contains('on') ? onText : offText;
        swap(st);
      }
      countLights();
    }
    if (e.target.closest('[data-theme-btn]')) cycleTheme();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 't' || e.key === 'T') cycleTheme(); });
}

injectIcons();
let saved = 'auto';
try { saved = localStorage.getItem('home-2026-theme') || 'auto'; } catch {}
setTheme(saved);
fit();
window.addEventListener('resize', fit);
clocks();
setInterval(clocks, 10_000);
countLights();
wire();
document.querySelectorAll('[data-toggle]').forEach((t) => t.setAttribute('aria-pressed', String(t.classList.contains('on'))));
