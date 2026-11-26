const TILE_SIZE = 256;
const MIN_ZOOM = 3;
const MAX_ZOOM = 19;
const radians = Math.PI / 180;

export function personPoint(state) {
  const { latitude, longitude } = state?.attributes ?? {};
  return !['unknown', 'unavailable'].includes(state?.state) &&
    Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
    Number.isFinite(longitude) && Math.abs(longitude) <= 180 ? [latitude, longitude] : null;
}

function worldPoint([latitude, longitude]) {
  const lat = Math.max(-85.05112878, Math.min(85.05112878, latitude)) * radians;
  return [(longitude + 180) / 360, Math.max(0, Math.min(1, (1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2))];
}

// Find the first instant of today in the HA timezone, including days with a clock change.
export function localDayStart(now, timeZone) {
  const format = new Intl.DateTimeFormat('en-AU', { timeZone, day: 'numeric' });
  const today = format.format(now);
  let start = Math.floor(now / 1000) - 129600, end = Math.floor(now / 1000);
  while (start < end) {
    const mid = Math.floor((start + end) / 2);
    if (format.format(mid * 1000) === today) end = mid;
    else start = mid + 1;
  }
  return start * 1000;
}

export function stateChanges(rows, start, end) {
  const ordered = (Array.isArray(rows) ? rows : []).flatMap((row) => {
    const time = (row?.lc ?? row?.lu) * 1000;
    return typeof row?.s === 'string' && Number.isFinite(time) && time <= end ? [{ state: row.s, time }] : [];
  }).sort((a, b) => a.time - b.time);
  const changes = [];
  for (const row of ordered) {
    if (row.time <= start && changes.at(-1)?.time === start) changes.pop();
    if (changes.at(-1)?.state !== row.state) changes.push({ ...row, time: Math.max(start, row.time) });
  }
  return changes;
}

const stateColour = (state) => state === 'home' ? 'home' : ['not_home', 'unknown', 'unavailable'].includes(state) ? 'away' : 'zone';

export function personMarkup(ic) {
  return `<header class="person-head">
    <span class="mono person-avatar" data-person-face aria-hidden="true"></span>
    <div><h2 id="person-title"></h2><p id="person-summary"></p></div>
    <button class="person-control person-close" type="button" data-act="sheet-close" aria-label="Close location" autofocus>${ic('close')}</button>
  </header>
  <div class="person-tabs" role="tablist" aria-label="Location details">
    <button type="button" role="tab" id="person-map-tab" aria-selected="true" aria-controls="person-map-panel">${ic('location')}Map</button>
    <button type="button" role="tab" id="person-activity-tab" aria-selected="false" aria-controls="person-activity-panel" tabindex="-1">${ic('history')}Activity</button>
  </div>
  <section id="person-map-panel" role="tabpanel" aria-labelledby="person-map-tab">
    <div class="person-map">
      <div class="person-map-viewport" role="img"><div class="person-map-tiles"></div><span class="mono person-marker" data-person-face aria-hidden="true"></span></div>
      <div class="person-map-controls">
        <button type="button" class="person-control" data-zoom="1" aria-label="Zoom in">${ic('plus')}</button>
        <button type="button" class="person-control" data-zoom="-1" aria-label="Zoom out">${ic('minus')}</button>
        <button type="button" class="person-control" data-recentre aria-label="Recentre on person">${ic('recentre')}</button>
      </div>
      <span class="person-map-credit" hidden>© OpenStreetMap contributors · openstreetmap.org/copyright</span>
    </div>
    <p class="person-map-status" role="status"></p>
  </section>
  <section id="person-activity-panel" role="tabpanel" aria-labelledby="person-activity-tab" hidden>
    <div class="person-section-title"><h3>State history</h3><span>Today</span></div>
    <p class="person-activity-status" role="status"></p>
    <div class="person-history" hidden>
      <div class="person-timeline" role="img" aria-label="Today’s state history. Recorded changes are listed below."></div>
      <div class="person-axis" aria-hidden="true"></div>
      <div class="person-legend"></div>
      <div class="person-section-title"><h3>State changes</h3><span class="person-date"></span></div>
      <div class="person-events" tabindex="0" aria-label="State changes, newest first"><ol></ol><p hidden>No recorded state changes today.</p></div>
    </div>
  </section>`;
}

function mountMap(dialog, request) {
  const viewport = dialog.querySelector('.person-map-viewport');
  const layer = dialog.querySelector('.person-map-tiles');
  const marker = dialog.querySelector('.person-marker');
  const controls = dialog.querySelector('.person-map-controls');
  const credit = dialog.querySelector('.person-map-credit');
  const message = dialog.querySelector('.person-map-status');
  const zoomIn = controls.querySelector('[data-zoom="1"]');
  const zoomOut = controls.querySelector('[data-zoom="-1"]');
  const tiles = new Map();
  let point, centre, drag;
  let zoom = 15, following = true, disposed = false;
  let credential, pendingToken;

  async function token() {
    if (credential?.expires > Date.now()) return credential.value;
    pendingToken ??= request({ type: 'map_tiles/access_token' }).then(({ token: value }) => {
      if (typeof value !== 'string' || !value) throw new Error('Map tiles unavailable');
      credential = { value, expires: Date.now() + 20 * 60000 };
      return value;
    }).finally(() => { pendingToken = null; });
    return pendingToken;
  }

  function status() {
    const visible = [...tiles.values()];
    const hasTiles = visible.some((tile) => tile.loaded);
    credit.hidden = !hasTiles;
    const content = !point ? 'Location unavailable.' : hasTiles ? '' :
      visible.length && visible.every((tile) => tile.failed) ? 'Map tiles unavailable. Showing the reported position.' : 'Loading map…';
    if (message.textContent !== content) message.textContent = content;
  }

  async function load(tile, path) {
    try {
      let value = await token();
      const fetchTile = () => fetch(path, {
        headers: { 'X-Map-Tiles-Token': value },
        signal: tile.abort.signal, mode: 'same-origin', redirect: 'error', referrerPolicy: 'no-referrer',
      });
      let response = await fetchTile();
      if (response.status === 403) {
        if (credential?.value === value) credential = null;
        value = await token();
        response = await fetchTile();
      }
      if (!response.ok) throw new Error('Map tile failed');
      const blob = await response.blob();
      if (tile.abort.signal.aborted) return;
      tile.url = URL.createObjectURL(blob);
      tile.img.src = tile.url;
    } catch {
      if (!tile.abort.signal.aborted) { tile.failed = true; status(); }
    }
  }

  function clear(key, tile) {
    tile.abort.abort();
    if (tile.url) URL.revokeObjectURL(tile.url);
    tile.img.remove();
    tiles.delete(key);
  }

  function draw() {
    if (disposed) return;
    controls.hidden = marker.hidden = !point;
    zoomIn.disabled = zoom === MAX_ZOOM;
    zoomOut.disabled = zoom === MIN_ZOOM;
    const w = viewport.clientWidth, h = viewport.clientHeight;
    if (!point) {
      for (const [key, tile] of tiles) clear(key, tile);
      status();
      return;
    }
    if (!w || !h) return;
    const count = 2 ** zoom, size = count * TILE_SIZE;
    const left = centre[0] * size - w / 2, top = centre[1] * size - h / 2;
    const keys = new Set();
    for (let y = Math.max(0, Math.floor(top / TILE_SIZE)); y < Math.min(count, Math.ceil((top + h) / TILE_SIZE)); y++) {
      for (let x = Math.floor(left / TILE_SIZE); x < Math.ceil((left + w) / TILE_SIZE); x++) {
        const key = `${zoom}/${x}/${y}`;
        keys.add(key);
        let tile = tiles.get(key);
        if (!tile) {
          const img = document.createElement('img');
          img.alt = '';
          img.draggable = false;
          tile = { img, abort: new AbortController() };
          tiles.set(key, tile);
          img.addEventListener('load', () => { tile.loaded = true; status(); });
          img.addEventListener('error', () => { tile.failed = true; img.hidden = true; status(); });
          layer.append(img);
          const wrappedX = ((x % count) + count) % count;
          load(tile, `/api/map_tiles/raster/${zoom}/${wrappedX}/${y}.png`);
        }
        tile.img.style.transform = `translate(${x * TILE_SIZE - left}px,${y * TILE_SIZE - top}px)`;
      }
    }
    for (const [key, tile] of tiles) if (!keys.has(key)) clear(key, tile);
    const offset = point[0] - centre[0];
    marker.style.left = `${w / 2 + (offset - Math.round(offset)) * size}px`;
    marker.style.top = `${point[1] * size - top}px`;
    status();
  }

  const resize = new ResizeObserver(draw);
  resize.observe(viewport);
  controls.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-recentre')) { following = true; centre = point; }
    else zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + Number(button.dataset.zoom)));
    draw();
  });
  viewport.addEventListener('pointerdown', (event) => {
    if (!point || event.button !== 0 || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, centre };
    viewport.setPointerCapture(drag.id);
  });
  viewport.addEventListener('pointermove', (event) => {
    if (drag?.id !== event.pointerId) return;
    following = false;
    // clientWidth/clientHeight are the unscaled map size.
    const bounds = viewport.getBoundingClientRect();
    const size = TILE_SIZE * 2 ** zoom;
    const x = drag.centre[0] - (event.clientX - drag.x) * viewport.clientWidth / bounds.width / size;
    const y = drag.centre[1] - (event.clientY - drag.y) * viewport.clientHeight / bounds.height / size;
    centre = [((x % 1) + 1) % 1, Math.max(0, Math.min(1, y))];
    draw();
  });
  viewport.addEventListener('lostpointercapture', (event) => { if (drag?.id === event.pointerId) drag = null; });
  return {
    update(state) {
      const position = personPoint(state);
      const next = position && worldPoint(position);
      if (next?.[0] === point?.[0] && next?.[1] === point?.[1] && point !== undefined) return;
      point = next;
      if (!point) { drag = null; following = true; }
      if (following) centre = point;
      draw();
    },
    draw,
    dispose() {
      disposed = true;
      resize.disconnect();
      for (const [key, tile] of tiles) clear(key, tile);
    },
  };
}

