# Step 2 — Cloudflare Access (Admin Protection)

**Estimated time: 4 minutes**  
**Prerequisites:** Pages URL from Step 1 (`TODO_PAGES_URL`), Mike's email address (`TODO_MIKE_EMAIL`)

---

## Why This Step Matters

Without Access, anyone who discovers `/admin/music` can see and modify your song list.  
Cloudflare Access puts a login gate in front of `/admin/*` using email one-time PIN — no passwords, no accounts needed.

---

## 2A — Create the Access Application

1. Go to **https://one.dash.cloudflare.com** → log in with the same Cloudflare account
2. In the left sidebar → **Access** → **Applications**
3. Click **Add an application**
4. Choose **Self-hosted**
5. Fill in application details:
   - **Application name:** `PurposeJoy Listen Admin`
   - **Session duration:** 24 hours
   - **Application domain:**
     - **Subdomain:** *(leave blank or type `purposejoy-listen`)*
     - **Domain:** type exactly: `purposejoy-listen.pages.dev`
     - **Path:** `/admin`
   - Click **+ Add application domain** and add a second entry:
     - **Domain:** `purposejoy-listen.pages.dev`
     - **Path:** `/admin/api`
6. Click **Next**

---

## 2B — Create the Identity Policy

1. On the "Add policies" screen, click **Add a policy**
2. Fill in:
   - **Policy name:** `Admin allowlist`
   - **Action:** Allow
3. Under **Configure rules** → Include:
   - Rule type: **Emails**
   - Value: enter your email address
   - Click **+ Add require** and add another email entry for: `TODO_MIKE_EMAIL`
4. Click **Save policy**
5. Click **Next**

---

## 2C — Set Authentication Method

1. On the "Set up" screen:
   - Under **Login methods**, enable **One-time PIN**
   - This sends a 6-digit code to the user's email — no app install, no password
2. Click **Add application**

---

## 2D — Verify It Works

1. Open an **incognito window**
2. Navigate to `https://purposejoy-listen.pages.dev/admin/music`
3. You should see a Cloudflare Access login page asking for your email
4. Enter your email → check inbox → paste the 6-digit code → click **Sign in**
5. You should land on the admin song list (empty, which is correct)

**CLI verification** (confirms Access is blocking API too):
```bash
curl -i https://purposejoy-listen.pages.dev/admin/api/songs
```
→ Expected: `HTTP/2 302` redirect to Cloudflare Access login page  
→ NOT expected: JSON response (would mean admin is unprotected)

---

## 2E — After Custom Domain Is Live (Step 3)

Once `listen.purposejoy.org` is live, revisit this Access application and add the custom domain:

1. Access → Applications → **PurposeJoy Listen Admin** → Edit
2. Click **+ Add application domain**
3. Add: domain `listen.purposejoy.org` / path `/admin`
4. Add: domain `listen.purposejoy.org` / path `/admin/api`
5. Save

---

## Important Notes

- **TODO_MIKE_EMAIL** — add Mike's email before going live. If you don't have it yet, you can edit the policy and add it later under Access → Applications → your app → Policies → edit.
- Session lasts 24 hours per device. Each person only needs to log in once per day.
- If someone enters the wrong email (not on the allowlist), Access shows "403 Forbidden" — they never reach the admin UI.

---

**Next:** Proceed to `03_DNS_CUSTOM_DOMAIN.md` to attach `listen.purposejoy.org`.
