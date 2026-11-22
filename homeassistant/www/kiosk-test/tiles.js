// Tile rendering and controls. Each tile is built once and then updated in place.
import { CAMERA_REFRESH_MS, CONFIRM_WINDOW_MS } from './config.js?v=2';
import {
  domainOf, isUnavailable, binarySensorText, stepValue, climateStep, redact, isLocalImage,
} from './entities.js?v=2';

// ---- Icons: one small inline SVG per domain ----

const ICON_PATHS = {
  light: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  switch: '<rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="16" cy="12" r="3"/>',
  fan: '<circle cx="12" cy="12" r="2"/><path d="M12 10c0-4 1-7 4-7s2 5-2 7M14 12c4 0 7 1 7 4s-5 2-7-2M12 14c0 4-1 7-4 7s-2-5 2-7M10 12c-4 0-7-1-7-4s5-2 7 2"/>',
  automation: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  cover: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 8h16M4 13h16"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  climate: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>',
  media_player: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  scene: '<path d="m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>',
  script: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
  button: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  number: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  select: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  sensor: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  binary_sensor: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  area: '<path d="M3 11 12 4l9 7"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/>',
  alarm_control_panel: '<path d="m12 2 8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/>',
  default: '<circle cx="12" cy="12" r="9"/>',
};
const ICON_ALIAS = {
  input_boolean: 'switch', input_button: 'button', input_number: 'number', input_select: 'select',
  device_tracker: 'person',
};

export function icon(domain) {
  const paths = ICON_PATHS[ICON_ALIAS[domain] ?? domain] ?? ICON_PATHS.default;
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
}

// Control glyphs as SVG (Unicode symbols such as ⏭ render as emoji on Android).
const GLYPHS = {
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="1.5"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
  next: '<path d="M6 5.5v13l9-6.5zM18 5.5v13"/>',
  minus: '<path d="M6 12h12"/>',
  plus: '<path d="M12 6v12M6 12h12"/>',
};
const glyph = (name) => `<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true">${GLYPHS[name]}</svg>`;

// Domains whose tile toggles on tap, like the dashboard's glass_toggle tiles.
export const TOGGLE_DOMAINS = new Set(['light', 'switch', 'fan', 'input_boolean', 'automation']);
const LONG_PRESS_MS = 500;

// ---- Small DOM helpers ----

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A control button. `label` is text, or `{glyph}` for an SVG glyph (then `aria` names it). */
function button(label, onTap, aria) {
  const b = el('button', 'ctl');
  if (typeof label === 'string') b.textContent = label; else b.innerHTML = glyph(label.glyph);
  b.type = 'button';
  if (aria) b.setAttribute('aria-label', aria);
  b.addEventListener('click', (e) => { e.stopPropagation(); onTap(b); });
  return b;
}

/** Wraps an action so it only runs on a second tap within the confirm window. */
function confirmed(action, needsConfirm = () => true) {
  return (b) => {
    if (!needsConfirm()) return action();
    if (b.dataset.armed) {
      clearTimeout(Number(b.dataset.armed));
      disarm(b);
      return action();
    }
    b.dataset.label = b.innerHTML;
    b.textContent = 'Tap again';
    b.classList.add('armed');
    b.dataset.armed = String(setTimeout(() => disarm(b), CONFIRM_WINDOW_MS));
  };
}

function disarm(b) {
  delete b.dataset.armed;
  b.classList.remove('armed');
  if (b.dataset.label !== undefined) b.innerHTML = b.dataset.label;
}

const name = (s, id) => s?.attributes?.friendly_name || id;
const cap = (v) => { const t = String(v ?? '').replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };
const withUnit = (s) => (s.attributes.unit_of_measurement ? `${s.state} ${s.attributes.unit_of_measurement}` : cap(s.state));

