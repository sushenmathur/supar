#!/usr/bin/env python3
"""Builds dashboards/redesign-quiet-glass.html: a static 1280x800 mock-up of the Quiet Glass Home view.
Tokens are read from ../homeassistant/themes/glass.yaml, so the mock-up cannot drift from the theme.
  python3 dashboards/build-quiet-glass.py
Open the page with  ?theme=light|dark  &scene=calm|busy|popup|energy|saver  (&shot hides the controls)."""
import json, os, re, yaml

here = os.path.dirname(os.path.abspath(__file__))
theme = yaml.safe_load(open(os.path.join(here, '..', 'homeassistant', 'themes', 'glass-2.yaml')))['Glass 2']
modes = theme['modes']
saver = yaml.safe_load(open(os.path.join(here, '..', 'homeassistant', 'themes', 'glass-2.yaml')))['Glass 2 Saver']
TOKEN_KEYS = [k for k in theme if k.split('-')[0] in ('space', 'radius', 'fs', 'fw', 'lh', 'tap', 'disc', 'dot', 'bar', 'icon', 'ring', 'popup', 'saver', 'opacity', 'dur', 'ease') or k in ('font-sans',)]
shared = '\n'.join(f'  --{k}: {theme[k]};' for k in TOKEN_KEYS if not str(theme[k]).startswith('var('))
def block(sel, vals):
    keys = ['surface-0', 'surface-1', 'surface-2', 'text-1', 'text-2', 'hairline', 'accent', 'on-accent', 'state-on', 'state-on-ink', 'state-on-tint', 'state-alert', 'state-alert-ink',
            'state-alert-tint', 'on-alert', 'state-warn', 'state-warn-ink', 'state-warn-tint', 'state-ok', 'state-ok-ink', 'state-ok-tint', 'shadow-card', 'shadow-pop',
            'glass-bg', 'glass-border', 'glass-blur', 'popup-bg', 'scrim']
    return sel + ' {\n' + '\n'.join(f'  --{k}: {vals[k]};' for k in keys if k in vals) + '\n}\n'
saver_vars = block(':root[data-scene="saver"]', {**{k: modes['dark'][k] for k in modes['dark']}, **{k: v for k, v in saver.items() if k in modes['dark']}})

I = json.loads(__import__('subprocess').check_output(['node', '-e', r"""
const fs=require('fs');const src=fs.readFileSync(process.argv[1],'utf8');
const m=src.match(/const P = \{([\s\S]*?)\n\};/);const P=eval('({'+m[1]+'})');
P.check='<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>';
P.alert='<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>';
P.shieldok='<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>';
P.shieldwarn='<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4M12 16h.01"/>';
P.tower='<path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9M7.8 4.7a6.14 6.14 0 0 0-.8 7.5M16.2 4.7a6.14 6.14 0 0 1 .9 7.5M19.1 1.9a10.16 10.16 0 0 1 0 14.1M9.5 18h5M8 22l4-11 4 11M8 22h8"/>';
P.washer='<rect width="18" height="20" x="3" y="2" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M7 6h.01M11 6h.01"/>';
P.close='<path d="M18 6 6 18M6 6l12 12"/>';
P.garageopen='<path d="M3 9v11M21 9v11M3 9l9-6 9 6"/><path d="M7 20v-5h10v5"/>';
P.leaf='<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>';
P.bin='<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>';
P.recycle='<path d="M7 19H4.8a1.83 1.83 0 0 1-1.6-2.7L5 13M11 19h6.4a1.83 1.83 0 0 0 1.6-2.7L17 13M14 16l-3 3 3 3M8.3 10.8 5 8l3-3M10.1 4.5l.9-1.5a1.83 1.83 0 0 1 3.2 0l1.8 3"/>';
P.user='<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>';
P.volume='<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>';
P.external='<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>';
P.sleep='<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>';
process.stdout.write(JSON.stringify(P));""", os.path.join(here, 'shared.js')]))
sprite = ''.join(f'<symbol id="i-{k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{v}</symbol>' for k, v in I.items())
ic = lambda n, cls='': f'<svg class="ic {cls}"><use href="#i-{n}"/></svg>'

