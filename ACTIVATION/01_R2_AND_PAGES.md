# Step 1 — Enable R2 + Deploy to Cloudflare Pages

**Estimated time: 8 minutes**  
**Prerequisites:** Cloudflare account login, payment method on file (R2 is free-tier but requires a card)

---

## 1A — Enable R2 Object Storage

1. Go to **https://dash.cloudflare.com** → log in with `Brandonnarron1@gmail.com`
2. In the left sidebar, click **R2 Object Storage**
3. You'll see an "Enable R2" screen. Click **Enable R2**
   - Note: R2 requires a payment method, but the free tier is 10GB storage + 1M reads/month — no charge unless you exceed those limits
   - Enter your payment method if prompted, then click **Enable**
4. Once enabled, click **Create bucket**
5. Fill in:
   - **Bucket name:** `purposejoy-media` ← exact spelling, lowercase, no spaces
   - **Location:** Automatic
   - **Default storage class:** Standard
6. Click **Create bucket**

✅ Acceptance: You see `purposejoy-media` in the R2 bucket list.

---

## 1B — Connect GitHub Repo to Cloudflare Pages

1. In Cloudflare dashboard left sidebar → **Workers & Pages**
2. Click **Create application**
3. Click the **Pages** tab
4. Click **Connect to Git**
5. If prompted, authorize Cloudflare to access your GitHub account → **Authorize Cloudflare Pages**
6. Under "Select a repository", search for and select: `brandonnarron1-lang/purposejoy-listen`
7. Click **Begin setup**
8. Fill in build settings:
   - **Project name:** `purposejoy-listen`
   - **Production branch:** `main`
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** *(leave blank)*
9. Click **Save and Deploy**

⏳ First build takes 2–3 minutes. Watch the build log. When it says "Success", you'll see a URL like:
```
https://purposejoy-listen.pages.dev
```
📋 **Write down your Pages URL here:** `TODO_PAGES_URL` (you'll need it in Step 2 and Step 3)

✅ Acceptance: Build log shows green. URL loads (it'll show a React app — /listen will be empty, which is correct).

---

## 1C — Add D1 and R2 Bindings

After the first deploy, the app can't read from the database or storage yet — you need to wire up the bindings.

1. In Cloudflare Pages → click your project **purposejoy-listen**
2. Click **Settings** tab → **Functions** in the left menu
3. Scroll to **D1 database bindings** → click **Add binding**
   - Variable name: `DB`
   - D1 database: `purposejoy_db`
   - Click **Save**
4. Scroll to **R2 bucket bindings** → click **Add binding**
   - Variable name: `MEDIA`
   - R2 bucket: `purposejoy-media`
   - Click **Save**
5. Go back to **Deployments** tab → click **Retry deployment** on the latest deployment (or push any small commit to trigger a new build)

⏳ Wait for the new deployment to complete (~2 min).

✅ Acceptance: Open `https://TODO_PAGES_URL/listen` in browser → you see the PurposeJoy Listen page with "No tracks yet. Check back soon!" message and the PurposeJoy branding. No errors in browser console.

✅ Acceptance: Open `https://TODO_PAGES_URL/api/playlists/purposejoy` → returns JSON:
```json
{"id":"pl_main","slug":"purposejoy","title":"PurposeJoy","songs":[]}
```

---

## 1D — Verify Song Count is Zero (expected)

After confirming API works, verify the songs table is empty (correct pre-launch state):

Run in Terminal:
```bash
cd ~/Desktop/purposejoy-listen
npx wrangler d1 execute purposejoy_db --remote --command "SELECT COUNT(*) as songs FROM songs;"
```
→ Expected: `songs: 0`

Or via the Cloudflare dashboard → D1 → `purposejoy_db` → **Console** tab → paste the query.

---

**Next:** Proceed to `02_ACCESS.md` to protect the admin console.