/** One-line state text for a tile. */
export function stateText(s) {
  if (!s) return '—';
  if (isUnavailable(s)) return cap(s.state);
  const a = s.attributes;
  switch (domainOf(s.entity_id)) {
    case 'light':
      return s.state === 'on' && a.brightness != null ? `On · ${Math.round((a.brightness / 255) * 100)}%` : cap(s.state);
    case 'fan':
      return s.state === 'on' && a.percentage != null ? `On · ${a.percentage}%` : cap(s.state);
    case 'cover':
      return a.current_position != null ? `${cap(s.state)} · ${a.current_position}%` : cap(s.state);
    case 'climate': {
      const unit = a.temperature_unit ?? '°';
      const now = a.current_temperature != null ? `${a.current_temperature}${unit}` : '—';
      const target = a.temperature != null ? `${a.temperature}${unit}`
        : a.target_temp_low != null ? `${a.target_temp_low}–${a.target_temp_high}${unit}` : null;
      return `${now}${target ? ` → ${target}` : ''} · ${cap(a.hvac_action ?? s.state)}`;
    }
    case 'media_player':
      return a.media_title ? [a.media_title, a.media_artist].filter(Boolean).join(' — ') : cap(s.state);
    case 'sensor': case 'input_number': case 'number':
      return withUnit(s);
    case 'binary_sensor':
      return binarySensorText(s.state, a.device_class);
    case 'person': case 'device_tracker':
      return s.state === 'home' ? 'Home' : s.state === 'not_home' ? 'Away' : s.state;
    case 'script':
      return s.state === 'on' ? 'Running' : '';
    case 'scene': case 'button': case 'input_button':
      return '';
    default:
      return cap(s.state);
  }
}

// ---- Tiles ----

/**
 * Builds a tile. `ctx` provides callService(domain, service, data), openSheet(entityId)
 * and cameras (a CameraRefresher).
 * Returns {el, update(state)}.
 */
