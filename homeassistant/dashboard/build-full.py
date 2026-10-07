#!/usr/bin/env python3
"""Assemble dashboard-full.yaml (templates + home-view + other views) and validate it."""
import re, subprocess, tempfile, os, yaml
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda n: open(os.path.join(here, n)).read()
tpl = rd('templates.yaml'); tpl = tpl[re.search(r'^button_card_templates:\s*$', tpl, re.M).start():].rstrip() + '\n'
home = ''.join(l for l in rd('home-view.yaml').splitlines(True) if not l.startswith('#'))
home = ''.join(('  ' + l if l.strip() else l) for l in home.splitlines(True))
head = '''# =============================================================================
# Glass dashboard: COMPLETE raw configuration (replace everything in the editor)
# Dashboard > pencil > three dots > Raw configuration editor > select all > paste > Save.
# BACK UP your current raw config first (select all, copy to a file).
# Contains: button_card_templates, navbar-templates, the redesigned Home view (hubhome)
# and your other nine views carried over unchanged.
# =============================================================================
'''
full = head + tpl + '\nviews:\n' + home.rstrip() + '\n' + rd('_other-views.yaml')
open(os.path.join(here, 'dashboard-full.yaml'), 'w').write(full)
d = yaml.safe_load(full)
assert [v['path'] for v in d['views']][0] == 'hubhome' and len(d['views']) == 10
blocks = re.findall(r'\[\[\[(.*?)\]\]\]', full, re.S); bad = 0
with tempfile.TemporaryDirectory() as t:
    for i, b in enumerate(blocks):
        f = os.path.join(t, f'{i}.js'); open(f, 'w').write('(function(entity,states,variables){' + b + '\n})')
        bad += subprocess.run(['node', '--check', f], capture_output=True).returncode != 0
used = set(re.findall(r'template: (\w+)', full)) - {'main'}
assert not used - set(d['button_card_templates']), 'undefined template'
print(f'ok: {len(d["views"])} views, {len(blocks)} JS blocks, {bad} JS errors, {full.count(chr(10))} lines')
