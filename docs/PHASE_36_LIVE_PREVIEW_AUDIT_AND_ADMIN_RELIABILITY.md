# PHASE 36 — LIVE PREVIEW AUDIT + ADMIN RELIABILITY

Prioritized fix plan for the next wave after the preview deployment. Use this once the live preview URL is available and the external audit begins.

**Status:** Preview baseline deployed. Not production-final until major admin flows and hero behavior are verified on the live preview.

---

## Track 1 — Hero reliability

- [ ] Verify live carousel loop on all 3 slots (1 → 2 → 3 → 1) on the deployed preview.
- [ ] Verify YouTube embed behavior on desktop and mobile (if hero uses embed slots).
- [ ] Fix any remaining stutter, freeze, or slot desync observed in production-like conditions.
- [ ] Confirm full-screen cover without awkward crop or letterboxing on key viewports.

**Acceptance:** 10+ transitions with no visible freeze; next video ready before fade; sequence correct.

---

## Track 2 — Home hero cleanup

- [ ] Confirm subtitle (“By Lex Laurence and Liam Bongo”) is removed.
- [ ] Confirm duplicate listening controls are removed (single Listen Now + Booking only).
- [ ] Check CTA spacing, logo legibility, and mobile composition on real devices.

**Acceptance:** Hero matches design intent; no redundant listen UI.

---

## Track 3 — Booking / About polish

- [ ] Audit visual hierarchy, spacing, section rhythm, and premium artist feel on Booking and About.
- [ ] Improve booking conversion layout (form prominence, trust elements, EPK CTA).
- [ ] Improve About page storytelling and press-kit presentation.

**Acceptance:** Both pages feel artist-industry ready; clear conversion path on Booking.

---

## Track 4 — Media admin workflow

- [ ] Fix upload reliability fully (uploads persist to Supabase storage and `external_media_assets`).
- [ ] Ensure photo and video uploads persist and appear in Media library.
- [ ] Allow assignment to collections cleanly (Add from library → gallery_media).
- [ ] Ensure collection galleries populate on the public Media page.
- [ ] Make workflow comparable to Exclusive Lex admin logic, minus paywall.

**Acceptance:** Upload → register → assign to collection → visible on public gallery.

---

## Track 5 — Events admin reliability

- [ ] Fix create / edit / delete consistency (no silent failures or stale UI).
- [ ] Ensure thumbnails upload and render in admin cards and on public Events list/detail.
- [ ] Ensure event detail pages render correctly from admin data (title, date, time, details, thumbnail).

**Acceptance:** Full CRUD works; thumbnails show in admin and on public site.

---

## Track 6 — Shop admin reliability

- [ ] Fix create / edit / delete consistency for products.
- [ ] Ensure product thumbnails upload and display in admin and on public Shop.
- [ ] Ensure public shop page and product detail render correctly.

**Acceptance:** Full CRUD works; product images show in admin and on public site.

---

## Track 7 — Data / storage / RLS hardening

- [ ] Identify exact Supabase RLS or bucket policy blockers (e.g. Storage `media` INSERT for authenticated).
- [ ] List the minimum migrations or Dashboard policy changes still needed.
- [ ] Separate code issues from infra issues (document which fixes are code vs Supabase config).

**Acceptance:** Clear checklist of infra steps; no “mystery” upload or permission failures.

---

## Recommended first task once live audit begins

1. **Open the preview URL** and confirm the home page loads.
2. **Run Track 1 (Hero reliability):** Watch 10+ hero transitions; note any stutter, freeze, or wrong sequence; verify full-screen cover and (if applicable) YouTube embed behavior.
3. **Run Track 2 (Home hero cleanup):** Confirm subtitle and duplicate listen control are gone; quick check of CTA and mobile composition.
4. **If hero is stable,** move to **Track 4 (Media admin):** Log in to admin, upload one image and one video, confirm they persist and appear in Media library; assign one asset to a collection and confirm it appears on the public Media gallery page.

This order validates the most visible (hero) and highest-risk (upload) flows before deeper polish.

---

*Phase 36 — Live preview audit + admin reliability. Update checkboxes as tasks are completed.*
