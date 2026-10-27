# D3 — Media Studio (plan for review; not started)

Goal: turn the Media Library into a visual creative workspace Lex and Laurance can run from their
phones, without worrying about compression, file sizes or slowing the site down. Separate from D1.
Nothing here is implemented, and no new media-processing service is introduced, until this plan is
approved.

Builds on: `MEDIA_OPTIMIZATION_PLAN_2026-10-26.md` (audit, browser encoding evaluation, failure
policy) and `BANDWIDTH_RELEASE_PREP_2026-10-26.md` (hero renditions, caching rules, costs).

## Priorities (proposed order)

| # | Capability | Notes |
|---|---|---|
| 1 | **Honest uploads** | Never upload an unoptimized original silently. On failure: Try again / Try on a computer / Upload original anyway (explicit, ≤50 MB, labelled "Not optimized") / Cancel. Today's uploader still falls back silently — fix first. |
| 2 | **Video posters** | First-frame (or chosen-frame) poster for every video, generated in the browser at upload from the local file, so no large original is downloaded to make a thumbnail. Backfill existing videos from the already-optimized copies where they exist. Replaces the generic film icons in the dashboard and library. |
| 3 | **Automatic image compression** | Web copy capped at 2560 px (hero 2880), EXIF orientation applied, location data stripped, ~q82; width/height recorded. Originals kept. Ends the 32–37 MB originals being fetched by the image optimizer. |
| 4 | **Automatic video optimization** | WebCodecs hardware encoding (ffmpeg.wasm fallback for small files): 1080p desktop + 720p phone + poster, as already proven for the homepage clips (VMAF ≥ 92.7, 64–84% smaller). HDR detection and warning for iPhone footage. |
| 5 | **Visual organization** | Grid of real thumbnails, filters by type / usage (Hero, Public, Internal) / collection, portrait-safe previews (no cropping of tall images). |
| 6 | **Usage indicators** | "Used in: Homepage slide 1 · Collection X · Event Y" on each item, so nothing in use is removed by accident. |
| 7 | **Per-image focal points** | Tap to set the focal point; preview phone and desktop crops side by side. Stored on the media record (replaces the code-defined art direction). |
| 8 | **Bulk management** | Multi-select: label (Hero/Public/Internal), tag, archive. Delete stays a separate, confirmed action that keeps originals unless explicitly chosen. |
| 9 | **Drag-and-drop ordering** | `@dnd-kit` (already approved) for touch and keyboard ordering in collections and the hero. |
| 10 | **Upload progress & recovery** | Per-file progress, resumable uploads for large files, keep-screen-awake while encoding, clear retry after interruptions. |

## Data model (needs approval before any migration)

- `external_media_assets`: `width`, `height`, `duration_s`, `original_bytes`, `content_sha256`,
  `processing_status`, `focal_x`, `focal_y`.
- New `media_renditions` table (`asset_id`, `kind`, `storage_path`, `bytes`, `width`, `height`).
- Same RLS pattern as the existing lockdown: public read, admin write.

## Constraints carried over

- Originals are never overwritten or deleted without explicit approval.
- Content-hashed rendition names with one-year caching; overwritten paths keep short caching.
- No paid video service; stay within Supabase Free unless the owner decides otherwise.
- Automated video tests use local fixtures only.
- Real iPhone Safari and Android Chrome sign-off for every upload path.

## Estimate (to refine at plan review)

About 8–12 working days in total; items 1–3 (≈3 days) deliver most of the bandwidth and
usability benefit and can ship first.
