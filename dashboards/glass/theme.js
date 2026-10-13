/* Mock-only helper: icon sprite, theme/lite/nofilter/reduce toggles, stage scaling. Not shipped to Home Assistant. */
(() => {
  const P = {
    home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>',
    therm: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    sofa: '<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 13a2 2 0 0 1 4 0v1h10v-1a2 2 0 0 1 4 0v4H3v-4Z"/><path d="M5 17v2M19 17v2"/>',
    garage: '<path d="M3 20V9l9-5 9 5v11"/><path d="M7 20v-7h10v7M7 16.5h10"/>',
    drop: '<path d="M12 3c3.5 4 6 7 6 10a6 6 0 0 1-12 0c0-3 2.5-6 6-10Z"/>',
    bolt: '<path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z"/>',
    car: '<path d="M5 16V12l2-5h10l2 5v4"/><path d="M3 16h18v2H3zM7 12h10"/><circle cx="7.5" cy="16" r=".6"/><circle cx="16.5" cy="16" r=".6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    cloud: '<path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9.5 4.3 4.3 0 0 1 17.5 18H7Z"/>',
    cloudsun: '<path d="M8 18a3.5 3.5 0 0 1-.4-7A5 5 0 0 1 17 10.5a3.7 3.7 0 0 1-.5 7.5H8Z"/><path d="M8 5.5 7 4M4.5 8 3 7M12.5 5l.5-1.8"/>',
    play: '<path d="M8 5.5v13l11-6.5-11-6.5Z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    power: '<path d="M12 3v8"/><path d="M6.5 6.5a8 8 0 1 0 11 0"/>',
    wind: '<path d="M3 9h10a3 3 0 1 0-3-3M3 15h14a3 3 0 1 1-3 3M3 12h7"/>',
    snow: '<path d="M12 3v18M4 7.5l16 9M20 7.5l-16 9"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    cal: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    more: '<circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/>',
    pin: '<path d="M12 21s6-5.5 6-10.5a6 6 0 0 0-12 0C6 15.5 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2"/>',
    door: '<path d="M6 21V4h9l3 2v15M4 21h16"/><circle cx="12.5" cy="12.5" r=".7"/>',
    bot: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    camera: '<rect x="3" y="7" width="18" height="12" rx="3"/><circle cx="12" cy="13" r="3.2"/><path d="M8 7l1.2-2h5.6L16 7"/>',
    tv: '<rect x="3" y="5" width="18" height="12" rx="2.5"/><path d="M9 20h6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    plug: '<path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v5"/>',
    temp: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z"/>'
  };
  const sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">' +
    Object.entries(P).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('') + '</svg>';
  document.body.insertAdjacentHTML('afterbegin', sprite);
  document.querySelectorAll('[data-i]').forEach(el => {
    el.outerHTML = `<svg class="ic ${el.dataset.c || ''}" aria-hidden="true"><use href="#i-${el.dataset.i}"/></svg>`;
  });

  const root = document.documentElement;
  const sys = matchMedia('(prefers-color-scheme: dark)');
  const saved = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const save = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };
  const apply = () => {
    const t = saved('glass-theme') || 'auto';
    root.dataset.theme = t === 'auto' ? (sys.matches ? 'dark' : 'light') : t;
    root.toggleAttribute('data-lite', saved('glass-lite') === '1');
    root.toggleAttribute('data-nofilter', saved('glass-nofilter') === '1');
    root.toggleAttribute('data-reduce', saved('glass-reduce') === '1');
    document.querySelectorAll('[data-toggle]').forEach(b => {
      const k = b.dataset.toggle;
      const on = k.startsWith('theme:') ? (saved('glass-theme') || 'auto') === k.slice(6) : saved('glass-' + k) === '1';
      b.setAttribute('aria-pressed', on);
    });
  };
  sys.addEventListener('change', apply);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-toggle]'); if (!b) return;
    const k = b.dataset.toggle;
    if (k.startsWith('theme:')) save('glass-theme', k.slice(6));
    else save('glass-' + k, saved('glass-' + k) === '1' ? '0' : '1');
    apply();
  });
  apply();

  const stage = document.querySelector('[data-stage]');
  if (stage) {
    const fit = () => {
      const w = parseFloat(stage.dataset.w), h = parseFloat(stage.dataset.h);
      const s = Math.min(innerWidth / w, (innerHeight - (document.querySelector('.bar')?.offsetHeight || 0)) / h);
      stage.style.width = w + 'px'; stage.style.height = h + 'px';
      stage.style.transform = `scale(${s})`;
      stage.parentElement.style.height = h * s + 'px';
    };
    addEventListener('resize', fit); fit();
  }
  document.querySelectorAll('[data-pop]').forEach(b => b.addEventListener('click', () => {
    const t = document.getElementById(b.dataset.pop); if (t) t.hidden = !t.hidden;
  }));
})();
