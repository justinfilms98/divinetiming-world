# Phases AD–AK — Structured Correction Wave — Output Summary

Reality-check pass: composition, footer, booking, detail pages, event thumbnails, and media videos. Changes are scoped to durable improvements; completion is based on actual behavior, not prior notes.

---

## 1. Phase AD — Visual Balance System Pass

**Objective:** Address “still feels left-heavy” at the composition level: alignment, section weighting, footer grouping.

**Changes made:**

- **Footer** (Phase AE): Rebuilt for clearer grouping, spacing, and visual center — see Phase AE.
- **Booking** (Phase AF): Inquiry section made a full-bleed band with centered header and balanced two-column layout — see Phase AF.
- **Grid**: Reverted a brief experiment with `justify-items-center` on the shared Grid; cards remain full-width in cells. List pages (shop, events, media) already use centered intro copy (`text-center max-w-[45ch] mx-auto`). No further grid change this pass.
- **Section alignment**: Shop list, events list, and media hub use `Container` and centered intro text; footer and booking were the main composition fixes.

**Summary:** Left-heavy feel was addressed primarily through footer rebuild and booking reconstruction (centered header, full-bleed inquiry band, balanced form/aside). Home, events, shop, and media already use the same rail and centered intros.

---

## 2. Phase AE — Footer Rebuild

**Objective:** Footer on the same visual center line as the site; stronger grouping, spacing, and premium feel.

**Changes made** (`components/layout/Footer.tsx`):

- Wrapper: `pt-20 pb-16` → `py-16 md:py-20` for balanced vertical rhythm.
- Inner layout: `gap-8` → `gap-10 md:gap-12`; `items-center justify-center text-center` retained.
- Brand block: Tighter grouping with `gap-1.5`; byline no longer uses “By” prefix for a cleaner line.
- Nav: `gap-x-6 gap-y-1` → `gap-x-8 gap-y-2` for clearer link spacing.
- Social: Wrapper `gap-4` → `gap-6` with `pt-1`; icon size `w-4 h-4` → `w-5 h-5`; links use `p-2 rounded-lg` for a clearer hit area.
- Footer given `role="contentinfo"` and background `bg-[var(--bg)]/60` for slight separation.

**Preserved:** Core nav links, social/platform links, brand identity (Divine Timing + byline).

---

## 3. Phase AF — Booking Page Rebuild V2

**Objective:** Premium booking destination: confident hero-to-content transition, centered inquiry block, stronger form/aside balance.

**Changes made** (`app/booking/page.tsx`):

- **Hero → content:** `SignatureDivider` spacing set to `my-12 md:my-14`; story section (when present) also uses `SignatureDivider` with the same spacing.
- **Inquiry section:** Replaced `Section` with a semantic `<section>` that has:
  - Full-bleed band: `bg-[var(--bg-secondary)]/40 border-y border-[var(--text)]/5`.
  - Content on rail: `Container` with `py-16 md:py-24`.
- **Header:** Centered; `mb-12 md:mb-16`; supporting copy `max-w-[40ch] mx-auto`.
- **Two-column layout:** `max-w-[1000px] mx-auto`; grid `gap-12 lg:gap-16`; columns `1.15fr` and `320px` (fixed aside). Form card: `p-6 sm:p-8 md:p-10`, `shadow-[var(--shadow-card-hover)]`, `border-[var(--accent)]/15`, `bg-[var(--bg)]/80`. Aside cards: `bg-[var(--bg)]/60` for subtle contrast.
- **Removed:** `Section` import (replaced by plain `section`).

**Preserved:** Booking form, contact block, Press/EPK card, Artist bio, BookingAboutCard, partners/sponsors, CTA behavior.

---

## 4. Phase AG — Secondary Page Composition Pass

**Objective:** Stronger structure and rhythm on shop, event, and gallery detail without overdesigning.

**Shop detail** (`app/shop/[slug]/page.tsx`):

- Main: `pb-20`; back link `mb-10`; grid `gap-12 md:gap-16`.
- Image column: `max-w-lg`, `md:sticky md:top-28` so the gallery stays in view.
- Badges: `mb-4`; subtitle `mb-4`; price `mb-8`; description `mb-10`.
- CTA block: Wrapped in `pt-2 border-t border-[var(--accent)]/10` to separate from description.

**Event detail** (`app/events/[slug]/page.tsx`):

