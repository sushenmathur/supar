#!/bin/sh
# Render the Quiet Glass mock-up (1280x800) to previews/redesign-quiet-glass-*.png with headless Chromium.
#   ./shoot-quiet-glass.sh            all scenes, light + dark
# Needs python3 + Pillow (crop to exact size) and Chromium under /opt/pw-browsers.
cd "$(dirname "$0")"
CH=$(ls /opt/pw-browsers/chromium-*/chrome-linux*/chrome | head -1)
mkdir -p previews
shot() {  # scene theme
  out=previews/redesign-quiet-glass-$1-$2.png
  $CH --headless --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1280,900 \
      --virtual-time-budget=1500 --screenshot="$out" "file://$PWD/redesign-quiet-glass.html?scene=$1&theme=$2&shot" >/dev/null 2>&1
  python3 -I -c "from PIL import Image;import sys;p=sys.argv[1];Image.open(p).crop((0,0,1280,800)).save(p)" "$out"
}
for t in light dark; do for s in calm busy popup energy; do shot $s $t; done; done
shot saver dark