export function createTile(entityId, ctx) {
  const domain = domainOf(entityId);
  const root = el('article', `tile d-${domain}`);
  root.dataset.entity = entityId;

  const body = el('button', 'tile-body');
  body.type = 'button';
  const head = el('span', 'tile-head');
  head.innerHTML = `<span class="well">${icon(domain)}</span>`;
  const text = el('span', 'tile-text');
  const title = el('span', 'tile-name', entityId);
  const line = el('span', 'tile-state');
  text.append(title, line);
  body.append(head, text);
  root.append(body);

  let state = null;
  const call = (svc, data = {}) => ctx.callService(svc.split('.')[0], svc.split('.')[1], { entity_id: entityId, ...data });
  const toggles = TOGGLE_DOMAINS.has(domain);

  // Tap: toggle (toggle domains) or open details. Hold: always open details.
  let holdTimer = 0;
  let held = false;
  body.addEventListener('pointerdown', () => {
    held = false;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => { held = true; ctx.openSheet(entityId); }, LONG_PRESS_MS);
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) body.addEventListener(ev, () => clearTimeout(holdTimer));
  body.addEventListener('contextmenu', (e) => e.preventDefault());
  body.addEventListener('click', () => {
    if (held) { held = false; return; }
    if (!toggles) return ctx.openSheet(entityId);
    if (!isUnavailable(state)) call(`${domain}.toggle`);
  });
  if (toggles) {
    root.classList.add('toggles');
    head.append(el('span', 'switch'));
  }
  const controls = el('div', 'tile-controls');
  const controlButtons = [];
  const add = (b) => { controlButtons.push(b); controls.append(b); return b; };
  let refresh = () => {};

  switch (domain) {
    case 'light': case 'switch': case 'fan': case 'input_boolean': case 'automation':
      refresh = (s) => {
        const on = s?.state === 'on';
        body.setAttribute('aria-pressed', String(on));
        root.classList.toggle('on', on);
      };
      break;
    case 'cover': {
      const guarded = () => ['garage', 'gate'].includes(state?.attributes.device_class);
      add(button({ glyph: 'up' }, confirmed(() => call('cover.open_cover'), guarded), 'Open'));
      add(button({ glyph: 'stop' }, () => call('cover.stop_cover'), 'Stop'));
      add(button({ glyph: 'down' }, confirmed(() => call('cover.close_cover'), guarded), 'Close'));
      refresh = (s) => {
        // Open garage doors and gates read as a warning; other open covers just as active.
        const open = ['open', 'opening'].includes(s?.state);
        root.classList.toggle('warn', open && guarded());
        root.classList.toggle('on', open && !guarded());
      };
      break;
    }
    case 'lock':
      add(button('Lock', () => call('lock.lock')));
      add(button('Unlock', confirmed(() => call('lock.unlock'))));
      refresh = (s) => root.classList.toggle('warn', s?.state === 'unlocked');
      break;
    case 'climate': {
      const stepper = numberStepper({
        read: (s) => s.attributes.temperature,
        step: (s) => climateStep(s.attributes),
        min: (s) => s.attributes.min_temp, max: (s) => s.attributes.max_temp,
        unit: (s) => s.attributes.temperature_unit ?? '°',
        send: (v) => call('climate.set_temperature', { temperature: v }),
      });
      stepper.buttons.forEach(add);
      controls.insertBefore(stepper.value, stepper.buttons[1]);
      refresh = (s) => {
        // Range (low/high) thermostats stay read-only here.
        const readOnly = !s || s.attributes.temperature == null;
        controls.hidden = readOnly;
        stepper.refresh(s);
      };
      break;
    }
    case 'input_number': case 'number': {
      const stepper = numberStepper({
        read: (s) => Number(s.state),
        step: (s) => s.attributes.step ?? 1,
        min: (s) => s.attributes.min, max: (s) => s.attributes.max,
        unit: (s) => s.attributes.unit_of_measurement ?? '',
        send: (v) => call(`${domain}.set_value`, { value: v }),
      });
      stepper.buttons.forEach(add);
      controls.insertBefore(stepper.value, stepper.buttons[1]);
      refresh = stepper.refresh;
      break;
    }
    case 'media_player': {
      const art = el('img', 'art');
      art.alt = '';
      art.hidden = true;
      head.querySelector('.well').append(art);
      const pp = add(button({ glyph: 'play' }, () => call('media_player.media_play_pause'), 'Play or pause'));
      add(button({ glyph: 'next' }, () => call('media_player.media_next_track'), 'Next'));
      let lastPicture = null;
      refresh = (s) => {
        const playing = s?.state === 'playing';
        if (pp.dataset.playing !== String(playing)) {
          pp.dataset.playing = String(playing);
          pp.innerHTML = glyph(playing ? 'pause' : 'play');
        }
        root.classList.toggle('on', playing);
        const pic = s?.attributes.entity_picture;
        if (pic !== lastPicture) {
          lastPicture = pic;
          art.hidden = !isLocalImage(pic, location.origin);
          if (!art.hidden) art.src = pic; else art.removeAttribute('src');
        }
      };
      break;
    }
    case 'scene': add(button('Activate', () => call('scene.turn_on'))); break;
    case 'script': add(button('Run', () => call('script.turn_on'))); break;
    case 'button': case 'input_button': add(button('Press', () => call(`${domain}.press`))); break;
    case 'input_select': case 'select': add(button('Choose…', () => ctx.openSheet(entityId))); break;
    case 'camera': {
      const img = el('img', 'snapshot');
      img.alt = '';
      root.classList.add('tile-camera');
      body.prepend(img);
      ctx.cameras.observe(img, entityId);
      break;
    }
    default:
      break;
  }
  if (controls.childElementCount) root.append(controls);

  return {
    el: root,
    update(s) {
      state = s;
      title.textContent = name(s, entityId);
      line.textContent = stateText(s);
      const off = isUnavailable(s);
      root.classList.toggle('unavailable', off);
      for (const b of controlButtons) b.disabled = off;
      refresh(s);
    },
  };
}

/** −/value/+ control. Taps adjust a local target and send once the taps stop. */
function numberStepper({ read, step, min, max, unit, send }) {
  let st = null;
  let current = null;
  let pending = null;
  let timer = 0;
  const value = el('span', 'step-value');
  const show = () => { value.textContent = pending ?? current ?? '—'; };
  const nudge = (dir) => () => {
    if (current == null) return;
    pending = stepValue(pending ?? current, step(st), dir, min(st) ?? -Infinity, max(st) ?? Infinity);
    show();
    clearTimeout(timer);
    timer = setTimeout(() => { const v = pending; pending = null; send(v); }, 600);
  };
  const buttons = [button({ glyph: 'minus' }, nudge(-1), 'Decrease'), button({ glyph: 'plus' }, nudge(1), 'Increase')];
  return {
    value,
    buttons,
    refresh(s) {
      st = s;
      const v = s ? read(s) : null;
      current = v == null || Number.isNaN(v) ? null : v;
      value.dataset.unit = s ? unit(s) : '';
      show();
    },
  };
}

