// Page version. Bumped by tools/kiosk-test/bump-version.mjs, which also
// rewrites the matching ?v= query on every module import.
export const VERSION = '2';

// Lovelace dashboards to read entities from, by url_path (null = default dashboard).
// 'dashboard-hub' is inferred from the navigation paths in homeassistant/dashboard/master.yaml
// (e.g. /dashboard-hub/garage). Override on the page with ?dash=url_path1,url_path2.
export const SOURCE_DASHBOARDS = ['dashboard-hub'];

// Camera snapshot refresh interval for on-screen camera tiles.
export const CAMERA_REFRESH_MS = 10_000;

// How long a "Tap again" confirmation stays armed.
export const CONFIRM_WINDOW_MS = 3_000;
