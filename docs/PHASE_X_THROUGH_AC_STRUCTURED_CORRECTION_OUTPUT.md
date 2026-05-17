# Phases X–AC — Structured Correction Wave — Output Summary

Reality-check pass: fixes grounded in actual layout, parity, and operator issues. No speculative completion; changes are scoped to durable system-level improvements.

---

## 1. Phase X — Global Rail Enforcement + Page Shell Consistency

**Objective:** One canonical public rail (`max-w-[1200px] mx-auto px-5 md:px-8`), consistent content-top offset for non-hero pages, header/body/footer on the same center line.

**Changes made:**

- **Gallery detail** (`app/media/galleries/[slug]/page.tsx`): Removed standalone `<Header />` so the page uses only PublicLayout’s CornerNav. Avoids double header and wrong shell. Kept `pt-24 md:pt-28 pb-16` on main.
- **Press kit** (`app/presskit/page.tsx`): Wrapped content in `<main className="pt-24 md:pt-28 pb-20 min-w-0">` so content clears the sticky nav and uses the same top offset as other detail pages. Content already inside `Container` (canonical rail).
- **EPK** (`app/epk/page.tsx`): Replaced ad-hoc `section` + `max-w-2xl mx-auto px-4` with `Container` and inner `max-w-[65ch] mx-auto`. Section uses `pt-24 md:pt-28 pb-16` for consistent top offset. EPK content now sits on the same rail and padding as the rest of the site.
- **Cart** (`app/cart/page.tsx`): Main updated from `py-12` to `pt-24 md:pt-28 pb-16 min-w-0` so content doesn’t sit under the sticky nav after scroll.

**Already correct (no change):**

- `Container`, `Footer`, and CornerNav scrolled bar use the same rail (Container/Footer: `max-w-[1200px] mx-auto px-5 md:px-8`; CornerNav: `.content-width` + `px-5 md:px-8` in globals.css with `margin-left/right: auto`).
- Header (admin) uses `max-w-[1200px] mx-auto px-5 md:px-8`.
- Shop list, events list, media hub, shop detail, event detail, booking, about already use `Container` or equivalent rail.

**Conflicting wrappers removed or unified:**

- Gallery detail: removed duplicate `Header` (public pages use CornerNav from PublicLayout).
- EPK: removed custom `max-w-2xl mx-auto px-4` in favor of `Container` + `max-w-[65ch]`.
- Press kit: added explicit main wrapper with shared top offset; content remained in `Container` + `GlassPanel`.

---

## 2. Phase Y — Secondary Page Rebuild

**Objective:** Stronger structure, hierarchy, and spacing on shop, event, and gallery detail without overdesigning.

**Event detail** (`app/events/[slug]/page.tsx`):

- Hero kept on rail: outer `max-w-[1200px] mx-auto px-5 md:px-8`, inner `max-h-[420px] overflow-hidden rounded-b-2xl` so the hero aligns with the body and doesn’t feel full-bleed off-rail.
- Main already has `pt-24 md:pt-28 pb-16`; grid and article spacing unchanged; event image still shown when `imageUrl` (resolved thumbnail) exists; placeholder when not.

**Shop detail** (`app/shop/[slug]/page.tsx`):

- Already has `pt-24 md:pt-28`, two-column grid, badge/title/subtitle/price/description hierarchy, `ProductDetailClient` CTA. No structural change this pass.

**Gallery detail** (`components/media/GalleryDetailClient.tsx`):

- Already has title, description, back link, and grid with spacing. Shell fix (removal of duplicate Header) is in Phase X.

---

## 3. Phase Z — Booking Page Reconstruction

**Objective:** Centered, premium inquiry page; hero supports without dominating; form and aside feel balanced.

**Changes made** (`app/booking/page.tsx`):

- Hero wrapper: `pt-20 md:pt-24` → `pt-[4.5rem] md:pt-24` for clearer space under the sticky nav.
- Inquiry section: `pt-8 md:pt-10 pb-14 md:pb-20` → `pt-12 md:pt-16 pb-20 md:pb-24`; header `mb-6 md:mb-8` → `mb-8 md:mb-10` and centered with `text-center max-w-[45ch] mx-auto`.
- Two-column grid: `gap-8 lg:gap-12` → `gap-10 lg:gap-14`; column ratio `1fr_minmax(280px,340px)` → `1.2fr_minmax(280px,320px)` for a more balanced form/aside relationship.

**Preserved:** Inquiry form, contact/EPK/bio cards, and all conversion behavior.

---

## 4. Phase AA — Admin/Public Parity

### Event thumbnails

**Tracing:**

- **Storage:** Events have `thumbnail_url`, `external_thumbnail_asset_id`; optional `thumbnail_storage_path` (Supabase path).
- **Admin save:** POST body includes `thumbnail_url` and `external_thumbnail_asset_id`. When the operator picks from the library, the form sets both (e.g. `thumbnail_url` = asset `preview_url`, `external_thumbnail_asset_id` = asset `id`) and submits them.
- **Resolution:** `resolveEventThumbnailUrl` (lib/eventMedia.ts): 1) `thumbnail_storage_path` → Supabase public URL; 2) `thumbnail_url` if valid https; 3) `external_thumbnail_asset_id` via `resolveMediaUrl` (returns `thumbnailUrl` or `url`). `getEventBySlug` and `getEvents` attach `resolved_thumbnail_url` via this helper.
- **Public render:** Event list and event detail use `event.resolved_thumbnail_url ?? event.thumbnail_url`; EventCard and event detail hero both use it.

**Conclusion:** Logic and data flow are correct. If thumbnails still don’t show:

1. Confirm in DB that the event row has `external_thumbnail_asset_id` (and optionally `thumbnail_url`) set after save.
2. Confirm `external_media_assets` has a non-null `preview_url` (or `thumbnail_url`) for that asset. RLS allows public SELECT (`Public read external_media` in migration 013).
3. If using upload/supabase provider, ensure the asset’s `preview_url` is a full URL (e.g. Supabase storage URL).

No code change was required; resolution and fallbacks are already in place.

### Shop operator safety

- **Create vs edit:** Same POST `/api/admin/products`; edit sends `id` plus name, slug, subtitle, description, price, is_featured, badge, status, images (new images only; existing images remain; removal via separate delete). API persists all of these.
- **Admin form:** All listed fields (title, subtitle, badge, description, status, featured, images) are in the form and payload. Edit loads product with images; add/remove image flows are separate.
- **Public cards:** Shop list uses `product.product_images` (sorted) and first image URL; ProductCard shows it with error/fallback. No change this pass; if cards look skeletal, verify product has at least one image (or placeholder) and that resolved URLs are valid.

---

## 5. Phase AB — Hero Alignment

**Objective:** One hero surface; one looping video or image; optional poster and logo; centered CTA row; centered platform/social row under CTAs; no floating social.

**Current state (no code change this pass):**

- Home uses `getHeroSingleSource` (one video or image), `UnifiedHero` with `posterUrl`, and hero content with `HeroContent` (CTAs) and `HeroPlatformRow` (centered under CTAs). SocialDock is not rendered in PublicLayout.
- Single looping video, image hero, poster, and logo overlay are supported; no 3 rotating hero videos.

---

## 6. Phase AC — Media Videos (Implementation Plan)

**Deliverable:** Implementation plan only; no schema or UI changes in this pass.

- **Plan:** `docs/PHASE_AC_MEDIA_VIDEOS_IMPLEMENTATION_PLAN.md`.
- **Summary:** Add optional `caption` and `is_vertical` (or `aspect_ratio`) to `videos`; extend admin form; public Videos tab: mobile = vertical feed (Reels-like), desktop = centered 9:16 player with next/prev; reuse/adapt existing video modal and `getVideos()`.
- **Current:** Media page already has Collections + Videos tabs; videos are YouTube-based with grid + modal. Vertical feed and centered desktop player are the next step per the plan.

---

## 7. Files Changed

| File | Changes |
|------|--------|
| `app/media/galleries/[slug]/page.tsx` | Removed `Header` import and usage; rely on PublicLayout/CornerNav only. |
| `app/presskit/page.tsx` | Wrapped content in `<main className="pt-24 md:pt-28 pb-20 min-w-0">`. |
| `app/epk/page.tsx` | Use `Container` + `max-w-[65ch]`; section `pt-24 md:pt-28 pb-16`; removed custom `max-w-2xl px-4`. |
| `app/cart/page.tsx` | Main: `pt-24 md:pt-28 pb-16 min-w-0`. |
| `app/events/[slug]/page.tsx` | Hero on rail: wrapper `max-w-[1200px] mx-auto px-5 md:px-8`, inner `max-h-[420px] overflow-hidden rounded-b-2xl`. |
| `app/booking/page.tsx` | Hero top padding; inquiry section padding/header and grid spacing/ratio. |
| `docs/PHASE_AC_MEDIA_VIDEOS_IMPLEMENTATION_PLAN.md` | **New.** Implementation plan for vertical short-form and desktop player. |

---

## 8. Blockers Still Remaining

- **Event thumbnails:** If they still don’t appear after deployment, verify in DB and RLS as in Phase AA. No known code bug.
- **Media videos vertical feed:** Not implemented; see Phase AC plan. Requires schema + admin + public UI work.
- **Left-heavy feel:** If the site still feels left-heavy on certain viewports, the next step is a visual pass on viewport-specific padding (e.g. very large screens) or any remaining one-off wrappers not yet using `Container`/`.content-width`.

---

## 9. Manual QA Checklist

Use this to verify locally.

**Phase X — Rail and shell**

- [ ] Home: header (CornerNav when scrolled), main content, and footer align on one vertical center line; no obvious left/right drift.
- [ ] Shop list, shop detail, events list, event detail, media hub, gallery detail, booking, about, press kit, EPK, cart: content uses the same rail; no extra or conflicting max-widths.
- [ ] Gallery detail: no duplicate header; only CornerNav appears.
- [ ] Press kit, EPK, cart: top of content does not sit under the sticky nav (pt-24 md:pt-28 or equivalent).
- [ ] Footer: inner content is centered and aligned with body (same rail).

**Phase Y — Detail pages**

- [ ] Shop detail: two-column layout, clear title/subtitle/price/description, quantity + CTA; no header overlap.
- [ ] Event detail: hero visually on rail; title, date, venue, description; event image shows when set; no header overlap.
- [ ] Gallery detail: title and intro in rail; grid spacing; no header overlap.

**Phase Z — Booking**

- [ ] Hero is compact; transition from hero to form feels intentional.
- [ ] “Booking inquiries” header is centered; form and aside are balanced; spacing is consistent.
- [ ] Form and all aside cards (contact, EPK, bio, etc.) work; no functionality removed.

**Phase AA — Parity**

- [ ] Events: set an event thumbnail in admin (upload or library); save; reload public events list and event detail; thumbnail appears (if not, check DB and asset `preview_url`/RLS as above).
- [ ] Shop: create product, then edit; all fields load and save; add/remove images; public card shows image when set.

**Phase AB — Hero**

- [ ] Home: one hero (video or image); CTAs and platform row centered; no floating social dock.

**Phase AC**

- [ ] Media > Videos tab: existing grid and modal still work; vertical feed is future work per plan.
