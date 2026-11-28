import { E, ROBBIE_IMAGE, ROBBIE_ROOMS } from './config.js?v=39';
import { titleCase } from './home.js?v=39';
import { cap, durationSince, isUnavailable, num } from './state.js?v=39';

// Home Assistant vacuum entity feature flags used by the native vacuum card.
const VF = { pause: 4, stop: 8, dock: 16, fan: 32, locate: 512, start: 8192, area: 16384 };

// A drawing of a Roborock Qrevo (round body, LiDAR turret, dark front bumper) for Robbie's pop-up.
const QREVO_SVG = `<svg class="rbimg" viewBox="0 0 160 112" role="img" aria-label="Robbie, a Roborock Qrevo">
  <ellipse cx="80" cy="98" rx="66" ry="9" fill="rgba(0,0,0,.14)"/>
  <path d="M16 60v16c0 12.2 28.7 22 64 22s64-9.8 64-22V60" fill="#d5dae4"/>
  <path d="M18 74c4 11 30 19 62 19s58-8 62-19" fill="none" stroke="#2c303b" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="80" cy="60" rx="64" ry="23" fill="#f6f7fa" stroke="#c3c9d5" stroke-width="1.5"/>
  <ellipse cx="80" cy="60" rx="52" ry="17" fill="none" stroke="#e3e7ee" stroke-width="1.5"/>
  <path d="M63 54v-11h34v11c0 3.3-7.6 6-17 6s-17-2.7-17-6z" fill="#2c303b"/>
  <ellipse cx="80" cy="43" rx="17" ry="6" fill="#454b5b"/>
  <path d="M66 49.5c4 1.6 9 2.4 14 2.4s10-.8 14-2.4" fill="none" stroke="#7d8597" stroke-width="1.5"/>
  <ellipse cx="80" cy="69" rx="7" ry="2.6" fill="#c3c9d5"/>
  <circle cx="80" cy="69" r="1.3" fill="#2fbfa0"/>
</svg>`;

// Read the same saved area mapping that HA's vacuum.clean_area action resolves.
async function cleaningAreas(request) {
  const [entry, areas] = await Promise.all([
    request({ type: 'config/entity_registry/get', entity_id: E.robbie }),
    request({ type: 'config/area_registry/list' }),
  ]);
  const mapping = entry?.options?.vacuum?.area_mapping;
  return areas.filter(({ area_id }) => Array.isArray(mapping?.[area_id]) && mapping[area_id].length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'en-AU'));
}

