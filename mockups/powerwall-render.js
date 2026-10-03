const fmt = v => v >= 1000 ? (v / 1000).toFixed(1) + ' kW' : Math.round(v) + ' W';
const { solar, imp, exp, tesla, kia } = s;
const home = Math.max(0, solar + imp - exp - tesla - kia);
const load = home + tesla + kia;
const selfPct = load > 0 ? Math.round(Math.min(1, solar / load) * 100) : (solar > 0 ? 100 : 0);
const day = solar > 0;
const C = { solar: '#ffb020', grid: '#a67cff', exp: '#c9a6ff', home: '#4c8dff', ev: '#30d158', kia: '#2bd4c0', mute: '#8e999c' };
const P = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const pt = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
const dur = w => Math.max(0.45, 2.4 - (w / 1000) * 0.45).toFixed(2) + 's';

/* house geometry: front gable A-B-Cc-D-E, side wall E-D-F-G, roof plane Cc-H-F-D */
const A = [112, 192], B = [112, 128], Cc = [152, 98], D = [192, 128], E = [192, 192], F = [268, 114], G = [268, 178], H = [228, 84];
const roof = (u, v) => P(P(Cc, H, u), P(D, F, u), v);
const side = (u, v) => P(P(E, G, u), P(D, F, u), v);

let panels = '';
for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
  const u0 = 0.1 + i * 0.2 + 0.015, u1 = 0.1 + (i + 1) * 0.2 - 0.015;
  const v0 = 0.14 + j * 0.36 + 0.03, v1 = 0.14 + (j + 1) * 0.36 - 0.03;
  panels += `<polygon points="${pt(roof(u0, v0))} ${pt(roof(u1, v0))} ${pt(roof(u1, v1))} ${pt(roof(u0, v1))}"
    fill="${day ? '#2c4268' : '#192131'}" stroke="${day ? C.solar : '#344055'}" stroke-width="0.7" ${day ? 'class="pw-glow"' : ''}/>`;
}

const garage = [side(0.38, 0), side(0.38, 0.62), side(0.86, 0.62), side(0.86, 0)];
let slats = '';
for (let k = 1; k < 5; k++) slats += `<line x1="${side(0.38, k * 0.124)[0]}" y1="${side(0.38, k * 0.124)[1]}" x2="${side(0.86, k * 0.124)[0]}" y2="${side(0.86, k * 0.124)[1]}" stroke="#0e1418" stroke-width="0.6"/>`;

const lit = home > 0;
const car = (x, y, body, on, col) => `
  ${on ? `<ellipse cx="${x + 22}" cy="${y + 16}" rx="26" ry="4" fill="${col}" class="pw-pulse"/>` : ''}
  <path d="M${x} ${y + 12} C${x + 1} ${y + 7} ${x + 6} ${y + 6} ${x + 12} ${y + 5} L${x + 17} ${y + 1} C${x + 21} ${y - 1} ${x + 31} ${y - 1} ${x + 34} ${y + 1} L${x + 39} ${y + 5} C${x + 43} ${y + 6} ${x + 44} ${y + 8} ${x + 44} ${y + 11} L${x + 44} ${y + 13} L${x} ${y + 13} Z" fill="${body}"/>
  <path d="M${x + 18} ${y + 2} L${x + 33} ${y + 2} L${x + 37} ${y + 5.5} L${x + 14} ${y + 5.5} Z" fill="#1d2a30"/>
  <circle cx="${x + 10}" cy="${y + 13}" r="3.4" fill="#0c0f11"/><circle cx="${x + 35}" cy="${y + 13}" r="3.4" fill="#0c0f11"/>
  ${on ? `<path d="M${x + 22} ${y - 9} l-3 6 h3 l-2 5 l5 -7 h-3 l2 -4 z" fill="${col}"/>` : ''}`;

const flow = (d, col, w, rev) => w > 0
  ? `<path d="${d}" fill="none" stroke="${col}" stroke-width="1.6" stroke-linecap="round" class="pw-flow${rev ? ' pw-rev' : ''}" style="animation-duration:${dur(w)}"/>`
  : `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1.4"/>`;

const roofMid = roof(0.5, 0.5);
const gridCol = exp > 0 ? C.exp : C.grid;
const label = (x, y, anchor, cap, val, col, sub, subCol) => `
  <text x="${x}" y="${y}" text-anchor="${anchor}" font-size="9.5" font-weight="700" letter-spacing="1.2" fill="${C.mute}">${cap}</text>
  <text x="${x}" y="${y + 20}" text-anchor="${anchor}" font-size="19" font-weight="700" fill="#ffffff">${val}</text>
  ${sub ? `<text x="${x}" y="${y + 34}" text-anchor="${anchor}" font-size="10" font-weight="600" fill="${subCol || col}">${sub}</text>` : ''}`;

