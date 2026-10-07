#!/usr/bin/env python3
"""Check master.yaml: valid YAML, expected views, every button-card template defined,
and every [[[ ]]] JavaScript block compiles (checked on the parsed values, as Home Assistant sees them)."""
import os, re, subprocess, sys, tempfile, yaml
here = os.path.dirname(os.path.abspath(__file__))
text = open(os.path.join(here, 'master.yaml')).read()
d = yaml.safe_load(text)

def strings(o):
    if isinstance(o, str): yield o
    elif isinstance(o, dict):
        for v in o.values(): yield from strings(v)
    elif isinstance(o, list):
        for v in o: yield from strings(v)

blocks = [b for s in strings(d) for b in re.findall(r'\[\[\[(.*?)\]\]\]', s, re.S)]
used = set(re.findall(r'template: (\w+)', text)) - {'main'}
missing = used - set(d['button_card_templates'])
bad = 0
with tempfile.TemporaryDirectory() as t:
    for i, b in enumerate(blocks):
        f = os.path.join(t, f'{i}.js'); open(f, 'w').write('(function(entity,states,variables){' + b + '\n})')
        r = subprocess.run(['node', '--check', f], capture_output=True, text=True)
        if r.returncode: bad += 1; print('JS error:', b[:120].strip(), '\n', r.stderr[:200])
print(f'views: {[v["path"] for v in d["views"]]}\nJS blocks: {len(blocks)}, errors: {bad}\nundefined templates: {sorted(missing) or "none"}')
sys.exit(1 if bad or missing else 0)
