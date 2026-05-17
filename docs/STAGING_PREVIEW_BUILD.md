# Staging / Preview Build — External Audit

Summary of changes for the staging preview deployment and how to obtain the preview URL.

---

## 1. Hero

- **Subtitle removed:** “By Lex Laurence and Liam Bongo” (MemberLine) removed from home hero.
- **Duplicate listen control removed:** Hero platform row (streaming icons) removed from home hero; single “Listen Now” + “Booking” CTAs only.
- **Stutter / robustness:** Hero video carousel now uses a 2.5s max wait and retries from the current slot if the next video is not ready, so slot 1 does not get stuck.
- **Cover and focal point:** Videos use `object-cover object-center`; hero section uses `min-h-[100vh]` for full viewport coverage.
- **YouTube embeds (HeroCarouselV2):** Iframe scaled to cover viewport (min-width/min-height + translate) so all 3 slots rotate in an infinite loop with no letterboxing.

---

## 2. Booking page redesign

- **Layout:** Two-column on desktop (form left, details right); single column on mobile.
- **Form fields:** Name, Email, Company, Event type (dropdown), Event date, Location, Budget range, Message.
- **Sections on the right:** Contact & management, Press / EPK download, Artist bio, Booking about card, Partners (if set).
- **Hero:** Tall hero with headline and single CTA to `#booking-form`.
- **Event type:** New optional field and DB column `event_type` (migration `030_booking_event_type.sql`).

---

## 3. About page inspiration pass

- **Hero:** Height preset set to “tall”.
- **Brand statement:** Optional block from hero subtext.
- **Story:** Existing bio/story section kept and labelled.
- **Performance identity:** Short mission line (“Live, evolving, in motion…”).
- **Press kit CTA:** “Download EPK” button and copy added.

---

## 4. Media admin workflow

- **Upload:** Existing flow (UniversalUploader → Supabase storage → `/api/admin/media/register`) unchanged.
- **Collections:** Create/edit collections; set cover from library; **“Add from library”** in the edit modal to assign media to a collection (POST to `/api/admin/gallery-media`).
- **Thumbnails / cover:** Cover image chosen via Media Library Picker; gallery-media supports `external_media_asset_id` and URL.
- **Reorder:** Gallery-media reorder via existing PATCH `/api/admin/gallery-media` (items array with `display_order`).
- **RLS:** Register API uses service role (bypasses RLS). If client uploads to storage fail, ensure Storage RLS allows **authenticated** insert on bucket `media` (see `026_storage_media_policies.sql` or Dashboard).

---

## 5. Events admin

- **Edit / delete:** Existing POST (create/update) and DELETE `/api/admin/events` unchanged; edit and delete work.
- **Thumbnail:** Upload or “from library” sets `thumbnail_url` and `external_thumbnail_asset_id`.
- **Public events:** List and detail use `getEvents()` / `getEventBySlug()` with `withResolvedThumbnails`; Supabase assets now resolve (see Thumbnails below).

---

## 6. Shop admin

- **Edit:** Existing product and product_images flows unchanged.
- **Thumbnails:** Product images use `image_url` and/or external asset; resolution supports Supabase provider where used.

---

## 7. Thumbnails / media rendering

- **Supabase provider:** `lib/media/resolveMediaUrl.ts` and `resolveExternalAsset` now handle `provider === 'supabase'` (preview_url / thumbnail_url). Events, galleries, and any feature using `resolveMediaUrl` or `resolveEventThumbnailUrl` now show Supabase-uploaded thumbnails correctly.
- **Admin cards:** Events and collections already use resolved or direct URLs; no change needed for display.

---

## 8. Deploy staging and get preview URL

- **Build:** `npm run build` completes successfully.
- **Preview URL:** Depends on your host:
  - **Vercel:** Push this branch (e.g. `staging` or `preview`) and open the deployment’s “Preview” URL from the Vercel dashboard or the PR comment.
  - **Other:** Use your normal staging deploy (e.g. `vercel --preview`, or your CI/CD staging environment). The preview URL is the URL of that deployment.

---

## DB / RLS / schema changes

| Change | File | Notes |
|--------|------|--------|
| `booking_inquiries.event_type` | `supabase/migrations/030_booking_event_type.sql` | Optional text; add column then deploy API that sends it. |

No RLS changes in this pass. Existing policies (admin service role, public read, authenticated storage upload) are unchanged.

---

## Remaining known issues

1. **Storage upload from browser:** If uploads still fail in admin, confirm in Supabase Dashboard → Storage → bucket `media` → Policies that **authenticated** users have INSERT. Some setups require policies to be created in the Dashboard rather than via migrations.
2. **Gallery media list in Collections:** Edit modal shows count and “Add from library” but does not list individual media or reorder inside the modal; reorder is still done elsewhere if you have a dedicated gallery-media admin view.
3. **Event type in booking:** Backend accepts and stores `event_type` only after migration `030_booking_event_type.sql` is applied; otherwise the column is missing and insert may fail unless you omit `event_type` for older DBs (current API sends it when provided).

---

*Staging preview build — for external audit.*