const stars = day ? '' : [[60, 96], [96, 70], [250, 40], [286, 96], [200, 22], [128, 30], [304, 140]]
  .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 0.8 : 1.2}" fill="#fff" opacity="${0.35 + (i % 3) * 0.15}"/>`).join('');

const evSub = tesla > 0 && kia > 0 ? 'Both charging' : tesla > 0 ? 'Tesla charging' : kia > 0 ? 'Kia charging' : 'Not charging';
const chipTxt = day ? `${selfPct}% solar` : (imp > 0 ? 'On grid' : 'Idle');
const chipCol = day ? C.solar : C.grid;

return `
<svg viewBox="0 0 320 258" width="100%" style="display:block" xmlns="http://www.w3.org/2000/svg" font-family="inherit">
  <defs>
    <radialGradient id="pwsky" cx="${day ? '20%' : '80%'}" cy="0%" r="90%">
      <stop offset="0" stop-color="${day ? 'rgba(255,176,32,0.22)' : 'rgba(80,110,200,0.18)'}"/>
      <stop offset="1" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <linearGradient id="pwwall" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e9edef"/><stop offset="1" stop-color="#b9c2c6"/></linearGradient>
    <linearGradient id="pwside" x1="0" x2="1"><stop offset="0" stop-color="#9aa5aa"/><stop offset="1" stop-color="#7d888d"/></linearGradient>
  </defs>
  <rect width="320" height="258" fill="url(#pwsky)"/>
  ${stars}
  ${day ? '' : '<path d="M222 30 a9 9 0 1 0 7 13 a7 7 0 1 1 -7 -13z" fill="#cfd8ff" opacity="0.8"/>'}

  <rect x="${160 - 34}" y="6" width="68" height="18" rx="9" fill="${chipCol}" fill-opacity="0.16"/>
  <text x="160" y="18.5" text-anchor="middle" font-size="10" font-weight="700" fill="${chipCol}">${chipTxt}</text>

  <ellipse cx="190" cy="206" rx="118" ry="13" fill="#ffffff" fill-opacity="0.035"/>

  <g stroke="#5f6b72" stroke-width="1.3" fill="none" stroke-linecap="round">
    <path d="M43 118 L32 196 M43 118 L54 196 M36 134 L50 134 M30 148 L56 148 M34 166 L52 166 M33 148 L50 166 M53 148 L36 166"/>
  </g>
  <circle cx="30" cy="148" r="1.6" fill="${gridCol}"/><circle cx="56" cy="148" r="1.6" fill="${gridCol}"/>

  ${flow(`M56 150 C80 150 92 168 112 168`, gridCol, imp || exp, exp > 0)}
  ${flow(`M104 44 C140 44 170 60 ${pt(roofMid)}`, C.solar, solar, false)}
  ${flow(`M240 130 C262 112 270 84 262 58`, C.home, home, false)}

  <polygon points="${pt(E)} ${pt(D)} ${pt(F)} ${pt(G)}" fill="url(#pwside)"/>
  <polygon points="${garage.map(pt).join(' ')}" fill="#2a3338"/>${slats}
  <polygon points="${pt(A)} ${pt(B)} ${pt(Cc)} ${pt(D)} ${pt(E)}" fill="url(#pwwall)"/>
  <polygon points="${pt(Cc)} ${pt(H)} ${pt(F)} ${pt(D)}" fill="#3a4247"/>
  ${panels}
  <polyline points="${pt([106, 131])} ${pt(Cc)} ${pt([198, 131])}" fill="none" stroke="#2b3236" stroke-width="3" stroke-linejoin="round"/>
  <rect x="128" y="142" width="22" height="18" rx="1.5" fill="${lit ? '#ffd27a' : '#2a3338'}" ${lit ? 'class="pw-window"' : ''}/>
  <rect x="158" y="150" width="16" height="42" rx="1.5" fill="#4a5459"/>
  <line x1="139" y1="142" x2="139" y2="160" stroke="#b9c2c6" stroke-width="1"/>

  ${car(204, 196, '#e6eaec', tesla > 0, C.ev)}
  ${car(118, 200, '#7d8a90', kia > 0, C.kia)}

  ${label(14, 30, 'start', 'SOLAR', fmt(solar), C.solar, day ? 'Generating' : 'Night', day ? C.solar : C.mute)}
  ${label(306, 30, 'end', 'HOME', fmt(home), C.home, lit ? 'Using' : 'Idle')}
  ${label(14, 222, 'start', 'GRID', fmt(exp || imp), gridCol, exp > 0 ? 'Exporting' : imp > 0 ? 'Importing' : 'Idle', exp || imp ? gridCol : C.mute)}
  ${label(306, 222, 'end', 'VEHICLES', fmt(tesla + kia), C.ev, evSub, tesla || kia ? C.ev : C.mute)}
</svg>`;
