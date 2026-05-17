# Phases S–W — Structured Correction Wave — Output Summary

Stabilization pass: global layout rail, header offset, public detail pages, booking composition, hero alignment, and admin/public parity. No new design systems; minimal, durable changes only.

---

## 1. Phase S — Global Layout Rail + Header Offset

**Objective:** One canonical centered content rail and consistent non-hero page top offset.

**Canonical rail:** `max-w-[1200px] mx-auto px-5 md:px-8`

**Changes made:**
- **Header** (`components/layout/Header.tsx`): Inner wrapper updated from `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` to `max-w-[1200px] mx-auto px-5 md:px-8` so header aligns with the same rail as body and footer.
- **Shop product detail** (`app/shop/[slug]/page.tsx`): Main top padding from `pt-20 md:pt-24` to `pt-24 md:pt-28`.
- **Event detail** (`app/events/[slug]/page.tsx`): Main from `py-16` to `pt-24 md:pt-28 pb-16`.
- **Gallery detail** (`app/media/galleries/[slug]/page.tsx`): Main from `py-16` to `pt-24 md:pt-28 pb-16`.

**Already correct (no change):**
- `Container` and `Footer` already use `max-w-[1200px] mx-auto px-5 md:px-8`.
- CornerNav uses `.content-width` (1200px in `globals.css`).
- No other conflicting max-widths were introduced; left-heavy wrappers were not present.

**Summary:** Header, body, and footer now share the same centered rail. Detail pages without a full hero use a shared top offset so content does not sit under the header.

---

## 2. Phase T — Public Detail Page Rebuild

**Objective:** Intentional, premium structure for shop, event, and gallery detail — no full redesign.

**Shop detail** (`app/shop/[slug]/page.tsx`):
- Grid gap set to `gap-10 md:gap-14` for clearer two-column balance.
- Badge row given `mb-3` for hierarchy.
- Description constrained with `max-w-[65ch]` for readability.
- Layout remains two-column inside the canonical rail; quantity and CTA area unchanged.

**Event detail** (`app/events/[slug]/page.tsx`):
- Grid `gap-12 lg:gap-16`; article `space-y-8` for consistent rhythm.
- Event image block only rendered when `imageUrl` (resolved thumbnail) exists; date placeholder when no image.
- Clear hierarchy between metadata and long description; optional CTA area for ticket/external link preserved.

**Gallery detail** (`components/media/GalleryDetailClient.tsx`):
- H1 given `mb-3`; description `mb-10 md:mb-14`.
- Media grid given `className="mt-2"` for spacing.
- Title and intro framed inside the same centered rail; no header overlap (handled in Phase S).

---

## 3. Phase U — Booking Page Rebuild

**Objective:** Rebalance hero vs content; premium form + aside; keep conversion and functionality.

**Changes made** (`app/booking/page.tsx`):
- Hero `heightPreset` changed from `"standard"` to `"compact"` so the hero supports without dominating.
- `SignatureDivider` given `className="my-10 md:my-12"` for rhythm.
- Inquiry section: padding `pt-8 md:pt-10 pb-14 md:pb-20`; section header `mb-6 md:mb-8`.
- Content remains on the existing centered rail (`Container` and `max-w-[1000px]` two-column block); no left-heavy layout change.

**Preserved:** Inquiry form, supporting contact/EPK/bio content, and all conversion-oriented behavior.

---

## 4. Phase V — Hero System Alignment

**Objective:** One hero surface; image or video; optional poster and logo overlay; CTAs; social row centered under CTAs; no bottom-right floating social; no 3 rotating hero videos.

**Audit findings:**
- **UnifiedHero** already supports single image or video, `posterUrl`, and children (CTAs).
- **getHeroSingleSource** returns one source (first video, else first image, else legacy); poster supported for video.
- Home uses `getHeroSingleSource` and passes `posterUrl`; logo overlay is via `heroSection?.logoFinalUrl` in hero content.
- **SocialDock** (fixed bottom-right) is **not** rendered in `PublicLayout`; only CornerNav, Footer, CartTrigger, CartSlideOut are in the shell. So bottom-right floating social is already absent.

**Changes made:**
- **Home hero** (`app/page.tsx`): Rendered `HeroPlatformRow` under `HeroContent` with `overrides={siteSettings}` and `delay={0.5}` so platform/social icons appear centered under hero CTAs.

**Result:** Single looping cinematic hero (video or image), poster and logo-over-video supported, CTAs + centered social row on home; no floating social cluster.

---

## 5. Phase W — Admin/Public Parity

