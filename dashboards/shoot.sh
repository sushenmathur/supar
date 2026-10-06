#!/bin/sh
# Render each concept to previews/*.png at 1600x1000
cd "$(dirname "$0")"
CH=$(ls /opt/pw-browsers/chromium-1194/chrome-linux*/chrome | head -1)
for f in option-*.html; do
  $CH --headless --no-sandbox --disable-gpu --hide-scrollbars --window-size=1600,1087 --screenshot=previews/${f%.html}.png file://$PWD/$f >/dev/null 2>&1
  python3 -I -c "from PIL import Image;import sys;p=sys.argv[1];Image.open(p).crop((0,0,1600,1000)).save(p)" previews/${f%.html}.png
done
