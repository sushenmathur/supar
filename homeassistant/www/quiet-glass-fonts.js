/* Quiet Glass: loads Inter (400 / 500 / 600) for the dashboard.
 * Install: copy this file to /config/www/quiet-glass-fonts.js and the Inter .woff2 files to /config/www/fonts/
 * (run www/install-fonts.sh on the HA host), then add a Dashboard resource:
 *   URL /local/quiet-glass-fonts.js   Type: JavaScript module
 * Without the files the theme falls back to system-ui, so nothing breaks. */
(() => {
  if (document.getElementById('quiet-glass-fonts')) return;
  const face = (weight, file) =>
    `@font-face{font-family:'Inter';font-style:normal;font-weight:${weight};font-display:swap;` +
    `src:local('Inter'),url('/local/fonts/${file}.woff2') format('woff2');}`;
  const style = document.createElement('style');
  style.id = 'quiet-glass-fonts';
  style.textContent = face(400, 'Inter-Regular') + face(500, 'Inter-Medium') + face(600, 'Inter-SemiBold');
  document.head.appendChild(style);
})();
