/* Data and helpers for the November 2026 Home view redesign options (redesign-*.html).
   Values mirror the live Home view screenshot from 20 November 2026; the light, room and
   vehicle states are illustrative for the mock-up only. Load after shared.js (icons + ic()). */
Object.assign(P, {
  cam: '<path d="M16 10.5 21 7v10l-5-3.5"/><rect width="14" height="12" x="2" y="6" rx="2"/>',
  fan: '<path d="M12 12c-3-5-1-9 2-9 2 0 3 2 1.5 4.5L12 12Zm0 0c5-3 9-1 9 2 0 2-2 3-4.5 1.5L12 12Zm0 0c3 5 1 9-2 9-2 0-3-2-1.5-4.5L12 12Zm0 0c-5 3-9 1-9-2 0-2 2-3 4.5-1.5L12 12Z"/>',
  prev: '<path d="M19 20 9 12l10-8z"/><path d="M5 19V5"/>',
  next: '<path d="m5 4 10 8-10 8z"/><path d="M19 5v14"/>',
  pause: '<rect width="4" height="16" x="6" y="4" rx="1"/><rect width="4" height="16" x="14" y="4" rx="1"/>',
  away: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  grid2: '<path d="M2 12h3M19 12h3M12 2v3M8 4l1.5 2.5M16 4l-1.5 2.5"/><path d="M4 22 8 9h8l4 13"/><path d="M6 16h12"/>',
  ev: '<path d="M5 18V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12"/><path d="M3 18h14"/><path d="M15 9h2a2 2 0 0 1 2 2v3a1 1 0 0 0 2 0V8l-3-3"/><path d="m10 7-2 4h3l-2 4"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  bin: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>'
});

const H = {
  now: { time: '12:14', ampm: 'PM', day: 'Friday', date: '20 November', short: 'Fri 20 Nov', greet: 'Good afternoon' },
  weather: { temp: 27, sky: 'Sunny', hi: 29, lo: 19, rain: 0 },
  clocks: [['India', '7:44', 'am'], ['Austin', '8:14', 'pm']],
  people: [
    { name: 'Sushen', init: 'S', place: 'Home', batt: 80, home: true },
    { name: 'Paro', init: 'P', place: 'Work', batt: 66 }
  ],
  quick: [
    { name: 'Good Night', icon: 'moon' }, { name: 'Announce', icon: 'mega' },
    { name: 'Lost Phone', icon: 'phone' }, { name: 'WiFi', icon: 'wifi' }, { name: 'Robbie', icon: 'bot', sub: 'Docked' }
  ],
  rooms: [
    { id: 'living', name: 'Living', icon: 'sofa', sub: 'All off', on: 0 },
    { id: 'kids', name: 'Kids', icon: 'smile', sub: "Samar's room occupied", on: 0, busy: true },
    { id: 'garage', name: 'Garage', icon: 'garage', sub: 'Door closed', on: 0 },
    { id: 'outdoor', name: 'Outdoor', icon: 'trees', sub: 'All off', on: 0 },
    { id: 'laundry', name: 'Laundry', icon: 'shirt', sub: 'Idle', on: 0 },
    { id: 'media', name: 'Media', icon: 'tv', sub: 'TV playing', on: 1, busy: true }
  ],
  lights: [
    { name: 'Kitchen Pendants', icon: 'bulb', on: false },
    { name: 'Bedroom Downlights', icon: 'bulb', on: true, lvl: 80 },
    { name: 'Media Room', icon: 'bulb', on: false },
    { name: 'Tall Lamp', icon: 'lamp', on: false },
    { name: 'Corridor', icon: 'bulb', on: false },
    { name: 'Hallway', icon: 'bulb', on: true, lvl: 60 }
  ],
  tv: { name: 'TV', state: 'Playing', src: 'Apple OTT' },
  ac: { state: 'Off', set: 27, inside: 24 },
  agenda: [
    { t: 'All day', title: 'Day off work' },
    { t: 'All day', title: 'Working day' },
    { t: '5:00 – 5:45 PM', title: 'Summer Sixes', start: 17, end: 17.75 }
  ],
  cars: [
    { name: 'Sorento', sub: 'Home', pct: 97, kind: 'Fuel' },
    { name: 'Bluey', sub: 'Paro · Work', pct: 71, kind: 'Battery' }
  ],
  security: { alarm: 'Disarmed', garage: 'Closed', front: 'Locked', frontSub: 'Locked · closed' },
  energy: { period: 'Off-peak', rate: '0.18', today: '2.63', sold: '0.24', bill: '17.09', est: '128.17',
    solar: 4.6, home: 1.6, grid: 3.0, self: 100, evs: [['Tesla', 'Not charging', '0 W'], ['Kia', 'Not charging', '0 W']] },
  nav: [
    { name: 'Home', icon: 'home', active: true }, { name: 'Rooms', icon: 'grid' },
    { name: 'Lights', icon: 'bulb', badge: 2 }, { name: 'Climate', icon: 'therm' },
    { name: 'Security', icon: 'shield', badge: 1 }, { name: 'Music', icon: 'music' }, { name: 'More', icon: 'more' }
  ]
};

/* ?theme=dark|light pins the theme for screenshots; T toggles it live. */
(function () {
  const q = new URLSearchParams(location.search).get('theme');
  if (q) document.documentElement.dataset.theme = q;
  addEventListener('keydown', e => {
    if (e.key.toLowerCase() !== 't') return;
    const r = document.documentElement, dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    r.dataset.theme = dark ? 'light' : 'dark';
  });
})();
