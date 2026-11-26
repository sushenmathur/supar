// Page version. Bump with tools/kiosk-test/bump-version.mjs --dir homeassistant/www/kiosk-home-glass
export const VERSION = '36';

// Entity IDs, taken from the hubhome view in homeassistant/dashboard/master.yaml.
export const E = {
  weather: 'weather.north_lakes_weather',
  sun: 'sun.sun',
  quietHour: 'input_boolean.quiet_hour',
  snooze: 'input_boolean.alert_banner_snooze',
  keepGarage: 'input_boolean.keep_garage_door_open',
  keepSide: 'input_boolean.keep_side_door_open',
  garageContact: 'binary_sensor.garage_door_sensor_contact',
  sideContact: 'binary_sensor.side_door_contact',
  screenContact: 'binary_sensor.crimsafe_door_contact',
  frontContact: 'binary_sensor.front_door_contact',
  patioContact: 'binary_sensor.patio_door_contact',
  laundryContact: 'binary_sensor.laundrydoorsensor_contact',
  hallwayContact: 'binary_sensor.hallwaydoorsensor_contact',
  sideBattery: 'sensor.side_battery',
  robbieDock: 'sensor.robbie_dock_dock_error',
  robbie: 'vacuum.robbie',
  goodNight: 'scene.good_night',
  festive: 'switch.festive_lights',
  announceMessage: 'input_text.announce_message',
  announceSpeaker: 'input_select.announce_speaker',
  announceVolume: 'input_number.announce_volume',
  garageCover: 'cover.garage_door_v2',
  garageLight: 'light.garage_light',
  garageState: 'input_select.garage_door_state',
  frontDoor: 'input_boolean.front_door',
  alarm: 'alarm_control_panel.home_alarm',
  tv: 'media_player.tv',
  aircon: 'climate.living_room',
  calendar: 'calendar.supar_family',
  camera: 'camera.front_door_snapshot_2',
  garageCamera: 'camera.garage_live_view',
  cameraLive: 'camera.front_door_live_view_2',
  washer: 'sensor.washer_current_status',
  washerEnd: 'sensor.washer_remaining_time',
  dryer: 'sensor.dryer_current_status',
  dryerEnd: 'sensor.dryer_remaining_time',
  tariff: 'select.grid_import_tariff',
  rate: 'sensor.current_energy_rate',
  costToday: 'sensor.daily_import_cost',
  solarCredit: 'sensor.daily_solar_credit',
  billToDate: 'sensor.electricity_bill_to_date',
  billEstimate: 'sensor.electricity_estimated_bill',
  solarPower: 'sensor.sh50rs_a21c2106894_mppt_total_power',
  importPower: 'sensor.sh50rs_a21c2106894_purchased_power',
  exportPower: 'sensor.sh50rs_a21c2106894_total_export_active_power',
  teslaCharger: 'sensor.sonic_charger_power',
  kiaCharger: 'sensor.kia_charger_power',
  shanaya: 'binary_sensor.shanaya_room_occupancy_status',
  samar: 'binary_sensor.samar_room_occupancy_new',
  bedroomTv: 'switch.bedroom_tv',
};

// charge: the phone's charging status, first entity preferred, the next used if it's missing or unavailable.
export const PEOPLE = [
  { id: 'person.sushenmathur', battery: 'sensor.sushen_iphone_battery_level', charge: ['sensor.sushen_phone_battery_status', 'sensor.sushen_iphone_battery_state'], colour: '#3a4aa6' },
  { id: 'person.paro', battery: 'sensor.paro_phone_battery', charge: ['sensor.paro_phone_battery_status', 'sensor.paro_iphone_battery_state'], colour: '#6b4a8e' },
];

// Cars: card badge (the logo image in /config/www/images/, else a built-in Kia wordmark / Tesla T), the pop-up's
// photo and its controls (from master.yaml's chips).
export const CARS = [
  { name: 'Sorento', brand: 'kia', logo: '/local/images/kialogo.png', tracker: 'device_tracker.kia_gps_location', battery: 'input_number.kia_battery_estimate', chargingPower: 'sensor.kia_charger_power',
    onroad: 'input_boolean.kia_onroad', image: '/api/image/serve/b0801eee9b5f2d6fcf7972d71f0d7711/512x512',
    chips: [['value', 'sensor.kia_charger_power', 'Charge power', 'plug'], ['value', 'sensor.kia_last_charge_added', 'Last charge', 'bolt'],
      ['toggle', 'switch.kia_charger', 'Charger', 'plug'], ['onroad', 'input_boolean.kia_onroad', 'On road', 'car'], ['home', 'binary_sensor.kia_at_home', 'Location', 'home']] },
  { name: 'Bluey', brand: 'tesla', logo: '/local/images/teslalogo.png', tracker: 'device_tracker.tesla', battery: 'sensor.sonic_battery', chargingFlag: 'binary_sensor.sonic_charging',
    onroad: 'input_boolean.tesla_onroad', image: '/api/image/serve/cdd510be49f2493bc87fd540c01cea69/512x512',
    chips: [['value', 'sensor.sonic_range_rated', 'Range', 'gauge'], ['value', 'sensor.bluey_charge_energy_added', 'Last charge', 'bolt'],
      ['lock', 'lock.bluey_lock', 'Lock', 'lock'], ['boot', 'cover.bluey_trunk', 'Boot', 'car'], ['charging', 'binary_sensor.sonic_charging', 'Charger', 'plug']] },
];

