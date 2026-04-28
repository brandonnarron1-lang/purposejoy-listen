# PurposeJoy Listen v1 — Operator Resume Packet

**Read this first when you return.**\
All code is done. All documents are written. You just need to click through 4 files in order.

---

## STATUS

ItemStatusCode — all phases 1–9✅ CompleteBuild — clean, no errors✅ VerifiedD1 schema — applied, seeded✅ VerifiedBrand tokens — PROVISIONAL palette applied✅ Applied (see note below)GitHub repo — pushed to main✅ `github.com/brandonnarron1-lang/purposejoy-listen`R2 bucket creation⏳ Requires your actionCloudflare Pages deploy⏳ Requires your actionD1 + R2 bindings in Pages⏳ Requires your actionCloudflare Access (admin protection)⏳ Requires your actionDNS CNAME at GoDaddy⏳ Requires your actionApp icons (PWA)⏳ Requires your actionMike's email in Access policy⏳ Requires Mike's emailLegal copy (privacy/terms)⏳ Stubbed — fill before public launchWeb Analytics token⏳ Optional

---

## TIME REQUIRED

PhaseEstimated timeStep 1 — R2 + Pages deploy8 minStep 2 — Cloudflare Access4 minStep 3 — DNS + custom domain5 min + propagationStep 4 — Smoke test10 min**Total operator action time\~27 minutes**DNS propagation (unattended wait)2 min – 1 hour

---

## ORDER OF OPERATIONS

Execute these files in order — each builds on the previous:

1. `01_R2_AND_PAGES.md` — Enable R2, create bucket, connect repo to Pages, add bindings
2. `02_ACCESS.md` — Protect admin console via Cloudflare Access (email OTP)
3. `03_DNS_CUSTOM_DOMAIN.md` — Add CNAME at GoDaddy for `listen.purposejoy.org`
4. `04_SMOKE_TEST.md` — Verify everything works end-to-end before announcing

Additional resource:

- `MIKE_ADMIN_SOP.md` — Send this to Mike. Full walkthrough for uploading/publishing songs.

---

## ITEMS NEEDED BEFORE STARTING

Gather these before you open the first file:

ItemWhere to find it☐ Cloudflare account login`brandonnarron1@gmail.com` / [dash.cloudflare.com](http://dash.cloudflare.com)☐ Cloudflare Zero Trust access`one.dash.cloudflare.com` (same account)☐ GoDaddy account login[godaddy.com](http://godaddy.com)☐ Payment method on CloudflareNeeded to enable R2 (free tier, just for verification)☐ Mike's email addressAsk Mike → add to `02_ACCESS.md` wherever you see `TODO_MIKE_EMAIL`

---

## DECISIONS MADE AUTONOMOUSLY DURING THIS RUN

These were applied without operator input. You can override any of them after launch with a simple code change + push.

### 1. Brand Token Palette — PROVISIONAL

**Reason applied:** The original build used purple placeholder values (`#7C3AED`) not confirmed by you.\
**What was applied:** A PurposeJoy-aligned navy/gold palette:

TokenValueMeaningPrimary`#1B2A4E`Deep purpose navySecondary/Accent`#E8B14A`Joy goldBackground`#FAF7F2`Warm off-whiteSurface`#FFFFFF`Card/panel whiteText`#1B2A4E`Primary textMuted`#5A6478`Secondary textBorder`#E5E0D5`Dividers

**To override:** Edit `src/index.css` CSS variables → `git push` → redeploys automatically.\
The player bar and Now Playing overlay always render dark (navy bg, light text) regardless of background color.

### 2. download_enabled default → FALSE

Every uploaded song defaults to download-disabled. You can enable per-song in the admin toggle.

### 3. No test song uploaded

Launch state is an empty playlist. First upload happens in person with Mike.

---

## WHAT DOES NOT REQUIRE YOUR ACTION

Everything in this list is already done:

- All React components (player, admin UI, song pages, share sheet, install prompt)
- All API endpoints (streaming, playlist, OG meta, download gating, events)
- D1 schema applied (songs, playlists, playlist_items, events tables)
- Default playlist seeded (slug: `purposejoy`, published: true)
- PWA service worker (Workbox — audio streams bypass cache, cover art cached 30 days)
- OG meta injection per-song and per-playlist via HTMLRewriter
- Share card generation (SVG, R2-cached)
- Cloudflare Access admin protection code (functions/admin/api/\*)
- Brand token patch committed and build verified
- GitHub repo created and up to date

---

## ROLLBACK NOTES

If anything goes sideways during activation:

ScenarioRollbackR2 bucket wrong nameDelete and recreate with exact name `purposejoy-media`Pages deploy failsCheck build log for TypeScript errors; run `npm run build` locally to diagnoseBindings not workingIn Pages → Settings → Functions → re-save each binding → redeployAccess blocks you tooGo to [one.dash.cloudflare.com](http://one.dash.cloudflare.com) → confirm your email is in the policyCNAME wrong valueUpdate GoDaddy CNAME to exact value shown in Cloudflare Pages custom domain screenEverything brokenRoll back by deleting the Pages project and starting 01_R2_AND_PAGES.md fresh

**The code repo itself is stable.** All rollback options involve infrastructure changes, not code changes.

---

## ETA TO LIVE

With all manual steps executed in sequence:

- **\~27 minutes** active work
- **+ 2–60 minutes** DNS propagation (unattended — go do something else)
- **= \~30–90 minutes** total wall time from when you start to `https://listen.purposejoy.org/listen` being live

---

## NEXT SESSION HANDOFF PROMPT

```
Read ~/Desktop/Agent_Comms/PURPOSEJOY_LISTEN_V1_ACTIVATION_READY.md for full context.
Repo: ~/Desktop/purposejoy-listen
GitHub: https://github.com/brandonnarron1-lang/purposejoy-listen
Cloudflare account: 387ef9c6271adc9d99dae6dd2791dc4a
D1 ID: 5623368b-a8a3-4dc4-8789-14ba1acd0454

Task: [TASK]
```
