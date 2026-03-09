# Phase B1 — System Enforcement + Operator Reliability

## Output Summary

### 1. Exact layout drift findings

**Pages not using the canonical content rail (before fixes):**

| Location | Issue | Fix applied |
|----------|--------|-------------|
| **Booking** | `Container` used with `max-w-[1280px]` override (charter: 1200px) | Removed override; uses default Container 1200px |
| **CornerNav** (sticky bar) | `px-6` (24px) vs Container `px-5 md:px-8` (20/32px) | Aligned to `px-5 md:px-8` |
| **About** | Used `Header` (duplicate nav) and no `Container` around main content | Removed Header; wrapped main content in `Container` |
| **Press Kit** | Centered panel with `px-4` only; no canonical rail | Wrapped in `Container`; panel `mx-auto` inside |
| **Cart** | Main used `max-w-2xl mx-auto` without outer rail | Wrapped main in `Container`; inner form stays `max-w-2xl` |

**Components responsible for layout drift (now corrected):**

- `app/booking/page.tsx` — Container override
- `components/layout/CornerNav.tsx` — nav padding
- `app/about/page.tsx` — Header + no Container
- `app/presskit/page.tsx` — no Container
- `app/cart/page.tsx` — no Container

**Left-weight causes addressed:**

- **Corner nav:** Padding aligned with content (`px-5 md:px-8`).
- **Hero center:** No change; hero content was already centered; alignment is consistent.
- **Section container mismatches:** All main content sections now sit inside `Container` (max-w-[1200px] mx-auto px-5 md:px-8) on About, Booking, Press Kit, Cart; Events, Media, Shop already used Container for main content.

**New shared shell:** `components/layout/PublicPageShell.tsx` — single outer wrapper for public pages (min-h-screen, max-w-[100vw], overflow-x-clip). Available for future use; individual pages already use the same pattern inline.

---

### 2. Content model findings

- **Hero/title/subtext source:** All from `hero_sections` (headline, subtext, label_text). One table per page_slug; no separate “artist byline” column.
- **Why byline was in hero subtext:** Editors could type “By Liam Bongo & Lex Laurence” into the hero subtext field; the system did not separate “campaign tagline” from “artist credit.”
- **Refactor applied:** No DB schema change. Charter and Phase A already restricted byline to About / Press Kit / bio. Safeguard kept: `stripArtistBylineFromHeroSubtext()` used on Events, Media, Shop so any byline-like subtext in the DB is not shown on those heroes. Recommended for content model: in admin hero editor, add helper text: “Subtext = short page tagline only. Do not use artist byline here.”
- **Concepts now clearly separated in behavior:** Brand mark = DIVINE:TIMING (headline/logo). Page/hero title = headline. Campaign subtext = subtext (with byline stripped on events/media/shop). Artist bio/byline = About page + Press Kit + footer only.

---

### 3. Whether true publish states were implemented

**Yes.** Formal states are implemented and enforced.

- **Migration 031_content_publish_states.sql:** Adds `status` (`draft` | `published` | `archived`) to:
  - `events` (default `published`)
  - `products` (default `published`; backfill from `is_active`: false → draft)
  - `galleries` (default `published`)
  - `videos` (default `published`)
- **Public fetchers:** Only content with `status === 'published'` is returned (with fallback when the column does not exist yet: events/products/galleries/videos show all until migration is run, then filter by status).
- **Admin:** Events admin has Visibility dropdown (Published / Draft / Archived) and status badge on cards. Products API accepts `status` and sets `is_active = (status === 'published')`; admin shop can be extended with a status control (DB and API ready).
- **Galleries and videos:** Status column and public filtering are in place; admin UI for changing gallery/video status can be added in a follow-up (API already uses service role and can read/write all rows).

---

### 4. Media pipeline fixes completed

- **Pipeline traced:** Upload → assignment to collection (`gallery_media.gallery_id`) → gallery has `status` → public hub uses `getGalleriesForHub()` and `getGalleryBySlug()` which now filter by `status === 'published'`. Gallery media are not filtered by a separate “public” flag; visibility is at the collection level.
- **Fixes:** 
  - Only published galleries appear in the hub and in collection detail.
  - Counts in `getGalleriesForHub()` use existing `gallery_media` join; counts reflect all media in that gallery (no per-item status yet).
- **Empty states:** Media page already had “Media collections coming soon” and “Videos coming soon” when the active tab has no items. No code change.

---

### 5. Admin usability fixes completed

