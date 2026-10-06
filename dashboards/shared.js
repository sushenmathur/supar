/* Shared icons, entity data and helpers for the three dashboard concepts.
   Entity names mirror the existing Home Assistant dashboard. */
const P = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>',
  therm: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  mega: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
  wifi: '<path d="M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.86a10 10 0 0 1 14 0M8.5 16.43a5 5 0 0 1 7 0"/>',
  sofa: '<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="M4 18v2M20 18v2"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  garage: '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12M6 14h12"/><rect width="12" height="12" x="6" y="10"/>',
  trees: '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>',
  shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  tv: '<rect width="20" height="15" x="2" y="7" rx="2"/><path d="m17 2-5 5-5-5"/>',
  play: '<path d="M6 3 20 12 6 21z"/>',
  power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>',
  wind: '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>',
  snow: '<path d="M2 12h20M12 2v20"/><path d="m20 16-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  cloudsun: '<path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.95 12.65a4 4 0 0 0-5.93-4.13"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
  bot: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  lamp: '<path d="M8 2h8l4 10H4L8 2Z"/><path d="M12 12v6M8 22v-2c0-.6.4-1 1-1h6c.6 0 1 .4 1 1v2H8Z"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  up: '<path d="m5 12 7-7 7 7M12 19V5"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  plug: '<path d="M12 22v-5M9 8V2M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  batt: '<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/>',
  cell: '<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/>',
  door: '<path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20M14 12v.01"/>',
  unlock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
  chev: '<path d="m9 18 6-6-6-6"/>'
};
const ic = (n, s = 24, sw = 1.75) =>
  `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;

const D = {
  now: { time: '9:49', ampm: 'AM', date: 'Wednesday, 7 October', short: 'Wed 7 Oct', year: 2026 },
  weather: { temp: 27, sky: 'Partly cloudy', humidity: 63,
    days: [['Wed', 19, 27, 100], ['Thu', 17, 22, 58], ['Fri', 16, 25, 78]] },
  clocks: [['Austin', '6:49', 'pm'], ['India', '5:19', 'am']],
  event: { title: 'Samar Shanaya Swim Class', time: '4:30 – 5:00 PM', day: 'Wed', num: 7, mon: 'OCT' },
  people: [
    { name: 'Sushen', init: 'S', place: 'Office', addr: 'Fortitude Valley QLD', batt: 95, net: 'WiFi', ago: '43 min ago', hue: 200 },
    { name: 'Paro', init: 'P', place: 'Work', addr: 'Kelvin Grove QLD', batt: 86, net: 'Cellular', ago: '3 hrs ago', hue: 330 }
  ],
  status: [
    { name: 'Sorento', sub: 'Sushen · Work', icon: 'car' },
    { name: 'Bluey', sub: 'Paro · Work', icon: 'car' },
    { name: 'Shanaya Room', sub: 'Clear', icon: 'bed' },
    { name: 'Samar Room', sub: 'Occupied', icon: 'bed', hot: true }
  ],
  rooms: [
    { name: 'Living', sub: 'All off', icon: 'sofa' },
    { name: 'Kids', sub: '1 on', icon: 'smile', on: true },
    { name: 'Garage', sub: 'Door closed', icon: 'garage' },
    { name: 'Outdoor', sub: 'All off', icon: 'trees' },
    { name: 'Laundry', sub: 'Idle', icon: 'shirt' },
    { name: 'Media', sub: 'All off', icon: 'tv' }
  ],
  lights: [
    { name: 'Kitchen Pendants', icon: 'bulb' }, { name: 'Dining', icon: 'bulb' },
    { name: 'Media Room', icon: 'bulb' }, { name: 'Lamp', icon: 'lamp' },
    { name: 'Corridor', icon: 'bulb' }, { name: 'Hallway', icon: 'bulb' }
  ],
  quick: [
    { name: 'Good Night', icon: 'moon' }, { name: 'Announce', icon: 'mega' },
    { name: 'Lost Phone', icon: 'phone' }, { name: 'WiFi', icon: 'wifi' }
  ],
  nav: [
    { name: 'Home', icon: 'home', active: true }, { name: 'Rooms', icon: 'grid' },
    { name: 'Lights', icon: 'bulb', badge: 1 }, { name: 'Climate', icon: 'therm' },
    { name: 'Security', icon: 'shield', badge: 1 }, { name: 'Media', icon: 'tv' },
    { name: 'More', icon: 'more' }
  ],
  energy: { today: '0.54', sold: '0.15', bill: '108.16', est: '152.41', rate: '0.20',
    solar: '4.4', home: '473', grid: '4.0', self: 100,
    evs: [['Tesla', 'Not charging'], ['Kia', 'Not charging']] },
  security: { alarm: 'Disarmed', garage: 'Closed', front: 'Locked · Closed' },
  robot: { name: 'Robbie', state: 'Docked' }
};

function fit() {
  const s = Math.min(innerWidth / 1600, innerHeight / 1000);
  document.getElementById('stage').style.transform = `translate(-50%,-50%) scale(${s})`;
}
addEventListener('resize', fit);
addEventListener('DOMContentLoaded', fit);
document.addEventListener('click', e => {
  const t = e.target.closest('[data-toggle]');
  if (t) t.classList.toggle('on');
  const seg = e.target.closest('[data-seg] > *');
  if (seg) { seg.parentElement.querySelectorAll('.on').forEach(x => x.classList.remove('on')); seg.classList.add('on'); }
});