- Main: `pb-20`; back link `mb-10` and focus styles.
- Grid: `gap-14 lg:gap-20`, columns `1.4fr 1fr`; sidebar `lg:sticky lg:top-28`.
- Article: `space-y-10`; event image block `rounded-2xl`; description `type-body`.
- Event card (ticket/share) remains in the right column with sticky behavior.

**Gallery detail** (`components/media/GalleryDetailClient.tsx`):

- Back link `mb-10`; header block `mb-12 md:mb-16` with title `mb-4` and optional description.
- Empty state: `py-24`.
- **GalleryGrid:** `className` (e.g. `mt-4 gap-6 md:gap-8`) is now passed to `Grid` instead of only to `Reveal` so grid spacing is configurable.

---

## 5. Phase AH — Event Thumbnail Reliability Fix

**Objective:** Event thumbnails reliably show on public list and detail when set in admin.

**Flow traced:**

- **Admin:** Thumbnail can be set via upload (stores URL in `thumbnail_url` and optionally asset id in `external_thumbnail_asset_id`) or via library picker (sets both `thumbnail_url` = asset `preview_url` and `external_thumbnail_asset_id` = asset `id`). Hidden inputs and submit payload include both fields.
- **API:** POST persists `thumbnail_url` and `external_thumbnail_asset_id`.
- **Resolution:** `resolveEventThumbnailUrl` uses, in order: `thumbnail_storage_path` → `thumbnail_url` (if https) → `external_thumbnail_asset_id` via `resolveMediaUrl`. `getEventBySlug` and `getEvents` attach `resolved_thumbnail_url`.
- **Public:** Event list and event detail use `event.resolved_thumbnail_url ?? event.thumbnail_url`.

**Fix applied** (`app/admin/events/page.tsx`):

- Thumbnail display condition was `(previewThumbnail || editingEvent?.thumbnail_url)`. When an event had only `external_thumbnail_asset_id` (no `thumbnail_url`), the form showed “no thumbnail” even though the API returns `resolved_thumbnail_url`.
- **Change:** Use `(previewThumbnail || editingEvent?.thumbnail_url || editingEvent?.resolved_thumbnail_url)` for showing the thumbnail block, and use `previewThumbnail || editingEvent?.thumbnail_url || editingEvent?.resolved_thumbnail_url || ''` for the `<img src>`. So when an event is loaded with only `external_thumbnail_asset_id`, the admin shows the resolved image and the hidden inputs still submit the correct values.

**Result:** Admin display matches saved data; public resolution path was already correct. If thumbnails still fail in production, verify DB has `external_thumbnail_asset_id` or `thumbnail_url` set and that `external_media_assets.preview_url` is non-null and readable (RLS allows public SELECT).

---

## 6. Phase AI — Shop Operator Confidence V2

**Objective:** Clearer admin product cards, edit confidence, and public shop polish.

**Scope this pass:** No new UI was added. Admin shop already has product cards with image, name, price, status, featured, badge, and Edit/Delete; create and edit use the same API and field set. Public shop detail received composition improvements in Phase AG (sticky image, spacing, CTA separator). Full “operator confidence” polish (e.g. reorder, bulk actions, clearer empty states) is left for a follow-up.

---

## 7. Phase AJ — Hero Final Alignment

**Objective:** One looping cinematic hero video as primary; image supported; optional logo; centered CTA and platform row; no floating social.

**Current state:** Home already uses `getHeroSingleSource` (single video or image), `UnifiedHero` with `posterUrl`, hero content with `HeroContent` (CTAs) and `HeroPlatformRow` (centered under CTAs). `SocialDock` is not rendered in `PublicLayout`. No code change this pass.

---

## 8. Phase AK — Media Videos Implementation

**Objective:** Videos tab supports vertical short-form: schema, admin, fetch, and public feed scaffold.

**Delivered:**

1. **Schema** (`supabase/migrations/034_videos_caption_vertical.sql`): `videos.caption` (TEXT), `videos.is_vertical` (BOOLEAN DEFAULT false).
2. **API** (`app/api/admin/videos/route.ts`): POST accepts and persists `caption` and `is_vertical` on create and update.
3. **Fetch** (`lib/content/server.ts`): `getVideos()` selects `caption` and `is_vertical` and returns them; defaults `caption: null`, `is_vertical: false`.
4. **Types** (`lib/content/shared.ts`): `MediaPageVideo` extended with `caption?: string | null` and `is_vertical?: boolean`.
5. **Admin** (`app/admin/videos/page.tsx`): Create form includes optional Caption and “Vertical / short-form (9:16)” checkbox; load selects `caption`, `is_vertical`.
6. **Public scaffold** (`components/media/VideoFeed.tsx`): New component that takes `videos` and renders a centered 9:16 player with title/caption below and prev/next controls. Desktop-oriented; mobile can later add vertical swipe.
7. **Media page** (`components/media/MediaPageClient.tsx`): When on the Videos tab and there are videos, the grid is replaced with `<VideoFeed videos={videos} />`. Modal player remains in the tree but is unused for the feed.

