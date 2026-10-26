# Divine Timing — media system correction (V2), 2026-10-26

Branch `feat/visual-v2`, built on `feat/visual-v1`. Production is unchanged. Nothing here is deployed without owner approval.

## Root causes

| Problem | Root cause | Where |
|---|---|---|
| Orange portrait in "test test" loses both heads in the gallery; lightbox is fine | Every gallery frame is forced into `aspect-[16/10]` with `object-cover`. The lightbox uses `object-contain`, which is why it shows the whole photo | `components/collections/CollectionStory.tsx` (old line 118) |
| No intrinsic sizes to work with | The uploader never sends width/height, so all 20 library assets have `width/height = null`. The gallery query also never joined them | `components/admin/uploader/UniversalUploader.tsx`, `lib/content/server.ts` `getGalleryBySlug` |
| Collection page swaps between dark and light bands after every photo | Each frame alternated `band-night` / `band-sand` by index | `CollectionStory.tsx` |
| Headers crop heads (Contact on iPhone), zoom too far (Journey desktop), crop hard (Media desktop), show different parts of the photo (Shop) | One fixed hero shape per preset (production: 200px strip; 16:9 with no cap). The crop is always centred, and there's no per-image focal point, phone/desktop distinction or portrait handling | `components/hero/UnifiedHero.tsx`, `components/ui/MediaAssetRenderer.tsx` |
| Blank space with a lone spiral under Shop/Media headers | About 310px of stacked spacers (`mt-20` + divider + section padding + duplicate intro line) | `app/shop/page.tsx`, `app/media/page.tsx` (fixed in V1; **not yet in production**) |
| Grey video tiles titled "hero 1.mp4" | (1) Every upload, including hero clips, is saved `usage_type='public'`, so 8 of the 9 library videos are re-uploads of `hero 1/2/3`. (2) With no poster, the code fell back to the **video URL as the `<img>` thumbnail**, which can't render, so the tile shows the alt text (the filename) | `app/api/admin/media/register/route.ts`, `lib/media/publicLibraryVideos.ts` |
| "Empty gradient" above the test event on phones | Card and hero images were raw `<img>` tags pointing at **31–36 MB originals** (4672×7008 JPEGs). On cellular, the placeholder shows for a long time. The image optimiser handles them fine: the same file comes back as 62 KB | `MediaAssetRenderer.tsx` image branch |
| Lightbox slow on phones | Also loads the raw 30 MB+ original | `components/media/Lightbox.tsx` |
| Homepage hero "Buffering video" can loop forever | The spinner shows on every `waiting` event with no timeout. A `<link rel=preload as=fetch>` triggers a second download of the hero file, and all carousel slides preload `auto` | `MediaAssetRenderer.tsx`, `app/page.tsx` |

## Why the demo content is still public

- **Same data everywhere.** Preview and production use the **same Supabase database**, so there's no configuration difference between them.
- **Filters work.** The public filters (`status = 'published'`, enforced in RLS too) behave correctly.
- **Three demo items were republished in admin after they were set to Draft:**
  - Event `99d1c43e…` ("TEST TEST") at 11:55 PT.
  - Collection `test-test` at 11:57 PT.
  - Product `test` at 12:21 PT (owner said this was deliberate).
- **Still draft:** the other 6 events and the `test` collection.
- No publication states were changed in this pass.

## Production vs preview

- **Production (`main` 14b7744):** pre-V1 code, so every issue above is visible there.
- **V1 preview:** fixes the headers' shape, spacing, empty states, and the 404/legal pages.
- **V2 (this branch):** everything else in this report.

## What V2 changes (shared components, no per-page CSS patches)

1. **Full photography** (`CollectionStory.tsx`):
   - Frames render at their intrinsic proportions: `width:auto; height:auto; max-width:100%; max-height:88svh`. Portraits stay portrait and are centred; landscapes span the column. Nothing is cropped.
   - Number labels and captions align to the photo's edges.
   - When an asset has recorded dimensions, they're used to reserve the space before loading.
   - One continuous dark gallery surface replaces the alternating bands.
   - The cover remains an intentional crop (banner) with an upper-centre focal point.
