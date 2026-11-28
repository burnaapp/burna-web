#!/bin/sh
# Renders the phone screens and the share image for the website from the HTML in img-src/, with headless Chrome.
#
#   sh img-src/render.sh            (run from the site folder; needs Google Chrome and cwebp: brew install webp)
#
# The phone screens are HTML/CSS reproductions of the app's screens, drawn at 1 CSS px per iOS point and captured at 3x.
# To use real screenshots instead, save them over img/screen-*.webp at the same aspect ratio (413 x 872, bezel included)
# or change the width/height attributes in index.html to match the new images.
# The rank badges in img/ranks/ come from `node img-src/badges.mjs`.
set -e
cd "$(dirname "$0")/.."
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

shot() { # file width height scale out.png
  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor="$4" --window-size="$2,$3" \
    --default-background-color=00000000 --virtual-time-budget=4000 --allow-file-access-from-files \
    --screenshot="$5" "file://$PWD/img-src/$1" >/dev/null 2>&1
}

for s in board workouts rankup friends effort; do
  shot "screens/$s.html" 413 872 3 "$TMP/$s.png"
  cwebp -quiet -q 86 -alpha_q 100 -m 6 "$TMP/$s.png" -o "img/screen-$s.webp"
  echo "img/screen-$s.webp"
done

shot og.html 1200 630 1 og.png
echo og.png
