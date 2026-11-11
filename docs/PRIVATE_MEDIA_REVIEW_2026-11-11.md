# Private media review — for Lex and Liam (2026-11-11)

**Nothing has been moved, hidden or deleted.** This list is for deciding which files, if any, should
become private. Every file stays where it is, with its original and all existing references, until
you choose.

## What changed on 2026-11-11 and what didn't

- Since migration 060 (production, 2026-11-11 09:39 UTC), visitors can no longer **list** files or see the contents of unpublished Collections and events.
- Every file in the `media` bucket still **downloads by its direct link**, because the bucket is public. That is what keeps the site's photos and videos fast and cached.
- Until 060, anyone could list all 96 files. Links copied before then still work while a file stays in the public bucket.
- **Copies already downloaded can't be recalled**: by visitors, browsers, caches, or anyone who saved a file. Making a file private only stops new downloads from the site's storage.
- A file is made private by moving it to a separate private bucket (tested on staging). The site's own pages don't use any of the files below, so moving them wouldn't change anything visitors see.

## Summary

The 96 production files: 57 are used by the public site and are not listed here. The other 39 are
below.

| Recommendation | Files | Why |
| --- | --- | --- |
| **Public** (no need to hide) | 17 | Byte-identical copy of a file the site already shows (11), or an older encode of a current homepage video (6) |
| **Needs review** | 22 | Older homepage clips no longer used (15), legacy page header photos (2), photos with no record or use (3), empty failed uploads (2) |
| **Private** | 0 | No file is attached to unpublished content. The only files used by drafts are the draft-Collection photos, already marked Public in the Media Library |

"Original" means the first upload of that content; "Duplicate" means byte-identical to another
file; "Superseded" means replaced by a newer version.

## Recommended Public: copies of what the site already shows

| File | Type | Size | Current usage | Published / unpublished | Kind | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| `hero/home.jpg` | JPEG | 1.26 MB | None | Neither | Duplicate of `hero/events.jpg` (Events page header) | Public |
| `hero/logos/home-logo.png` | PNG | 0.06 MB | None | Neither | Duplicate of the live white logo | Public |
| `library/1773117115214-DT_LOGO_W.png` | PNG | 0.06 MB | Library item (Internal) | Neither | Duplicate of the live white logo | Public |
| `library/1779484114463-DT_LOGO_W__1_.png` | PNG | 0.06 MB | Library item (Internal) | Neither | Duplicate of the live white logo | Public |
| `library/1794269854816-DT_LOGO_W.png` | PNG | 0.06 MB | Library item (Internal) | Neither | Duplicate of the live white logo | Public |
| `library/1779483084445-hero_1.mp4` | MP4 | 18.95 MB | Library item (Internal) | Neither | Duplicate of homepage video 1 | Public |
| `library/1779482471929-hero_2.mp4` | MP4 | 18.77 MB | Library item (Internal) | Neither | Duplicate of homepage video 2 | Public |
| `library/1779482476054-hero_3.mp4` | MP4 | 19.10 MB | Library item (Internal) | Neither | Duplicate of homepage video 3 | Public |
| `library/1794270885935-ch4_the_duo.jpg` | JPEG | 0.16 MB | Library item (Internal) | Neither | Duplicate of the published Journey chapter 4 image | Public |
| `library/1794270891354-ch5_the_tribe.jpg` | JPEG | 0.23 MB | Library item (Internal) | Neither | Duplicate of the published Journey chapter 5 image | Public |
| `library/1794276338090-soe1_08.jpg` | JPEG | 0.27 MB | Library item (Internal) | Neither | Duplicate of a photo the site already shows | Public |
| `hero/optimized/hero-1-1080p-f1a49936b2.mp4` | MP4 | 6.53 MB | None | Neither | Superseded encode of homepage video 1 | Public |
| `hero/optimized/hero-1-720p-f3daf77e46.mp4` | MP4 | 2.99 MB | None | Neither | Superseded encode of homepage video 1 | Public |
| `hero/optimized/hero-2-1080p-e1c66eeca2.mp4` | MP4 | 7.03 MB | None | Neither | Superseded encode of homepage video 2 | Public |
| `hero/optimized/hero-2-720p-07832e3852.mp4` | MP4 | 3.25 MB | None | Neither | Superseded encode of homepage video 2 | Public |
| `hero/optimized/hero-3-1080p-296e0ea290.mp4` | MP4 | 6.61 MB | None | Neither | Superseded encode of homepage video 3 | Public |
| `hero/optimized/hero-3-720p-65665b1b0d.mp4` | MP4 | 2.96 MB | None | Neither | Superseded encode of homepage video 3 | Public |

## Needs review: please confirm

