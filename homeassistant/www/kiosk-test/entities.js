// Pure logic: no DOM, no network. Imported by the page and by Node (tests, smoke script).

export const UNASSIGNED = 'unassigned';

// Matches anything shaped like an entity ID.
const ENTITY_RE = /\b[a-z_]+\.[a-z0-9_]+\b/g;

export const domainOf = (entityId) => entityId.slice(0, entityId.indexOf('.'));

/** `?dash=a,b` → ['a', 'b']; `default` or an empty item means the default dashboard (null). */
export function parseDashParam(search) {
  const raw = new URLSearchParams(search).get('dash');
  if (raw === null) return null;
  return raw.split(',').map((s) => s.trim()).map((s) => (s === '' || s === 'default' ? null : s));
}

export const isStrategyDashboard = (config) =>
  Boolean(config && typeof config === 'object' && config.strategy);

/**
 * Finds every entity referenced anywhere in a Lovelace config, including templates and
 * card-specific keys, by scanning the serialised config.
 *
 * @param {object} config Lovelace config from `lovelace/config`.
 * @param {Iterable<string>} knownEntityIds Entity IDs present in the state machine.
 * @param {{services?: Iterable<string>}} [options] `domain.service` names to keep out of `missing`.
 * @returns {{entities: string[], missing: string[]}}
 */
export function extractEntities(config, knownEntityIds, options = {}) {
  const known = knownEntityIds instanceof Set ? knownEntityIds : new Set(knownEntityIds);
  const services = new Set(options.services ?? []);
  const domains = new Set([...known].map(domainOf));
  // Blank out JSON escapes so "\nlight.x" in a multi-line template isn't read as "nlight.x".
  const text = JSON.stringify(config ?? {}).replace(/\\(?:u[0-9a-fA-F]{4}|.)/g, ' ');

  const entities = [];
  const missing = [];
  const seen = new Set();
  ENTITY_RE.lastIndex = 0;
  let m;
  while ((m = ENTITY_RE.exec(text)) !== null) {
    const id = m[0];
    const domain = domainOf(id);
    if (known.has(id)) {
      if (!seen.has(id)) { seen.add(id); entities.push(id); }
    } else if (domains.has(domain)) {
      if (!seen.has(id) && !services.has(id)) { seen.add(id); missing.push(id); }
    } else {
      // Not an entity: retry after the first dot so "states.sensor.x" still finds "sensor.x".
      ENTITY_RE.lastIndex = m.index + domain.length + 1;
    }
  }
  return { entities, missing };
}

/** Merges per-dashboard extraction results, keeping first-seen order. */
export function mergeExtractions(results) {
  const entities = [];
  const missing = [];
  const e = new Set();
  const mi = new Set();
  for (const r of results) {
    for (const id of r.entities) if (!e.has(id)) { e.add(id); entities.push(id); }
    for (const id of r.missing) if (!mi.has(id)) { mi.add(id); missing.push(id); }
  }
  return { entities, missing };
}

/** Accepts the `list_for_display` result ({entities: [{ei, ai, di, hb}]}) or a plain array of entries. */
export function displayEntries(entityRegistry) {
  if (!entityRegistry) return [];
  return Array.isArray(entityRegistry) ? entityRegistry : entityRegistry.entities ?? [];
}

/**
 * Fallback entity set: everything in the state machine that the registry doesn't mark hidden.
 * Disabled entities have no state, so they never appear in `stateIds`.
 */
export function fallbackEntities(stateIds, entityRegistry) {
  const hidden = new Set(displayEntries(entityRegistry).filter((e) => e.hb).map((e) => e.ei));
  return [...stateIds].filter((id) => !hidden.has(id)).sort();
}

/**
 * Groups entities by area: the entity's own area, else its device's area, else `unassigned`.
 * Areas are sorted by name with `unassigned` last; entity order within an area is kept.
 *
 * @param {string[]} entityIds
 * @param {{areas?: {area_id: string, name: string}[], devices?: {id: string, area_id?: string|null}[], entities?: any}} registries
 * @returns {{id: string, name: string, entityIds: string[]}[]}
 */
export function groupByArea(entityIds, registries) {
  const areaNames = new Map((registries.areas ?? []).map((a) => [a.area_id, a.name]));
  const deviceArea = new Map((registries.devices ?? []).map((d) => [d.id, d.area_id ?? null]));
  const entries = new Map(displayEntries(registries.entities).map((e) => [e.ei, e]));

  const groups = new Map();
  for (const id of entityIds) {
    const entry = entries.get(id);
    let area = entry?.ai ?? (entry?.di ? deviceArea.get(entry.di) : null) ?? null;
    if (!area || !areaNames.has(area)) area = UNASSIGNED;
    if (!groups.has(area)) groups.set(area, []);
    groups.get(area).push(id);
  }
  return [...groups.entries()]
    .map(([id, ids]) => ({ id, name: id === UNASSIGNED ? 'Unassigned' : areaNames.get(id), entityIds: ids }))
    .sort((a, b) => sortGroups(a, b));
}