2. **Thumbnails and cards:**
   - `StoryCard` uses an upper-third focal default.
   - `EventCard` gets a branded placeholder while loading. If there's no photo, it shows a compact 96px branded strip instead of a 16:10 empty box.
   - Video tiles show the clip's own first frame (metadata-only fetch), with a branded fallback.
3. **Cinematic heroes:**
   - **Focal points:** each source image has separate phone and desktop anchors (`lib/media/heroArtDirection.ts`, keyed by storage path). Replacing an image falls back to safe defaults.
   - **Split layout:** portrait sources (Shop) use a split layout on wide screens: title panel plus portrait panel, instead of a destructive banner crop.
   - **Height:** utility-page headers are taller on desktop (`clamp(420px, 60svh, 680px)`).
4. **Delivery (`MediaAssetRenderer`):**
   - Optimisable hosts go through `next/image`: responsive widths, AVIF/WebP, about 60–100 KB instead of 4–36 MB.
   - The lightbox does the same.
   - EXIF orientation is applied by the optimiser and modern browsers. The current sources have orientation 1 or none.
5. **Video:**
   - Hero placements, and re-uploads that share a hero clip's file name, are excluded from the public Videos tab. Duplicates collapse to one. The video URL is never used as an image.
   - Titles use `alt_text`, or a cleaned file name.
   - Covered by unit tests built from today's real rows.
6. **Hero buffering:**
   - 8-second stall watchdog, after which the poster shows and the spinner stops.
   - Only the first slide preloads in full; later slides fetch metadata first.
   - The double-download preload link is removed, along with duplicate `<source>` tags.
7. **Lint:** the pre-existing hero/video lint errors are fixed. State resets moved to a URL-keyed remount, and reduced-motion uses `useSyncExternalStore`.

## Data changes that need owner approval (not done)

| Change | Why | Risk |
|---|---|---|
| Set `usage_type='hero'` on the 8 hero-clip library assets | Makes the Videos-tab separation explicit instead of name-matched | Metadata only; reversible |
| Backfill `width/height` for the 20 library images (read headers from storage) | Gallery frames reserve their exact shape before loading (no layout shift) | Metadata only |
| Uploader: send width/height/duration, and per-placement `usage_type` | New uploads arrive correct | Code only; applies to future uploads |
| Migration: `focal_x/focal_y` plus mobile pair (and an optional mobile image) on `hero_sections` and gallery covers | Admin-controlled focal points (follow-up step 7) | Additive nullable columns |
| Generate and store video posters at upload (canvas frame grab) | Real posters instead of the metadata-frame fallback | Code only |

## Legal content still required (do not publish placeholders as policy)

The four drafts (Privacy, Terms, Refund, Shipping) still contain `[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]`. V2 keeps the branded "being finalised" pages. Before commerce or newsletter activation, the owner (ideally with a lawyer) needs to supply or confirm:

- **Operator identification:** the business address for the operator (Alexel Laurence Oulton, autónomo, NIE on file), plus contact email. Spain's LSSI requires the operator's identity, address, tax ID and contact details to be accessible on the site.
- **Final policy text:** Privacy, Terms, Refund and Shipping reviewed and approved. That includes how subscriber and booking data is processed, and which processors are named (Supabase, Vercel, Stripe, Resend).
- **Cookie and analytics disclosure:** decide whether the first-party analytics needs a consent notice.
- **Newsletter:** the consent wording for double opt-in signup, and the retention and unsubscribe terms.

## Remaining limitations

- **Phone testing:** verification is emulated (360–1920px, touch and mobile user agents, headless Edge). Real iPhone Safari and Android Chrome sign-off is still required.
- **Layout shift:** until dimensions are backfilled, gallery photos have no reserved height before they load. The frame holds a 50svh placeholder to limit the jump.
- **Hard-coded focal points:** these live in code until the admin controls (step 7) exist.
- **Video library:** only one genuine library video remains ("Website 1"). It has no editorial title or poster yet.
