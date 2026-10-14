#!/bin/sh
# Downloads Inter (SIL Open Font License) and installs the three weights Quiet Glass uses.
# Run on the Home Assistant host (or any machine, then copy the fonts folder to /config/www/fonts/).
#   sh install-fonts.sh [/config/www]
set -e
DEST="${1:-/config/www}"
TMP="$(mktemp -d)"
mkdir -p "$DEST/fonts"
curl -fsSL -o "$TMP/inter.zip" https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip
unzip -q -o "$TMP/inter.zip" -d "$TMP/inter"
for w in Regular Medium SemiBold; do
  f="$(find "$TMP/inter" -name "Inter-$w.woff2" | grep -v -i display | head -1)"
  [ -n "$f" ] && cp "$f" "$DEST/fonts/Inter-$w.woff2"
done
cp "$(dirname "$0")/quiet-glass-fonts.js" "$DEST/quiet-glass-fonts.js" 2>/dev/null || true
rm -rf "$TMP"
ls -l "$DEST/fonts"
