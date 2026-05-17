# Phase 42 — Regression Recovery + True Centering + Upload Fix + Booking Inbox — Output

Baseline: Phase 41 did not land correctly in preview (413 uploads, left-biased layouts, unchanged nav CTA, missing public videos, no booking inquiries inbox). This pass treats those as regressions and fixes them.

---

## 1. Exact root causes found

| Issue | Root cause |
|-------|------------|
| **413 on hero/media upload** | Request body (file) is sent through the Next.js API route. Vercel serverless functions have a ~4.5 MB request body limit. Large video/image uploads exceed this and return 413 Payload Too Large before the route runs. |
| **Left-biased layouts** | Many pages used `Container` or inner `max-w-[1000px]` without a consistent outer rail; some content was not wrapped in a single centered `max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8` wrapper. Shop and shop detail had no page-level rail. |
| **Public Media Videos tab** | Library videos are merged in `getLibraryVideoAssets()` + media page; VideoFeed supports `video_url`. If uploads were failing with 413, no library videos were ever stored, so none could appear. Fixing upload fixes the data path. |
| **Event thumbnails / admin edit** | Data path was already correct (withResolvedThumbnails, EventCard uses resolved_thumbnail_url). Admin events had clickable row and Edit; layout/centering and upload fix improve the overall flow. |
| **Nav CTA styling** | Phase 41 had already set gold bg, white border, black text, hover white/black/underline in Header. If it did not appear in preview, possible cache or deploy artifact; no code reversion found. Left as-is with same classes. |
| **Footer centering** | Phase 41 had already added 3-column grid with empty left/right; center column holds content. Left as-is. |
| **Admin Booking Inquiries** | There was no inbox page. "Booking Inquiries" in nav pointed to the booking content editor; no list view of `booking_inquiries` table. |

---

## 2. Exact fixes made

### Upload (413)

- **Approach:** Avoid sending the file through Vercel. Client uploads directly to Supabase Storage using the existing authenticated session; storage policies already allow authenticated uploads to the `media` bucket (migration 003).
- **New API:** `POST /api/admin/media/upload-path` — body `{ filename }`, returns `{ path, publicUrl }`. No file in request; small JSON only.
- **Client (UniversalUploader):** For each file: (1) call `upload-path` to get `path` and `publicUrl`, (2) `supabase.storage.from('media').upload(path, file)` from the browser (createClient from `@/lib/supabase/client`), (3) call existing `POST /api/admin/media/register` with `{ provider: 'supabase', files: [{ storage_path, public_url, name, mimeType, size }] }`. File never hits the server; no 413.

### Centered layout rail

- **Standard rail:** `max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 w-full` applied to main content on:
  - `/shop` — wrapper around ShopPageClient.
  - `/shop/[slug]` — replaced Container + max-w-[1000px] with single rail div.
  - `/events` — replaced Container with rail div.
  - `/events/[slug]` — hero and main content both in rail.
  - `/media` — replaced Container with rail div.
  - `/media/galleries/[slug]` — replaced Container with rail div.
  - `/booking` — form section already had a wrapper; set to same rail class.
- **Grid centering:** Shop product grid: `justify-items-center`. Media collections already had `justify-items-center` (Phase 41). Sparse content centers within the rail.

### Events