// Favourite lights (the six dynamic slots) and the 18-light pool they draw from.
export const FAV = ['light.kitchen_pendants', 'light.dining_light', 'light.sonoff_1000dbd8b7', 'light.tall_lamp', 'light.corridor_light', 'light.hallway_light'];
export const LIGHT_POOL = [...FAV, 'light.kitchenled', 'light.kitchen_downlights', 'light.aarlo_samar_cam', 'switch.sonoff_1000e54df1',
  'light.garage_light', 'light.driveway_light', 'switch.sonoff_1000905c71', 'switch.sonoff_100053e676',
  'switch.patio_lights', 'light.backyard_light', 'light.laundry_light', 'switch.festive_lights'];
export const LIGHT_META = {
  'light.kitchen_pendants': ['Kitchen Pendants', 'pendant'],
  'light.dining_light': ['Dining', 'pendant'],
  'light.sonoff_1000dbd8b7': ['Media Room', 'downlight'],
  'light.tall_lamp': ['Tall Lamp', 'lamp'],
  'light.corridor_light': ['Corridor', 'downlight'],
  'light.hallway_light': ['Hallway', 'downlight'],
  'light.kitchenled': ['Kitchen Bench', 'downlight'],
  'light.kitchen_downlights': ['Kitchen Downlights', 'downlight'],
  'light.aarlo_samar_cam': ['Samar Night Light', 'downlight'],
  'switch.sonoff_1000e54df1': [null, 'downlight'],
  'light.garage_light': ['Garage Downlight', 'downlight'],
  'light.driveway_light': ['Driveway Floodlight', 'spot'],
  'switch.sonoff_1000905c71': ['Door Downlight', 'downlight'],
  'switch.sonoff_100053e676': ['Outdoor Lights', 'bulb'],
  'switch.patio_lights': ['Patio Lights', 'sparkle'],
  'light.backyard_light': ['Backyard Spotlight', 'spot'],
  'light.laundry_light': ['Laundry Spotlight', 'spot'],
  'switch.festive_lights': ['Festive Light', 'sparkle'],
};

export const ROOM_LIGHTS = {
  living: ['light.dining_light', 'light.kitchen_pendants', 'light.kitchen_downlights', 'light.kitchenled', 'light.sonoff_1000dbd8b7', 'light.tall_lamp'],
  kids: ['light.aarlo_samar_cam', 'light.tall_lamp'],
  outdoor: ['switch.patio_lights', 'light.backyard_light', 'light.driveway_light', 'light.laundry_light', 'switch.sonoff_100053e676', 'switch.sonoff_1000905c71'],
};

export const SECURITY_CONTACTS = ['binary_sensor.garage_door_sensor_contact', 'binary_sensor.front_door_contact', 'binary_sensor.hallwaydoorsensor_contact',
  'binary_sensor.patio_door_contact', 'binary_sensor.side_door_contact', 'binary_sensor.laundrydoorsensor_contact'];

export const MEDIA = {
  skip: ['media_player.browser_', 'media_player.aarlo_', 'media_player.home_speakers_2', 'media_player.bluey_media_player', 'media_player.stremio_mathur_sushen_gmail_com_stremio'],
  names: { 'media_player.hubs_bedroom_apple_tv': 'Bedroom Apple TV', 'media_player.media_apple_tv': 'Media Apple TV', 'media_player.tv': 'TV' },
  switches: { 'switch.bedroom_tv': { name: 'Bedroom TV', player: 'media_player.hubs_bedroom_apple_tv' } },
};

// The Media pop-up's players, in the order they're listed when none is playing (the Media tile's list in
// master.yaml). ids: the first one Home Assistant has (and isn't unavailable) is used, so the bedroom Apple TV
// is listed once. remote: its power and long press use the TV remote. power: a switch that powers the device.
// Dark mode: 'sun' switches to dark after sunset and back at sunrise (sun.sun); 'system' follows the tablet's own
// light/dark setting (Kiosk Satellite or Android).
export const THEME = 'sun';