// ---- Details sheet ----

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export function relativeTime(iso, now = Date.now()) {
  const secs = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(secs);
  if (abs < 60) return rtf.format(secs, 'second');
  if (abs < 3600) return rtf.format(Math.round(secs / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(secs / 3600), 'hour');
  return rtf.format(Math.round(secs / 86400), 'day');
}

export class Sheet {
  /** @param {{getState: (id: string) => object, callService: Function, onOpenChange: (open: boolean) => void}} ctx */
  constructor(ctx) {
    this.ctx = ctx;
    this.entityId = null;
    this.dialog = el('dialog', 'sheet');
    this.dialog.addEventListener('close', () => { this.entityId = null; ctx.onOpenChange(false); });
    // Tapping the backdrop (the dialog element itself) closes it.
    this.dialog.addEventListener('click', (e) => { if (e.target === this.dialog) this.dialog.close(); });
    document.body.append(this.dialog);
  }

  open(entityId) {
    this.entityId = entityId;
    this.render();
    if (!this.dialog.open) {
      this.dialog.showModal();
      this.ctx.onOpenChange(true);
    }
  }

  /** Re-renders if this entity is the one on show. */
  update(entityId) {
    if (this.dialog.open && entityId === this.entityId) this.render();
  }

  render() {
    const id = this.entityId;
    const s = this.ctx.getState(id);
    const d = this.dialog;
    d.replaceChildren();
    const head = el('div', 'sheet-head');
    const h = el('h2', '', name(s, id));
    const close = el('button', 'ctl', 'Close');
    close.type = 'button';
    close.addEventListener('click', () => d.close());
    head.append(h, close);
    d.append(head, el('p', 'sheet-id', id));

    if (!s) { d.append(el('p', '', 'No state.')); return; }
    d.append(el('p', 'sheet-state', `${stateText(s) || cap(s.state)} · changed ${relativeTime(s.last_changed)}`));

    const domain = domainOf(id);
    if ((domain === 'input_select' || domain === 'select') && Array.isArray(s.attributes.options)) {
      const list = el('div', 'options');
      for (const option of s.attributes.options) {
        const b = el('button', 'ctl option', option);
        b.type = 'button';
        b.disabled = isUnavailable(s);
        if (option === s.state) b.setAttribute('aria-current', 'true');
        b.addEventListener('click', () => this.ctx.callService(domain, 'select_option', { entity_id: id, option }));
        list.append(b);
      }
      d.append(list);
    }

    const table = el('dl', 'attrs');
    for (const [key, value] of Object.entries(redact(s.attributes))) {
      table.append(el('dt', '', key), el('dd', '', typeof value === 'object' ? JSON.stringify(value) : String(value)));
    }
    d.append(table);
  }
}

// ---- Camera snapshots ----

/** Refreshes camera snapshots every CAMERA_REFRESH_MS, only while on screen and not paused. */
export class CameraRefresher {
  constructor(getState) {
    this.getState = getState;
    this.entityOf = new Map();
    this.visible = new Set();
    this.pauses = new Set();
    this.observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { this.visible.add(e.target); this.load(e.target); } else this.visible.delete(e.target);
      }
    });
    setInterval(() => { if (!this.pauses.size) this.visible.forEach((img) => this.load(img)); }, CAMERA_REFRESH_MS);
  }

  observe(img, entityId) {
    this.entityOf.set(img, entityId);
    img.addEventListener('error', () => img.classList.add('img-error'));
    img.addEventListener('load', () => img.classList.remove('img-error'));
    this.observer.observe(img);
  }

  /** Pause reasons (e.g. 'screensaver', 'hidden') stack; refreshing resumes when none remain. */
  setPaused(reason, paused) {
    if (paused) this.pauses.add(reason);
    else if (this.pauses.delete(reason) && !this.pauses.size) this.visible.forEach((img) => this.load(img));
  }

  load(img) {
    if (this.pauses.size) return;
    // entity_picture carries a rotating access token, so read it fresh every time.
    const pic = this.getState(this.entityOf.get(img))?.attributes.entity_picture;
    if (!isLocalImage(pic, location.origin)) return;
    img.src = `${pic}${pic.includes('?') ? '&' : '?'}_ts=${Date.now()}`;
  }
}