def room(name, icon, label, on=False): return f'<div class="card room{" on" if on else ""}"><span class="disc">{ic(icon)}</span><b>{name}</b><span class="lbl">{label}</span></div>'
def tog(name, icon, on=False): return f'<div class="card tog{" on" if on else ""}">{ic(icon)}<b>{name}</b><span class="lbl">{"On" if on else "Off"}</span></div>'
def now(icon, name, label, tone='', extra=''): return f'<div class="card now {tone}"><span class="disc">{ic(icon)}</span><b>{name}</b><span class="lbl">{label}</span>{extra}</div>'
def zone(name): return f'<div class="card tog">{ic("bot")}<b>{name}</b></div>'
def scene(name, icon): return f'<div class="card scene">{ic(icon, "lg")}<span>{name}</span></div>'
def navitem(name, icon, active=False, badge=0):
    return f'<div class="nv{" act" if active else ""}">{ic(icon)}<span>{name}</span>{f"<i class=badge>{badge}</i>" if badge else ""}</div>'
def seg(items, on): return '<div class="seg">' + ''.join(f'<span class="{"on" if i == on else ""}">{t}</span>' for i, t in enumerate(items)) + '</div>'

def person(name, place, home, img):
    return f'<div class="person"><span class="av" style="background:{img}">{name[0]}<i class="dot{" ok" if home else ""}"></i></span><span class="pl"><b>{name}</b><br>{place}</span></div>'

def home(scene_name):
    busy = scene_name == 'busy'
    clock, ap = ('9:12', 'PM') if busy else ('10:42', 'AM')
    status_icon, status = ('shieldwarn', 'Garage door open +1 · 3 lights on · Off-peak') if busy else ('shieldok', 'All secure · 1 light on · Off-peak')
    status_cls = 'warn' if busy else 'ok'
    if busy:
        col1 = (
            '<div class="card now alert p1"><span class="disc">' + ic('garageopen') + '</span><b>Garage door open</b><span class="lbl">12 min · also: Side door</span>'
            '<div class="acts"><span class="chip">' + ic('garage') + 'Close</span><span class="chip">' + ic('garageopen') + 'Keep garage</span><span class="chip">' + ic('door') + 'Keep side</span></div></div>'
            + now('tv', 'Media', 'Media Apple TV playing', 'on') + now('snow', 'Aircon on', 'Living 24° · Bedroom 22°', 'on')
            + now('washer', 'Laundry running', 'Washer 24 min · Dryer cooling', 'on')
            + '<div class="card bins"><b>Bins out tonight</b><div class="binrow"><span class="bin r">' + ic('bin') + 'General</span><span class="bin a">' + ic('recycle') + 'Recycling</span></div></div>')
    else:
        col1 = now('check', "Everything's calm", '', 'calm')
    rooms = ''.join([room('Living', 'sofa', '3 on' if busy else '1 on', True), room('Kids', 'smile', 'All off'),
                     room('Garage', 'garage', 'Open' if busy else 'Closed', busy), room('Outdoor', 'trees', 'All off'),
                     room('Laundry', 'shirt', 'Both running' if busy else 'Idle', busy), room('Media', 'tv', '1 playing' if busy else 'All off', busy)])
    favs = ''.join([tog('Pendants', 'bulb', True), tog('Dining', 'bulb', busy), tog('Media room', 'bulb'), tog('Lamp', 'lamp', busy), tog('Corridor', 'bulb'), tog('Hallway', 'bulb')])
    using, solar, grid_v, grid_c, selfp = ('2.8 kW', '0 W', '2.8 kW', 'From grid', 0) if busy else ('1.2 kW', '3.4 kW', '2.2 kW', 'Exporting', 100)
    energy = (f'<div class="card energy"><span class="lbl">Home is using</span><b class="hero">{using}</b><div class="nodes">'
              f'<div class="nd">{ic("sun" if not busy else "moon")}<div><b>{solar}</b><span>{"Solar" if not busy else "Solar idle"}</span></div></div>'
              f'<div class="nd">{ic("tower")}<div><b>{grid_v}</b><span>{grid_c}</span></div></div>'
              f'<div class="nd">{ic("car")}<div><b>Idle</b><span>Car</span></div></div></div>'
              f'<div class="selfp"><span>Self-powered</span><span class="track"><i style="width:{selfp}%"></i></span><b>{selfp}%</b></div></div>')
    event = f'<div class="card event"><span class="disc">{ic("cal")}</span><span class="lbl">Today · 4:30 pm</span><b>Samar swimming</b></div>'
    scenes = ''.join([scene('Good Night', 'moon'), scene('Announce', 'mega'), scene('Lost Phone', 'phone'), scene('Wi-Fi', 'wifi')])
    nav = ''.join([navitem('Home', 'home', True), navitem('Rooms', 'grid'), navitem('Lights', 'bulb'), navitem('Climate', 'therm'),
                   navitem('Security', 'shield', badge=2 if busy else 0), navitem('Media', 'tv'), navitem('More', 'more')])
    return f'''
<nav class="rail glass">{nav}</nav>
<main class="view">
  <section class="topbar">
    <div class="clock"><div class="t">{clock}<small>{ap}</small></div><div class="d">Wednesday 14 October</div></div>
    <div class="status {status_cls}">{ic(status_icon)}<span>{status}</span></div>
    <div class="wx">{ic("cloudsun", "lg")}<div><b>24°</b><span>Partly cloudy</span></div></div>
    {person('Sushen', 'Office', False, 'linear-gradient(135deg,var(--accent),var(--state-ok))')}
    {person('Paro', 'Home', True, 'linear-gradient(135deg,var(--state-warn),var(--state-on))')}
  </section>
  <section class="cols">
    <div class="col now-col">{col1}</div>
    <div class="col rooms-col"><div class="rooms">{rooms}</div><div class="favs">{favs}</div></div>
    <div class="col home-col">{energy}{event}<div class="scenes">{scenes}</div></div>
  </section>
</main>'''

