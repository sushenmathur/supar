#!/usr/bin/env python3
"""Build self-contained option files from src/: embed Google Fonts (latin, woff2) as base64, then bake the
JS-generated icons, camera art and clock into static HTML (bake.cjs) so the page renders without network or JS.
Usage: python3 build.py   (needs curl + network for the font download, and Playwright for baking)"""
import base64, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = {'option-1-soft-bento': ['Outfit:wght@200;300;400;500;600;700', 'Work+Sans:wght@400;500;600'],
         'option-2-editorial': ['Space+Grotesk:wght@300;400;500;600', 'Inter:wght@400;500;600'],
         'option-3-ambient': ['Plus+Jakarta+Sans:wght@200;300;400;500;600;700']}
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
cache = {}
def get(url, binary=False):
    if url not in cache:
        cache[url] = subprocess.run(['curl', '-sfL', '-A', UA, url], check=True, capture_output=True).stdout
    return cache[url] if binary else cache[url].decode()

def font_css(spec):
    css = get(f'https://fonts.googleapis.com/css2?family={spec}&display=swap')
    groups = {}
    for sub, body in re.findall(r'/\* ([\w-]+) \*/\s*@font-face\s*\{([^}]*)\}', css):
        if sub != 'latin': continue
        fam = re.search(r"font-family:\s*'([^']+)'", body).group(1)
        w = int(re.search(r'font-weight:\s*(\d+)', body).group(1))
        url = re.search(r'url\((https://[^)]+\.woff2)\)', body).group(1)
        groups.setdefault((fam, url), []).append(w)
    out = []
    for (fam, url), ws in groups.items():
        b64 = base64.b64encode(get(url, True)).decode()
        out.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{min(ws)} {max(ws)};font-display:block;src:url(data:font/woff2;base64,{b64}) format('woff2')}}")
    return '\n'.join(out)

for name, specs in FONTS.items():
    src = open(os.path.join(HERE, 'src', name + '.html')).read()
    faces = '\n'.join(font_css(s) for s in specs)
    html = src.replace('<style>', '<style>\n' + faces + '\n', 1)
    open(os.path.join(HERE, name + '.html'), 'w').write(html)
    print('fonts embedded:', name, f'{len(html)//1024} KB')
subprocess.run(['node', os.path.join(HERE, 'bake.cjs')], check=True,
               env={**os.environ, 'NODE_PATH': os.environ.get('NODE_PATH', '/opt/node22/lib/node_modules')})
