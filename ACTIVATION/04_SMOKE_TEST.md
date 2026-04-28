# Step 4 — Smoke Test & Launch Checklist

**Estimated time: 10 minutes**\
**Prerequisites:** Steps 1–3 complete. Custom domain live. Access policy active.

---

## Public-Side Checks (no login required)

### 4A — Core Pages

URLExpected result`https://listen.purposejoy.org/listen`PurposeJoy Listen page renders. "No tracks yet. Check back soon!" in track list. Play button visible. No console errors.`https://listen.purposejoy.org/privacy`Privacy stub page loads`https://listen.purposejoy.org/terms`Terms stub page loads`https://listen.purposejoy.org/offline`Offline fallback page loads

### 4B — OG Meta Tags

1. View source on `https://listen.purposejoy.org/listen` (Cmd+U in browser)
2. Search for `og:title` — you should find:

   ```html
   <meta property="og:title" content="PurposeJoy Listen">
   <meta property="og:description" content="Stream gospel and faith music...">
   <meta name="twitter:card" content="summary_large_image">
   ```
3. Validate OG tags: paste the URL into [**https://www.opengraph.xyz**](https://www.opengraph.xyz) — confirm all fields populate cleanly

### 4C — API Health

Run these in Terminal (or open directly in browser):

```bash
# Playlist API — should return pl_main with empty songs array
curl https://listen.purposejoy.org/api/playlists/purposejoy | python3 -m json.tool

# Events endpoint — should accept a POST
curl -X POST https://listen.purposejoy.org/api/events \
  -H "Content-Type: application/json" \
  -d '{"event_type":"play","song_id":"test"}' | python3 -m json.tool
```

Expected responses:

- Playlist: `{"id":"pl_main","slug":"purposejoy","title":"PurposeJoy","songs":[],...}`
- Events: `{"ok":true}`

### 4D — PWA Install Test (Mobile)

**Android Chrome:**

1. Open `https://listen.purposejoy.org/listen` in Chrome on Android
2. Wait \~5 seconds → you should see "Add PurposeJoy to Home screen" banner or menu item
3. Tap install → icon appears on home screen with correct name "PurposeJoy"
4. Open from home screen → app loads without browser chrome (standalone mode)

**iOS Safari:**

1. Open `https://listen.purposejoy.org/listen` in Safari on iPhone
2. Tap the Share button (box with arrow) → scroll down → **Add to Home Screen**
3. Name should auto-fill "PurposeJoy" → tap **Add**
4. Open from home screen → loads in standalone mode

⚠️ Icons will show a placeholder until you add PNG files to `public/icons/`. See README for instructions.

### 4E — Service Worker Registration

In Chrome DevTools on `/listen`:

1. Open DevTools → **Application** tab → **Service Workers**
2. Confirm: `sw.js` is registered and status is **Activated and running**
3. Check **Cache Storage** → you should see `workbox-*` caches being built

---

## Admin-Side Checks (Cloudflare Access OTP required)

### 4F — Access Gate

1. Open incognito window → `https://listen.purposejoy.org/admin/music`
2. Cloudflare Access screen appears → enter your email → check email → enter 6-digit code
3. You land on **PurposeJoy Admin** song list → empty, correct

### 4G — Admin UI Completeness

Verify all admin UI elements render:

- \[ \] Song list table with "Upload song" button
- \[ \] Click **+ Upload song** → form loads with all fields:
  - MP3 file picker
  - Cover image picker
  - Title, Artist, Album, Description, Lyrics, Release date
  - Download enabled toggle (starts OFF)
  - Sort order
- \[ \] Cancel button returns to song list

### 4H — Database Zero-State Verification

Confirm no accidental writes during testing:

```bash
cd ~/Desktop/purposejoy-listen
npx wrangler d1 execute purposejoy_db --remote \
  --command "SELECT COUNT(*) as songs FROM songs; SELECT COUNT(*) as events FROM events;"
```

→ Expected: `songs: 0`, `events: 1` (the test events POST from 4C above is fine)

---

## Lighthouse Baseline (document scores)

Run Lighthouse in Chrome DevTools on `https://listen.purposejoy.org/listen`:

1. Open Chrome DevTools → **Lighthouse** tab
2. Check: Performance, Accessibility, Best Practices, PWA
3. Click **Analyze page load**
4. Record scores in `ACTIVATION/LIGHTHOUSE_BASELINE.md`

**Targets for v1 launch:**

CategoryTargetBlocking?Performance≥85No (nice to have)Accessibility≥90Yes (fix before announce)Best Practices≥90NoPWA — Installable✅No (needs icons)PWA — Service Worker✅Yes

---

## All Green?

If all checks above pass: **v1 is launch-ready pending first content upload.**

**First upload workflow** (do this with Mike in person):

1. Admin → Upload song → fill form → Upload
2. Watch progress bar → song saved as Draft
3. Song list → toggle Draft → confirm "Yes, publish"
4. Open `https://listen.purposejoy.org/listen` in a new tab → song appears immediately
5. Hit play → audio streams ✅

---

## Post-Launch Reminders

- \[ \] Add real privacy policy to `/privacy` (replace stub)
- \[ \] Add real terms to `/terms` (replace stub)
- \[ \] Add Cloudflare Web Analytics token to `index.html`
- \[ \] Confirm brand hex tokens with B-Nelly (current palette is PROVISIONAL)
- \[ \] Add Mike's email to Access allowlist (`TODO_MIKE_EMAIL`)
- \[ \] Add app icons to `public/icons/` for full PWA experience