def living_popup():
    lights = ''.join([tog('Dining', 'bulb'), tog('Pendants', 'bulb', True), tog('Kitchen downlights', 'bulb'), tog('Kitchen bench', 'bulb'), tog('Media room', 'bulb'), tog('Lamp', 'lamp')])
    return f'''
<div class="scrim"></div>
<div class="popup glass">
  <div class="ph">{ic("sofa", "lg")}<b>Living &amp; kitchen</b><span class="badge2">{ic("therm")}23.5°</span><span class="badge2">{ic("snow")}Cool</span></div>
  <div class="card tilef"><div class="trow"><span class="disc on">{ic("snow")}</span><div><b>Aircon</b><span class="lbl">Cool · 23.5° now</span></div><b class="set">24°</b></div>
    {seg(["Off", "Cool", "Heat", "Dry", "Fan"], 1)}</div>
  <div class="ps">Lights</div>
  <div class="pgrid">{lights}</div>
  <div class="ps">Robbie</div>
  <div class="card tilef"><div class="trow"><span class="disc">{ic("bot")}</span><div><b>Robbie</b><span class="lbl">Docked</span></div></div>{seg(["Start", "Dock", "Stop"], 9)}</div>
  <div class="pgrid">{zone("Kitchen")}{zone("Media room")}{zone("Media &amp; kitchen")}{zone("Coffee station")}</div>
  <div class="fade"></div>
</div>'''

def energy_popup():
    return f'''
<div class="scrim"></div>
<div class="popup glass">
  <div class="ph">{ic("zap", "lg")}<b>Energy</b><span class="badge2">Off-peak</span></div>
  <div class="pgrid"><div class="card stat"><span class="lbl">Home using</span><b>1.2 kW</b></div><div class="card stat"><span class="lbl">Self-powered</span><b>100%</b></div></div>
  <div class="pgrid3"><div class="card stat s"><span class="lbl">Solar</span><b>3.4 kW</b></div><div class="card stat s"><span class="lbl">From grid</span><b>0 W</b></div><div class="card stat s"><span class="lbl">To grid</span><b>2.2 kW</b></div></div>
  <div class="ps">Cost</div>
  <div class="pgrid"><div class="card stat"><span class="lbl">Today</span><b>$0.54</b></div><div class="card stat"><span class="lbl">Sold</span><b>$0.15</b></div>
    <div class="card stat"><span class="lbl">Bill to date</span><b>$108.16</b></div><div class="card stat"><span class="lbl">Estimated bill</span><b>$152.41</b></div></div>
  <div class="ps">Car charging</div>
  <div class="pgrid">{tog("Tesla charger", "plug")}{tog("Kia charger", "plug")}</div>
</div>'''

