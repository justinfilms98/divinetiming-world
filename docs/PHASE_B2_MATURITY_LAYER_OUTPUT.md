# Phase B2 — Charter Maturity Layer — Output

## PRIORITY 1 — Layout System Completion

### Audit result

- **Container, Section, Card:** Exist and are used on public pages (events, media, shop client, booking, about, presskit, cart, events/[slug]).
- **PageShell:** Exists; used for admin/special flows (max-w-4xl). Not used on standard public pages by design; public pages use Container + Section directly.
- **Grid:** Added as `components/ui/Grid.tsx` (1–4 cols, gap-6 md:gap-8). Available for product/gallery grids; adoption in ShopPageClient and MediaPageClient can follow.

### Violations found and fixed

| Component / Page | Violation | Fix |
|------------------|-----------|-----|
| `app/events/[slug]/page.tsx` | Used `Header` (duplicate nav) and hero wrapper `max-w-5xl` | Removed Header; hero and main use canonical rail: `max-w-[1200px] mx-auto px-5 md:px-8` for hero wrapper; main already in Container. |

### Verification

- **Hero center:** Hero content uses `items-center justify-center text-center`; hero wrapper uses `mx-auto`.
- **Corner nav:** Padding aligned to `px-5 md:px-8`; bar uses `.content-width` (1200px + margin auto).
- **Container max width:** 1200px applied consistently for main content.
- **Section padding:** `Section` uses `py-12 md:py-16`; no conflicting ad-hoc section padding.

### Components that violated (now fixed)

- `app/events/[slug]/page.tsx` — Header + max-w-5xl. Fixed as above.

Full audit: `docs/LAYOUT_AUDIT.md`.

---

## PRIORITY 2 — Admin Status Controls

### Implemented

- **Products (Shop):** Visibility dropdown in create/edit modal (Published / Draft / Archived). List shows status badge (Published / Draft / Archived). Removed “Active” checkbox; API uses `status` and sets `is_active` from it.
- **Galleries (Collections):** Visibility dropdown in edit modal. List shows Draft/Archived badge. API POST accepts `status` on create and update.
- **Videos:** Status dropdown per row (Published / Draft / Archived); change triggers POST with `id` + `status`. List shows Draft/Archived badge. API POST accepts `status` on create and update.

### Visibility state

- Events: already had status dropdown and badges (Phase B1).
- Products, Galleries, Videos: status and badges added as above. Admin always shows whether each item is published, draft, or archived.

---

## PRIORITY 3 — Media Pipeline Verification

### Trace: upload → assignment → publish → public render

1. **Upload:** Media goes to Media Library (external_media_assets) or direct URLs in gallery_media.
2. **Assignment:** Gallery media linked via `gallery_media.gallery_id`; gallery has `status` (draft | published | archived).
3. **Publish:** Gallery must be `status = 'published'` to appear in hub and in `getGalleryBySlug`.
4. **Public render:** `getGalleriesForHub()` and `getGalleryBySlug()` filter by `status === 'published'` when the column exists. Gallery media are not filtered by item-level status; visibility is at collection level.

### Confirmed

- Published galleries (and their media) appear on the public Media page.
- Draft/archived galleries do not appear; `getGalleryBySlug` returns `null` for non-published slug.
- Collection counts in `getGalleriesForHub` count all `gallery_media` rows for each gallery; no per-item status.
- Cover image: `resolveGalleryCoverUrl` uses `cover_image_url` (https) or `external_cover_asset_id`; behavior is consistent.

### Fixes applied

- `getEventBySlug`: returns `null` when event has `status` and it is not `published` (detail page no longer shows draft/archived events).

---

## PRIORITY 4 — Admin Usability

- **Thumbnails:** Events, products, and collections show thumbnails/cover; videos show YouTube thumbnail. No change required.
- **Success/error:** Existing alert/error handling retained; collections/videos/shop use alerts on failure. Optional future: toast or inline success message.
- **Save flows:** Save/Create/Update buttons and form submit are clear; status is part of the same save.
- **Visibility:** Status badge and/or dropdown on Events, Products, Collections, Videos.
- **Terminology:** No remaining developer-only labels in the audited admin screens; Stripe env reference on shop admin kept for setup.

---

## PRIORITY 5 — Public Data Safety

- **Placeholder content:** Migration `032_mark_placeholder_content_draft.sql` marks test/placeholder events and products as draft (run after 031).
- **Public pages:** Only published content is returned: getEvents, getProducts, getGalleriesForHub, getGalleryBySlug, getVideos, getEventBySlug all filter by `status === 'published'` when the column exists (with fallback when it does not).
- **Empty states:** Events (“No upcoming events” / “No past events”), Media (“Media collections coming soon” / “Videos coming soon”), Shop (“No products yet”) already in place.

---

## PRIORITY 6 — Hero Architecture Evaluation

### Audit

- **Video loading:** HeroVideoCarouselPremium waits for canplay/playing with timeout; preloads next. Some risk of stutter if next video not ready.
- **Carousel timing:** 8s rotation, 800ms fade; logic is clear.
- **Error handling:** Video `onError` and waitForReady; no explicit fallback UI in premium carousel for failed video.
- **Fallback logic:** Multiple branches (premium → V2 → legacy → unified); more surface area for bugs.

### Recommendation

**B) Simplify to single hero surface.**

Reasoning: reliability (fewer code paths), brand clarity (one strong hero), performance (one video/image), maintainability. Optional: add timed source switching inside a single component if rotation is needed later.

Details: `docs/HERO_ARCHITECTURE_EVALUATION.md`.

---

## Files changed (summary)

| File | Change |
|------|--------|
| `components/ui/Grid.tsx` | **New** — Grid component (1–4 cols). |
| `app/events/[slug]/page.tsx` | Removed Header; hero wrapper to max-w-[1200px] + px; main in Container. |
| `lib/content/server.ts` | getEventBySlug returns null for non-published when status exists. |
| `app/api/admin/galleries/route.ts` | POST accepts and persists `status` (create + update). |
| `app/api/admin/videos/route.ts` | POST accepts and persists `status` (create + update). |
| `app/admin/collections/page.tsx` | Status in load; editStatus state; Visibility dropdown in edit; Draft/Archived badge in list. |
| `app/admin/videos/page.tsx` | Status in load; status dropdown per row; handleStatusChange; Draft/Archived badge. |
| `app/admin/shop/page.tsx` | Visibility dropdown in modal; status in payload; Published/Draft/Archived badge; removed Active checkbox. |
| `docs/LAYOUT_AUDIT.md` | **New** — Layout audit and violation list. |
| `docs/HERO_ARCHITECTURE_EVALUATION.md` | **New** — Hero audit and recommendation (B). |
| `docs/PHASE_B2_MATURITY_LAYER_OUTPUT.md` | **New** — This summary. |

---

## Remaining (optional)

- Use `<Grid>` in ShopPageClient and MediaPageClient for canonical grid layout.
- Consider wrapping shop product detail (`/shop/[slug]`) main content in Container for strict 1200px rail.
- Hero: implement single-surface mode (env or feature flag) and make it default if desired.
- Admin: add toast or inline “Saved” feedback where helpful.
