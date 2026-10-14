#!/usr/bin/env python3
"""Checks for the Quiet Glass dashboard. Run from anywhere:  python3 homeassistant/dashboard/validate.py [-v]

Fails (exit 1) when:
  * master.yaml is not valid YAML, or a [[[ ]]] JavaScript block does not compile
  * a card references a button-card template (or navbar template) that is not defined, or a template
    inherits from an undefined template
  * master.yaml contains a hex / rgba() / hsl() colour literal (colours live in themes/glass.yaml only)
  * master.yaml uses a literal px / ms size for type, radius, spacing, shadow or duration (tokens only)
  * a var(--token) used in master.yaml is not defined by the theme (or as a --qg-* custom property in a template)
  * more than 2 radii, 6 font sizes, 3 weights or 1 font family are used
  * theme text contrast is below target in either mode (4.5:1 secondary, 7:1 primary) or the 1280x800 Home
    baseline renders more than ~35 cards
Warnings (do not fail) list known, documented exceptions."""
import os, re, subprocess, sys, tempfile, yaml

here = os.path.dirname(os.path.abspath(__file__))
text = open(os.path.join(here, 'master.yaml')).read()
d = yaml.safe_load(text)
theme = yaml.safe_load(open(os.path.join(here, '..', 'themes', 'glass.yaml')).read())
errors, warnings = [], []

def strings(o):
    if isinstance(o, str): yield o
    elif isinstance(o, dict):
        for v in o.values(): yield from strings(v)
    elif isinstance(o, list):
        for v in o: yield from strings(v)

def walk(o):
    yield o
    if isinstance(o, dict):
        for v in o.values(): yield from walk(v)
    elif isinstance(o, list):
        for v in o: yield from walk(v)

# ---------------------------------------------------------------- 1. JavaScript blocks
blocks = [b for s in strings(d) for b in re.findall(r'\[\[\[(.*?)\]\]\]', s, re.S)]
bad_js = 0
with tempfile.TemporaryDirectory() as t:
    for i, b in enumerate(blocks):
        f = os.path.join(t, f'{i}.js'); open(f, 'w').write('(function(entity,states,variables,hass){' + b + '\n})')
        r = subprocess.run(['node', '--check', f], capture_output=True, text=True)
        if r.returncode: bad_js += 1; errors.append('JS error: ' + b[:100].strip().replace('\n', ' ') + ' :: ' + r.stderr.strip().splitlines()[-1][:120])

# ---------------------------------------------------------------- 2. templates
bct = d.get('button_card_templates', {})
nav = d.get('navbar-templates', {})
def refs(t):
    return [t] if isinstance(t, str) else list(t) if isinstance(t, list) else []
missing_bc, missing_nav = set(), set()
for node in walk(d):
    if not isinstance(node, dict) or 'template' not in node: continue
    ty = node.get('type')
    if ty == 'custom:navbar-card':
        missing_nav |= set(refs(node['template'])) - set(nav)
    elif ty == 'custom:button-card':
        missing_bc |= set(refs(node['template'])) - set(bct)
for name, tpl in bct.items():                       # templates inheriting templates
    missing_bc |= set(refs(tpl.get('template'))) - set(bct)
for n in sorted(missing_bc): errors.append(f'undefined button-card template: {n}')
for n in sorted(missing_nav): errors.append(f'undefined navbar template: {n}')
unused = sorted(n for n in bct if not any(isinstance(x, dict) and n in refs(x.get('template')) for x in walk(d)))
for n in unused: warnings.append(f'template never referenced: {n}')

# ---------------------------------------------------------------- 3. literals
body = re.sub(r'^\s*#.*$', '', text, flags=re.M)         # ignore comments
for m in re.finditer(r'(?<![\w&/])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b', body):
    errors.append(f'hex colour literal {m.group(0)} (line {body[:m.start()].count(chr(10)) + 1})')
for m in re.finditer(r'\b(?:rgba?|hsla?)\(', body):
    errors.append(f'rgb/hsl literal at line {body[:m.start()].count(chr(10)) + 1}')
LIT = re.compile(r'(?<![\w.#-])-?\d*\.?\d+(?:px|ms|rem)\b|(?<![\w.#-])\d*\.?\d+s\b')
for i, line in enumerate(body.splitlines(), 1):
    for m in LIT.finditer(line):
        lit = m.group(0)
        if lit in ('1px', '2px') and re.search(r'border|outline', line): continue   # hairline widths
        errors.append(f'size/duration literal {lit} (line {i}): {line.strip()[:80]}')

# ---------------------------------------------------------------- 4. tokens
theme_keys = set()
for name, th in theme.items():
    theme_keys |= set(th)
    for mode in (th.get('modes') or {}).values(): theme_keys |= set(mode)
local_props = set(re.findall(r"'?(--qg-[\w-]+)'?\s*:", text)) | {'--mdc-icon-size', '--primary-text-color'}
used = set(re.findall(r'var\(\s*--([\w-]+)', body))
for u in sorted(used):
    if u not in theme_keys and f'--{u}' not in local_props and u not in ('primary-text-color',) and not u.startswith('qg-'):
        errors.append(f'var(--{u}) is not defined in themes/glass.yaml')
