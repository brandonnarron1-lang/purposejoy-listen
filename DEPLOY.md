# PurposeJoy Listen — Deploy Guide

## Step 1 — Enable R2 (REQUIRED FIRST)

1. Go to <https://dash.cloudflare.com> → account `Brandonnarron1@gmail.com's Account`
2. Click **R2 Object Storage** in the left nav
3. Click **Enable R2** (free tier, no credit card needed)
4. Click **Create bucket**
5. Name: `purposejoy-media` → **Create bucket**

## Step 2 — Connect Repo to Cloudflare Pages

1. Go to <https://dash.cloudflare.com> → **Workers & Pages** → **Create application**
2. Click **Pages** tab → **Connect to Git**
3. Authorize GitHub → select repo: `brandonnarron1-lang/purposejoy-listen`
4. Branch: `main`
5. Build settings:
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Click **Save and Deploy**

After first deploy completes:

- You'll get a preview URL like `purposejoy-listen.pages.dev`

## Step 3 — Add Bindings to Pages

In Cloudflare Pages → your project → **Settings** → **Functions**:

**D1 Database:**

- Variable name: `DB`
- D1 database: `purposejoy_db`

**R2 Bucket:**

- Variable name: `MEDIA`
- R2 bucket: `purposejoy-media`

Click **Save** — this triggers a redeploy automatically.

## Step 4 — Set Up Cloudflare Access (Admin Protection)

1. Go to <https://one.dash.cloudflare.com> → **Access** → **Applications** → **Add an application**
2. Choose **Self-hosted**
3. Fill in:
   - App name: `PurposeJoy Admin`
   - Application domain: `purposejoy-listen.pages.dev` (or your custom domain later)
   - Path: `admin/*`
4. Session duration: **24 hours**
5. Next → Create policy:
   - Policy name: `Admins only`
   - Action: **Allow**
   - Rule type: **Emails** → add your email addresses
6. Authentication → select **One-time PIN**
7. Save

## Step 5 — Test the Preview URL

Open `https://purposejoy-listen.pages.dev/listen` in:

- \[ \] iOS Safari
- \[ \] Android Chrome
- \[ \] Desktop Chrome

## Step 6 — Upload First Song (Admin Walkthrough)

1. Open `https://purposejoy-listen.pages.dev/admin/music`
2. Enter your email when prompted → check email for OTP → paste code
3. Click **+ Upload song**
4. Select your MP3 + cover image
5. Fill in title, artist, description, lyrics
6. Click **Upload song** → watch progress bar
7. Back on song list → click **○ Draft** → confirm modal → **Yes, publish**
8. Open `/listen` — song appears in playlist with play button

## Step 7 — Add App Icons

Drop 4 PNG files into `public/icons/` in the repo:

- `icon-192.png` — 192×192px
- `icon-192-maskable.png` — 192×192px (safe zone 60%)
- `icon-512.png` — 512×512px
- `icon-512-maskable.png` — 512×512px

Generate maskable icons free at: <https://maskable.app>

Then push: `git add public/icons/ && git commit -m "feat: add PWA icons" && git push`

## Step 8 — DNS (When Ready for Custom Domain)

**Option A — Subdomain** `listen.purposejoy.org`At GoDaddy DNS → Add record:

```
Type:   CNAME
Host:   listen
Points to: purposejoy-listen.pages.dev
TTL:    1 hour
```

Then in Cloudflare Pages → Custom domains → Add `listen.purposejoy.org`

**Option B — Root domain** `purposejoy.org` (replaces Netlify) At GoDaddy → Nameservers → Custom → enter Cloudflare nameservers. Full steps: <https://developers.cloudflare.com/dns/zone-setups/full-setup/>

---

## Local Dev Commands

```bash
cd ~/Desktop/purposejoy-listen
NODE_ENV=development npm install --include=dev --legacy-peer-deps
npm run build           # production build
npm run dev             # Vite dev server (no bindings)
```

## Deploy Manually (after wrangler login)

```bash
cd ~/Desktop/purposejoy-listen
npx wrangler login      # opens browser OAuth
npx wrangler pages deploy dist --project-name purposejoy-listen
```