export function mountPerson(dialog, { person, getState, request, timeZone, formatTime, place, age, isLocalImage, escape, restoreFocus }) {
  const map = mountMap(dialog, request);
  const title = dialog.querySelector('#person-title'), summary = dialog.querySelector('#person-summary');
  const viewport = dialog.querySelector('.person-map-viewport');
  const [mapTab, activityTab] = dialog.querySelectorAll('[role="tab"]');
  const mapPanel = dialog.querySelector('#person-map-panel'), activity = dialog.querySelector('#person-activity-panel');
  const status = activity.querySelector('.person-activity-status'), history = activity.querySelector('.person-history');
  const timeline = activity.querySelector('.person-timeline'), axis = activity.querySelector('.person-axis');
  const legend = activity.querySelector('.person-legend'), list = activity.querySelector('ol');
  let disposed = false, requested = 0, lastFace;

  function showHistory(changes, start, end) {
    const timelineParts = changes[0].time === start ? changes : [{ time: start }, ...changes];
    const label = (state) => state == null ? 'No data' : ['unknown', 'unavailable'].includes(state) ? 'Unavailable' : place(state);
    const labels = new Map();
    timeline.innerHTML = timelineParts.map(({ state, time }, i) => {
      const share = ((timelineParts[i + 1]?.time ?? end) - time) / (end - start) * 100;
      const key = state == null ? 'missing' : stateColour(state);
      labels.set(label(state), key);
      return `<span class="person-segment ${key}" style="flex-basis:${share}%" title="${escape(label(state))}">${share >= 14 ? escape(label(state)) : ''}</span>`;
    }).join('');
    const steps = end - start >= 4 * 3600000 ? [0, 1, 2, 3, 4] : [0, 4];
    axis.innerHTML = steps.map((i) => `<span>${formatTime(new Date(start + (end - start) * i / 4))}</span>`).join('');
    legend.innerHTML = [...labels].map(([labelText, key]) => `<span class="${key}"><i></i>${escape(labelText)}</span>`).join('');
    const events = changes.filter(({ time }) => time > start).reverse();
    list.innerHTML = events.map(({ state, time }) => `<li class="${stateColour(state)}"><i aria-hidden="true"></i><strong>${escape(label(state))}</strong><time datetime="${new Date(time).toISOString()}">${formatTime(new Date(time), { second: '2-digit' })}</time></li>`).join('');
    list.nextElementSibling.hidden = Boolean(events.length);
    list.parentElement.scrollTop = 0;
    activity.querySelector('.person-date').textContent = new Date(end).toLocaleDateString('en-AU', { timeZone, weekday: 'short', day: 'numeric', month: 'long' });
    history.hidden = false;
  }

  async function loadHistory() {
    const seq = ++requested;
    const end = Date.now(), start = localDayStart(end, timeZone);
    status.textContent = 'Loading activity…';
    history.hidden = true;
    try {
      const records = await request({
        type: 'history/history_during_period', entity_ids: [person.id],
        start_time: new Date(start).toISOString(), end_time: new Date(end).toISOString(),
        minimal_response: true, no_attributes: true, include_start_time_state: true,
      });
      if (disposed || seq !== requested) return;
      const changes = stateChanges(records?.[person.id], start, end);
      status.textContent = changes.length ? '' : 'No recorded activity today.';
      if (changes.length) showHistory(changes, start, Math.max(start + 1, end));
    } catch {
      if (!disposed && seq === requested) status.textContent = 'Activity unavailable. Switch back to Activity to retry.';
    }
  }

  const select = (tab) => {
    const active = tab === activityTab;
    mapTab.setAttribute('aria-selected', String(!active));
    activityTab.setAttribute('aria-selected', String(active));
    mapTab.tabIndex = active ? -1 : 0;
    activityTab.tabIndex = active ? 0 : -1;
    mapPanel.hidden = active;
    activity.hidden = !active;
    if (active) loadHistory();
    else { requested++; map.draw(); }
  };
  const tabs = [mapTab, activityTab];
  for (const tab of tabs) {
    tab.addEventListener('click', () => { if (tab.getAttribute('aria-selected') === 'false') select(tab); });
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? mapTab : event.key === 'End' ? activityTab : tabs.find((item) => item !== tab);
      if (tab !== next) select(next);
      next.focus();
    });
  }
  return {
    update() {
      const state = getState();
      const name = (state?.attributes?.friendly_name ?? person.id.split('.')[1]).split(' ')[0];
      const picture = state?.attributes?.entity_picture;
      const face = isLocalImage(picture, location.origin) && new URL(picture, location.href).origin === location.origin
        ? `<img class="avatar" src="${escape(picture)}" alt="">` : escape(name[0] ?? '?');
      if (lastFace !== face) {
        for (const el of dialog.querySelectorAll('[data-person-face]')) {
          el.style.backgroundColor = person.colour;
          el.innerHTML = face;
        }
        lastFace = face;
      }
      if (title.textContent !== name) title.textContent = name;
      viewport.setAttribute('aria-label', `Map of ${name}’s reported position`);
      const changed = Date.parse(state?.last_changed);
      const label = !state || ['unknown', 'unavailable'].includes(state.state) ? 'Unavailable' : place(state.state);
      const content = `${label}${Number.isFinite(changed) ? ` · Last changed ${age(state.last_changed)} ago` : ''}`;
      if (summary.textContent !== content) summary.textContent = content;
      map.update(state);
    },
    dispose() { disposed = true; map.dispose(); restoreFocus(); },
  };
}