/** Registry-free fallback: one group per domain, sorted by domain. */
export function groupByDomain(entityIds) {
  const groups = new Map();
  for (const id of entityIds) {
    const d = domainOf(id);
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d).push(id);
  }
  return [...groups.entries()]
    .map(([id, ids]) => ({ id, name: titleCase(id), entityIds: ids }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function sortGroups(a, b) {
  if (a.id === UNASSIGNED) return 1;
  if (b.id === UNASSIGNED) return -1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

const titleCase = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Applies one `subscribe_entities` message (compressed format) to `states`, a Map of
 * entity_id → state object. Changed entities get a new object; untouched ones keep theirs.
 * Returns the set of entity IDs that changed or were removed.
 */
export function applyEntityDiff(states, msg, replace = false) {
  const changed = new Set();
  if (replace) {
    for (const id of states.keys()) if (!msg.a || !(id in msg.a)) { states.delete(id); changed.add(id); }
  }
  for (const [id, s] of Object.entries(msg.a ?? {})) {
    const lc = new Date(s.lc * 1000).toISOString();
    states.set(id, {
      entity_id: id,
      state: s.s,
      attributes: s.a ?? {},
      last_changed: lc,
      last_updated: s.lu ? new Date(s.lu * 1000).toISOString() : lc,
    });
    changed.add(id);
  }
  for (const id of msg.r ?? []) {
    states.delete(id);
    changed.add(id);
  }
  for (const [id, diff] of Object.entries(msg.c ?? {})) {
    const old = states.get(id);
    if (!old) continue;
    const next = { ...old };
    const add = diff['+'];
    const remove = diff['-'];
    if (add?.a || remove?.a) next.attributes = { ...old.attributes, ...(add?.a ?? {}) };
    for (const key of remove?.a ?? []) delete next.attributes[key];
    if (add?.s !== undefined) next.state = add.s;
    if (add?.lc) next.last_updated = next.last_changed = new Date(add.lc * 1000).toISOString();
    else if (add?.lu) next.last_updated = new Date(add.lu * 1000).toISOString();
    states.set(id, next);
    changed.add(id);
  }
  return changed;
}

// ---- Display helpers ----

const SECRET_KEYS = new Set(['token', 'access_token', 'api_key', 'key', 'password']);
const REDACTED = '••••';

/** Replaces secret query parameters in a URL-ish string, keeping the rest readable. */
export function redactUrl(value) {
  if (typeof value !== 'string' || !value.includes('?')) return value;
  return value.replace(/([?&])([^=&#]+)=([^&#]*)/g, (all, sep, name, val) =>
    (SECRET_KEYS.has(name.toLowerCase()) ? `${sep}${name}=${REDACTED}` : all));
}

/** Deep-copies an attribute value with secret keys and URL query secrets redacted. */
export function redact(value, key = '') {
  if (SECRET_KEYS.has(String(key).toLowerCase())) return REDACTED;
  if (typeof value === 'string') return redactUrl(value);
  if (Array.isArray(value)) return value.map((v) => redact(v));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k)]));
  }
  return value;
}

export const isUnavailable = (state) => !state || state.state === 'unavailable' || state.state === 'unknown';

const BINARY_WORDS = {
  door: ['Closed', 'Open'], garage_door: ['Closed', 'Open'], opening: ['Closed', 'Open'], window: ['Closed', 'Open'],
  lock: ['Locked', 'Unlocked'], motion: ['Clear', 'Detected'], occupancy: ['Clear', 'Detected'],
  presence: ['Away', 'Home'], moisture: ['Dry', 'Wet'], smoke: ['Clear', 'Detected'], gas: ['Clear', 'Detected'],
  carbon_monoxide: ['Clear', 'Detected'], sound: ['Clear', 'Detected'], vibration: ['Clear', 'Detected'],
  tamper: ['Clear', 'Tampered'], problem: ['OK', 'Problem'], safety: ['Safe', 'Unsafe'],
  connectivity: ['Disconnected', 'Connected'], plug: ['Unplugged', 'Plugged in'], power: ['Off', 'On'],
  battery: ['Normal', 'Low'], battery_charging: ['Not charging', 'Charging'], cold: ['Normal', 'Cold'],
  heat: ['Normal', 'Hot'], light: ['No light', 'Light detected'], moving: ['Not moving', 'Moving'],
  running: ['Not running', 'Running'], update: ['Up to date', 'Update available'],
};

/** Words a binary_sensor state by its device_class (open/closed, detected/clear…). */
export function binarySensorText(state, deviceClass) {
  if (state !== 'on' && state !== 'off') return titleCase(String(state));
  const words = BINARY_WORDS[deviceClass] ?? ['Off', 'On'];
  return state === 'on' ? words[1] : words[0];
}

/** Steps a numeric value, clamped to [min, max] and rounded to the step's precision. */
export function stepValue(current, step, direction, min = -Infinity, max = Infinity) {
  const decimals = (String(step).split('.')[1] ?? '').length;
  const next = Number((Number(current) + direction * step).toFixed(decimals));
  return Math.min(max, Math.max(min, next));
}

/** Climate target step: the entity's own, else 0.5 °C / 1 °F like HA's frontend. */
export function climateStep(attributes) {
  if (attributes.target_temp_step) return attributes.target_temp_step;
  return attributes.temperature_unit === '°F' ? 1 : 0.5;
}

/** True when an image URL points at Home Assistant itself (relative or same origin). */
export function isLocalImage(url, origin) {
  if (typeof url !== 'string' || url === '') return false;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  return Boolean(origin) && url.startsWith(`${origin}/`);
}
