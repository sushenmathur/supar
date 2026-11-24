#!/usr/bin/env python3
"""Build themes/<option>.css from themes/src/: insert the shared layer (_base.css) at /*@base*/ and embed any
fonts named in a /*@fonts Family:wght@...|...*/ line as base64 woff2 (latin subset), so each theme is self-contained.
Usage: python3 harness/build-themes.py   (needs curl and network for the font download)"""
import base64, glob, os, re, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
def get(url): return subprocess.run(['curl', '-sfL', '-A', UA, url], check=True, capture_output=True).stdout
def faces(spec):
    css = get(f'https://fonts.googleapis.com/css2?family={spec}&display=swap').decode()
    groups = {}
    for sub, body in re.findall(r'/\* ([\w-]+) \*/\s*@font-face\s*\{([^}]*)\}', css):
        if sub != 'latin': continue
        fam = re.search(r"font-family:\s*'([^']+)'", body).group(1)
        w = int(re.search(r'font-weight:\s*(\d+)', body).group(1))
        url = re.search(r'url\((https://[^)]+\.woff2)\)', body).group(1)
        groups.setdefault((fam, url), []).append(w)
    return '\n'.join(f"@font-face{{font-family:'{f}';font-style:normal;font-weight:{min(ws)} {max(ws)};font-display:swap;src:url(data:font/woff2;base64,{base64.b64encode(get(u)).decode()}) format('woff2')}}" for (f, u), ws in groups.items())
base = open(os.path.join(ROOT, 'themes/src/_base.css')).read()
for path in sorted(glob.glob(os.path.join(ROOT, 'themes/src/option-*.css'))):
    src = open(path).read()
    m = re.search(r'/\*@fonts ([^*]+)\*/', src)
    fonts = '\n'.join(faces(s) for s in m.group(1).split('|')) if m else ''
    out = (fonts + '\n' if fonts else '') + src.replace('/*@base*/', base)
    name = os.path.basename(path)
    open(os.path.join(ROOT, 'themes', name), 'w').write(out)
    print(f'{name}: {len(out) // 1024} KB')
