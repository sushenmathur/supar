/* Shared kit for the redesign mock-ups: icon sprite, stage scaling, toggles, day/night switch, clock, camera art.
   Icons are Lucide-style 24px stroke paths (inline, no network). */
(function () {
  const P = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    rooms: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h9M12 3v18M12 16h9"/>',
    bulb: '<path d="M9 18h6M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
    therm: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    shieldok: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-14.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    cloudmoon: '<path d="M10.19 4.5a5 5 0 0 0 6.31 6.31 5 5 0 0 1-6.31-6.31Z"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>',
    mega: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
    wifi: '<path d="M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.86a10 10 0 0 1 14 0M8.5 16.43a5 5 0 0 1 7 0"/>',
    robot: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3"/>',
    sofa: '<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/><path d="M4 18v2M20 18v2"/>',
    kids: '<circle cx="12" cy="13" r="8"/><circle cx="6" cy="5" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M9.5 15.5s1 1.2 2.5 1.2 2.5-1.2 2.5-1.2M9.5 11h.01M14.5 11h.01"/>',
    garage: '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12M6 14h12"/><path d="M6 22V10h12v12"/>',
    tree: '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>',
    washer: '<rect width="18" height="20" x="3" y="2" rx="2"/><path d="M3 6h18"/><circle cx="12" cy="14" r="5"/><path d="M7 4h.01M10 4h.01"/>',
    media: '<rect width="20" height="15" x="2" y="7" rx="2"/><path d="m17 2-5 5-5-5"/>',
    tv: '<rect width="20" height="14" x="2" y="4" rx="2"/><path d="M8 21h8M12 18v3"/>',
    snow: '<path d="M2 12h20M12 2v20m-8-6 4-4-4-4m16 8-4-4 4-4M10 4l2 2 2-2m-4 16 2-2 2 2"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    unlock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    door: '<path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3m8 0h9"/><path d="M10 12v.01"/><path d="M13 4.56v16.157a.6.6 0 0 1-.763.578l-5.358-1.53A2 2 0 0 1 5 17.84V5.766a2 2 0 0 1 1.205-1.835l4.088-1.752A1.9 1.9 0 0 1 13 4.56z"/>',
    video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    pendant: '<path d="M12 2v5M6 7h12l4 9H2l4-9Z"/><path d="M9.17 16a3 3 0 1 0 5.66 0"/>',
    ceiling: '<path d="M2 8h20"/><path d="M6 8a6 6 0 0 0 12 0"/><path d="M12 18v2M7 17l-1 1.5M17 17l1 1.5"/>',
    lamp: '<path d="M8 2h8l4 10H4z"/><path d="M12 12v6M8 22v-2c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2z"/>',
    dining: '<path d="M12 2v4M5 10h14l-2-4H7z"/><path d="M8 14a4 4 0 0 0 8 0"/>',
    power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.79 0"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    solar: '<rect x="3" y="9" width="18" height="10" rx="1"/><path d="M3 14h18M9 9v10M15 9v10M12 2v3M5.6 4.6l1.4 1.4M18.4 4.6 17 6"/>',
    grid: '<path d="M12 2 4 22M12 2l8 20M6 14h12M8 9h8M12 2v20"/>',
    battery: '<rect width="16" height="10" x="2" y="7" rx="2"/><path d="M22 11v2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
    check: '<path d="M20 6 9 17l-5-5"/>'
  };
  const sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">' +
    Object.entries(P).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`).join('') + '</svg>';

  window.ic = (n, s = 24, cls = '') => `<svg class="ic ${cls}" width="${s}" height="${s}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

  /* Stylised night-time porch frame used as the camera stand-in (no live feed in a mock-up). */
  let camN = 0;
  window.camArt = (tone = 'night') => {
    const warm = tone === 'night', u = 'c' + (++camN);
    return `<svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id="${u}glow" cx="62%" cy="10%" r="60%"><stop offset="0" stop-color="${warm ? '#ffd9a0' : '#fff6e6'}" stop-opacity=".85"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
        <linearGradient id="${u}wall" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${warm ? '#2a2f3a' : '#9aa3ad'}"/><stop offset="1" stop-color="${warm ? '#14171d' : '#6b737c'}"/></linearGradient>
        <linearGradient id="${u}path" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${warm ? '#3b3a38' : '#b9b3a6'}"/><stop offset="1" stop-color="${warm ? '#1d1c1b' : '#8d877b'}"/></linearGradient>
      </defs>
      <rect width="640" height="400" fill="url(#${u}wall)"/>
      <polygon points="0,400 230,250 470,250 640,400" fill="url(#${u}path)"/>
      <rect x="20" y="40" width="190" height="300" rx="6" fill="${warm ? '#4a2c1c' : '#7a4a2e'}"/>
      <rect x="34" y="54" width="162" height="272" rx="4" fill="${warm ? '#1b1f26' : '#3d4550'}" opacity=".9"/>
      <g stroke="${warm ? '#2b313b' : '#56606b'}" stroke-width="2">${Array.from({ length: 13 }, (_, i) => `<line x1="34" x2="196" y1="${70 + i * 20}" y2="${70 + i * 20}"/>`).join('')}</g>
      <rect x="420" y="30" width="160" height="230" fill="${warm ? '#3a3f48' : '#c5c8cc'}"/>
      <g fill="${warm ? '#4a505a' : '#d8dbde'}">${Array.from({ length: 8 }, (_, r) => Array.from({ length: 4 }, (_, c) => `<rect x="${424 + c * 40 + (r % 2) * 20}" y="${34 + r * 28}" width="36" height="24" rx="2"/>`).join('')).join('')}</g>
      <rect x="250" y="190" width="70" height="60" rx="30" fill="${warm ? '#2e4a2a' : '#4f7a46'}"/>
      <circle cx="400" cy="20" r="7" fill="#ffe7b8"/>
      <rect width="640" height="400" fill="url(#${u}glow)"/>
    </svg>`;
  };

  function fit() {
    const st = document.getElementById('stage');
    if (!st) return;
    const s = Math.min(innerWidth / 1600, innerHeight / 1000);
    st.style.transform = `translate(-50%,-50%) scale(${s})`;
  }

  function clock() {
    const d = new Date(2026, 10, 6, 21, 34);
    document.querySelectorAll('[data-time]').forEach(el => {
      const h = d.getHours() % 12 || 12, m = String(d.getMinutes()).padStart(2, '0');
      el.innerHTML = el.dataset.time === 'split' ? `${h}<span class="colon">:</span>${m}` : `${h}:${m}`;
    });
  }

  function setMode(m) {
    document.documentElement.dataset.mode = m;
    document.querySelectorAll('[data-setmode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.setmode === m));
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('afterbegin', sprite);
    document.querySelectorAll('[data-i]').forEach(el => { el.innerHTML = ic(el.dataset.i, +(el.dataset.s || 24)) + el.innerHTML; });
    document.querySelectorAll('[data-cam]').forEach(el => { el.insertAdjacentHTML('afterbegin', camArt(el.dataset.cam || 'night')); });
    document.querySelectorAll('[data-tog]').forEach(el => {
      el.setAttribute('role', 'button'); el.tabIndex = 0;
      el.setAttribute('aria-pressed', el.classList.contains('on'));
      const go = () => {
        const on = el.classList.toggle('on');
        el.setAttribute('aria-pressed', on);
        const s = el.querySelector('[data-st]');
        if (s) s.textContent = on ? (s.dataset.on || 'On') : (s.dataset.off || 'Off');
        document.dispatchEvent(new CustomEvent('tog'));
      };
      el.addEventListener('click', go);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    document.querySelectorAll('[data-setmode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.setmode)));
    const q = new URLSearchParams(location.search);
    setMode(q.get('mode') || 'day');
    if (q.has('shot')) document.documentElement.classList.add('shot');
    clock(); fit();
  });
  addEventListener('resize', fit);
})();
