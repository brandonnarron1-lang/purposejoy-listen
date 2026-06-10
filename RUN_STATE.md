# RUN_STATE — purposejoy-listen

Updated: 2026-06-10 (head-asset-fix deployed)

## Status: LIVE ✅ — HEAD + OG FIXED ✅

## Completed (session 2 — head + asset fix)
- HEAD tags: fully rewritten — title, description, og:type=music.album, og:url, og:image (working URL), twitter card, PWA meta
- OG card: generated via Pillow → public/og/og-card.png + twitter-card.png (1200×630 / 1200×600)
- manifest.webmanifest: name="Live With Purpose And Joy", short_name="Purpose & Joy", theme=#140A05, 4 icons
- vite.config.ts: includeAssets now includes og/*.png (was missing, caused og/ to not copy to dist)
- Commit: 23f9d3d (head-asset-fix branch) → merged main @ 410318e
- Production deploy: https://f081dc49.purposejoy-listen.pages.dev ✅
- Smoke: og-card 200, OG tags correct, manifest theme+icons correct, icon-512 200

## Completed (session 1 — brand system integration)
- Brand token CSS: src/styles/brand-tokens.css — canonical vars (#D4AF37 gold, #140A05 bg, #0A0500 deep)
  glass utilities, grain, aura-warm, data-pj-sequence, scroll-driven animations,
  View Transition names, pj-spotlight, reduced-motion overrides
- index.css: imports brand-tokens.css, aliases legacy vars, zero hex literals in base
- usePointerTrack.ts: pointer → --mx/--my CSS vars, spotlight on HeroMasthead
- SheetContext.tsx: View Transitions API wrapping open/close/toggle
- HeroMasthead.tsx: usePointerTrack spotlight, data-pj-sequence on content
- MiniPlayer.tsx: vt-cover-art on cover img
- NowPlayingSheet.tsx: vt-sheet on panel
- NowPlayingSheetContent.tsx: vt-cover-art on cover img
- TrackRow.tsx: all inline hex → CSS vars, scroll-fade-in class
- ListenHome.tsx: grain class, data-pj-sequence on track list
- manifest.webmanifest: name=PurposeJoy, theme_color=#140A05, bg_color=#0A0500
- index.html: title/OG/PWA meta → PurposeJoy, theme-color corrected, OG image → /brand/logo-warm.png
- tsc: clean (exit 0)
- Build: clean (exit 0)
- Commit: 1dedc97 "feat(brand): canonical token system, View Transitions API, pointer spotlight, scroll-driven anims"
- Merged to main, deployed: https://48728d6c.purposejoy-listen.pages.dev ✅

## Infrastructure
- D1: purposejoy_db (5623368b-a8a3-4dc4-8789-14ba1acd0454) — 14 songs, migrations 0001+0002 applied
- R2: purposejoy-media — exists
- Pages: purposejoy-listen — deployed, custom domain live
- Custom domain: listen.purposejoy.org → HTTP/2 200 ✅
- API: /api/playlists/purposejoy → 14 songs, lyrics_timed + transcript_state confirmed ✅
- GitHub: main @ 32383b8

## Remaining (post-launch, not blocking)
- Cloudflare Access admin protection (02_ACCESS.md) — needs manual Cloudflare Zero Trust setup
- App icons: only 6 sizes in public/icons/ — full PWA suite would be 17
- Privacy/terms stubs → real copy
- Web Analytics token in index.html
- Mike's email → Cloudflare Access allowlist

## Next entrypoint
App is live at https://listen.purposejoy.org
All brand system work shipped to production.
For Access setup: follow ACTIVATION/02_ACCESS.md manually in Cloudflare Zero Trust dashboard.
