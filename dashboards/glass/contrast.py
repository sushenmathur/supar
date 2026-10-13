#!/usr/bin/env python3
"""WCAG contrast check for the glass tokens over the real wallpapers (worst-case region).
Usage: python3 -I contrast.py wall-light.png wall-dark.png   (PNG renders of www/wallpaper-*.svg at 1600x1000)
Body text must be >= 4.5:1. ink-3 is decorative and is reported only."""
import sys
from PIL import Image

def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def lin(c): c /= 255; return c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
def lum(c): return .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2])
def cr(a, b): la, lb = lum(a), lum(b); hi, lo = max(la, lb), min(la, lb); return (hi + .05) / (lo + .05)
def over(fg, a, bg): return tuple(fg[i] * a + bg[i] * (1 - a) for i in range(3))

def extremes(path):
    im = Image.open(path).convert('RGB').resize((160, 100))
    px = sorted((lum(im.getpixel((x, y))), im.getpixel((x, y))) for x in range(160) for y in range(100))
    return px[int(len(px) * .01)][1], px[int(len(px) * .99)][1]  # darkest / lightest (1st / 99th percentile)

MODES = {
  'light': dict(
    ink=hexrgb('#101a2e'), ink2=(hexrgb('#101a2e'), .76), ink3=(hexrgb('#101a2e'), .54),
    ok=hexrgb('#127239'), warn=hexrgb('#975208'), bad=hexrgb('#be123c'), robbie=hexrgb('#0e7069'), accent=hexrgb('#1d63ed'), accent_text=hexrgb('#1a5ad8'),
    accent_ink=hexrgb('#ffffff'), warm=hexrgb('#ffb340'), warm_ink=hexrgb('#101a2e'),
    alerts=[hexrgb(c) for c in ('#c81e4a', '#9f1239', '#b45309', '#92400e', '#475569', '#334155')], alert_ink=hexrgb('#ffffff'),
    # surfaces: (name, [(overlay colour, alpha), ...]) applied over the wallpaper's *darkest* region
    surfaces=[('card (weakest .34)', [((255, 255, 255), .34)]), ('inset on card', [((255, 255, 255), .34), ((255, 255, 255), .46)]),
              ('elevated (weakest .52)', [((255, 255, 255), .52)])], worst='dark'),
  'dark': dict(
    ink=hexrgb('#f4f7fc'), ink2=(hexrgb('#f4f7fc'), .76), ink3=(hexrgb('#f4f7fc'), .54),
    ok=hexrgb('#6ee7b7'), warn=hexrgb('#fbbf24'), bad=hexrgb('#fc9dab'), robbie=hexrgb('#2dd4bf'), accent=hexrgb('#5aa2ff'), accent_text=hexrgb('#87bbff'),
    accent_ink=hexrgb('#06121f'), warm=hexrgb('#ffc266'), warm_ink=hexrgb('#101a2e'),
    alerts=[hexrgb(c) for c in ('#b4163f', '#8a0f33', '#a1480a', '#7c3a0c', '#3b4658', '#2a3344')], alert_ink=hexrgb('#ffffff'),
    surfaces=[('card (strongest .10)', [((255, 255, 255), .10)]), ('inset on card (rest .07)', [((255, 255, 255), .10), ((255, 255, 255), .07)]),
              ('elevated (lightest stop)', [((40, 56, 96), .74)])], worst='light'),
}

fails = 0
for mode, path in zip(('light', 'dark'), sys.argv[1:3]):
    m = MODES[mode]; dark, light = extremes(path)
    bg = dark if m['worst'] == 'dark' else light
    print(f'\n== {mode}: worst wallpaper region rgb{tuple(round(c) for c in bg)} ==')
    for name, layers in m['surfaces']:
        s = bg
        for colour, a in layers: s = over(colour, a, s)
        rows = [('ink', m['ink']), ('ink-2', over(m['ink2'][0], m['ink2'][1], s)),
                ('ok', m['ok']), ('warn', m['warn']), ('bad', m['bad']), ('robbie', m['robbie']), ('accent-text', m['accent_text'])]
        out = []
        for label, fg in rows:
            r = cr(fg, s); ok = r >= 4.5; fails += (not ok); out.append(f'{label} {r:.2f}{"" if ok else " FAIL"}')
        print(f'  {name}: ' + ' | '.join(out))
        print(f'    ink-3 (decorative, not body) {cr(over(m["ink3"][0], m["ink3"][1], s), s):.2f}')
    for label, fg, bgc in [('accent-ink on accent', m['accent_ink'], m['accent']), ('warm-ink on warm', m['warm_ink'], m['warm'])] + \
            [(f'alert-ink on {"#%02x%02x%02x" % tuple(int(x) for x in c)}', m['alert_ink'], c) for c in m['alerts']]:
        r = cr(fg, bgc); ok = r >= 4.5; fails += (not ok); print(f'  {label}: {r:.2f}{"" if ok else " FAIL"}')
print('\nRESULT:', 'all body-text pairs >= 4.5:1' if not fails else f'{fails} pair(s) below 4.5:1')
sys.exit(1 if fails else 0)
