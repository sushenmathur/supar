// Home Energy HUD: a port of the "Home Energy" Lovelace view (button-card HUD over the house photo) so it shows
// inside the page, without Home Assistant's sidebar and header. Same layout (1600 x 1000 photo coordinates),
// colours, flows and billing maths. Taps open the page's own more-info pop-up instead of button-card hotspots.
// The photo comes from /local/images/ on the same Home Assistant; the fonts are bundled in fonts/.

const BG_DAY = '/local/images/energy-dashboard-bg1.png';
const BG_NIGHT = '/local/images/energy-dashboard-bg-night.png';
const SOLAR_MAX = 5000;          // inverter rating (W) for the solar ring
const BILL_START_DAY = 17;       // AGL billing period: 17th to the 16th
const DAY_MS = 86400000;

const E = {
  solar: 'sensor.sh50rs_a21c2106894_mppt_total_power',
  imp: 'sensor.sh50rs_a21c2106894_purchased_power',
  exp: 'sensor.sh50rs_a21c2106894_total_export_active_power',
  total: 'sensor.home_power_consumption',
  tesla: 'sensor.bluey_charger_power',
  kia: 'sensor.kia_charger_power',
  selfUse: 'sensor.sh50rs_a21c2106894_daily_self_consumption_rate',
  teslaBatt: 'sensor.bluey_battery_level',
  teslaRange: 'sensor.bluey_battery_range',
  kiaBatt: 'input_number.kia_battery_estimate',
  cost: 'sensor.daily_import_cost',
  credit: 'sensor.daily_solar_credit',
  net: 'sensor.daily_energy_net',
  kwhIn: 'sensor.sh50rs_a21c2106894_daily_grid_import',
  kwhOut: 'sensor.solar_export_energy_daily',
  billToDate: 'sensor.electricity_bill_to_date',
  billEst: 'sensor.electricity_estimated_bill',
  billDay: 'sensor.electricity_billing_day',
  billLeft: 'sensor.electricity_days_remaining',
  lastBill: 'input_number.electricity_last_bill',
  rate: 'sensor.current_energy_rate',
  night: 'sensor.dashboard_night_mode',
  weather: 'weather.north_lakes_weather',
  gridDir: 'sensor.grid_direction',
  teslaCost: ['sensor.tesla_grid_charging_cost_today', 'sensor.tesla_grid_charging_cost_daily'],
  kiaCost: ['sensor.kia_grid_charging_cost_today', 'sensor.kia_grid_charging_cost_daily'],
};

const C = { solar: '#FFB547', grid: '#22D3EE', home: '#B388FF', ev: '#4D9FFF', cost: '#FF5C7A', credit: '#4DFFB8', text: '#E6F1FF', muted: '#9DB0CF' };
const battC = (b) => (b > 50 ? C.credit : b > 20 ? C.solar : C.cost);