**Older homepage clips** (the "website 1/2/3" videos the homepage used before the current hero
videos, March–May 2026). They were public when in use; no page uses them now.

| File | Type | Size | Current usage | Published / unpublished | Kind | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| `hero/home/slot-1/1772569987194-website_1.mp4.mp4` | MP4 | 6.99 MB | None | Neither | Original (website 1) | Needs review |
| `hero/home/slot-1/1772754092681-website_1.mp4.mp4` | MP4 | 6.99 MB | None | Neither | Duplicate (website 1) | Needs review |
| `hero/home/slot-1/1772756063687-website_1.mp4.mp4` | MP4 | 6.99 MB | None | Neither | Duplicate (website 1) | Needs review |
| `hero/home/slot-1/1772757089131-website_1.mp4.mp4` | MP4 | 6.99 MB | None | Neither | Duplicate (website 1) | Needs review |
| `hero/home/slot-3/1772754122766-website_1.mp4.mp4` | MP4 | 6.99 MB | None | Neither | Duplicate (website 1) | Needs review |
| `library/1773546585797-website_1.mp4` | MP4 | 6.99 MB | None (no library record) | Neither | Duplicate (website 1) | Needs review |
| `library/1773546740440-website_1.mp4` | MP4 | 6.99 MB | None (no library record) | Neither | Duplicate (website 1) | Needs review |
| `library/1773546768565-website_1.mp4` | MP4 | 6.99 MB | None (no library record) | Neither | Duplicate (website 1) | Needs review |
| `library/1779481436565-website_1.mp4` | MP4 | 6.99 MB | Library item (Internal, "website 1.mp4") | Neither | Duplicate (website 1) | Needs review |
| `hero/home/slot-2/1772569999052-website_2.mp4.mp4` | MP4 | 6.97 MB | None | Neither | Original (website 2) | Needs review |
| `hero/home/slot-2/1772757094583-website_2.mp4.mp4` | MP4 | 6.97 MB | None | Neither | Duplicate (website 2) | Needs review |
| `hero/home/slot-3/1772570009347-website_3.mp4.mp4` | MP4 | 7.05 MB | None | Neither | Original (website 3) | Needs review |
| `hero/home/slot-1/1772754107642-website_3.mp4.mp4` | MP4 | 7.05 MB | None | Neither | Duplicate (website 3) | Needs review |
| `hero/home/slot-3/1772756067358-website_3.mp4.mp4` | MP4 | 7.05 MB | None | Neither | Duplicate (website 3) | Needs review |
| `hero/home/slot-3/1772757098239-website_3.mp4.mp4` | MP4 | 7.05 MB | None | Neither | Duplicate (website 3) | Needs review |

**Legacy page header photos**, earlier header images for the Media and Shop pages. Their focal-point
settings are still in the code, but no page shows them now.

| File | Type | Size | Current usage | Published / unpublished | Kind | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| `hero/media.jpg` | JPEG | 1.39 MB | None | Neither | Superseded (earlier Media page header) | Needs review |
| `hero/shop.jpg` | JPEG | 4.32 MB | None | Neither | Superseded (earlier Shop page header) | Needs review |

**Photos with no library record and no use.** Uploaded 2026-05-18 and never attached to anything.
These are the likeliest to be unreleased.

| File | Type | Size | Current usage | Published / unpublished | Kind | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| `library/1779146122717-DSC01656_1.jpg` | JPEG | 3.42 MB | None (no library record) | Neither | Original | Needs review |
| `library/1779146316612-DSC01656_1.jpg` | JPEG | 3.42 MB | None (no library record) | Neither | Duplicate of the above | Needs review |
| `library/1779146185154-DSC02057.jpg` | JPEG | 2.67 MB | None (no library record) | Neither | Original | Needs review |

**Empty uploads** (0 bytes, failed uploads with no content).

| File | Type | Size | Current usage | Published / unpublished | Kind | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| `library/1779482469438-hero_1.mp4` | MP4 | 0 MB | Library item (Internal, "hero 1.mp4") | Neither | Empty duplicate | Needs review |
| `library/1779482536732-hero_1.mp4` | MP4 | 0 MB | Library item (Internal, "hero 1.mp4") | Neither | Empty duplicate | Needs review |

## Questions for Lex and Liam

1. Do any of the older homepage clips, the two old page header photos, or the three unattached photos (`DSC01656_1`, `DSC02057`) contain anything that shouldn't be public?
2. Should anything else be private going forward (for example unreleased artwork or behind-the-scenes footage), so new uploads of that kind go to the private area?
3. Duplicates and empty uploads could later be archived in the Media Library to tidy it up, but that is a separate housekeeping decision. Nothing is deleted without your say.
