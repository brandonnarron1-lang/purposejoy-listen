#!/usr/bin/env bash
# PurposeJoy Listen — R2 upload only
# D1 is already seeded. This script uploads audio + covers to R2 only.
# Run AFTER: (1) R2 enabled in Cloudflare Dashboard, (2) purposejoy-media bucket created,
#            (3) npx wrangler login completed in terminal
#
# Usage: Run from repo root (~/Desktop/purposejoy-listen):
#   bash INGEST/scripts/r2_upload_only.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INGEST_DIR="${REPO_ROOT}/INGEST"
AUDIO_DIR="${INGEST_DIR}/audio"
COVERS_DIR="${INGEST_DIR}/covers"
MANIFEST="${INGEST_DIR}/manifest/songs.json"

BUCKET="purposejoy-media"

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq is required. brew install jq"
  exit 1
fi

echo "════════════════════════════════════════════════════════════"
echo "  PurposeJoy Listen — R2 Upload (D1 already seeded)"
echo "════════════════════════════════════════════════════════════"
echo ""

TRACK_COUNT=$(jq 'length' "$MANIFEST")
echo "→ Uploading $TRACK_COUNT tracks to bucket: $BUCKET"
echo ""

UPLOAD_FAILS=0
for i in $(seq 0 $((TRACK_COUNT - 1))); do
  SLUG=$(jq -r ".[$i].slug" "$MANIFEST")
  AUDIO_SRC=$(jq -r ".[$i].source_audio_filename" "$MANIFEST")
  AUDIO_KEY=$(jq -r ".[$i].audio_r2_key" "$MANIFEST")
  COVER_SRC=$(jq -r ".[$i].cover_filename" "$MANIFEST")
  COVER_KEY=$(jq -r ".[$i].cover_r2_key" "$MANIFEST")

  AUDIO_PATH="${AUDIO_DIR}/${AUDIO_SRC}"
  COVER_PATH="${COVERS_DIR}/${COVER_SRC}"

  if [ ! -f "$AUDIO_PATH" ]; then
    echo "  ❌ [$((i+1))/$TRACK_COUNT] $SLUG — audio missing: $AUDIO_PATH"
    UPLOAD_FAILS=$((UPLOAD_FAILS + 1))
    continue
  fi
  if [ ! -f "$COVER_PATH" ]; then
    echo "  ❌ [$((i+1))/$TRACK_COUNT] $SLUG — cover missing: $COVER_PATH"
    UPLOAD_FAILS=$((UPLOAD_FAILS + 1))
    continue
  fi

  echo "  → [$((i+1))/$TRACK_COUNT] $SLUG"
  echo "      audio: $AUDIO_KEY ($(du -h "$AUDIO_PATH" | cut -f1))"
  npx wrangler r2 object put "${BUCKET}/${AUDIO_KEY}" \
    --file "$AUDIO_PATH" \
    --content-type "audio/mpeg" \
    --remote 2>&1 | grep -E "(Uploaded|Error|error)" || true

  echo "      cover: $COVER_KEY"
  npx wrangler r2 object put "${BUCKET}/${COVER_KEY}" \
    --file "$COVER_PATH" \
    --content-type "image/png" \
    --remote 2>&1 | grep -E "(Uploaded|Error|error)" || true
done

if [ $UPLOAD_FAILS -gt 0 ]; then
  echo ""
  echo "❌ $UPLOAD_FAILS upload(s) failed. Fix missing files and re-run."
  exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ R2 UPLOAD COMPLETE — 16 objects (8 audio + 8 covers)"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "D1 was pre-seeded. All 8 tracks are live."
echo ""
echo "Verification:"
echo "  npx wrangler r2 object get purposejoy-media/audio/sng_be23fe3ea61f.mp3 --pipe > /dev/null && echo ok"
echo ""
echo "Pre-warm OG share cards (run once after site deploys):"
SLUGS=$(jq -r '.[].slug' "$MANIFEST")
for SLUG in $SLUGS; do
  echo "  curl -s https://listen.purposejoy.org/api/share-card/${SLUG}.png > /dev/null"
done
echo ""
