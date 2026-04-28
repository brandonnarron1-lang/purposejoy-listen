# Step 3 — Custom Domain: listen.purposejoy.org

**Estimated time: 5 minutes operator action + 2–60 minutes DNS propagation**  
**Prerequisites:** Pages URL confirmed from Step 1, GoDaddy account login

---

## Strategy: Option B (locked)

- `purposejoy.org` → stays on Netlify, untouched
- `listen.purposejoy.org` → CNAME to Cloudflare Pages
- No nameserver migration required. No disruption to existing site.

---

## 3A — Tell Cloudflare Pages About Your Custom Domain

1. Go to Cloudflare dashboard → **Workers & Pages** → **purposejoy-listen**
2. Click **Custom domains** tab
3. Click **Set up a custom domain**
4. Type: `listen.purposejoy.org`
5. Click **Continue**
6. Cloudflare will show you a CNAME target. It will look like:
   ```
   purposejoy-listen.pages.dev
   ```
   📋 Note the exact value shown — use it in the next step.
7. Click **Activate domain** (Cloudflare will wait for DNS propagation)

Status will show **Pending**. That's expected. It becomes Active after you add the DNS record below.

---

## 3B — Add CNAME Record at GoDaddy

1. Log in to **https://www.godaddy.com**
2. Click your account name (top right) → **My Products**
3. Find `purposejoy.org` → click **DNS** (or "Manage DNS")
4. Scroll to the **CNAME** section → click **Add**
5. Fill in:
   ```
   Type:   CNAME
   Name:   listen
   Value:  purposejoy-listen.pages.dev
   TTL:    600 seconds (1 hour)
   ```
6. Click **Save**

⏳ DNS propagation usually takes 2–10 minutes. It can occasionally take up to 1 hour.

---

## 3C — Wait for Cloudflare Confirmation

1. Return to Cloudflare Pages → **Custom domains** tab
2. Refresh periodically. Status path: **Pending → Verifying → Active**
3. Once **Active**, Cloudflare automatically provisions a TLS certificate (Let's Encrypt). No action needed.

---

## 3D — Verify the Custom Domain

Once Active, run these checks:

**Browser:**
- Open `https://listen.purposejoy.org/listen` → page loads with valid HTTPS padlock
- Open `https://listen.purposejoy.org/admin/music` → Cloudflare Access OTP screen

**Terminal:**
```bash
curl -I https://listen.purposejoy.org/listen
```
→ Expected: `HTTP/2 200` with headers including:
```
content-type: text/html
cache-control: public, max-age=0, must-revalidate
```

```bash
curl -I https://listen.purposejoy.org/admin/api/songs
```
→ Expected: `HTTP/2 302` (redirect to Access login) — NOT a JSON body

---

## 3E — Update Access Policy for Custom Domain

After the custom domain is live, update your Access application to cover it:

1. Go to **one.dash.cloudflare.com** → Access → Applications → **PurposeJoy Listen Admin**
2. Click **Edit**
3. Click **+ Add application domain** twice:
   - Domain: `listen.purposejoy.org` / Path: `/admin`
   - Domain: `listen.purposejoy.org` / Path: `/admin/api`
4. Click **Save application**

---

## 3F — Update OG Meta URLs in Code (optional, post-launch)

The share card and OG meta currently point to `https://purposejoy.org/...`.  
Once the custom domain is live, these will work correctly at `https://listen.purposejoy.org/...` too.

If you ever want to update the canonical URL in OG tags:
```bash
cd ~/Desktop/purposejoy-listen
grep -rn "purposejoy.org" functions/listen/ functions/api/share-card/
# Update the hardcoded domain to listen.purposejoy.org if desired
# Then: git add -A && git commit -m "fix(og): update canonical URL" && git push
```

---

## 3G — Verify purposejoy.org is Untouched

Open `https://purposejoy.org` in a browser — confirm it still loads the existing Netlify site. The root domain is completely unaffected by this CNAME addition.

---

**Next:** Proceed to `04_SMOKE_TEST.md` to run acceptance tests before announcing.