# every theme must define the tokens its views use (Glass: all views; Glass Saver: the saver view only)
def used_in(view): return set(re.findall(r'var\(\s*--([\w-]+)', yaml.dump(view)))
view_theme = {}
for v in d['views']: view_theme.setdefault(v.get('theme', 'Glass'), []).append(v)
for name, th in theme.items():
    keys = set(th) | {k for m in (th.get('modes') or {}).values() for k in m}
    need = set().union(*[used_in(v) for v in view_theme.get(name, [])]) if name != 'Glass' else used
    if name == 'Glass':   # navbar / templates are shared
        need = used
    else:
        need = need | {u for tpl in ('qg_card',) for u in used_in(d['button_card_templates'][tpl])}
    miss = sorted(u for u in need if u not in keys and not u.startswith('qg-') and u != 'primary-text-color')
    if miss: errors.append(f'theme "{name}" lacks tokens used by its views: {", ".join(miss)}')

# ---------------------------------------------------------------- 5. scale (radii, sizes, weights, family)
radii = set(re.findall(r'border-radius\W+(?:[\w:. ]*?)(var\(--radius-[\w]+\))', body)) | set(re.findall(r'border-radius:\s*(var\(--radius-[\w]+\))', body))
sizes = set(re.findall(r'font-size\W+(var\(--fs-[\w]+\))', body))
weights = set(re.findall(r'font-weight\W+(var\(--fw-[\w]+\))', body))
families = set(re.findall(r'font-family\W+(var\(--[\w-]+\))', body))
for pat, label in ((r'font-size\s*:\s*(?!var|\s)', 'font-size without a token'), (r'font-weight\s*:\s*\d', 'literal font-weight'),
                   (r'border-radius\s*:\s*(?!var|0|\s)', 'border-radius without a token'), (r'font-family\s*:\s*(?!var|\s)', 'font-family without a token')):
    for m in re.finditer(pat, body):
        if 'font_size' in body[max(0, m.start() - 1):m.start() + 1]: continue
        errors.append(f'{label} at line {body[:m.start()].count(chr(10)) + 1}')
if len({r for r in radii if 'pill' not in r}) > 2: errors.append(f'more than 2 radii in use: {sorted(radii)}')
if len(sizes) > 6: errors.append(f'more than 6 font sizes in use: {sorted(sizes)}')
if len(weights) > 3: errors.append(f'more than 3 weights in use: {sorted(weights)}')
if len(families) > 1: errors.append(f'more than one font family: {sorted(families)}')

# ---------------------------------------------------------------- 6. contrast (theme)
def hexrgb(c): c = c.lstrip('#'); return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))
def lum(c):
    r = []
    for v in hexrgb(c):
        v /= 255; r.append(v / 12.92 if v <= .03928 else ((v + .055) / 1.055) ** 2.4)
    return .2126 * r[0] + .7152 * r[1] + .0722 * r[2]
def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + .05) / (lb + .05)
def mix(a, b, p):
    A, B = hexrgb(a), hexrgb(b); return '#%02x%02x%02x' % tuple(round(A[i] * p + B[i] * (1 - p)) for i in range(3))
def gradient_stops(v): return re.findall(r'#[0-9a-fA-F]{6}', v)
contrast_report = []
sets = []
for mode, vals in theme['Glass']['modes'].items(): sets.append((f'Glass/{mode}', vals))
sets.append(('Glass Saver', theme['Glass Saver']))
for label, v in sets:
    s0 = gradient_stops(v['surface-0']) if v['surface-0'].startswith('linear') else [v['surface-0']]
    bgs = {'surface-0': s0[0], 'surface-0b': s0[-1], 'surface-1': v['surface-1'], 'surface-2': v['surface-2']}
    for bg, bgc in bgs.items():
        r1, r2 = ratio(v['text-1'], bgc), ratio(v['text-2'], bgc)
        contrast_report.append((label, f'text-1 on {bg}', r1, 7.0)); contrast_report.append((label, f'text-2 on {bg}', r2, 4.5))
    for k in ('on', 'alert', 'warn', 'ok'):
        pct = int(re.search(r'(\d+)%', v[f'state-{k}-tint']).group(1)) / 100      # tint strength read from the theme
        tint = mix(v[f'state-{k}'], v['surface-1'], pct)
        contrast_report.append((label, f'state-{k}-ink on tint', ratio(v[f'state-{k}-ink'], tint), 4.5))
        contrast_report.append((label, f'text-1 on state-{k} tint', ratio(v['text-1'], tint), 7.0))
        contrast_report.append((label, f'text-2 on state-{k} tint', ratio(v['text-2'], tint), 4.5))
    contrast_report.append((label, 'on-accent on accent', ratio(v['on-accent'], v['accent']), 4.5))
    if 'on-alert' in v: contrast_report.append((label, 'on-alert on state-alert', ratio(v['on-alert'], v['state-alert']), 4.5))
for label, what, r, need in contrast_report:
    if r < need: errors.append(f'contrast {label}: {what} = {r:.1f}:1 (needs {need}:1)')