export const MEDIA_PLAYERS = [
  { ids: ['media_player.tv'], name: 'TV', icon: 'tv', remote: true },
  { ids: ['media_player.media_apple_tv'], name: 'Media Apple TV', icon: 'tv' },
  { ids: ['media_player.spotify'], name: 'Spotify', icon: 'music' },
  { ids: ['media_player.kitchen_speaker'], name: 'Kitchen speaker', icon: 'speaker' },
  { ids: ['media_player.bedroom_google_tv'], name: 'Bedroom Google TV', icon: 'tv' },
  { ids: ['media_player.hubs_bedroom_apple_tv', 'media_player.bedroom_apple_tv'], name: 'Bedroom Apple TV', icon: 'tv', power: 'switch.bedroom_tv', powerName: 'Bedroom TV' },
];

export const BINS = [
  { id: 'sensor.general_waste', label: 'General', lid: 'r' },
  { id: 'sensor.garden_organics', label: 'Garden', lid: 'g' },
  { id: 'sensor.recycling', label: 'Recycling', lid: 'y' },
];

// Robbie's room routines: [button, label, icon for the area].
export const ROBBIE_ROOMS = [
  ['button.robbie_kitchen_clean', 'Kitchen', 'kitchen'], ['button.robbie_media_clean', 'Media Room', 'tv'], ['button.robbie_media_kitchen2', 'Media & Kitchen', 'sofa'],
  ['button.robbie_coffee_station_clean', 'Coffee Station', 'coffee'], ['button.robbie_tiled_area_clean', 'Mop Tiled Area', 'mop'], ['button.robbie_hallways', 'Hallways', 'hallway'],
];
// Picture on Robbie's pop-up: /config/www/images/robbie.png, served by HA at /local/ (same origin).
// If it can't be loaded, the pop-up falls back to a built-in drawing of a Roborock Qrevo. '' uses the drawing.
export const ROBBIE_IMAGE = '/local/images/robbie.png';

// TV remote (press and hold the TV tile): quick sources from the Media TV pop-up (lg-remote-control).
// [source name as the TV lists it, label, badge colour]. Power uses script.media_tv_power, like a tap.
export const TV_SOURCES = [['Netflix', 'Netflix', '#E50914'], ['Prime Video', 'Prime Video', '#00A8E1'], ['Stremio', 'Stremio', '#7B5BF5'], ['YouTube', 'YouTube', '#FF0000']];

// Guest WiFi QR, the same image the dashboard's WiFi popup shows.
// Music Assistant's Home Assistant panel (same origin, so no host or IP in the page).
// Inside Kiosk Satellite the Music tab opens the kiosk's Music Library, by pressing its ESPHome button (Kiosk
// Satellite: Settings > ESPHome, Expose kiosk entities). nowPlaying is only used if there is no library button;
// null finds an entity by name (switch.*_now_playing, button.*_show_music_library). Without them, or outside
// Kiosk Satellite, the tab shows Music Assistant (MUSIC_PANEL).
export const KS_MUSIC = { nowPlaying: null, library: 'button.kitchen_tab_show_music_library' };
export const MUSIC_PANEL = '/d5369777_music_assistant';

export const WIFI_QR = '/api/image/serve/50750ef2d78e15cc901576e1c9fa2bae/512x512';

// Navigation to the existing Lovelace views (same origin, so Kiosk Satellite keeps them in the kiosk).
// Routes are hashes on this page, so Kiosk Satellite switches views without a reload.
export const NAV = [
  ['Home', 'home', 'home'], ['Rooms', 'rooms', 'rooms'], ['Lights', 'bulb', 'lights'],
  ['Climate', 'thermo', 'homeclimate'], ['Security', 'shield', 'security'], ['Music', 'music', 'music'],
  ['More', 'more', 'more'],
];
export const ROOM_ROUTES = [['living-room', 'Living', 'sofa'], ['kidsroom', 'Kids', 'kids'], ['garage', 'Garage', 'garage'], ['outdoor', 'Outdoor', 'tree'], ['laundry', 'Laundry', 'washer']];

// The navbar's More menu.
export const MORE = [['Phones', 'phone', '/ic3db-icloud3'], ['Settings', 'more', '/config'], ['Dev tools', 'key', '/developer-tools/yaml']];

export const CAMERA_REFRESH_MS = 10_000;
export const CONFIRM_WINDOW_MS = 3_000;