def saver_scene():
    return f'''
<div class="saver">
  <div class="sclock"><div class="t">9:48<small>PM</small></div><div class="d">Wednesday 14 October</div></div>
  <div class="srow"><span>{ic("therm", "lg")}19°</span><span>{ic("cal", "lg")}Samar swimming <em>Thu 4:30 pm</em></span></div>
  <div class="sbadges"><span class="sb">{ic("garageopen")}Garage door open</span></div>
  <div class="hint">Tap anywhere to return</div>
</div>'''

CSS = '''
*{box-sizing:border-box;margin:0;padding:0}
:root{
%(shared)s
}
%(light)s
%(dark)s
@media (prefers-color-scheme: dark){ :root:not([data-theme=light]){ color-scheme: dark } }
%(saver)s
html,body{width:1280px;height:800px;overflow:hidden;font-family:var(--font-sans);background:var(--surface-0);color:var(--text-1);-webkit-font-smoothing:antialiased}
body{position:relative}
.ic{width:var(--icon-md);height:var(--icon-md);flex:none;display:block}.ic.lg{width:var(--icon-lg);height:var(--icon-lg)}
.glass{background:var(--glass-bg);-webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);border:1px solid var(--glass-border)}
.lbl{font-size:var(--fs-secondary);font-weight:var(--fw-regular);color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
b{font-weight:var(--fw-semibold)}
/* rail */
.rail{position:absolute;left:var(--space-3);top:var(--space-3);bottom:var(--space-3);width:88px;border-radius:var(--radius-lg);box-shadow:var(--shadow-pop);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-1);padding:var(--space-3) var(--space-2)}
.nv{position:relative;width:72px;min-height:var(--tap);padding:var(--space-2) 0;border-radius:var(--radius-sm);display:flex;flex-direction:column;align-items:center;gap:var(--space-1);color:var(--text-2);font-size:var(--fs-caption);font-weight:var(--fw-medium)}
.nv.act{background:var(--surface-2);color:var(--text-1)}
.badge{position:absolute;top:2px;right:10px;min-width:18px;height:18px;border-radius:var(--radius-pill);background:var(--state-alert);color:var(--on-alert);font:var(--fw-semibold) var(--fs-caption)/18px var(--font-sans);text-align:center;font-style:normal;padding:0 5px}
/* view: sections geometry (row 56 + gap 8, column gap 16) */
.view{position:absolute;left:112px;right:16px;top:8px;bottom:0}
.topbar{height:120px;display:grid;grid-template-columns:3fr 5fr 2fr 1fr 1fr;gap:var(--space-2);align-items:center}
.clock{padding:var(--space-2) var(--space-3)}
.clock .t{font-size:var(--fs-clock);font-weight:var(--fw-medium);line-height:1;letter-spacing:-.02em}
.clock .t small{font-size:var(--fs-title);font-weight:var(--fw-medium);color:var(--text-2);margin-left:var(--space-2)}
.clock .d{font-size:var(--fs-body);color:var(--text-2);margin-top:var(--space-2)}
.status{display:flex;align-items:center;justify-content:center;gap:var(--space-2);font-size:var(--fs-title);font-weight:var(--fw-medium);text-align:center;padding:0 var(--space-2);min-height:var(--tap)}
.status .ic{color:var(--state-ok-ink)}.status.warn .ic{color:var(--state-warn-ink)}
.wx{display:grid;grid-template-columns:var(--icon-lg) auto;column-gap:var(--space-3);justify-content:center;align-items:center;min-height:var(--tap)}
.wx b{font-size:var(--fs-hero);line-height:1.1}.wx span{display:block;font-size:var(--fs-secondary);color:var(--text-2)}
.person{display:flex;flex-direction:column;align-items:center;gap:var(--space-1);min-height:var(--tap);padding:var(--space-1)}
.av{position:relative;width:var(--disc);height:var(--disc);border-radius:var(--radius-pill);display:grid;place-items:center;color:var(--on-accent);font-weight:var(--fw-semibold)}
.dot{position:absolute;right:-2px;bottom:-2px;width:var(--dot);height:var(--dot);border-radius:var(--radius-pill);background:var(--text-2);border:2px solid var(--surface-1);font-style:normal}.dot.ok{background:var(--state-ok)}
.pl{text-align:center;font-size:var(--fs-caption);line-height:var(--lh-tight);color:var(--text-2)}.pl b{color:var(--text-1)}
.cols{margin-top:var(--space-4);display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4)}
.col{display:flex;flex-direction:column;gap:var(--space-2);min-width:0}
/* card primitive */
.card{background:var(--surface-1);border:1px solid var(--hairline);border-radius:var(--radius-lg);box-shadow:var(--shadow-card);padding:var(--space-3);min-height:var(--tap);position:relative}
.disc{width:var(--disc);height:var(--disc);border-radius:var(--radius-pill);background:var(--surface-2);display:grid;place-items:center;color:var(--text-2)}
.on > .disc,.on.card .disc{background:color-mix(in srgb,var(--state-on) 26%%,var(--surface-2));color:var(--state-on-ink)}
.card.on{background:var(--state-on-tint);border-color:color-mix(in srgb,var(--state-on) 35%%,var(--hairline))}
/* room: 2 rows = 120 */
.rooms{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2)}
.room{height:120px;padding:var(--space-4);display:grid;grid-template-rows:1fr min-content min-content;row-gap:var(--space-1);cursor:pointer}
.room b{font-size:var(--fs-title)}.room .disc{align-self:center;justify-self:start}
/* toggles: 1 row = 56 */
.favs{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2)}
.tog{height:56px;padding:var(--space-2) var(--space-3);border-radius:var(--radius-sm);display:grid;grid-template-columns:var(--icon-md) 1fr;column-gap:var(--space-3);align-items:center}
.tog .ic{grid-row:span 2;color:var(--text-2)}.tog.on .ic{color:var(--state-on-ink)}
.tog b{font-size:var(--fs-body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;align-self:end}
.tog .lbl{font-size:var(--fs-caption);align-self:start}
/* now items: 1 row = 56 */
.now{height:56px;padding:var(--space-2) var(--space-3);display:grid;grid-template-columns:var(--disc) 1fr;column-gap:var(--space-3);align-items:center;background:var(--state-on-tint);border-color:color-mix(in srgb,var(--state-on) 35%%,var(--hairline))}
.now .disc{grid-row:span 2;background:color-mix(in srgb,var(--state-on) 26%%,var(--surface-2));color:var(--state-on-ink)}
.now b{font-size:var(--fs-body);align-self:end;line-height:var(--lh-tight)}.now .lbl{align-self:start}
.now.calm{background:transparent;border-color:transparent;box-shadow:none}.now.calm .disc{background:var(--surface-2);color:var(--text-2)}.now.calm b{font-weight:var(--fw-regular);color:var(--text-2);align-self:center;grid-row:span 2}
.now.alert{height:120px;grid-template-rows:min-content min-content 1fr;row-gap:var(--space-1)}
.now.alert.p1{background:var(--state-alert-tint);border-color:color-mix(in srgb,var(--state-alert) 35%%,var(--hairline));animation:pulse var(--dur-pulse) var(--ease) infinite}
.now.alert.p1 .disc{background:color-mix(in srgb,var(--state-alert) 26%%,var(--surface-2));color:var(--state-alert-ink)}
.acts{grid-column:1/-1;display:flex;gap:var(--space-2);align-self:end}
.chip{flex:1;min-height:var(--tap);display:flex;align-items:center;justify-content:center;gap:var(--space-2);border-radius:var(--radius-sm);background:var(--surface-2);font-size:var(--fs-secondary);font-weight:var(--fw-medium);padding:0 var(--space-2);white-space:nowrap;overflow:hidden}
.chip .ic{width:var(--icon-sm);height:var(--icon-sm)}
@keyframes pulse{0%%,100%%{box-shadow:var(--shadow-card),0 0 0 0 color-mix(in srgb,var(--state-alert) 0%%,transparent)}50%%{box-shadow:var(--shadow-card),0 0 0 var(--ring-size) color-mix(in srgb,var(--state-alert) 28%%,transparent)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
.bins{height:120px;display:flex;flex-direction:column;gap:var(--space-3);padding:var(--space-3) var(--space-4)}.bins b{font-size:var(--fs-body)}
.binrow{display:flex;gap:var(--space-2)}.bin{display:flex;align-items:center;gap:var(--space-2);min-height:var(--tap);padding:0 var(--space-3);border-radius:var(--radius-sm);font-size:var(--fs-secondary);font-weight:var(--fw-medium);background:var(--surface-2)}
.bin.r .ic{color:var(--state-alert-ink)}.bin.a .ic{color:var(--state-warn-ink)}
/* column 3 */
.energy{height:248px;padding:var(--space-4);display:flex;flex-direction:column}
.energy .hero{font-size:var(--fs-hero);line-height:var(--lh-tight);margin-top:var(--space-1);font-variant-numeric:tabular-nums}
.nodes{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);margin-top:var(--space-4)}
.nd{display:flex;align-items:center;gap:var(--space-2);min-width:0}.nd .ic{color:var(--text-2)}.nd b{display:block;font-size:var(--fs-body);font-variant-numeric:tabular-nums}.nd span{font-size:var(--fs-caption);color:var(--text-2);white-space:nowrap}
.selfp{display:flex;align-items:center;gap:var(--space-3);margin-top:auto;font-size:var(--fs-secondary);color:var(--text-2)}
.track{flex:1;height:var(--bar);border-radius:var(--radius-pill);background:var(--surface-2);overflow:hidden}.track i{display:block;height:100%%;background:var(--state-ok);border-radius:var(--radius-pill)}
.selfp b{color:var(--text-1);font-variant-numeric:tabular-nums}
.event{height:120px;padding:var(--space-3) var(--space-4);display:grid;grid-template-columns:var(--disc) 1fr;column-gap:var(--space-3);align-content:center;align-items:center}
.event .disc{grid-row:span 2}.event b{font-size:var(--fs-title);align-self:start}.event .lbl{align-self:end}
.scenes{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-2)}
.scene{height:120px;border-radius:var(--radius-sm);padding:var(--space-2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-2);font-size:var(--fs-secondary);font-weight:var(--fw-medium);text-align:center;cursor:pointer}
/* pop-up */
.scrim{position:absolute;inset:0;background:var(--scrim)}
.popup{position:absolute;left:50%%;top:50%%;transform:translate(-50%%,-50%%);width:var(--popup-width);max-height:740px;overflow:hidden;border-radius:var(--radius-lg);background:var(--popup-bg);box-shadow:var(--shadow-pop);padding:var(--space-4) var(--space-5) var(--space-5);display:flex;flex-direction:column;gap:var(--space-2)}
.ph{display:flex;align-items:center;gap:var(--space-3);min-height:var(--tap)}.ph b{font-size:var(--fs-title);flex:1}
.badge2{display:inline-flex;align-items:center;gap:var(--space-1);font-size:var(--fs-secondary);color:var(--text-2);background:var(--surface-2);border-radius:var(--radius-pill);padding:var(--space-1) var(--space-3)}.badge2 .ic{width:var(--icon-sm);height:var(--icon-sm)}
.ps{font-size:var(--fs-secondary);font-weight:var(--fw-semibold);color:var(--text-2);padding-top:var(--space-2);border-top:1px solid var(--hairline);margin-top:var(--space-1)}
.pgrid{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2)}.pgrid3{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-2)}
.tilef{display:flex;flex-direction:column;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg)}
.trow{display:flex;align-items:center;gap:var(--space-3)}.trow>div{flex:1;display:flex;flex-direction:column}.set{font-size:var(--fs-hero)}
.seg{display:flex;background:var(--surface-2);border-radius:var(--radius-sm);padding:var(--space-1);gap:var(--space-1)}
.seg span{flex:1;min-height:40px;display:grid;place-items:center;border-radius:calc(var(--radius-sm) - var(--space-1));font-size:var(--fs-secondary);font-weight:var(--fw-medium);color:var(--text-2)}
.seg span.on{background:var(--surface-1);color:var(--text-1);box-shadow:var(--shadow-card)}
.stat{padding:var(--space-3) var(--space-4);display:flex;flex-direction:column;gap:var(--space-1);justify-content:center;min-height:72px}.stat b{font-size:var(--fs-hero);font-variant-numeric:tabular-nums}.stat.s b{font-size:var(--fs-title)}
.popup .card{box-shadow:none}
.fade{position:absolute;left:0;right:0;bottom:0;height:72px;background:linear-gradient(transparent,var(--popup-bg));pointer-events:none}
/* saver */
[data-scene=saver] body,[data-scene=saver]{background:var(--surface-0)}
.saver{position:absolute;inset:0;padding:var(--space-6);display:flex;flex-direction:column;justify-content:center;background:var(--surface-0)}
.sclock{zoom:var(--saver-scale);margin-bottom:var(--space-5)}
.sclock .t{font-size:var(--fs-clock);line-height:1;letter-spacing:-.02em}.sclock .t small{font-size:var(--fs-title);margin-left:var(--space-2)}
.sclock .d{font-size:var(--fs-body);color:var(--text-2);margin-top:var(--space-2)}
.srow{display:flex;gap:var(--space-6);font-size:var(--fs-title);align-items:center}.srow span{display:inline-flex;align-items:center;gap:var(--space-3)}.srow .ic{color:var(--text-2)}.srow em{font-style:normal;color:var(--text-2);font-size:var(--fs-body)}
.sbadges{margin-top:var(--space-5);display:flex;gap:var(--space-3)}.sb{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-4);border-radius:var(--radius-sm);background:var(--state-alert-tint);color:var(--state-alert-ink);font-size:var(--fs-body);font-weight:var(--fw-medium)}
.hint{position:absolute;left:0;right:0;bottom:var(--space-5);text-align:center;font-size:var(--fs-secondary);color:var(--text-2)}
/* mock-up controls (hidden with &shot) */
.ctl{position:fixed;right:8px;bottom:8px;display:flex;gap:4px;z-index:99;opacity:.0;transition:opacity var(--dur-fast)}.ctl:hover{opacity:1}
.ctl button{font:var(--fw-medium) var(--fs-caption) var(--font-sans);padding:6px 10px;border-radius:var(--radius-sm);border:1px solid var(--hairline);background:var(--surface-1);color:var(--text-1);cursor:pointer}
'''