- **Events:** Visibility (status) dropdown and Draft/Archived badges; thumbnail preview and library picker; save flow and error handling unchanged but status is clear.
- **Products:** API supports `status`; admin can pass status (UI dropdown can be added in a follow-up).
- **Press Kit:** Dedicated admin page with save confirmation and “View public page” link (from Phase A).
- **Wording:** No internal/dev-only labels were found in the admin sections audited; Stripe message on shop admin references env var names (intentional for setup). No change.
- **Public visibility:** Events show Draft/Archived so operators see what is not on the site. Products: status in API; same visibility pattern can be added to shop admin UI.

---

### 6. Public placeholder cleanup status

- **Migration 032_mark_placeholder_content_draft.sql:** One-time update to set `status = 'draft'` for:
  - Events where title/venue/city/description match test patterns (e.g. test, swagland, weed, &lt;3).
  - Products where name matches test/placeholder patterns.
- **Effect:** After running 031 and 032, placeholder/test content no longer appears on public Events or Shop; it remains in the DB as draft.
- **Empty states:** Events and Media already show clear empty states when there are no (published) items; Shop shows “No products yet.”

---

### 7. Hero architecture recommendation

**Recommendation: Keep and stabilize the current carousel, with a defined fallback.**

- **Reasoning:** The charter calls for “smoothness over complexity” and allows a single-surface fallback. The current setup supports multiple slots (image/video/embed), which matches campaign flexibility (release vs tour vs merch). A single-surface hero would simplify code and reduce failure modes but would reduce flexibility.
- **Stabilize first:** Before simplifying, ensure:
  - Hero only uses resolved URLs (storage or external asset); no broken or placeholder media.
  - One clear code path for “which hero component to render” (current logic: premium video carousel → V2 carousel → legacy carousel → unified single).
  - Loading and error states for video (poster, no autoplay until interaction if needed for a11y).
- **If reliability issues persist:** Switch to a single hero surface (video OR poster) with optional timed source switching (e.g. rotate source every N seconds) instead of multiple slots. That keeps one DOM surface and one playback context, reducing stutter and race conditions.

---

### 8. Files changed

| File | Change |
|------|--------|
| `docs/PHASE_B1_ENFORCEMENT_OUTPUT.md` | **New** — this document |
| `docs/HERO_ARCHITECTURE_RECOMMENDATION.md` | (Recommendation in section 7 above; no separate file) |
| `components/layout/PublicPageShell.tsx` | **New** — canonical public page outer shell |
| `components/layout/CornerNav.tsx` | Nav padding `px-6` → `px-5 md:px-8` |
| `app/booking/page.tsx` | Container: removed `max-w-[1280px]` override |
| `app/about/page.tsx` | Removed Header; wrapped main in Container |
| `app/presskit/page.tsx` | Wrapped page in Container; GlassPanel `mx-auto` |
| `app/cart/page.tsx` | Import Container; wrapped main in Container |
| `lib/content/server.ts` | getEvents/getProducts/getGalleriesForHub/getGalleryBySlug/getVideos filter by status when column exists; resilient when missing |
| `lib/types/content.ts` | ContentStatus; Event/Gallery/Product status optional |
| `app/api/admin/events/route.ts` | POST accepts and persists `status` |
| `app/admin/events/page.tsx` | Event status; Visibility dropdown; Draft/Archived badges |
| `app/api/admin/products/route.ts` | POST accepts `status`; sets `is_active = (status === 'published')` |
| `supabase/migrations/031_content_publish_states.sql` | **New** — status column + indexes for events, products, galleries, videos |
| `supabase/migrations/032_mark_placeholder_content_draft.sql` | **New** — mark test/placeholder content as draft |

---

### 9. Remaining blockers before luxury polish

1. **Run migrations:** Apply `031_content_publish_states.sql` and `032_mark_placeholder_content_draft.sql` so status exists and placeholders are draft. Until then, public fetchers treat “no status column” as “show all” (events, products) or “no status filter” (galleries/videos).
2. **Admin status UI for products, galleries, videos:** Products API is ready; admin shop form does not yet show a status dropdown or badge. Galleries and videos have no admin status control yet; add when operator needs to set Draft/Published/Archived.
3. **Hero:** No code change in this phase; recommendation is to stabilize current carousel and only then consider single-surface if needed.
4. **RLS (optional):** Migration 031 does not change RLS; public visibility is enforced in application code. If you want DB-level enforcement, add RLS policies that restrict anonymous SELECT to `status = 'published'` and keep admin policies for authenticated users only.

---

**Charter enforcement:** Layout uses one canonical rail (Container 1200px, consistent padding). Publish states are implemented and used on the public side. Placeholder cleanup is defined in migration 032. Admin events have full status control; products have API support; galleries/videos have schema and public filter ready for admin UI when needed.
