# PurposeJoy Listen

Mobile-first installable PWA music player for PurposeJoy.  
**Live URL:** https://purposejoy.org/listen  
**Stack:** Cloudflare Pages + Functions + D1 + R2 + Tailwind + React + Vite  
**Admin:** /admin/music (Cloudflare Access — email OTP)

---

## Local Dev

```bash
# Install
NODE_ENV=development npm install --include=dev --legacy-peer-deps

# Dev server (frontend only, no D1/R2)
npm run dev

# Dev with Cloudflare bindings (D1 + R2 local simulation)
npx wrangler pages dev dist --d1 DB=5623368b-a8a3-4dc4-8789-14ba1acd0454 --r2 MEDIA=purposejoy-media

# Build
npm run build
```

### Environment
- Node v25+ required
- `NODE_ENV=development` MUST be set for installs (global on this machine — see CLAUDE.md)
- wrangler.toml has D1 and R2 bindings preconfigured

---

## Deploy to Cloudflare Pages

### First deploy
```bash
# Login
npx wrangler login

# Deploy preview (no prod until approved)
npx wrangler pages deploy dist --project-name purposejoy-listen
```

### Production deploy
```bash
npx wrangler pages deploy dist --project-name purposejoy-listen --branch main
```

### Cloudflare Dashboard steps (required after first deploy)
1. Go to **Pages → purposejoy-listen → Settings → Functions**
2. Add D1 binding: variable `DB` → database `purposejoy_db`
3. Add R2 binding: variable `MEDIA` → bucket `purposejoy-media`
4. Redeploy for bindings to take effect

---

## R2 Bucket Setup (REQUIRED — manual step)

R2 is not enabled on this account. Before the app can stream audio:

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage**
2. Enable R2 (free tier: 10GB storage, 1M reads/mo)
3. Create bucket named exactly: **`purposejoy-media`**
4. Return here and run:
   ```bash
   npx wrangler r2 bucket create purposejoy-media
   ```

---

## Admin Onboarding (First Upload)

1. Navigate to `https://purposejoy.org/admin/music`
2. Cloudflare Access will prompt for your email OTP
3. Click **+ Upload song**
4. Fill in: MP3 file, cover image (optional), title, artist, description, lyrics
5. Click **Upload song** — song uploads to R2, saved as Draft
6. Back on song list, click **○ Draft** toggle → confirm modal → **Yes, publish**
7. Song is now live on `/listen`

---

## DNS Cutover (GoDaddy → purposejoy.org)

**Option A: Subdomain only** (`listen.purposejoy.org`)
Add a CNAME at GoDaddy:
```
Type:  CNAME
Name:  listen
Value: purposejoy-listen.pages.dev
TTL:   Auto
```

**Option B: Root domain** (`purposejoy.org/listen`)
Requires migrating DNS to Cloudflare nameservers:
1. In Cloudflare dashboard: Add site `purposejoy.org`
2. Cloudflare gives you 2 nameservers (e.g. `ns1.cloudflare.com`)
3. At GoDaddy: Nameservers → Custom → paste Cloudflare NS
4. Propagation: 1–48 hours
5. In Cloudflare Pages → Custom Domain → add `purposejoy.org`

---

## Cloudflare Access Setup (Admin Protection)

