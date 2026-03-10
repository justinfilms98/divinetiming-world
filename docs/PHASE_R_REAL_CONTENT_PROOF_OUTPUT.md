# Phase R — Real-Content Proof — Output

**Focus:** Prove the platform works end-to-end with real sample content. No broad redesign or architecture work.

---

## 1. What real content was entered (runbook for operator)

Phase R proof is **manual**: an operator (or QA) runs the app, enters real content in admin, then verifies public pages. Below is the exact runbook. No automated content entry was performed in this pass.

### P1 — Hero proof (homepage)

1. In admin go to **Dashboard → Hero** (or `/admin/hero`).
2. Select page **Home**.
3. Enter:
   - **Hero media:** Upload or choose one real image or video (poster image if video).
   - **Page label:** e.g. `NEW RELEASE`.
   - **Headline:** e.g. `DIVINE:TIMING`.
   - **Subtext:** Optional short line.
   - **Primary CTA:** Text (e.g. `Listen Now`) and URL (e.g. Spotify link).
4. Save. Open **/** and confirm the hero shows the same media, label, headline, subtext, and CTA.

### P2 — Media proof

1. **Media library:** Admin → Media. Upload at least one real image (or video). Confirm it appears in the grid.
2. **Collection:** Admin → Collections. Create a collection (e.g. `Tour 2025`) with a short description. Set **Visibility** to **Published**.
3. **Cover:** In the same collection, click Edit → **Cover image** → Choose from library → select the uploaded asset. Save.
4. **Add media:** In Edit → **Media in collection** → Add from library → select the same (or another) asset. Save.
5. Confirm on **/media** that the collection appears with the correct cover and title.
6. Click into the collection; confirm **/media/galleries/[slug]** shows the gallery name, description, and media.

### P3 — Shop proof

1. Admin → Shop. Create (or edit) one product with:
   - **Title** (e.g. `Tour T-Shirt`).
   - **Subtitle** (optional).
   - **Badge** (optional, e.g. `New` or `Limited`).
   - **Image:** Add at least one image (upload or from library).
   - **Price** (e.g. `25.00`).
   - **Visibility:** **Published**.
2. Save. In admin, confirm the product card shows thumbnail, title, price, and **Published**.
3. Open **/shop** and confirm the product appears.
4. Open **/shop/[slug]** (use the product’s slug, e.g. `/shop/tour-t-shirt`) and confirm title, subtitle, badge, image(s), price, and description.

### P4 — Event proof

1. Admin → Events. Create (or edit) one event with:
   - **Title** (e.g. `Album Release Show`).
   - **Date** (real date).
   - **Venue** and **City**.
   - **Thumbnail:** Optional image from library or upload.
   - **Visibility:** **Published**.
2. Save. In admin, confirm the event card shows date, title, venue, and status.
3. Open **/events** and confirm the event appears in the list.
4. Open **/events/[slug]** and confirm title, date, venue, description, and thumbnail (if set).

### P5 — Press kit proof

1. Admin → Press Kit. Ensure at least **Title**, **Bio**, and optionally **Experience** / **PDF URL** have real content. Save.
2. Open **/presskit** and confirm the page shows the same title, bio, and sections.
3. Open **/epk** in the browser; confirm it **redirects** to **/presskit** (URL bar shows `/presskit`).

### P6 — Final public QA

After the above, re-check in order:

- **/** — Home hero and CTA.
- **/media** — Collections list and hub.
- **/media/galleries/[slug]** — One gallery detail.
- **/shop** — Product list.
- **/shop/[slug]** — One product detail.
- **/events** — Events list.
- **/events/[slug]** — One event detail.
- **/booking** — Booking hero and form.
- **/presskit** — Press kit content.
- **/epk** — Redirects to /presskit.

---

## 2. What public pages were verified (code-side)

From a **code audit** (no live server under this pass), the following routes and data flows were verified:

| Route | Data source | Filter / behavior |
|-------|-------------|-------------------|
| `/` | `getHeroSection('home')`, `getHeroSingleSource` | Hero media, label, headline, subtext, CTA from DB. |
| `/media` | `getGalleriesForHub()` | Published galleries only; at least one media item; resolved covers. |
| `/media/galleries/[slug]` | `getGalleryBySlug(slug)` | Published only; 404 if draft/archived or missing. |
| `/shop` | `getProducts()` | Published (or `is_active` if no status column). |
| `/shop/[slug]` | `getProductBySlug(slug)` | Published only; 404 otherwise. |
| `/events` | `getEvents()` | Published only. |
| `/events/[slug]` | `getEventBySlug(slug)` | Published only; 404 otherwise. |
| `/booking` | `getHeroSection('booking')`, `getBookingContent()`, etc. | Hero + story + form. |
| `/presskit` | `presskit` table (Supabase) | Single row; admin PATCH updates it. |
| `/epk` | `next.config.ts` redirect | Permanent redirect to `/presskit`. |

So: **all listed public pages are wired to the correct server fetchers and respect published/draft/archived where applicable.** Actual “verified” in the sense of “opened in a browser and checked” must be done by the operator using the runbook above.

---

## 3. What worked correctly end-to-end (from audit)

- **Hero:** Admin hero editor writes to `hero_sections` (and slot/media APIs). Home (and other pages) use `getHeroSection(page_slug)` and `getHeroSingleSource`; poster and CTA are supported. End-to-end path is correct.
- **Media:** Admin uploads to media library; admin creates galleries, sets cover and status, adds media. `getGalleriesForHub()` returns only published galleries with at least one media item; `getGalleryBySlug(slug)` returns only published. Covers and media URLs are resolved via existing helpers. Hub and gallery detail pages use these. End-to-end path is correct.
- **Shop:** Admin creates/updates products and images; status published/draft/archived. `getProducts()` and `getProductBySlug(slug)` filter to published (or `is_active` when no status). List and product detail pages use them. End-to-end path is correct.
- **Events:** Admin creates/updates events and thumbnail; status published/draft/archived. `getEvents()` and `getEventBySlug(slug)` filter to published. List and event detail pages use them. End-to-end path is correct.
- **Press kit:** Admin PATCHes `presskit` via `/api/admin/presskit`; public `/presskit` reads from same table. End-to-end path is correct.
- **/epk → /presskit:** Configured in `next.config.ts` as a permanent redirect. No code bug found.

---

## 4. What still failed or needs manual follow-up

- **No automated content entry or browser QA was run in this pass.** So:
  - **“Enter one real homepage hero”** and **“Confirm the public homepage reflects the saved hero”** must be done by an operator (or by an E2E test in a separate setup).
  - Same for media (upload, collection, cover, publish), shop (product + image + publish), event (create + publish), and press kit content.
- **Environment:** Real-content proof requires a running app (e.g. `npm run dev` or a deployed URL) and, for uploads, configured storage (e.g. Supabase Storage) and env vars. Any missing env (e.g. Stripe, storage bucket) can cause specific flows to fail at runtime even though the code paths are correct.
- **Redirect /epk:** The Next.js redirect is in place; the only check needed is to open `/epk` and confirm the browser ends up on `/presskit`.

---

## 5. Files changed

| File | Change |
|------|--------|
| `app/shop/[slug]/page.tsx` | Added `export const dynamic = 'force-dynamic';` so product detail always reflects current DB state after admin updates. |
| `app/presskit/page.tsx` | Added `export const dynamic = 'force-dynamic';` so press kit page always reflects current DB state after admin save. |
| `docs/PHASE_R_REAL_CONTENT_PROOF_OUTPUT.md` | New: runbook, data-flow verification summary, and Phase R output. |

No other code changes. Hero, media, shop, events, and press kit data flows were already correct; the runbook and dynamic exports complete the proof setup.

---

## 6. Final blockers before true launch content entry

- **None from code.** Data flow and visibility rules (published/draft/archived) are consistent across admin and public pages.
- **Operational:** Before treating the site as “proven” with real content:
  1. Run through the runbook in §1 once on a real environment (local or staging).
  2. Confirm storage (and any CDN) for hero/media/shop/event images and press kit PDF is configured and that uploads succeed.
  3. Confirm `/epk` redirect in production (same `next.config` redirect applies).
- After one full runbook pass with real sample content and no runtime errors, the platform is ready for true launch content entry.
