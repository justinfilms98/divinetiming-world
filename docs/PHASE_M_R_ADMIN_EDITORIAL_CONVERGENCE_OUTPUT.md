# Phase M–R — Admin / Editorial Convergence Pass — Output

**Focus:** Align admin tooling with the public platform so the label can operate the site confidently. No broad public-site polish.

---

## 1. Hero admin redesign summary

**Done.**

- **Audit:** `/admin/hero` was audited against the public homepage. The public site uses a **single-surface hero** via `getHeroSingleSource(hero)` → `UnifiedHero` (one media, optional poster, overlay, label, headline, primary CTA). The admin previously exposed a **3-slot carousel** model and a **purge legacy** flow that did not match this.
- **Removed:**
  - **HeroCarouselSlotsEditor** — entire 3-slot (image/video/embed) carousel UI and all slot reorder/upload-from-slots logic.
  - **Purge legacy** danger zone and modal (`/api/admin/hero/purge-legacy` is no longer surfaced in the UI).
  - Legacy/slot language from the hero admin copy.
- **Rebuilt around single-surface:**
  - **Hero media** — Upload/Replace/Remove for the one hero image or video (existing “Current hero” area, now labeled “Hero media & copy”).
  - **Poster image** — When hero type is video, a dedicated “Poster image (for video)” block: preview, Upload/Replace poster, Remove poster. Poster is stored in `hero_slots[0].poster_storage_path` and synced from load; upload uses `/api/admin/hero-slot/upload` with `slot_index=1`, `kind=poster`.
  - **Overlay opacity** — Slider (0–90%) unchanged.
  - **Page label** — Optional label text above headline (unchanged).
  - **Primary CTA** — Label + URL (unchanged). No secondary CTA in schema yet; single CTA only.
  - **Fallback** — No media → default/placeholder behavior unchanged.
- **Save behavior:** On Save, the admin now builds **one** slot when there is hero media: `buildSingleHeroSlots(current)` returns either `[]` or a single `HeroSlot` with `slot_index: 1`, `media_type`, `image_storage_path`/`image_url` or `video_storage_path`, `poster_storage_path` (for video), and `overlay_opacity`. Legacy fields (`media_type`, `media_url`, `media_storage_path`, overlay, label, headline, subtext, CTA, etc.) are still sent so the API and `getHeroSingleSource` remain compatible. Public homepage continues to read from `hero_slots` first (first video or first image + poster), then falls back to legacy fields.
- **Copy:** Card description set to: “Single hero per page: media, poster (for video), overlay, page label, headline, and primary CTA.” Section title: “Hero media & copy.”

**Files changed:** `components/admin/DashboardHeroEditor.tsx` (see §7).

---

## 2. Media flow proof

**Done (Phase N).** See `docs/PHASE_N_MEDIA_COLLECTIONS_OUTPUT.md`.

- Upload → media library → collection assignment → collection cover → public collection render is implemented and consistent.
- Media Library: optimistic merge after upload; cards with thumbnail, type pill, filename, date.
- Collections: edit modal with summary (count, visibility, cover); add/remove media; full media list with thumbnails and remove; draft/archived hidden on public; empty collections hidden from hub.

---

## 3. Shop thumbnail / editability fixes

**Done (Phase O).** See `docs/PHASE_O_SHOP_THUMBNAIL_EDITABILITY_OUTPUT.md`.

- Product image resolution: server-side `resolveProductImages()` for `image_url` and `external_media_asset_id`; used in `getProducts()` and new `getProductBySlug()`. Admin resolves asset preview URLs client-side after load.
- Public shop grid and product detail use resolved images; admin cards show thumbnail, “No image” when missing, subtitle, badge, status, featured.
- Create/edit/save for title, subtitle, badge, featured, inventory, status, image verified; public reflection and sold-out behavior consistent.

---

## 4. Booking layout fixes

**Status: Pending (P4).**

- **Planned:** Audit why booking feels left-heavy on desktop; rebalance form/aside layout and reduce dead space; tighten hero-to-form transition and composition.

---

## 5. Admin shell fixes

**Status: Pending (P5).**

- **Planned:** Audit admin pages for centering, shell width, spacing, readability; add lightweight success/error feedback where missing; make published/draft/incomplete states obvious.

---

## 6. Real-content proof results

**Status: Pending (P6).**

- **Planned:** Use real sample content to prove platform end-to-end: one real hero, one real shop item with image, one real event, one real media collection with uploaded assets; verify all appear correctly on the public site.

---

## 7. Files changed (this pass)

| File | Change |
|------|--------|
| `components/admin/DashboardHeroEditor.tsx` | P1 hero admin: removed 3-slot carousel editor and purge UI; added single-slot build on save, poster state + poster UI for video, “Hero media & copy” copy; removed unused imports (ChevronUp, ChevronDown, MediaLibraryPicker, normalizeHeroEmbed). |

---

## 8. Remaining blockers before final launch content entry

- **P2 (media/collections) done (Phase N). P3 (shop) done (Phase O).** P4–P6 not yet implemented — booking layout rebalance, admin shell polish, and real-content proof remain to be done.
- **Hero:** No known blockers for hero content entry; single-surface admin and public `UnifiedHero` are aligned. Secondary CTA is not in scope for this pass.
- **Dependency:** Confidence in launch content entry will depend on completing P2 (media/collections), P3 (shop), and at least a quick pass of P5 (admin shell) and P6 (real-content proof).
