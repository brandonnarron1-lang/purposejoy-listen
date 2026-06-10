# RUN_STATE — purposejoy-listen

Updated: 2026-06-10 (v1.1 merged + deployed to production)

## Status: LIVE ✅ — V1.1 COMPLETE ✅

---

## Completed (session 5 — COWORK V1.1 ALBUM RELEASE)

### Track A — Lyrics (14/14 ✅)
- All 14 songs transcribed with Whisper, normalized, pushed to D1
- `lyrics_timed` column: JSON object `{words, lines, duration, plain_text}` for all 14 tracks
- `transcript_state = 'ready'` for all 14 songs
- Verification query: `json_array_length(json_extract(lyrics_timed, '$.lines'))` (not `json_array_length(lyrics_timed)` — stored as object not array)
- `INGEST/scripts/update-lyrics.sql` committed (12 UPDATEs — 2 tracks had prior data)

### Track B — Prerender Seed + Splash Defer (shipped ✅)
- `scripts/prerender-seed.mjs` — build-time script, runs after `vite build`
  - Queries D1 directly via wrangler (`execFileSync` + `node wrangler.js` + `--command=<sql>`)
  - Inlines 14-song playlist JSON as `<script id="pj-seed" type="application/json">` into `dist/index.html`
  - 5025 bytes, idempotent (replaces existing seed on re-run)
- `package.json` build: `tsc -b && vite build && node scripts/prerender-seed.mjs`
- `src/pages/ListenHome.tsx` — `readSeed()` reads inline JSON synchronously
  - Skips network fetch entirely when seed present
  - Tracks paint without waiting for `/api/playlists/purposejoy` round-trip
- `src/App.tsx` — `LoadingSplash` deferred via `requestIdleCallback` (300ms timeout)
  - Splash no longer mounts before first paint — track list is LCP element
  - Return visits: `sessionStorage.getItem('pj_splashed')` still skips splash
  - Safari fallback: `requestAnimationFrame`

### Build outputs
- 4 JS chunks: main (295KB gz:91KB), NowPlayingSheet (15KB), LyricShareCard (6KB), index.browser (27KB)
- Seed: 5025 bytes inline in HTML
- CSS: 70KB gz:14KB

### Git
- Branch: `v1.1-release` → merged to `main` (64d3eb3)
- Tag: `v1.1`
- Origin: pushed ✅

---

## Perf history

| Session | Perf | LCP  | CLS | A11y | Notes |
|---------|------|------|-----|------|-------|
| baseline | 62  | 9.0s | 0.006 | 100 | Before any work |
| v1.0-perf | 78  | 4.9s | 0   | 100 | WebP, lazy splits, splash 0.8s, inline CSS |
| v1.1 (expected) | ≥80 | <4s | 0 | 100 | Seed eliminates API fetch; splash deferred past LCP |

> Lighthouse not yet run against v1.1 production — run next session if quality bar matters.
> Perf ≥90 / LCP <2.5s still requires SSR or removing splash entirely (React SPA ceiling).

---

## Infrastructure
- D1: purposejoy_db (5623368b-a8a3-4dc4-8789-14ba1acd0454) — 14 songs, all with lyrics_timed
- R2: purposejoy-media — WebP cover art for all 14 tracks
- Pages: purposejoy-listen — production @ listen.purposejoy.org
- GitHub: main @ 64d3eb3, tag v1.1

---

## Build process (required every session)
```
unset NODE_ENV           # prevent devDep suppression
unset CLOUDFLARE_API_TOKEN  # before wrangler write ops
# Always build from /tmp (iCloud Desktop sync breaks node_modules):
rsync -a --delete --exclude=node_modules --exclude=dist --exclude=.git \
  --exclude=_archive --exclude='*.mp4' --exclude='*.mov' --exclude='*.mp3' \
  ~/Desktop/purposejoy-listen/ /tmp/pj-build/
cd /tmp/pj-build && npm install --legacy-peer-deps
npm run build   # tsc + vite + prerender-seed (auto-runs)
CI=true npx wrangler pages deploy dist --project-name=purposejoy-listen --branch=main
```

---

## Remaining open items
- **Lighthouse v1.1** — not yet run; do next session if needed
- **Cloudflare Access /admin/*** — HUMAN ACTION: add Access policy in CF Zero Trust dashboard (brandonnarron1@gmail.com + Mike's email). See ACTIVATION/02_ACCESS.md
- **LCP <2.5s** — still requires SSR prerender or splash removal (React SPA ceiling). Seed + splash defer should improve from 4.9s but won't hit 2.5s on simulated throttling
- **Open Sans in CSS** — still referenced in index.css; replace with DM Sans (`--font-body`) to eliminate Google Fonts dependency
- **App icons** — only 6 sizes; full PWA suite = 17 (non-blocking)

## Next entrypoint
Production: https://listen.purposejoy.org
All v1.1 improvements live. For next session: Lighthouse verify or brand font cleanup.
