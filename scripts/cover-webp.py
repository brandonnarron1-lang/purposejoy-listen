#!/usr/bin/env python3
"""
cover-webp.py — Download cover art from R2, convert to WebP ≤400px, re-upload.

Usage:
  CF_TOKEN=<token> python3 scripts/cover-webp.py [--dry-run]

Reads:
  - CF_ACCT env var (or hardcoded fallback)
  - CF_TOKEN env var

Writes to R2:
  - art/sng_*.webp  (new keys, parallel to existing .png/.jpg)
  - covers/*.webp   (replaces the 1.3MB the-waves-wont-win.jpg)

Does NOT delete originals (safe — API worker can be updated to serve .webp).
"""

import os, sys, json, urllib.request, urllib.error, pathlib, shutil, time
from PIL import Image
import io

DRY_RUN = "--dry-run" in sys.argv
CF_ACCT = os.environ.get("CF_ACCT", "387ef9c6271adc9d99dae6dd2791dc4a")
CF_TOKEN = os.environ.get("CF_TOKEN", "")
BUCKET = "purposejoy-media"
MAX_DIM = 400
WEBP_QUALITY = 82

if not CF_TOKEN:
    print("ERROR: CF_TOKEN env var required")
    sys.exit(1)

BASE = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCT}/r2/buckets/{BUCKET}"
HEADERS = {"Authorization": f"Bearer {CF_TOKEN}"}

WORK_DIR = pathlib.Path("/tmp/cover_webp_work")
WORK_DIR.mkdir(exist_ok=True)

def cf_get(path):
    req = urllib.request.Request(f"{BASE}{path}", headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def cf_download(key):
    """Download raw bytes of an R2 object."""
    url = f"{BASE}/objects/{urllib.parse.quote(key, safe='')}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        return r.read()

def cf_upload(key, data, content_type="image/webp"):
    """PUT bytes to R2."""
    import urllib.parse
    url = f"{BASE}/objects/{urllib.parse.quote(key, safe='')}"
    req = urllib.request.Request(
        url, data=data, method="PUT",
        headers={**HEADERS, "Content-Type": content_type}
    )
    with urllib.request.urlopen(req) as r:
        return r.status

import urllib.parse

def convert_to_webp(raw_bytes, max_dim=MAX_DIM, quality=WEBP_QUALITY):
    img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    w, h = img.size
    if w > max_dim or h > max_dim:
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, "WEBP", quality=quality, method=6)
    return out.getvalue()

# --- List all image objects (fetch both prefixes to ensure covers/ is included) ---
print("Listing R2 objects...")
seen_keys = {}
for prefix in ["art", "covers"]:
    resp = cf_get(f"/objects?limit=200&prefix={prefix}")
    for o in resp["result"]:
        if not o["key"].startswith("audio/"):
            seen_keys[o["key"]] = o
image_objects = list(seen_keys.values())
image_objects.sort(key=lambda o: o["size"], reverse=True)
print(f"Found {len(image_objects)} image objects:")
for o in image_objects:
    print(f"  {o['key']:<55} {round(o['size']/1024):>6} KB")

print()
results = []

for obj in image_objects:
    key = obj["key"]
    orig_size = obj["size"]

    # Derive WebP key — replace extension
    stem = key.rsplit(".", 1)[0]
    webp_key = stem + ".webp"

    print(f"Processing: {key}")

    if DRY_RUN:
        print(f"  [DRY RUN] Would convert → {webp_key}")
        results.append({"key": key, "webp_key": webp_key, "status": "dry-run"})
        continue

    try:
        # Download
        print(f"  Downloading ({round(orig_size/1024)}KB)...", end=" ", flush=True)
        raw = cf_download(key)
        print(f"got {len(raw)} bytes")

        # Convert
        print(f"  Converting to WebP ≤{MAX_DIM}px q={WEBP_QUALITY}...", end=" ", flush=True)
        webp_data = convert_to_webp(raw)
        reduction = round((1 - len(webp_data)/orig_size) * 100)
        print(f"{round(len(webp_data)/1024)}KB ({reduction}% smaller)")

        # Upload
        print(f"  Uploading → {webp_key}...", end=" ", flush=True)
        status = cf_upload(webp_key, webp_data)
        print(f"HTTP {status}")

        results.append({
            "key": key,
            "webp_key": webp_key,
            "orig_kb": round(orig_size/1024),
            "webp_kb": round(len(webp_data)/1024),
            "reduction_pct": reduction,
            "status": "ok"
        })

        time.sleep(0.2)  # gentle rate limit

    except Exception as e:
        print(f"  ERROR: {e}")
        results.append({"key": key, "webp_key": webp_key, "status": f"error: {e}"})

# Summary
print("\n=== CONVERSION SUMMARY ===")
ok = [r for r in results if r.get("status") == "ok"]
errors = [r for r in results if "error" in str(r.get("status", ""))]
total_orig = sum(r.get("orig_kb", 0) for r in ok)
total_webp = sum(r.get("webp_kb", 0) for r in ok)
print(f"Converted: {len(ok)}/{len(results)}")
if ok:
    print(f"Total before: {total_orig} KB")
    print(f"Total after:  {total_webp} KB")
    print(f"Saved:        {total_orig - total_webp} KB ({round((1-total_webp/total_orig)*100)}%)")
if errors:
    print(f"Errors: {len(errors)}")
    for r in errors:
        print(f"  {r['key']}: {r['status']}")

# Save manifest
manifest_path = "/tmp/cover_webp_manifest.json"
with open(manifest_path, "w") as f:
    json.dump(results, f, indent=2)
print(f"\nManifest saved: {manifest_path}")
