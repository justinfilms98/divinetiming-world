# Security audit — unpublished media visibility (2026-11-11)

Status: **confirmed exposure, fix proposed, nothing changed.** No production or staging policy,
storage setting or data was modified. All checks were read-only.

## Summary

| Finding | Severity | Live today |
| --- | --- | --- |
| Media rows of **draft Collections** are readable by anyone, and the files download | **High** (unpublished content) | **Yes: 7 images in 2 draft Collections** |
| Anyone can **list every file** in the `media` bucket, including Media Library items marked internal | **High** (discovery of unpublished media) | **Yes: all 96 files listable** |
| `event_media` rows are readable whatever the event's status | Medium (same gap, currently empty) | No: 0 rows; all 8 events published |
| `product_images` and `product_variants` are readable whatever the product's status | Low to medium (same gap) | No: 1 image, belonging to the live product |
| `photos` and `photo_albums` (legacy) are readable by anyone | Low | No: 0 rows; tables unused |

Recommendation: treat the first two as a **security priority, before Journal development**.

## 1. What is involved

**Database.** Tables in the `public` schema, all with RLS enabled. Each has a single read policy
granted to everyone (role `public`) with condition `true`:
- `gallery_media` ("Public read gallery_media"): parent `galleries` is published-only.
- `event_media` ("Public read event_media"): parent `events` is published-only.
- `product_images` and `product_variants` ("Public read access"): parent `products` is live-only (published and active).
- `photos` and `photo_albums` ("Public read access"): legacy, no status column.

No write policy exists on any of them, so visitors cannot change anything. All writes go through the
admin APIs using the service role. Migration 054 removed the old open write policies but left these
read policies as they were.

**Storage.**
- All six buckets are public: `media`, `public-media`, `hero-videos`, `event-thumbnails`, `gallery-covers`, `music-covers`.
- `storage.objects` has eight read policies for everyone. One is `Public read all buckets` (`true`), plus one per bucket.
- These policies let the Storage list and search API enumerate files.
- Public object links (`/storage/v1/object/public/...`) don't use these policies at all; the bucket's public setting serves them.

**API paths a visitor can use**, with the public anon key every browser already receives:
- `GET /rest/v1/gallery_media` (and the same for `event_media`, `product_images`, `product_variants`, `photos`).
- `POST /storage/v1/object/list/{bucket}`, which lists file names.
- `GET /storage/v1/object/public/{bucket}/{path}`, which downloads any file whose name is known.

## 2. Can a signed-out visitor discover or retrieve draft media?

Tested on production as a signed-out visitor, with read-only requests using only the public key. Only
counts and status codes were recorded, no names or links.

- `galleries`: the visitor sees 1 Collection (published). The 2 drafts are correctly hidden.
- `gallery_media`: the visitor sees **23 rows. 7 belong to the 2 hidden draft Collections**, and **all 7 images download (HTTP 200)** from their stored links.
- `event_media` 0 rows, `product_images` 1 (live product), `product_variants` 0, `photos` 0.
- Media Library (`external_media_assets`): the visitor sees 14 of 53 rows; RLS correctly hides internal and archived items.
- Storage list: the visitor can **list all 96 files** in `media`. That includes the files behind the 39 hidden library rows, so hiding them in the database doesn't stop them being found.

## 3. Database visibility versus direct file links

- **Database rows** reveal that unpublished items exist, plus their captions, order, parent and file links. The proposed fix closes this.
- **File listing** reveals every file name. The proposed fix closes this (admin-only listing).
- **Direct file links** still work for anyone who already has a link, because the buckets stay public.
  - Closing that requires private buckets with signed links, a larger change that would affect image optimisation and caching.
  - It isn't needed to stop discovery: once rows and listings are closed, a visitor has no way to find an unpublished file's link.
  - Storage paths are timestamped and not guessable.
  - Links already shared, or cached by a visitor before the fix, keep working.

## 4. Other unpublished content types

Checked every public table:
- **Correctly gated:** events, galleries, products, releases, videos, journey, legal, press releases, label, Media Library.
- **Open by design:** settings, hero, page copy, about, booking, press kit and carousel. They hold public page content with no draft state.
- **Same gap:** the child tables listed in section 1.

## 5. Does anything public depend on the current access?

No.
- Collection and event pages fetch media only after loading a published parent (`lib/content/server.ts`: `getGalleryMedia`, `getEventMedia`, nested `gallery_media(*)` on published galleries).
- The Collections hub counts media only for published Collections.
- Shop pages read images of live products only. Checkout uses the service role.
- The only Storage listing in the code is the admin overview's storage total, which uses the service role and is unaffected.
- The admin Collections and Shop pages read through the signed-in admin, which the new `is_admin()` policies allow.
- Admin uploads use the existing admin insert and update policies, and keep an admin read policy.

## 6. Smallest safe correction

`supabase/proposed/unpublished_media_visibility.sql`, with an exact rollback in
`unpublished_media_visibility.down.sql`. Both parse as PostgreSQL 17; neither has been applied.

- Child media rows become readable only when their parent is public (published Collection, published event, live product). Admins still read everything.
- Storage read policies for everyone are replaced by one admin-only read policy. The buckets stay public, so every image, video and logo on the site loads by its link as before.
- No data, files or buckets change. Legacy `photos` and `photo_albums` are left alone (empty, unused).

Recommended numbering: apply this as **060**, ahead of the Journal, which becomes 061.

## 7. Testing on staging without touching owner media

Staging has identical policies and 2 draft Collections with no media.

1. **Before.** Add one test row to a draft staging Collection, pointing at an existing staging image (no upload; staging only). Run the signed-out probe and expect the row visible and the file listing open.
2. **Apply.** Apply the migration on staging only.
3. **Signed out.** Run the probe again:
   - The draft row is hidden and the published Collection's media is visible.
   - Storage listing returns no files.
   - Every public image link still returns HTTP 200.
   - `/collections`, a published Collection, `/events`, an event page, `/shop` and the homepage render with their images.
4. **As admin.** Collections and Shop show all media, including drafts. A Media Library upload, hero logo choice, slot change and product image upload all work.
5. **Undo test.** Run the down script, confirm the probe matches the "before" state, then re-apply.
6. **Clean up.** Delete the single test row (a staging row, never a file).
7. **Production, after separate approval.**
   - Record fingerprints, apply, and re-run the probe.
   - Spot-check the public pages and an admin upload.
   - The down script restores the previous state.