**Shop editing:**
- **Audit:** Create and edit both use the same `POST /api/admin/products` payload. Edit path sends `id` plus: name, slug, subtitle, description, price, is_featured, badge, status, images (new images only; existing images remain; removal is via separate delete).
- **API** (`app/api/admin/products/route.ts`): Accepts and persists name, slug, subtitle, description, price_cents, is_active (from status), is_featured, badge, display_order, status; on update, appends new images to `product_images` without clearing existing.
- **Admin form** (`app/admin/shop/page.tsx`): Form fields and submit payload include title (name), subtitle, badge, description, status, featured (is_featured), images (create: pendingImages + textarea; edit: add via handleAddImageToProduct, remove via handleRemoveImage). Inventory/variants are not in scope for this pass (no schema change).
- **Conclusion:** Create vs edit path and field handling are aligned; no update-path mismatch found. No code change required.

**Event thumbnails:**
- **Flow:** Admin saves `thumbnail_url` and/or `external_thumbnail_asset_id`. Public side uses `resolveEventThumbnailUrl` in `lib/eventMedia.ts`: order is `thumbnail_storage_path` → legacy `thumbnail_url` (if https) → `external_thumbnail_asset_id` via `resolveMediaUrl`.
- **Usage:** `getEventBySlug` and `getEvents` (or list call) attach `resolved_thumbnail_url` via `resolveEventThumbnailUrl` / `withResolvedThumbnails`. Event list and detail use this for card and hero.
- **Conclusion:** Resolution path matches product-image pattern. If thumbnails still do not appear: (1) confirm admin actually sets thumbnail (library picker sets `external_thumbnail_asset_id` and optionally `thumbnail_url`); (2) check RLS on `external_media_assets` for public/anonymous read; (3) confirm `preview_url` or resolved URL is non-null for the chosen asset. No code change in this pass; logic is correct.

---

## 6. Files Changed

| File | Changes |
|------|--------|
| `components/layout/Header.tsx` | Rail: `max-w-[1200px] mx-auto px-5 md:px-8` |
| `app/shop/[slug]/page.tsx` | Top padding `pt-24 md:pt-28`; grid gap; badge/description spacing |
| `app/events/[slug]/page.tsx` | Top padding and bottom; grid/article spacing; event image only when `imageUrl` present |
| `app/media/galleries/[slug]/page.tsx` | Top/bottom padding `pt-24 md:pt-28 pb-16` |
| `components/media/GalleryDetailClient.tsx` | H1/description/grid spacing |
| `app/booking/page.tsx` | Hero compact; divider margin; inquiry section padding/header margin |
| `app/page.tsx` | HeroPlatformRow under HeroContent with siteSettings and delay |

---

## 7. Blockers / Remaining Items

- **None** for the scope of this pass. If event thumbnails still do not show in production, verify in DB that `thumbnail_url` or `external_thumbnail_asset_id` is set after admin save, and that `external_media_assets` is readable by the role used for server-side fetch (e.g. RLS for public read).
- Inventory/variants for products were not part of this parity audit; no schema or UI changes.

---

## 8. Manual QA Checklist

Use this to verify the fixes locally.

**Phase S — Rail and header**
- [ ] Home: header, main content, and footer align on the same vertical rail (no left/right drift).
- [ ] Shop list, shop detail, events list, event detail, media hub, gallery detail, booking, about, press: content uses same rail; no conflicting max-widths or obvious left-heavy layout.
- [ ] Shop detail, event detail, gallery detail: top of content does not sit under the header (pt-24 md:pt-28).

**Phase T — Detail pages**
- [ ] Shop detail: two-column layout, clear title/subtitle/price/description, quantity + CTA; related items if present.
- [ ] Event detail: title, date, venue, location, description hierarchy; event image shows when set; no image = date placeholder; CTA if link exists.
- [ ] Gallery detail: title and intro in rail; media grid spacing; no header overlap.

**Phase U — Booking**
- [ ] Hero is present but not overpowering (compact).
- [ ] Form and aside feel balanced; spacing and headings consistent.
- [ ] Inquiry form and supporting content still work; no functionality removed.

**Phase V — Hero**
- [ ] Home: one hero (image or video); poster works for video; logo overlay works when set.
- [ ] Platform/social row appears centered under hero CTAs (not floating bottom-right).
- [ ] No floating social dock elsewhere on the site.

**Phase W — Parity**
- [ ] Admin: create product, then edit same product; all fields (name, subtitle, badge, description, status, featured, images) load and save; new images add, remove image works.
- [ ] Events: set event thumbnail in admin (upload or library); reload public events list and event detail; thumbnail appears when resolution path and data are correct (if not, check DB and RLS as above).