- Admin events: Row click and Edit open prefilled modal; save persists and refreshes list (existing). Thumbnail upload uses single UniversalUploader with image/* (existing).
- Public events: `getEvents()` already uses `withResolvedThumbnails()`; EventCard already uses `resolved_thumbnail_url ?? thumbnail_url` and placeholder. No code change; thumbnails show when data exists.

### Public Media Videos

- Library videos: `getLibraryVideoAssets()` and merge with `getVideos()` on the media page (Phase 41). VideoFeed renders `<video>` when `video_url` is set. With direct upload working, new uploads register and appear in the library; video assets with `mime_type` like `video/%` appear in the Videos tab and play.

### Media collections

- Grid already uses `gap-8 md:gap-10` and `justify-items-center` (Phase 41). No further change in this pass.

### Nav CTA

- Header "Book Now" already has: `bg-[var(--accent)] text-black border-2 border-white hover:bg-white hover:text-black hover:border-black hover:underline`. No change.

### Footer

- Already 3-column grid with center content (Phase 41). No change.

### Admin Booking Inquiries inbox

- **New page:** `/admin/booking-inquiries` — client page that fetches `booking_inquiries` ordered by `created_at` desc. Displays: name, email, organization, event_type, event_date, location, budget_range, message, created_at. Card list; empty state when no rows.
- **Nav:** Added "Booking" (content editor) and "Booking Inquiries" (inbox); "Booking Inquiries" links to `/admin/booking-inquiries`.

---

## 3. Files changed

| File | Change |
|------|--------|
| `app/api/admin/media/upload-path/route.ts` | **New.** POST returns `{ path, publicUrl }` for client-side direct upload. |
| `components/admin/uploader/UniversalUploader.tsx` | Use upload-path + Supabase client `storage.from('media').upload(path, file)` + register; remove direct POST of file to upload route. |
| `app/shop/page.tsx` | Wrap ShopPageClient in rail div `max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 w-full`. |
| `components/shop/ShopPageClient.tsx` | Remove Container; single wrapper div; grid `justify-items-center`. |
| `app/shop/[slug]/page.tsx` | Replace Container + inner div with one rail div. |
| `app/events/page.tsx` | Replace Container with rail div; fix stray `</Container>` → `</div>`. |
| `app/events/[slug]/page.tsx` | Main content in rail div; remove Container. |
| `app/media/page.tsx` | Replace Container with rail div. |
| `app/media/galleries/[slug]/page.tsx` | Replace Container with rail div. |
| `app/booking/page.tsx` | Booking form section wrapper uses rail class; remove Container import. |
| `app/admin/booking-inquiries/page.tsx` | **New.** Inbox list of booking_inquiries (name, email, organization, event_type, event_date, location, budget_range, message, created_at). |
| `components/admin/AdminNav.tsx` | Add Booking (content) and Booking Inquiries (inbox) links; add BookOpen icon. |

---

## 4. Before/after behavior

| Area | Before | After |
|------|--------|--------|
| Hero/media upload | POST file to API → 413 on Vercel for larger files. | Client gets path from API, uploads file to Supabase from browser, then registers. No file through Vercel; no 413. |
| Shop | No page-level rail; content could hug left. | Rail `max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8`; product grid centered. |
| Shop detail | Container + max-w-[1000px]. | Single rail same as above. |
| Events / events/[slug] | Container or mixed widths. | Single rail on both. |
| Media / media/galleries/[slug] | Container or max-w 1000. | Single rail. |
| Booking | Had rail; tightened to same class. | Same rail class; no Container. |
| Admin Booking Inquiries | No inbox; nav pointed to content editor. | New inbox at /admin/booking-inquiries; nav has Booking + Booking Inquiries. |

---

## 5. Remaining blockers

- **None** in code. Operator must ensure: (1) Supabase Storage bucket `media` exists and allows authenticated uploads (migration 003); (2) admin is logged in when uploading (browser uses session for direct upload).

---

## 6. Browser QA checklist (to be verified locally before preview)

1. **Admin hero upload (video):** Log in as admin → Hero → upload a video for hero media → no 413; success and hero updates.
2. **Admin media upload (video):** Admin → Media → upload a video file → no 413; file appears in library.
3. **Admin events:** Open an event row → edit modal prefilled → change and save → list refreshes; thumbnail shows in list when set.
4. **Public /events:** Event cards show thumbnail (or placeholder when none).
5. **Public /media → Videos tab:** At least one uploaded library video appears and plays (HTML5).
6. **/shop:** Content centered; equal left/right margins on desktop.
7. **/shop/[slug]:** Product detail centered.
8. **/booking:** Form and side cards centered; headings align to rail.
9. **Homepage:** Nav “Book Now” has gold background, white outline, black text; hover → white bg, black text, underline.
10. **Footer:** On desktop, footer content visually centered (3-column layout).
11. **Admin Booking Inquiries:** `/admin/booking-inquiries` shows list of inquiries (or empty state); most recent first.

---

## 7. What was verified before pushing preview

- **Build:** `npm run build` completed successfully (TypeScript and Turbopack).
- **No runtime browser QA or screenshots** were performed in this session. The checklist in §6 must be run locally by the operator; then push preview and capture screenshots (homepage, footer, /events, /events/[slug], /media collections, /media videos, /shop, /shop/[slug], /booking, admin hero, admin media, admin events, admin booking inquiries) to confirm all items.

Phase 42 code changes are complete. Finish by running local browser QA, then push a fresh preview and attach the requested screenshots.
