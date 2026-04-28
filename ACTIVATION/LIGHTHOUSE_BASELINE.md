# Lighthouse Baseline — PurposeJoy Listen

**Status:** PENDING — run after custom domain is live (Step 3 complete)

---

## How to Run

1. Open Chrome → navigate to `https://listen.purposejoy.org/listen`
2. Open Chrome DevTools (F12 or Cmd+Option+I)
3. Click **Lighthouse** tab
4. Select: Performance, Accessibility, Best Practices, PWA
5. Device: **Mobile** (primary target)
6. Click **Analyze page load**
7. Fill in scores below when complete

---

## Scores (fill in after testing)

**Tested URL:** `https://listen.purposejoy.org/listen`  
**Test date:** _____________  
**Device mode:** Mobile / Desktop  

| Category | Score | Target | Status |
|----------|-------|--------|--------|
| Performance | ___ | ≥85 | ⬜ |
| Accessibility | ___ | ≥90 | ⬜ |
| Best Practices | ___ | ≥90 | ⬜ |
| SEO | ___ | ≥90 | ⬜ |
| PWA — Installable | ✅/❌ | ✅ | ⬜ |
| PWA — Service Worker | ✅/❌ | ✅ | ⬜ |
| PWA — Offline | ✅/❌ | ✅ | ⬜ |

---

## Known Pre-Launch Gaps

These will lower scores but are documented:

| Gap | Impact | Fix |
|-----|--------|-----|
| Missing app icons (192/512 PNG) | PWA installable = ❌ | Add to `public/icons/`, push |
| Privacy/Terms stubs | SEO may flag thin content | Replace with real copy |
| No Web Analytics token | — | Add CF Analytics token to index.html |
| Empty playlist on first load | No LCP media to measure | Will improve after first song upload |

---

## Benchmark Targets (post first-upload)

After uploading a song with cover art, re-run Lighthouse. Cover art as LCP element should improve Performance score. Update table above.
