#!/bin/bash
# Visual QA — capture screenshots of /, /privacy, /terms at mobile + desktop
# Usage: ./scripts/visual_qa.sh [port]
# Requires: Chrome, dist/ built and being served on PORT

PORT=${1:-4175}
BASE="http://localhost:$PORT"
OUT="docs/visual-regression/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUT"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

capture() {
  local url="$1" label="$2" width="$3" height="$4"
  "$CHROME" \
    --headless=new \
    --screenshot="$OUT/${label}.png" \
    --window-size="${width},${height}" \
    --hide-scrollbars \
    --disable-gpu \
    --no-sandbox \
    "$url" 2>/dev/null
  echo "  ✓ $label (${width}×${height})"
}

echo "=== Visual QA → $OUT ==="
echo "Mobile 390×844:"
capture "$BASE/"        "home_mobile"    390 844
capture "$BASE/privacy" "privacy_mobile" 390 844
capture "$BASE/terms"   "terms_mobile"   390 844

echo "Desktop 1440×900:"
capture "$BASE/"        "home_desktop"    1440 900
capture "$BASE/privacy" "privacy_desktop" 1440 900
capture "$BASE/terms"   "terms_desktop"   1440 900

echo ""
echo "Screenshots saved to: $OUT"
ls -la "$OUT/"
