# Security audit — unpublished media visibility (2026-11-11)

Status:
- **Confirmed, fix tested on staging, not applied to production.**
- Proposed migration: `supabase/proposed/060_unpublished_media_visibility.sql`, with an exact undo `060_unpublished_media_visibility.down.sql`.
- Applied to staging only (staging migration 20261111085819).
- Production RLS, storage and data are unchanged.

## 1. Two separate risks

**A. Database visibility.** Anyone can read every row of `gallery_media`, `event_media`,
`product_images` and `product_variants`, whatever the state of the parent Collection, event or
product. A visitor can therefore see what an unpublished Collection or event contains: which
photos, their captions and their order.

**B. Storage discovery and download.**
- All six buckets are public.
- A read policy for everyone on `storage.objects` (`Public read all buckets`, `true`, plus one per bucket) lets anyone **list** every file.
- Public buckets serve `/storage/v1/object/public/...` links **without consulting any policy**. So any file whose link is known downloads, whatever RLS says.
- Closing the listing stops discovery. It does not make a file private.

## 2. What is exposed on production today

Read-only checks as a signed-out visitor, with the public key only.

- **Draft Collections:** 7 media rows (5 distinct photos) in 2 draft Collections are readable.
  - All 5 photos are Media Library items the owners marked **Public**, so the *files* were already meant to be public.
  - What leaks is each draft Collection's *contents, captions and order*.
- **Storage listing:** all 96 files in `media` are listable and downloadable.
- **Draft events and hidden products:** same database gap, nothing exposed today (no media on draft events; the only product image belongs to the live product).

### Which files are meant to be public

Each of the 96 files was checked against every content table and the code that names files
directly:

| Class | Files | Size | Meaning |
| --- | --- | --- | --- |
| Used by public content (database) | 43 | 160 MB | Hero, published Collections and events, releases, products, press kit, Public library items |
| Used by public content (code) | 14 | ~45 MB | The 12 current hero video encodes and posters (`lib/media/heroRenditions.ts`) and 2 web copies of large photos (`lib/media/webCopies.ts`) |
| **Internal only** | 12 | 65 MB | Library items marked Internal and used nowhere public: 3 duplicate white-logo copies, 6 older hero clips (2 of them empty files), 2 Journey chapter images, 1 photo |
| **Superseded, unused** | 27 | ~128 MB | Older hero slot uploads (10), older hero encodes (6), legacy hero stills (4), and orphaned library uploads (3 videos, 3 photos), kept because originals are never deleted |

The last two rows (39 files, about 190 MB) are the only files that could be considered private. All
of them can be listed today, and all download by link.

## 3. Can the current public-bucket setup protect private files?

- **Against discovery: yes,** once listing is admin-only and child rows follow their parent (migration 060). With no listing and no readable row, a visitor has no way to learn a private file's name.
  - Names are `library/<13-digit millisecond timestamp>-<original file name>`. That's impractical to guess blindly, but it isn't random.
- **Against someone who already has a link: no.**
  - Anyone who listed the bucket before the fix, or saved a link, can still download that file while it stays in the public bucket.
  - Changing RLS can't stop this (tested on staging, section 5).
- **True privacy needs a private bucket.** Files in a private bucket are refused on every public path and can be opened only through short-lived signed links (tested, section 5).

## 4. Recommended architecture (smallest secure option)

**Step 1, now: migration 060** (one migration, no file changes, no cost).
- Child media rows are readable only when the parent is public: published Collection, published event, live product. Admins still read everything.
- Storage listing and direct `storage.objects` reads become admin-only.
- Buckets stay public, so every public photo, video, logo and hero loads exactly as before, with the same CDN caching, image optimisation and bandwidth savings.
- Closes risk A completely, and closes discovery for risk B.

**Step 2, only if the owners want guaranteed privacy for specific files** (a staged storage transition, separate approval).
- **Private bucket** `media-private` (private, admin-only policies). Admins see these files through short-lived signed links from an admin API.
- **One-time move.** After the owners review the list in section 2, move the internal-only and superseded files (39 files, about 190 MB) into `media-private`.
  - Use the Storage API, not SQL. Same bytes, same names.
  - Update their library rows to point at the private location. Nothing is deleted.
  - Their old public links stop working immediately.
