// Connects to Home Assistant: through Kiosk Satellite's shared connection when inside KS,
// otherwise with the Home Assistant session this browser already has.
import { createConnection, getAuth, ERR_INVALID_AUTH } from './vendor/haws.mjs?v=1';

export const MESSAGES = {
  ksAuth: 'Turn on Share Home Assistant connection in Settings › Home Assistant › Custom Pages, and make sure this page is added as a custom page.',
  noSession: "Open Home Assistant in this browser, sign in with 'Keep me logged in' ticked, then reload this page.",
  unreachable: "Can't reach Home Assistant. Retrying…",
};

/** A failure that retrying won't fix. `kind` is 'ksAuth' or 'noSession'. */
export class FatalConnectError extends Error {
  constructor(kind) {
    super(MESSAGES[kind]);
    this.kind = kind;
  }
}

export const inKioskSatellite = () => window.kioskSatellite?.platform === 'kiosksatellite';

const TOKEN_KEY = 'hassTokens';

function loadTokens() {
  try {
    const tokens = JSON.parse(localStorage.getItem(TOKEN_KEY));
    return tokens && tokens.access_token ? tokens : null;
  } catch {
    return null;
  }
}

function saveTokens(tokens) {
  try {
    if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked; the session still works until the page is reloaded.
  }
}

async function attempt() {
  const ks = window.kioskSatellite;
  if (inKioskSatellite() && ks.ha?.createSocket) {
    try {
      return { conn: await createConnection({ createSocket: ks.ha.createSocket }), via: 'kiosk-satellite' };
    } catch (err) {
      if (err === ERR_INVALID_AUTH) throw new FatalConnectError('ksAuth');
      throw err;
    }
  }

  const tokens = loadTokens();
  // getAuth would redirect to HA's login page if the stored session is for another address,
  // so treat that as "no session" and let the person sign in themselves.
  if (!tokens || tokens.hassUrl !== location.origin) throw new FatalConnectError('noSession');
  try {
    const auth = await getAuth({ hassUrl: location.origin, loadTokens: async () => tokens, saveTokens });
    return { conn: await createConnection({ auth }), via: 'browser-session' };
  } catch (err) {
    if (err === ERR_INVALID_AUTH) throw new FatalConnectError('noSession');
    throw err;
  }
}

/**
 * Resolves with `{conn, via}` once connected. Retries unreachable errors with backoff
 * (1 s doubling to 30 s), calling `onRetry(delayMs)` before each wait. Rejects with
 * FatalConnectError when retrying can't help.
 */
export async function connect({ onRetry } = {}) {
  for (let tries = 0; ; tries++) {
    try {
      return await attempt();
    } catch (err) {
      if (err instanceof FatalConnectError) throw err;
      const delay = Math.min(30_000, 1000 * 2 ** tries);
      // Log the first failure and then every fifth, so a long outage doesn't flood the console.
      if (tries % 5 === 0) console.warn(`kiosk-home: can't reach Home Assistant (attempt ${tries + 1}, code ${errorCode(err)}), retrying`);
      onRetry?.(delay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/** A short, log-safe description of an error (never the error object itself). */
export function errorCode(err) {
  if (typeof err === 'number') return `haws-${err}`;
  return err?.code ?? err?.error?.code ?? err?.name ?? 'unknown';
}