1. Go to [one.dash.cloudflare.com](https://one.dash.cloudflare.com) → **Access → Applications**
2. Click **Add an application** → **Self-hosted**
3. Configure:
   - Name: `PurposeJoy Admin`
   - Session duration: 24 hours
   - Application domain: `purposejoy.org` (or `purposejoy-listen.pages.dev`)
   - Path: `admin/*`
4. Create policy:
   - Policy name: `Admins`
   - Action: Allow
   - Include rule: **Emails** → add your email and Mike's email
5. Authentication method: **One-time PIN** (email OTP, no account required)
6. Save and deploy

---

## Project Structure

```
purposejoy-listen/
├── src/
│   ├── App.tsx                   # Router + PlayerProvider shell
│   ├── main.tsx
│   ├── index.css                 # CSS variables + Tailwind
│   ├── types.ts                  # Shared TypeScript types
│   ├── context/
│   │   └── PlayerContext.tsx     # Global audio state + Media Session API
│   ├── components/
│   │   ├── PlayerBar.tsx         # Persistent bottom player (mobile + desktop)
│   │   ├── NowPlayingModal.tsx   # Mobile fullscreen now-playing
│   │   ├── TrackRow.tsx          # Playlist track row
│   │   ├── ShareButton.tsx       # Share sheet (native + fallbacks)
│   │   └── InstallPrompt.tsx     # PWA install CTA
│   └── pages/
│       ├── ListenHome.tsx        # /listen — playlist + big play button
│       ├── SongDetail.tsx        # /listen/:songSlug
│       ├── PlaylistDetail.tsx    # /listen/playlist/:slug
│       ├── OfflinePage.tsx       # /offline
│       ├── PrivacyPage.tsx       # /privacy (stub — fill before launch)
│       ├── TermsPage.tsx         # /terms (stub — fill before launch)
│       └── admin/
│           ├── AdminMusic.tsx    # /admin/music — song table + stats
│           └── AdminSongForm.tsx # /admin/music/new + /admin/music/:id/edit
├── functions/
│   ├── _types.ts                 # Env interface (DB, MEDIA)
│   ├── _middleware.ts            # CORS headers
│   ├── api/
│   │   ├── playlists/[slug].ts   # GET playlist + songs
│   │   ├── songs/[slug].ts       # GET single song
│   │   ├── stream/[slug].ts      # Range-aware audio streaming from R2
│   │   ├── cover/[key].ts        # Cover art from R2 (cached)
│   │   ├── events.ts             # POST analytics events
│   │   └── share-card/[slug].ts  # OG image generation (SVG, cached to R2)
│   ├── listen/
│   │   ├── [songSlug].ts         # OG meta injection for song pages
│   │   └── playlist/[slug].ts    # OG meta injection for playlist pages
│   ├── download/[slug].ts        # Download endpoint (if enabled)
│   └── admin/api/
│       ├── songs/
│       │   ├── index.ts          # GET all songs, POST new (multipart upload)
│       │   └── [id]/index.ts     # PATCH metadata, DELETE (soft/hard)
│       ├── playlists/
│       │   ├── index.ts          # GET all, POST new
│       │   └── [id]/index.ts     # PATCH, PUT (reorder items)
│       └── stats.ts              # GET play/download/share counts
├── migrations/
│   └── 0001_schema.sql           # Full schema + seed (applied to D1)
├── public/
│   ├── app.webmanifest           # PWA manifest
│   └── icons/                    # ⚠️ Add icon files before launch (see below)
├── wrangler.toml                 # D1 + R2 bindings
├── vite.config.ts                # Vite + Tailwind + vite-plugin-pwa
└── tsconfig.json
```

---

## ⚠️ Pre-Launch Checklist (B-Nelly Action Items)

### BLOCKING
- [ ] **Enable R2** in Cloudflare dashboard, create `purposejoy-media` bucket
- [ ] **App icons**: Add 4 PNG files to `public/icons/`:
  - `icon-192.png` (192×192)
  - `icon-192-maskable.png` (192×192, safe zone 60%)
  - `icon-512.png` (512×512)
  - `icon-512-maskable.png` (512×512, safe zone 60%)
  - Use your PurposeJoy logo. Online tool: https://maskable.app
- [ ] **Cloudflare Access** — set up admin policy with your email + Mike's email (steps above)
- [ ] **D1 + R2 bindings** in Pages dashboard (steps above)

### BRAND (before Phase 7 finalizes)
- [ ] Confirm brand hex tokens or replace CSS vars in `src/index.css`:
  - `--pj-primary: #7C3AED` (placeholder — using purple)
  - `--pj-secondary: #A78BFA`
  - `--pj-bg: #0F0A1E`
  - `--pj-surface: #1A1232`
- [ ] Update `theme_color` and `background_color` in `public/app.webmanifest`
- [ ] Update `theme-color` in `index.html`

### LEGAL (not blocking launch)
- [ ] Replace stub in `/privacy` with real privacy policy
- [ ] Replace stub in `/terms` with real terms of service
- [ ] Review `/sms-terms` if SMS list is ever activated

### ANALYTICS
- [ ] Add Cloudflare Web Analytics token to `index.html` (uncomment script tag, replace `YOUR_TOKEN_HERE`)
  - Get token: Cloudflare dashboard → Web Analytics → Add site

### DNS
- [ ] Decide: subdomain (`listen.purposejoy.org`) or root (`purposejoy.org`) — see DNS section above
- [ ] Apply DNS records at GoDaddy (or migrate NS to Cloudflare)
- [ ] Add custom domain in Pages dashboard after DNS propagates

---

## Cloudflare Resources Created

| Resource | ID/Name |
|----------|---------|
| D1 Database | `purposejoy_db` — ID: `5623368b-a8a3-4dc4-8789-14ba1acd0454` |
| R2 Bucket | `purposejoy-media` — ⚠️ PENDING (enable R2 first) |
| Account | `387ef9c6271adc9d99dae6dd2791dc4a` |
