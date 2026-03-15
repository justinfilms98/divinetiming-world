# Phase AC — Media Videos: Vertical Short-Form Implementation Plan

## Current state

- **Public Media page** has Collections and Videos tabs. Videos tab shows a grid of video cards (YouTube-based); clicking opens a modal player.
- **Videos table**: `id`, `title`, `youtube_id`, `thumbnail_url`, `is_featured`, `display_order`, `status`. Public `getVideos()` filters by `status = 'published'` and resolves thumbnails.
- **Admin** supports YouTube URL/id, title, thumbnail, status, ordering. No caption or aspect/vertical flag.

## Target behavior

- **Mobile**: TikTok/Reels-like vertical feed (full-height viewport, swipe next/prev, optional sound toggle).
- **Desktop**: Centered 9:16 player with next/prev controls and optional fullscreen.
- **Admin**: Upload or external source; title; caption; status; ordering / featured order; optional “vertical/short-form” flag for layout.

## Implementation plan

### 1. Schema (minimal)

- **videos**: Add optional `caption TEXT`, and either `is_vertical BOOLEAN DEFAULT false` or `aspect_ratio TEXT` (e.g. `'9:16'`, `'16:9'`) so the public UI can choose layout. Prefer `is_vertical` for simplicity.
- Migration: `ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption TEXT; ADD COLUMN IF NOT EXISTS is_vertical BOOLEAN DEFAULT false;`

### 2. Admin

- **Videos admin** (existing page): Add caption textarea and “Vertical / short-form” checkbox. Save/load with existing POST/GET. Optional: allow external source (e.g. external_media_asset_id) in addition to YouTube for uploaded short-form clips; can be a follow-up.

### 3. Public — Videos tab

- **Data**: `getVideos()` already returns list; extend type to include `caption`, `is_vertical` (or `aspect_ratio`). No change to filtering.
- **Layout**:
  - **Mobile**: If any video is vertical (or all), render a vertical feed: one video per viewport height, swipe up/down (or tap next/prev) to change. Use a single 9:16 container; YouTube embed or native video with `playsInline` and optional mute-for-autoplay.
  - **Desktop**: Centered column (e.g. max-w-[400px] or 9:16 aspect) with one primary player; prev/next buttons or keyboard arrows; optional fullscreen. Optional: sidebar or list of thumbnails for quick jump.
- **Components**: Extract or add `VerticalVideoFeed` (mobile) and `CenteredVideoPlayer` (desktop) with shared state for current index and next/prev. Reuse or adapt existing `VideoPlayerModal` for single-video playback; add next/prev when in “feed” mode.
- **URL**: Optional `?v=id` or `#v=id` for deep link to a specific video in the feed.

### 4. Order of work

1. Migration: add `caption`, `is_vertical` to `videos`.
2. Admin: caption + is_vertical in form and API.
3. Public types and `getVideos()` to return new fields.
4. Public Videos tab: detect mobile vs desktop; render vertical feed (mobile) or centered player (desktop) with next/prev; wire YouTube (and later native video if needed).
5. Polish: fullscreen, accessibility, reduced motion.

### 5. Out of scope for this pass

- Native upload (non-YouTube) for short-form: can be added later with `external_media_asset_id` or new storage path on `videos`.
- Multiple sources per video (e.g. YouTube + fallback upload): not required for first version.

---

This plan keeps the existing brand and content model, reuses current admin and public wiring, and adds the minimum schema and UI for vertical short-form and premium desktop playback.