- **Going forward:**
  - A library action, "Make private", moves a file into the private bucket; "Make public" moves it back before it can be used on the site.
  - New uploads stay as they are today (public bucket, undiscoverable).
  - Add a random part to new upload names (`library/<timestamp>-<random>-<name>`), so even a leaked naming pattern can't be guessed.

**Not recommended: making the whole `media` bucket private.**
- Every public image and video would then need signed links generated per visit.
- That breaks long-lived CDN and image caching, which raises origin bandwidth (the D2-A savings would be lost).
- It would also mean changing every public page, for files that are public by design.

## 5. Staging verification (actual staging database and storage)

Staging policies matched production exactly before the test (same policy fingerprint). Test rows
were clearly labelled, staging only, and removed afterwards:
- a draft-Collection photo,
- a draft event with one photo,
- one photo on a published event.

No owner media was touched.

| Test | Before 060 | After 060 |
| --- | --- | --- |
| Visitor: draft Collection photo row readable | yes | **no** |
| Visitor: draft event photo row readable | yes | **no** |
| Visitor: published event photo row readable | yes | yes |
| Visitor: published Collection media rows | 3 | 3 |
| Visitor: files listable in `media` | 26 | **0** |
| Visitor with a known link to an internal file (public bucket) | 200 | **200** (as predicted: RLS can't stop it) |
| Admin: draft rows readable | yes | yes |
| Admin: storage listing | 200 | 200 |
| Admin: Media Library API | 200 | 200 (12 items) |
| Admin: upload to `media` | — | 200 |
| Public pages `/`, `/collections`, a Collection, `/events`, `/media`, `/shop`, `/journey`, `/music` | 200 | 200 |
| Public page files that exist in staging storage | download | download (9 of 9) |

The 13 other page links that fail on staging point to files that were never copied into staging
storage (a known staging data gap); they fail identically before and after.

Private-bucket prototype (a temporary `media-private` bucket on staging, with a 1×1 test image):

| Test | Result |
| --- | --- |
| Admin upload to the private bucket | 200 |
| Visitor via the public link | **400** |
| Visitor via the signed-in link | **400** |
| Visitor asking for a signed link | **400** |
| Admin creates a 6-second signed link; opened without login | 200 |
| Same signed link after it expires | **400** |
| File in the public bucket fetched twice (CDN cache HIT), then moved to the private bucket: old link | **400 immediately**, and still 400 after 70 seconds |

Rollback: the undo script restored the policies **byte for byte** (identical policy fingerprint), and
the visitor probe returned to the exposed state. The fix was then re-applied and is left on staging.

## 6. Previously exposed links and caches

- While a file stays in the public bucket, any saved link keeps working, before and after 060.
- Moving a file to the private bucket ends access through Supabase at once. On staging the CDN returned 400 straight after the move, even for a file it had just served from cache.
- Copies outside Supabase can't be recalled:
  - anything a visitor already downloaded,
  - browser caches (uploads are marked cacheable for a long time),
  - Vercel's image cache for any file that was ever shown through the site's image optimiser (31 days).
  - The internal and superseded files aren't shown on public pages, so the last case shouldn't apply to them.

## 7. Cost and migration implications

- **Migration 060:** one database migration, policies only. No data, files or buckets change. No cost change. Rollback verified.
- **Step 2:** a separate, staged change:
  - a small migration (private bucket and its admin-only policies),
  - admin code (signed previews, "Make private" and "Make public", random upload names),
  - a one-time file move through the Storage API, after the owners review the file list.
  - Storage cost is unchanged (files move, they aren't copied). Signed links are used only in the admin, so extra bandwidth is negligible.
- Public pages, the hero carousel, renditions and web copies are untouched by both steps.

## 8. Production plan (after approval)

1. Record fingerprints: policies, storage (96 files, eTags), all content tables.
2. Apply 060.
3. Re-run the signed-out probe:
   - draft rows hidden,
   - listing returns 0,
   - published rows visible,
   - every public page and its files return 200.
4. As an admin: Collections and events show draft media, a Media Library page load works, and the logo picker opens (no saves).
5. Undo, if ever needed: `060_unpublished_media_visibility.down.sql` restores the previous policies exactly.