**Run migration:** Apply `034_videos_caption_vertical.sql` so `caption` and `is_vertical` exist before using the new admin fields and public feed.

---

## 9. Files Changed

| File | Changes |
|------|--------|
| `components/layout/Footer.tsx` | Rebuild: spacing, grouping, nav/social layout, role and background. |
| `app/booking/page.tsx` | Inquiry section as full-bleed band; centered header; form/aside layout and card styling; removed Section import. |
| `app/shop/[slug]/page.tsx` | Main padding, back link spacing, grid gap, sticky image column, CTA border separator. |
| `app/events/[slug]/page.tsx` | Main padding, back link, grid gap and ratio, sticky sidebar, article spacing, image rounded-2xl. |
| `components/media/GalleryDetailClient.tsx` | Back link spacing, header block, GalleryGrid className passed to Grid. |
| `components/media/GalleryGrid.tsx` | className passed to Grid instead of Reveal. |
| `app/admin/events/page.tsx` | Thumbnail display uses resolved_thumbnail_url when thumbnail_url missing. |
| `supabase/migrations/034_videos_caption_vertical.sql` | **New.** caption, is_vertical on videos. |
| `app/api/admin/videos/route.ts` | Accept and persist caption, is_vertical. |
| `lib/content/server.ts` | getVideos selects and returns caption, is_vertical. |
| `lib/content/shared.ts` | MediaPageVideo: caption, is_vertical. |
| `app/admin/videos/page.tsx` | Create form: caption, is_vertical; load selects new columns. |
| `components/media/VideoFeed.tsx` | **New.** Centered 9:16 feed with prev/next. |
| `components/media/MediaPageClient.tsx` | Videos tab uses VideoFeed instead of grid. |

---

## 10. Blockers Still Remaining

- **Migration 034:** Must be run for Phase AK (videos caption/is_vertical). Until then, admin new columns may error if the app expects them; optional: guard select in getVideos or admin load to tolerate missing columns.
- **Event thumbnails:** If they still don’t appear after the admin fix, verify DB and RLS as in Phase AH.
- **Phase AI (shop operator):** Deferred; admin cards and edit flow are unchanged beyond existing behavior.
- **Phase AJ (hero):** No change; current hero behavior already matches the stated target.

---

## 11. Manual QA Checklist

Use this to verify locally.

**Phase AD — Visual balance**
- [ ] Home, events list, shop list, media hub: intro/headline copy is centered; no obvious left-heavy drift.
- [ ] Booking: Inquiry section feels centered and balanced (see Phase AF).
- [ ] Footer: Feels centered and grouped (see Phase AE).

**Phase AE — Footer**
- [ ] Footer content is centered; brand, nav, and social have clear grouping and spacing.
- [ ] Footer aligns on the same visual center as the rest of the site.

**Phase AF — Booking**
- [ ] Hero is compact; transition to inquiry section is clear.
- [ ] “Booking inquiries” header and copy are centered; form and aside are balanced.
- [ ] Form and all aside cards work; no functionality removed.

**Phase AG — Detail pages**
- [ ] Shop detail: Image column can stick on scroll; CTA is visually separated from description.
- [ ] Event detail: Sidebar sticks; event image and copy have clear rhythm.
- [ ] Gallery detail: Title and intro have clear spacing; grid spacing looks even.

**Phase AH — Event thumbnails**
- [ ] In admin, set an event thumbnail (upload or library), save, reopen edit: thumbnail still shows.
- [ ] On public events list and event detail, the same event shows its thumbnail when set.

**Phase AK — Media videos**
- [ ] Run migration `034_videos_caption_vertical.sql` if not already applied.
- [ ] In admin, add a video with optional caption and “Vertical / short-form” checked; save.
- [ ] Public Media → Videos tab: centered 9:16 player with prev/next; title and caption show; switching prev/next updates the video.

**Phase AI / AJ**
- [ ] Shop admin: product cards and edit still work as before.
- [ ] Home hero: single video or image, CTAs, platform row under CTAs; no floating social.