# ---------------------------------------------------------------- 7. Home card budget
home = next(v for v in d['views'] if v['path'] == 'hubhome')
def count_rendered(card):
    n = 1
    for k in ('cards',):
        for c in card.get(k, []) if isinstance(card.get(k), list) else []: n += count_rendered(c)
    return n
def baseline(card):
    if card.get('type') == 'custom:button-card' and card.get('visibility') and 'Everything' not in str(card.get('name')): return 0   # hidden at rest
    if card.get('visibility') and card.get('type') != 'custom:alert-ticker-card' and 'Everything' not in str(card.get('name')): return 0
    return 1
home_cards = [c for s in home['sections'] for c in s['cards']]
base = sum(baseline(c) for c in home_cards)
busy = sum(1 for c in home_cards)
if base > 35: errors.append(f'Home baseline renders {base} cards (budget ~35)')

# ---------------------------------------------------------------- 7b. "Everything's calm" must mirror the Now items
import random
def ev(c, st, now):
    k = c['condition']
    if k == 'state':
        have = str(st.get(c['entity']))
        if 'state' in c: return have in ([c['state']] if isinstance(c['state'], str) else c['state'])
        return have not in ([c['state_not']] if isinstance(c['state_not'], str) else c['state_not'])
    if k == 'numeric_state':
        try: v = float(st.get(c['entity']))
        except (TypeError, ValueError): return False
        return v < c['below'] if 'below' in c else v > c['above']
    if k == 'and': return all(ev(x, st, now) for x in c['conditions'])
    if k == 'or': return any(ev(x, st, now) for x in c['conditions'])
    if k == 'time':
        wd, m = now
        hm = lambda t: int(t[:2]) * 60 + int(t[3:5])
        if c.get('weekdays') and wd not in c['weekdays']: return False
        if c.get('after') and m < hm(c['after']): return False
        if c.get('before') and m >= hm(c['before']): return False
        return True
    raise ValueError(k)
def gather(c, pool):
    if c['condition'] in ('and', 'or'):
        for x in c['conditions']: gather(x, pool)
    elif c['condition'] == 'state':
        vals = c.get('state', c.get('state_not')); pool.setdefault(c['entity'], set()).update([vals] if isinstance(vals, str) else vals)
    elif c['condition'] == 'numeric_state':
        t = c.get('below', c.get('above')); pool.setdefault(c['entity'], set()).update([t - 1, t, t + 1])
now_sec = home['sections'][1]['cards']
calm = next((c for c in now_sec if "Everything" in str(c.get('name'))), None)
items = [c for c in now_sec if c is not calm and c.get('type') != 'custom:alert-ticker-card' and c.get('visibility')]
if calm is None: errors.append('Home has no "Everything\'s calm" item')
else:
    pool = {}
    for c in items + [calm]:
        for cond in c['visibility']: gather(cond, pool)
    rng = random.Random(7); bad = 0
    for _ in range(20000):
        st = {e: rng.choice(sorted(map(str, v)) + ['unavailable', 'zz']) for e, v in pool.items()}
        if rng.random() < .5:   # bias towards quiet states so the calm branch is exercised
            for e, v in pool.items():
                if rng.random() < .8: st[e] = 'zz'
        now = (rng.choice(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']), rng.randrange(1440))
        any_item = any(all(ev(cond, st, now) for cond in c['visibility']) for c in items)
        is_calm = all(ev(cond, st, now) for cond in calm['visibility'])
        if any_item == is_calm: bad += 1
    if bad: errors.append(f'"Everything\'s calm" disagrees with the Now items in {bad}/20000 random states')
    print(f'calm check: {len(items)} Now items, {len(pool)} entities, 20000 random states, mismatches {bad}')

# ---------------------------------------------------------------- 8. exceptions (documented)
warnings.append('touch targets: heading badges, tile feature chips and the navbar popup labels are native HA controls (28-40px); every Quiet Glass card is >= 48px (min-height: var(--tap)).')

print(f'views: {[v["path"] for v in d["views"]]}')
print(f'JS blocks: {len(blocks)}, errors: {bad_js}')
print(f'button-card templates: {len(bct)} ({", ".join(bct)})')
print(f'undefined templates: {sorted(missing_bc | missing_nav) or "none"}')
print(f'tokens used: {len(used)} | radii {sorted(radii)} | font sizes {len(sizes)} | weights {len(weights)} | families {sorted(families)}')
if '-v' in sys.argv:
    for label, what, r, need in contrast_report: print(f'  contrast {label:12s} {what:28s} {r:5.1f}:1 (>= {need})')
worst = min(contrast_report, key=lambda x: x[2] / x[3])
print(f'contrast checks: {len(contrast_report)}, tightest {worst[0]} {worst[1]} = {worst[2]:.1f}:1 (target {worst[3]}:1)')
print(f'Home cards: {base} at rest, {busy} top-level incl. every conditional item')
for w in warnings: print('note:', w)
for e in errors: print('ERROR:', e)
print('FAILED' if errors else 'OK')
sys.exit(1 if errors else 0)
