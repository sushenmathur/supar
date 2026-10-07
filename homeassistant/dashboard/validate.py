#!/usr/bin/env python3
"""Check master.yaml: valid YAML, expected views, every button-card template defined, JS blocks parse."""
import os, re, subprocess, sys, tempfile, yaml
here = os.path.dirname(os.path.abspath(__file__))
text = open(os.path.join(here, 'master.yaml')).read()
d = yaml.safe_load(text)
paths = [v['path'] for v in d['views']]
used = set(re.findall(r'template: (\w+)', text)) - {'main'}
missing = used - set(d['button_card_templates'])
blocks = re.findall(r'\[\[\[(.*?)\]\]\]', text, re.S); bad = 0
with tempfile.TemporaryDirectory() as t:
    for i, b in enumerate(blocks):
        f = os.path.join(t, f'{i}.js'); open(f, 'w').write('(function(entity,states,variables){' + b + '\n})')
        bad += subprocess.run(['node', '--check', f], capture_output=True).returncode != 0
print(f'views: {paths}\nJS blocks: {len(blocks)}, errors: {bad}\nundefined templates: {sorted(missing) or "none"}')
sys.exit(1 if bad or missing else 0)