export function mountRobbie(root, { get, ic, esc, call, close, request, formatTime }) {
  const dialog = root.closest('dialog');
  const selected = new Set();
  let screen = 'overview', areas = [], areaError = false, fetchId = 0, loading = false;
  let busy = false, feedback = '', last = '', photoFailed = false;
  const active = () => root.isConnected && dialog.open;

  function overview() {
    const vacuum = get(E.robbie);
    const attrs = vacuum?.attributes ?? {};
    const available = !isUnavailable(vacuum);
    const state = vacuum?.state;
    const can = (feature) => available && (attrs.supported_features == null || Boolean(attrs.supported_features & feature));
    const battery = num(get(E.robbieBattery)) ?? attrs.battery_level;
    const charging = get(E.robbieCharging)?.state === 'on' || attrs.battery_charging === true;
    const change = available && Number.isFinite(Date.parse(vacuum.last_changed)) ? `${durationSince(vacuum.last_changed)} ago` : '';
    const lastClean = new Date(get(E.robbieLastClean)?.state);
    const dock = get(E.robbieDock);
    const measure = (id) => {
      const sensor = get(id);
      const value = num(sensor);
      return value == null ? '' : `${value}${sensor.attributes?.unit_of_measurement ? ' ' + sensor.attributes.unit_of_measurement : ''}`;
    };
    const stats = [
      ['Cleaning time', measure(E.robbieCleanTime)],
      ['Cleaned area', measure(E.robbieCleanArea)],
      ['Dock', isUnavailable(dock) ? '' : dock.state === 'ok' ? 'Ready' : titleCase(dock.state)],
      ['Filter life remaining', measure(E.robbieFilter)],
      ['Last clean finished', Number.isFinite(+lastClean) ? formatTime(lastClean) : ''],
    ].filter(([, value]) => value);
    const action = (service, label, icon, enabled) => `<button class="tile b" data-rb-service="${service}"${enabled ? '' : ' disabled'}>${ic(icon)}${label}</button>`;
    const cleaning = state === 'cleaning';
    const activeJob = ['cleaning', 'paused', 'returning'].includes(state);
    const fan = Array.isArray(attrs.fan_speed_list) ? attrs.fan_speed_list : [];
    const pic = ROBBIE_IMAGE && !photoFailed ? `<img class="rbimg" src="${esc(ROBBIE_IMAGE)}" alt="Robbie, a Roborock Qrevo">` : QREVO_SVG;
    return `<div class="rbhead">${pic}<div><h3>${available ? esc(cap(state)) : 'Unavailable'}</h3>
        ${change ? `<p>${esc(change)}</p>` : ''}
        ${Number.isFinite(battery) ? `<p class="rb-battery">${ic('bolt')} ${Math.round(battery)}%${charging ? ' · Charging' : ''}</p>` : ''}</div></div>
      ${stats.length ? `<dl class="rb-stats">${stats.map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>` : ''}
      <div class="rb-actions">
        ${action(cleaning ? 'pause' : 'start', cleaning ? 'Pause' : state === 'paused' ? 'Resume' : 'Clean all', cleaning ? 'pause' : 'play', state !== 'returning' && can(cleaning ? VF.pause : VF.start))}
        ${action('stop', 'Stop', 'stop', activeJob && can(VF.stop))}
        ${action('return_to_base', 'Dock', 'home', state !== 'docked' && state !== 'returning' && can(VF.dock))}
        ${action('locate', 'Locate', 'location', can(VF.locate))}
      </div>
      <div class="rb-options">
        ${fan.length ? `<label class="rb-fan"><span>Fan speed</span><select aria-label="Fan speed"${can(VF.fan) ? '' : ' disabled'}>
          ${fan.includes(attrs.fan_speed) ? '' : '<option value="" selected disabled>Choose speed</option>'}
          ${fan.map((speed) => `<option value="${esc(speed)}"${speed === attrs.fan_speed ? ' selected' : ''}>${esc(cap(speed))}</option>`).join('')}</select></label>` : ''}
        <button class="tile b rb-by-area" data-rb-action="areas"${can(VF.area) ? '' : ' disabled'}>${ic('rooms')}<span><small>Cleaning</small>By area</span>${ic('chevron')}</button>
      </div>
      <details class="rb-presets"><summary>Cleaning presets</summary><div class="acts">
        ${ROBBIE_ROOMS.map(([id, name, icon]) => `<button class="tile b" data-rb-preset="${esc(id)}">${ic(icon)}${esc(name)}</button>`).join('')}
      </div></details>`;
  }

  function areaPicker() {
    if (loading) return '<p role="status">Loading Home Assistant areas…</p>';
    if (areaError) return '<p role="status">Couldn’t load Robbie’s areas from Home Assistant.</p><button class="tile b rb-retry" data-rb-action="areas">Try again</button>';
    if (!areas.length) return '<p>Robbie has no mapped areas. Add them in Home Assistant under Robbie’s vacuum settings.</p>';
    const names = areas.filter(({ area_id }) => selected.has(area_id)).map(({ name }) => name);
    return `<p>Select the areas to clean. Robbie chooses the cleaning order.</p>
      <div class="rb-areas" role="group" aria-label="Areas to clean">${areas.map(({ area_id, name }) => {
        const checked = selected.has(area_id);
        return `<button class="tile b rb-area${checked ? ' on' : ''}" data-rb-area="${esc(area_id)}" aria-pressed="${checked}"${busy ? ' disabled' : ''}>
          ${ic('rooms')}<span>${esc(name)}</span><span class="rb-check">${checked ? ic('check') : ''}</span></button>`;
      }).join('')}</div>
      <div class="rb-footer"><span role="status">${names.length ? esc(names.join(', ')) : 'No areas selected'}</span>
        <button class="tile b on" data-rb-action="start"${busy || !selected.size || isUnavailable(get(E.robbie)) ? ' disabled' : ''}><span>${busy ? 'Starting…' : 'Start cleaning'}</span></button>
      </div>`;
  }

  function update() {
    if (!active()) return;
    const picker = screen === 'areas';
    const html = `<header class="rb-title"><button class="tile b" data-rb-action="back" aria-label="${picker ? 'Back to Robbie' : 'Close Robbie'}">${ic(picker ? 'left' : 'close')}</button>
      <div><small>${picker ? 'Robbie' : 'Roborock Qrevo'}</small><h2 id="robbie-title" tabindex="-1">${picker ? 'Clean areas' : 'Robbie'}</h2></div></header>
      ${picker ? areaPicker() : overview()}${feedback ? `<p class="rb-feedback" role="status">${esc(feedback)}</p>` : ''}`;
    if (html === last) return;
    const presetsOpen = root.querySelector('.rb-presets')?.open;
    const focus = document.activeElement;
    const attribute = ['data-rb-area', 'data-rb-service', 'data-rb-action', 'data-rb-preset']
      .find((key) => focus.hasAttribute(key));
    const focusKey = root.contains(focus) && (attribute
      ? `[${attribute}="${CSS.escape(focus.getAttribute(attribute))}"]` : focus.localName);
    last = html;
    root.innerHTML = html;
    if (presetsOpen && !picker) root.querySelector('.rb-presets').open = true;
    if (focusKey) root.querySelector(focusKey)?.focus({ preventScroll: true });
    const img = root.querySelector('img.rbimg');
    img?.addEventListener('error', () => { photoFailed = true; update(); }, { once: true });
  }

  async function openAreas() {
    const id = ++fetchId;
    screen = 'areas';
    loading = true;
    areaError = false;
    feedback = '';
    update();
    root.querySelector('h2').focus();
    try {
      const result = await cleaningAreas(request);
      if (id !== fetchId || !active()) return;
      areas = result;
      for (const area of selected) if (!areas.some(({ area_id }) => area_id === area)) selected.delete(area);
    } catch {
      if (id === fetchId && active()) areaError = true;
    } finally {
      if (id === fetchId && active()) {
        loading = false;
        update();
      }
    }
  }

  function back() {
    if (screen === 'overview') { close(); return; }
    if (busy) return;
    fetchId++;
    screen = 'overview';
    feedback = '';
    update();
    root.querySelector('[data-rb-action="areas"]').focus();
  }

  function cancel(event) {
    if (screen !== 'areas') return;
    event.preventDefault();
    back();
  }
  dialog.addEventListener('cancel', cancel);

  root.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const { rbAction, rbArea, rbService, rbPreset } = button.dataset;
    if (rbAction === 'areas') { await openAreas(); return; }
    if (rbAction === 'back') { back(); return; }
    if (rbArea) {
      if (selected.has(rbArea)) selected.delete(rbArea);
      else selected.add(rbArea);
      update();
      return;
    }
    if (rbAction === 'start') {
      if (busy || !selected.size || isUnavailable(get(E.robbie))) return;
      busy = true;
      feedback = '';
      update();
      try {
        const cleaning_area_id = areas.filter(({ area_id }) => selected.has(area_id)).map(({ area_id }) => area_id);
        await call('vacuum', 'clean_area', { entity_id: E.robbie, cleaning_area_id });
        if (!active()) return;
        selected.clear();
        screen = 'overview';
        feedback = 'Area clean requested.';
      } catch {
        feedback = 'Couldn’t start cleaning. Check Robbie in Home Assistant and try again.';
      } finally {
        busy = false;
        update();
        if (active()) root.querySelector(screen === 'overview' ? 'h2' : '[data-rb-action="start"]').focus();
      }
      return;
    }
    try {
      if (rbService) await call('vacuum', rbService, { entity_id: E.robbie });
      if (rbPreset) {
        await call('button', 'press', { entity_id: rbPreset });
        if (active()) close();
      }
    } catch {
      feedback = 'Robbie’s command failed. Try again.';
      update();
    }
  });
  root.addEventListener('change', async (event) => {
    if (!event.target.matches('select')) return;
    try {
      await call('vacuum', 'set_fan_speed', { entity_id: E.robbie, fan_speed: event.target.value });
    } catch {
      feedback = 'Couldn’t set the fan speed. Try again.';
      update();
    }
  });

  update();
  return { update, dispose() { dialog.removeEventListener('cancel', cancel); } };
}
