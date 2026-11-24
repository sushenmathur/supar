// Pure helpers: no DOM, no network. Imported by the page and by Node tests.

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
    states.set(id, { entity_id: id, state: s.s, attributes: s.a ?? {}, last_changed: lc, last_updated: s.lu ? new Date(s.lu * 1000).toISOString() : lc });
    changed.add(id);
  }
  for (const id of msg.r ?? []) { states.delete(id); changed.add(id); }
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

export const isUnavailable = (s) => !s || s.state === 'unavailable' || s.state === 'unknown';

/** True when an image URL points at Home Assistant itself (relative or same origin). */
export function isLocalImage(url, origin) {
  if (typeof url !== 'string' || url === '') return false;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  return Boolean(origin) && url.startsWith(`${origin}/`);
}

/** "12 min", "1 h 5 min" from a past ISO time. */
export function durationSince(iso, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

export const num = (s) => { const v = parseFloat(s?.state); return Number.isFinite(v) ? v : null; };

export const cap = (v) => { const t = String(v ?? '').replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };
