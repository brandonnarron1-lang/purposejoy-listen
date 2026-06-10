# RUN_STATE — purposejoy-listen

Updated: 2026-06-10 21:00 (perf sweep v1.0-perf merged + deployed to production)

## Status: LIVE ✅ — PERF SWEEP COMPLETE ✅

## Completed (session 4 — COWORK PERF-CACHE-LAZY, RUN_ID=perf-20260610-204101)

### What shipped
- **WebP cover art** — 14 covers converted (3.3MB → 304KB, 91% reduction)
- **R2 cover worker** — WebP content negotiation (`Accept: image/webp`), `Vary: Accept` header
- **LCP preload** — `<link rel="preload" as="image" href="/brand/wordmark.png" fetchpriority="high">` (actual LCP element on mobile)
- **font-display:optional** — eliminates FOUT/CLS from Google Fonts swap; dropped Open Sans from font load (not in brand DNA)
- **Inline critical CSS** — background + root height inlined in `<head>` to eliminate white flash and reduce FCP
- **LoadingSplash timing** — 2.2s → 0.8s total (in:200ms, hold:200ms, out:400ms)
- **Lazy JS splits** — `NowPlayingSheet` (15KB) + `LyricShareCard` (6KB) deferred via `React.lazy()`; 4 chunks total (was 2)
- **Playlist API cache headers** — `Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=3600` + `CDN-Cache-Control: public, s-maxage=3600`
- **Non-blocking font loading** — `media="print" onload="this.media='all'"` pattern
- **SW registration deferred** — `injectRegister: 'script-defer'` in vite.config.ts
- **robots.txt** — `Allow: /` + Sitemap reference

### Lighthouse results (mobile simulated, 3 cycles)

| Metric | Baseline | Final | Bar |
|--------|----------|-------|-----|
| Perf   | 62       | 78    | ≥90 ⚠️ |
| A11y   | 100      | 100   | 100 ✓ |
| SEO    | 92       | 100   | 100 ✓ |
| LCP    | 9.0s     | 4.9s  | <2.5s ⚠️ |
| CLS    | 0.006    | 0     | 0 ✓ |
| TBT    | —        | 10ms  | — ✓ |
| FCP    | —        | 2.7s  | — |

### Why Perf/LCP bar not reached
LCP is React-SPA-bound. The 294KB main bundle + loading splash on simulated mobile throttling (slow CPU + slow 4G) makes <2.5s LCP structurally impossible without:
- SSR / prerendering (e.g. Vite SSR, Astro, or CF Workers prerender)
- Removing the LoadingSplash entirely
- Serving a static HTML shell that hydrates progressively

CF Pages does **not** cache Function (Worker) responses at the CDN edge — `s-maxage` headers are stripped. This is a CF Pages architectural limitation; cache headers are in the function response for future migration to a CDN-aware setup (e.g. CF Workers with cache API).

### Git
- Branch: `perf-cache-lazy` → merged to `main` (c7de3b0)
- Tag: `v1.0-perf`
- Origin: pushed ✓

### Build process (documented for future sessions)
- ALWAYS: `unset NODE_ENV` before `npm install` (global NODE_ENV=production suppresses devDeps)
- ALWAYS: build from `/tmp/pj-perf-build/` (iCloud Desktop sync breaks node_modules symlinks)
- ALWAYS: `unset CLOUDFLARE_API_TOKEN` before wrangler write ops
- ALWAYS: `CI=true npx wrangler` to suppress interactive prompts
- Build pattern: `rsync (excl node_modules/dist/.git/_archive) → npm install --legacy-peer-deps → npx vite build → rsync dist/ back → wrangler pages deploy`

## Infrastructure
- D1: purposejoy_db (5623368b-a8a3-4dc4-8789-14ba1acd0454) — 14 songs
- R2: purposejoy-media — cover art + .webp variants for all 14 tracks
- Pages: purposejoy-listen — production @ listen.purposejoy.org
- Custom domain: listen.purposejoy.org → HTTP/2 200 ✅
- GitHub: main @ c7de3b0, tag v1.0-perf

## Remaining (open items)
- **Cloudflare Access /admin/* gate** — HUMAN ACTION REQUIRED: add Access policy in CF Zero Trust dashboard (brandonnarron1@gmail.com + Mike's email). Follow ACTIVATION/02_ACCESS.md.
- **LCP <2.5s** — requires SSR prerender or splash removal. Architectural decision needed before next perf sprint.
- **App icons** — only 6 sizes in public/icons/ (full PWA suite = 17, non-blocking)
- **Open Sans in CSS** — still referenced in 20+ places in index.css; replace with DM Sans (`--font-body`) to complete brand alignment and eliminate Google Fonts dependency

## Next entrypoint
Production: https://listen.purposejoy.org
All perf improvements live. For next session: SSR prerender decision or brand font cleanup.