def page():
    body = {'calm': home('calm'), 'busy': home('busy'), 'popup': home('calm') + living_popup(), 'energy': home('calm') + energy_popup(), 'saver': saver_scene()}
    scenes = ''.join(f'<div class="scene-wrap" data-for="{k}">{v}</div>' for k, v in body.items())
    css = CSS % dict(shared=shared, light=block(':root[data-theme=light]', modes['light']), dark=block(':root[data-theme=dark]', modes['dark']), saver=saver_vars)
    return f'''<!doctype html>
<html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=1280">
<title>Quiet Glass: Home mock-up (1280x800)</title>
<style>{css}
.scene-wrap{{display:none}}[data-scene=calm] [data-for=calm],[data-scene=busy] [data-for=busy],[data-scene=popup] [data-for=popup],[data-scene=energy] [data-for=energy],[data-scene=saver] [data-for=saver]{{display:block}}
</style></head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">{sprite}</svg>
{scenes}
<div class="ctl"><button data-s="calm">Calm</button><button data-s="busy">Busy</button><button data-s="popup">Room pop-up</button><button data-s="energy">Energy pop-up</button><button data-s="saver">Saver</button><button data-t="1">Light/Dark</button></div>
<script>
const q = new URLSearchParams(location.search);
const root = document.documentElement;
const dark = matchMedia('(prefers-color-scheme: dark)').matches;
function set(){{ root.dataset.theme = q.get('theme') || (dark ? 'dark' : 'light'); root.dataset.scene = q.get('scene') || 'calm'; }}
set();
if (q.has('shot')) document.querySelector('.ctl').remove();
document.querySelector('.ctl')?.addEventListener('click', e => {{
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.s) q.set('scene', b.dataset.s);
  if (b.dataset.t) q.set('theme', root.dataset.theme === 'dark' ? 'light' : 'dark');
  set();
}});
</script></body></html>
'''

open(os.path.join(here, 'redesign-quiet-glass.html'), 'w').write(page())
print('wrote dashboards/redesign-quiet-glass.html')
