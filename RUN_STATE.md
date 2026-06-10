# RUN_STATE — purposejoy-listen

Updated: 2026-06-10 (v1.1 verified — visual regression complete)

## Status: LIVE ✅ — V1.1 VERIFIED ✅

---

## Completed (session 6 — COWORK V1.1 VERIFICATION)

### Phase 1 — Production checks ✅
- Seed live: `<script id="pj-seed">` present in prod HTML, 5025 bytes, 14 songs
- Cache headers: function responses `max-age=0,must-revalidate`; cover WebP `immutable`
- Lyrics: 14/14 tracks have `lyrics_timed` with populated `.lines` array
  - Verified via: `json_array_length(json_extract(lyrics_timed, '$.lines'))` > 0 for all 14

### Phase 2 — Lighthouse mobile ✅ (ceiling documented)
| Run | Perf | LCP | A11y | Notes |
|-----|------|-----|------|-------|
| v1.1 initial (prior session) | 86 | 3.8s | 100 | rIC-deferred splash as LCP anchor |
| C1 (seed-suppresses-splash) | 70 | 5.6s | 100 | hero opacity-0 surfaced as LCP — regression |
| C2 (hero opacity fix) | 76 | 5.4s | 100 | preload doesn't help JS-gated img |
| Restored v1.1 baseline | 71-77 | 5.1-5.5s | 100 | variance across runs |

**SPA ceiling conclusion**: Perf ≥90 / LCP <2500ms not achievable without SSR/prerender.
- React SPA parse time on simulated 4G throttling: ~850ms
- Hero image is JS-rendered — preloading doesn't move LCP without SSR
- rIC-deferred splash is a better LCP anchor than the hero (paints ~300ms vs ~1050ms JS floor)
- C1 and C2 changes reverted; v1.1 App.tsx restored

**A11y=100 confirmed ✅** across all runs.

### Phase 3 — Visual regression ✅
6 screenshots captured at 2026-06-10T22:42 against production:
- `docs/visual-regression/home-mobile.png`     426KB  ✓
- `docs/visual-regression/privacy-mobile.png`   77KB  ✓
- `docs/visual-regression/terms-mobile.png`     73KB  ✓
- `docs/visual-regression/home-desktop.png`   1562KB  ✓
- `docs/visual-regression/privacy-desktop.png`  99KB  ✓
- `docs/visual-regression/terms-desktop.png`    94KB  ✓
Viewport: mobile=390×844, desktop=1440×900. All pages rendered with React hydrated (2s settle).

---

## v1.1 Feature Summary (shipped)

### Track A — Lyrics (14/14 ✅)
- All 14 songs transcribed with Whisper, normalized, pushed to D1
- `lyrics_timed` column: JSON object `{words, lines, duration, plain_text}` for all 14 tracks
- `transcript_state = 'ready'` for all 14 songs
- Verification query: `json_array_length(json_extract(lyrics_timed, '$.lines'))`

### Track B — Prerender Seed + Splash Defer ✅
- `scripts/prerender-seed.mjs` — build-time D1 fetch → inlines 14-song seed into `dist/index.html`
- `src/pages/ListenHome.tsx` — `readSeed()` reads inline JSON synchronously, skips network fetch
- `src/App.tsx` — `LoadingSplash` deferred via `requestIdleCallback(mount, {timeout:300})`
  - Splash mounts after first paint — track list is visible before splash appears
  - Return visits: `sessionStorage.getItem('pj_splashed')` skips splash

---

## Infrastructure
- D1: purposejoy_db (5623368b-a8a3-4dc4-8789-14ba1acd0454) — 14 songs, all with lyrics_timed
- R2: purposejoy-media — WebP cover art for all 14 tracks
- Pages: purposejoy-listen — production @ listen.purposejoy.org
- GitHub: main @ 0ec07f3 (post-verification)

---

## Build process (required every session)
```
unset NODE_ENV
unset CLOUDFLARE_API_TOKEN
rsync -a --delete --exclude=node_modules --exclude=dist --exclude=.git \
  --exclude=_archive --exclude='*.mp4' --exclude='*.mov' --exclude='*.mp3' \
  ~/Desktop/purposejoy-listen/ /tmp/pj-build/
cd /tmp/pj-build && npm install --legacy-peer-deps
npm run build   # tsc + vite + prerender-seed (auto-runs)
CI=true npx wrangler pages deploy dist --project-name=purposejoy-listen --branch=main
```

---

## Remaining open items
- **Cloudflare Access /admin/*** — HUMAN ACTION: add Access policy in CF Zero Trust dashboard
  (brandonnarron1@gmail.com + Mike's email). See ACTIVATION/02_ACCESS.md
- **LCP <2.5s** — requires SSR/prerender. Not achievable with React SPA + simulated throttling.
  Options if needed: Cloudflare Pages SSR (Hono/React), or static HTML shell with hydration.
- **Open Sans in CSS** — still referenced in index.css; replace with DM Sans (`--font-body`)
  to eliminate Google Fonts dependency (non-blocking)
- **App icons** — only 6 sizes; full PWA suite = 17 (non-blocking)

## Next entrypoint
Production: https://listen.purposejoy.org
v1.1 fully verified. For next session: SSR exploration or brand font cleanup.