export const energyHud = {
  ids: Object.values(E).flat(),
  render(c) {
    const st = (e) => c.get(e)?.state;
    const num = (e) => { const v = parseFloat(st(e)); return Number.isNaN(v) ? 0 : v; };
    const watts = (v) => (Math.abs(v) > 0 && Math.abs(v) < 50 ? v * 1000 : v);
    const kw = (w) => (Math.abs(w) >= 1000 ? `${(w / 1000).toFixed(2)} kW` : `${Math.round(w)} W`);
    const usd = (v) => `$${Math.abs(v).toFixed(2)}`;
    const pick = (ids) => ids.find((e) => c.get(e)) || ids[0];

    const solar = watts(num(E.solar));
    const imp = watts(num(E.imp));
    const exp = watts(num(E.exp));
    const total = watts(num(E.total));
    const tesla = watts(num(E.tesla));
    const kia = watts(num(E.kia));
    const home = Math.max(0, total - tesla - kia);
    const selfUse = num(E.selfUse);
    const teslaBatt = Math.round(num(E.teslaBatt));
    const teslaRange = Math.round(num(E.teslaRange));
    const kiaBatt = Math.round(Math.abs(num(E.kiaBatt)));
    const cost = num(E.cost), credit = num(E.credit), net = num(E.net);
    const kwhIn = num(E.kwhIn), kwhOut = num(E.kwhOut);
    const billToDate = num(E.billToDate), billEst = num(E.billEst);
    const billPct = billEst > 0 ? Math.min(100, (billToDate / billEst) * 100) : 0;
    const rate = num(E.rate);
    const rateC = rate < 5 ? rate * 100 : rate;  // $/kWh -> c/kWh
    const night = st(E.night) === 'on';

    // Billing period: from the billing-day sensors when available, else dates on the bill sensors'
    // attributes, else a monthly period starting BILL_START_DAY.
    const now = new Date();
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    const billAttr = { ...(c.get(E.billEst)?.attributes ?? {}), ...(c.get(E.billToDate)?.attributes ?? {}) };
    const attrDate = (...keys) => { for (const k of keys) { const d = billAttr[k] ? new Date(billAttr[k]) : null; if (d && !Number.isNaN(+d)) return d; } return null; };
    const bDay = parseFloat(st(E.billDay)), bLeft = parseFloat(st(E.billLeft));
    let pStart, pEnd;
    if (!Number.isNaN(bDay) && bDay >= 1 && !Number.isNaN(bLeft) && bLeft >= 0) {
      pStart = addDays(today0, -(Math.round(bDay) - 1));
      pEnd = addDays(today0, Math.round(bLeft));
    } else {
      pStart = attrDate('billing_period_start', 'period_start', 'bill_start', 'start_date', 'last_reset');
      pEnd = attrDate('billing_period_end', 'period_end', 'bill_end', 'end_date', 'next_reset');
      if (!pStart) { pStart = new Date(now.getFullYear(), now.getMonth(), BILL_START_DAY); if (pStart > now) pStart.setMonth(pStart.getMonth() - 1); }
      if (!pEnd) { pEnd = new Date(pStart); pEnd.setMonth(pEnd.getMonth() + 1); }
      if (pEnd.getHours() === 0 && pEnd.getMinutes() === 0) pEnd = new Date(pEnd.getTime() - DAY_MS);  // an end at midnight is the next period's start
    }
    const dmy = (d) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }).toUpperCase();
    const periodDays = Math.max(1, Math.round((pEnd - pStart) / DAY_MS) + 1);
    const periodDay = Math.min(periodDays, Math.max(1, Math.floor((now - pStart) / DAY_MS) + 1));
    const lastBill = num(E.lastBill);
    const vsLast = lastBill > 0 ? ((billEst - lastBill) / lastBill) * 100 : null;
    const periodTxt = `${dmy(pStart)} – ${dmy(pEnd)}`;

    const w = c.get(E.weather);
    const temp = w?.attributes?.temperature !== undefined ? `${w.attributes.temperature}°` : '—';
    const cond = w ? w.state.replace('partlycloudy', 'partly cloudy').replace(/-/g, ' ') : '';
    const [hm, ap = ''] = c.fmtTime(now, c.tz()).split(/\s/);  // "2:05" big, "PM" small beside it
    const date = now.toLocaleDateString('en-AU', { timeZone: c.tz(), weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();

    // ---------- drawing helpers ----------
    const BOXES = [];
    // Everything that moves goes on its own transparent layer above the picture, so the tablet repaints only
    // those thin lines each frame, not the photo, the frosted glass and the text.
    const ANIM = [];
    const glass = (x, y, w2, h, col, a = 0.28, dy = 0) => {
      BOXES.push(`<rect x="${x}" y="${y + dy}" width="${w2}" height="${h}" rx="16"/>`);
      return `<rect x="${x}" y="${y}" width="${w2}" height="${h}" rx="16" fill="rgba(6,14,34,.58)" stroke="${col}" stroke-opacity="${a}"/>
        <path d="M${x} ${y + 18} V${y + 8} Q${x} ${y} ${x + 8} ${y} H${x + 18}" fill="none" stroke="${col}" stroke-width="2"/>
        <path d="M${x + w2} ${y + h - 18} V${y + h - 8} Q${x + w2} ${y + h} ${x + w2 - 8} ${y + h} H${x + w2 - 18}" fill="none" stroke="${col}" stroke-width="2"/>`;
    };
    // dy: how far the card is shifted (the Today card sits in a translated group); the animated layer isn't shifted.
    const ring = (cx, cy, r, col, pct, sw = 7, dy = 0) => {
      const L = 2 * Math.PI * r;
      ANIM.push(`<circle cx="${cx}" cy="${cy + dy}" r="${r + 9}" fill="none" stroke="${col}" stroke-opacity=".35" stroke-dasharray="2 6" class="hud-spin" style="animation-delay:__PH24000__"/>`);
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-opacity=".18" stroke-width="${sw}"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"
          stroke-dasharray="${(L * Math.max(0, Math.min(1, pct))).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})" filter="url(#hud-glow)"/>`;
    };
    // o.max: the widest the text may be; a value that would overflow its card is squeezed to fit.
    const t = (x, y, s, col, txt, o = {}) => {
      const est = String(txt).length * s * (o.mono ? 0.62 : 0.52);
      const fit = o.max && est > o.max ? `textLength="${o.max}" lengthAdjust="spacingAndGlyphs"` : '';
      return `<text x="${x}" y="${y}" font-size="${s}" fill="${col}" class="${o.mono ? 'hud-mono' : 'hud-ui'}" ${o.end ? 'text-anchor="end"' : o.mid ? 'text-anchor="middle"' : ''} ${fit} ${o.ls ? `letter-spacing="${o.ls}"` : ''} font-weight="${o.wt || 600}">${c.esc(String(txt))}</text>`;
    };
    const lbl = (x, y, txt, o = {}) => t(x, y, 13, C.muted, txt, { ls: 2.5, ...o });
    const bar = (x, y, w2, pct, col, h = 7) => `<rect x="${x}" y="${y}" width="${w2}" height="${h}" rx="${h / 2}" fill="rgba(157,176,207,.18)"/>
      <rect x="${x}" y="${y}" width="${Math.max(h, (w2 * pct) / 100).toFixed(1)}" height="${h}" rx="${h / 2}" fill="${col}" filter="url(#hud-glow)"/>`;
    // Moving flows: a still, wide soft underlay in the picture plus marching dots on the animated layer.
    const flow = (d, col, pw) => {
      const sw = (2 + Math.min(5, pw / 1000)).toFixed(1);
      ANIM.push(`<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" class="hud-flow" style="animation-delay:__PH1000__"/>`);
      return `<path d="${d}" fill="none" stroke="${col}" stroke-opacity=".22" stroke-width="${+sw + 7}" stroke-linecap="round"/>`;
    };
    // Tap targets: an invisible rectangle over the area, so the whole panel is tappable.
    const tap = (id, x, y, w2, h, label) => `<g class="hot" data-act="info" data-arg="${c.esc(id)}" role="button" tabindex="0" aria-label="${c.esc(label)}"><rect x="${x}" y="${y}" width="${w2}" height="${h}" fill="#000" fill-opacity="0"/>`;

    // ---------- flows (photo coordinates, 1600 x 1000) ----------
    const P_SOLAR_HOME = 'M 720 226 C 720 276, 754 296, 754 340';
    const P_HOME_TESLA = 'M 762 500 C 772 530, 800 552, 830 574';
    const P_HOME_KIA = 'M 892 432 C 985 436, 1100 456, 1150 506';
    const link = (d, col) => {
      const [x1, y1] = d.match(/M ([\d.]+) ([\d.]+)/).slice(1);
      const pts = d.match(/[\d.]+ [\d.]+$/)[0].split(' ');
      return `<path d="${d}" fill="none" stroke="${col}" stroke-opacity=".15" stroke-width="7" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="${col}" stroke-opacity=".85" stroke-width="2.2" stroke-dasharray="6 6"/>
        <circle cx="${x1}" cy="${y1}" r="4.5" fill="#04091A" stroke="${col}" stroke-width="2"/>
        <circle cx="${pts[0]}" cy="${pts[1]}" r="4.5" fill="#04091A" stroke="${col}" stroke-width="2"/>`;
    };
    let flows = '';
    if (solar > 50) flows += link(P_SOLAR_HOME, C.solar) + flow(P_SOLAR_HOME, C.solar, solar - exp);
    if (exp > 50) flows += flow('M 630 300 C 560 292, 450 256, 354 248', C.solar, exp);
    if (imp > 50) flows += flow('M 354 252 C 450 282, 580 384, 640 420', C.grid, imp);
    if (tesla > 50) flows += link(P_HOME_TESLA, C.ev) + flow(P_HOME_TESLA, C.ev, tesla);
    if (kia > 50) flows += link(P_HOME_KIA, C.ev) + flow(P_HOME_KIA, C.ev, kia);

    // ---------- conditions (top right) ----------
    const conditions = `${tap(E.weather, 1252, 44, 316, 150, 'Weather')}
      ${glass(1252, 44, 316, 150, C.grid)}
      ${t(1274, 108, 44, C.text, hm, { mono: 1, wt: 700, max: 150 })}${t(1274 + Math.min(150, hm.length * 44 * 0.6) + 6, 108, 18, C.muted, ap.toUpperCase(), { mono: 1, wt: 700 })}
      ${lbl(1276, 136, date)}
      ${t(1546, 100, 32, C.text, temp, { mono: 1, end: 1, wt: 700 })}
      ${t(1546, 126, 15, C.muted, cond.toUpperCase(), { end: 1, ls: 2, max: 120 })}
      <rect x="1274" y="152" width="272" height="28" rx="14" fill="rgba(255,181,71,.10)" stroke="${C.solar}" stroke-opacity=".5"/>
      ${t(1290, 171, 13, C.muted, 'TARIFF NOW', { ls: 2.5 })}
      ${t(1530, 171, 14, C.solar, `${rateC.toFixed(2)} ¢/kWh`, { mono: 1, end: 1, wt: 700 })}</g>`;

    // ---------- left rail: today ----------
    const netC = net >= 0 ? C.credit : C.cost;
    const inPct = kwhIn + kwhOut > 0 ? (kwhIn / (kwhIn + kwhOut)) * 100 : 50;
    const DY = 124;  // Today and Billing sit below the Grid card
    const today = `<g transform="translate(0 ${DY})">
      ${glass(32, 196, 320, 360, C.grid, 0.28, DY)}
      ${lbl(54, 228, 'TODAY')}${lbl(330, 228, 'SINCE 00:00', { end: 1 })}
      ${tap(E.selfUse, 44, 244, 128, 132, 'Self use')}
        ${ring(108, 312, 50, C.solar, selfUse / 100, 7, DY)}
        ${t(108, 318, 26, C.text, `${selfUse.toFixed(0)}%`, { mono: 1, mid: 1, wt: 700 })}
        ${t(108, 338, 11, C.muted, 'SELF USE', { mid: 1, ls: 2 })}</g>
      ${tap(E.net, 176, 262, 168, 100, 'Net today')}
        ${lbl(188, 292, 'NET TODAY')}
        ${t(186, 334, 36, netC, `${net >= 0 ? '+' : '−'}${usd(net)}`, { mono: 1, wt: 700, max: 150 })}</g>
      <line x1="54" y1="388" x2="330" y2="388" stroke="${C.muted}" stroke-opacity=".18"/>
      ${tap(E.cost, 44, 392, 296, 42, 'Grid cost')}${lbl(54, 418, 'GRID COST')}${t(330, 420, 20, C.cost, usd(cost), { mono: 1, end: 1, wt: 700 })}</g>
      <line x1="54" y1="436" x2="330" y2="436" stroke="${C.muted}" stroke-opacity=".18"/>
      ${tap(E.credit, 44, 440, 296, 42, 'Solar credit')}${lbl(54, 466, 'SOLAR CREDIT')}${t(330, 468, 20, C.credit, usd(credit), { mono: 1, end: 1, wt: 700 })}</g>
      <line x1="54" y1="484" x2="330" y2="484" stroke="${C.muted}" stroke-opacity=".18"/>
      ${tap(E.kwhIn, 44, 488, 296, 66, 'Grid import and solar export')}
        ${lbl(54, 512, 'IN')}${t(80, 513, 16, C.grid, kwhIn.toFixed(1), { mono: 1, wt: 700 })}
        ${lbl(282, 512, 'OUT', { end: 1 })}${t(330, 513, 16, C.solar, kwhOut.toFixed(1), { mono: 1, end: 1, wt: 700 })}
        <rect x="54" y="526" width="${Math.max(0, (276 * inPct) / 100 - 3).toFixed(1)}" height="8" rx="4" fill="${C.grid}" filter="url(#hud-glow)"/>
        <rect x="${(54 + (276 * inPct) / 100 + 3).toFixed(1)}" y="526" width="${Math.max(0, (276 * (100 - inPct)) / 100 - 3).toFixed(1)}" height="8" rx="4" fill="${C.solar}" filter="url(#hud-glow)"/>
        ${t(192, 548, 11, C.muted, 'kWh GRID IMPORT · SOLAR EXPORT', { mid: 1, ls: 1.5 })}</g>
    </g>`;

    // ---------- left rail: billing ----------
    const vsTxt = vsLast === null ? '' : `${vsLast <= 0 ? '▼' : '▲'} ${Math.abs(vsLast).toFixed(0)}%`;
    const vsC = vsLast === null ? C.muted : vsLast <= 0 ? C.credit : C.cost;
    const billing = `<g transform="translate(0 ${DY})">
      ${glass(32, 576, 320, 262, C.grid, 0.28, DY)}
      ${lbl(54, 608, 'BILLING')}
      ${t(330, 608, 13, C.text, periodTxt, { end: 1, ls: 1.5, mono: 1, max: 190 })}
      ${tap(E.billToDate, 44, 620, 296, 106, 'Bill to date')}
        ${lbl(54, 642, 'BILL TO DATE')}
        ${t(330, 642, 12, C.muted, `DAY ${periodDay} / ${periodDays}`, { end: 1, ls: 1.5 })}
        ${t(52, 688, 42, C.text, usd(billToDate), { mono: 1, wt: 700, max: 190 })}
        ${t(330, 686, 14, C.muted, `${billPct.toFixed(0)}% OF EST.`, { end: 1, ls: 1.5 })}
        ${bar(54, 704, 276, billPct, C.ev, 8)}</g>
      <line x1="54" y1="732" x2="330" y2="732" stroke="${C.muted}" stroke-opacity=".18"/>
      ${tap(E.billEst, 44, 736, 296, 46, 'Estimated bill')}${lbl(54, 766, 'ESTIMATED BILL')}${t(330, 768, 22, C.home, usd(billEst), { mono: 1, end: 1, wt: 700 })}</g>
      <line x1="54" y1="784" x2="330" y2="784" stroke="${C.muted}" stroke-opacity=".18"/>
      ${tap(E.lastBill, 44, 788, 296, 46, 'Last bill')}
        ${lbl(54, 816, 'LAST BILL')}
        ${t(236, 818, 18, C.text, lastBill > 0 ? usd(lastBill) : '—', { mono: 1, end: 1, wt: 700 })}
        ${t(330, 817, 15, vsC, vsTxt, { mono: 1, end: 1, wt: 700 })}</g>
    </g>`;

    // ---------- node cards over the photo ----------
    const solarNode = `${tap(E.solar, 560, 70, 264, 156, 'Solar')}
      ${glass(560, 70, 264, 156, C.solar, 0.45)}
      ${ring(624, 148, 40, C.solar, solar / SOLAR_MAX)}
      <path d="M624 134 L614 152 H623 L619 166 L634 144 H625 Z" fill="${C.solar}"/>
      ${lbl(682, 118, 'SOLAR')}
      ${t(680, 158, 32, C.solar, kw(solar), { mono: 1, wt: 700, max: 126 })}
      ${t(682, 186, 13, selfUse >= 80 ? C.credit : selfUse >= 50 ? C.solar : C.cost, `SELF USE ${selfUse.toFixed(0)}%`, { ls: 1.5 })}</g>
      ${solar > 50 ? `<path d="M690 226 L642 295" stroke="${C.solar}" stroke-dasharray="3 4" stroke-opacity=".8"/><circle cx="640" cy="298" r="5" fill="none" stroke="${C.solar}" stroke-width="2"/>` : ''}`;

    const gridState = imp > 50 ? ['IMPORTING', C.cost, `▼ ${kw(imp)}`] : exp > 50 ? ['EXPORTING', C.credit, `▲ ${kw(exp)}`] : ['IDLE', C.muted, '—'];
    const gridNode = `${tap(c.get(E.gridDir) ? E.gridDir : E.imp, 32, 190, 320, 114, 'Grid')}
      ${glass(32, 190, 320, 114, C.grid, 0.45)}
      <g transform="translate(56 214)" stroke="${C.grid}" stroke-width="1.8" fill="none" stroke-linecap="round" filter="url(#hud-glow)">
        <path d="M8 66 L20 6 L26 6 L38 66 M2 14 H44 M5 26 H41 M12 44 L34 26 M34 44 L12 26 M14 58 L32 44 M32 58 L14 44"/></g>
      ${lbl(122, 230, 'GRID')}
      ${t(120, 272, 32, gridState[1], gridState[2], { mono: 1, wt: 700, max: 210 })}
      ${t(122, 292, 11, C.muted, gridState[0], { ls: 2 })}</g>`;

    const solarShare = total > 0 ? Math.min(1, Math.max(0, (solar - exp) / total)) : 0;
    const homeNode = `<g class="hot" data-act="go" data-arg="#home" role="button" tabindex="0" aria-label="Back to Home">
      <rect x="640" y="340" width="252" height="160" fill="#000" fill-opacity="0"/>
      ${glass(640, 340, 252, 160, C.home, 0.5)}
      ${ring(700, 420, 38, C.home, solarShare)}
      <path d="M686 424 L700 410 L714 424 M690 420 V434 H710 V420" fill="none" stroke="${C.home}" stroke-width="2" stroke-linejoin="round"/>
      ${lbl(752, 392, 'HOME')}
      ${t(750, 432, 28, C.home, kw(home), { mono: 1, wt: 700, max: 122 })}
      ${t(752, 458, 11, C.muted, `${(solarShare * 100).toFixed(0)}% FROM SOLAR`, { ls: 1.5 })}
      ${t(752, 480, 11, C.home, 'OPEN HUB ›', { ls: 2 })}</g>`;

    const evNode = (x, y, name, eid, batt, pw, sub, costEid) => {
      const gridCost = num(costEid);
      return `${tap(eid, x, y, 188, 186, name)}
        ${glass(x, y, 188, 220, C.ev, pw > 50 ? 0.7 : 0.35)}
        ${lbl(x + 20, y + 30, name)}
        ${t(x + 168, y + 30, 12, pw > 50 ? C.ev : C.muted, pw > 50 ? `⚡ ${(pw / 1000).toFixed(1)} kW` : 'IDLE', { end: 1, ls: 1.5, mono: pw > 50 })}
        ${ring(x + 94, y + 104, 44, battC(batt), batt / 100, 8)}
        ${t(x + 94, y + 112, 26, C.text, `${batt}%`, { mono: 1, mid: 1, wt: 700 })}
        ${t(x + 94, y + 176, 12, C.muted, sub, { mid: 1, ls: 1.5 })}</g>
        ${tap(costEid, x, y + 188, 188, 32, `${name} grid charging cost`)}
        <line x1="${x + 20}" y1="${y + 188}" x2="${x + 168}" y2="${y + 188}" stroke="${C.muted}" stroke-opacity=".18"/>
        ${t(x + 20, y + 209, 11, C.muted, 'GRID TODAY', { ls: 2 })}
        ${t(x + 168, y + 210, 15, gridCost > 0 ? C.cost : C.muted, usd(gridCost), { mono: 1, end: 1, wt: 700 })}</g>`;
    };
    const nodes = solarNode + gridNode + homeNode
      + evNode(738, 574, 'TESLA', E.teslaBatt, teslaBatt, tesla, tesla > 50 ? `${teslaRange} KM · CHARGING` : `${teslaRange} KM RANGE`, pick(E.teslaCost))
      + evNode(1058, 506, 'KIA', E.kiaBatt, kiaBatt, kia, kia > 50 ? 'CHARGING' : 'ESTIMATED', pick(E.kiaCost));

    // ---------- assemble ----------
    const bg = night ? BG_NIGHT : BG_DAY;
    const body = conditions + today + billing + flows + nodes;  // fills BOXES for the frosted-glass clip
    // The HUD fits the whole 1600 x 1000 picture in the view; spare space either side shows a blurred, dimmed
    // copy of the photo.
    return `<div class="hud" aria-label="Home energy">
      <div class="hud-bg" style="background-image:url('${bg}')"></div>
      <svg class="hud-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Home energy overview">
        <defs>
          <filter id="hud-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="hud-frost" x="0" y="0" width="100%" height="100%"><feGaussianBlur stdDeviation="14"/></filter>
          <clipPath id="hud-glassClip">${BOXES.join('')}</clipPath>
          <linearGradient id="hud-vignette" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#04091A" stop-opacity=".55"/><stop offset=".3" stop-color="#04091A" stop-opacity="0"/>
            <stop offset=".8" stop-color="#04091A" stop-opacity="0"/><stop offset="1" stop-color="#04091A" stop-opacity=".35"/></linearGradient>
        </defs>
        <rect width="1600" height="1000" fill="#04091A"/>
        <image href="${bg}" x="0" y="0" width="1600" height="1000" preserveAspectRatio="xMidYMid slice"/>
        <rect width="1600" height="1000" fill="url(#hud-vignette)"/>
        <image href="${bg}" x="0" y="0" width="1600" height="1000" preserveAspectRatio="xMidYMid slice" filter="url(#hud-frost)" clip-path="url(#hud-glassClip)"/>
        ${body}
      </svg>
      <svg class="hud-svg hud-anim" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${ANIM.join('')}</svg>
      <button class="hud-home" data-act="go" data-arg="#home">${c.ic('home')}HOME</button>
    </div>`;
  },
};
