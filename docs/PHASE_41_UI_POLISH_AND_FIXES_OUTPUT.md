# Phase 41 — Admin UX Cleanup + Centered Layout Pass + Events + Media Video Alignment — Output

Baseline: Phase 40. No full redesign; only the listed fixes were implemented.

---

## 1. What was changed

### 1) Remove confusing duplicate upload buttons

- **Hero editor (DashboardHeroEditor):** Removed the duplicate “Upload” / “Replace” pattern. There is now a single uploader per context:
  - **Hero media:** One `UniversalUploader` only (accept: image + video). Label: “Upload image or video”. Removed hidden file input + separate “Upload” button.
  - **Logo (PNG):** One `UniversalUploader` only (accept: `image/png`). Labels: “Replace logo” when logo exists, “Upload logo (PNG)” when empty. Removed hidden file input + “Upload” / “Upload logo” buttons.
  - **Poster (video hero):** Single file input + “Upload poster” / “Replace poster” button only (accept: `image/*`). No second uploader.
- **Event thumbnail (admin Events):** One `UniversalUploader` per state (with/without thumbnail), with `acceptOverride="image/*"` and labels “Replace thumbnail” / “Upload thumbnail (image)”. “Choose from library” remains a separate, non-upload action.
- **Accept rules:** Hero media: image/* + video/*. Event thumbnail: image/*. Logo: image/png only.

### 2) Fix Admin Events editing

- **List:** Each event row already showed title, venue/city, date, status, and thumbnail. No change to data shown.
- **Edit entry:** Row is clickable (whole card opens the modal). Edit button still opens the same Create/Edit modal. Action buttons (move, ticket link, Edit, Delete) use `stopPropagation` so clicking them does not trigger row click.
- **Modal:** Form is prefilled from `editingEvent` (defaultValue / default values). Saving sends POST with `id` for updates; success runs `loadEvents()`, revalidate, toasts “Event updated” / “Event created”, and closes the modal. Delete still works with confirmation and toast.
- **Thumbnail:** Event thumbnail upload uses a single `UniversalUploader` with `acceptOverride="image/*"` and explicit button labels.

### 3) Event thumbnails on public Events page

- **Data:** Public `getEvents()` already used `withResolvedThumbnails()`; `EventCard` already used `resolved_thumbnail_url ?? thumbnail_url` and a placeholder when missing. No change to data flow.
- **Layout:** Events section uses a centered rail: `Container` with `max-w-[1100px] mx-auto px-4 md:px-6`. Event list remains full width inside that rail; month grouping unchanged.

### 4) Center layouts on desktop (Events, Media, Booking)

- **Events:** `Section` > `Container` with `max-w-[1100px] mx-auto px-4 md:px-6`; inner content `w-full`.
- **Media:** `Container` with `max-w-[1100px] mx-auto px-4 md:px-6`; inner `w-full`. Collection grid uses `justify-items-center` so few items center.
- **Booking:** `Container` with `max-w-[1100px] mx-auto px-4 md:px-6` for the booking form section; inner `w-full`.

### 5) Media collection card sizing and spacing

- **Grid:** Global `Grid` gap increased from `gap-6 md:gap-8` to `gap-8 md:gap-10`. Media collections use `Grid cols={4}` with `justify-items-center` so cards are centered when there are few.
- **Cards:** Collection cards unchanged in aspect (4/5) or structure; larger gaps make the block feel roomier.

### 6) Media Videos content (Option B)

- **Behavior:** Public Media → Videos tab now shows:
  - **Admin → Videos (YouTube):** Unchanged; same table and `getVideos()`.
  - **Media Library video assets:** Supabase-uploaded assets with `mime_type` starting with `video/` are fetched by new `getLibraryVideoAssets()` and merged with YouTube videos. They appear as playable HTML5 videos in the same feed.
- **Types:** `MediaPageVideo` extended with optional `youtube_id` and optional `video_url`. YouTube entries have `youtube_id`; library entries have `video_url` and `id` prefixed with `lib-`.
- **VideoFeed:** If `video_url` is set, a `<video src={...} controls playsInline>` is rendered; otherwise the existing YouTube iframe is used. Title and caption work for both.
- **Admin:** Subtitle on Admin → Media updated to: “Upload and manage media library. Video uploads also appear in the public Media → Videos tab.”

### 7) Footer alignment

- **Layout:** Footer content is in a 3-column grid: `grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 items-center justify-items-center text-center`. Left and right columns are empty (hidden on mobile) for symmetry; center column holds brand, nav links, and social. Center content is truly centered on desktop.

### 8) Nav button styling

- **Book Now (CTA):** Default: gold background (`bg-[var(--accent)]`), white border (`border-2 border-white`), black text. Hover: white background, black text, black border, underline. Uses `transition-all duration-200`, `glow`, and focus ring.
- **Other nav links:** Kept as text links with `nav-link-underline` (underline animation). Wrapped in `group` for possible future use; no structural change.

---

## 2. Files changed

| File | Changes |
|------|--------|
| `components/admin/DashboardHeroEditor.tsx` | Single uploader for hero media and logo; removed duplicate file inputs and buttons; removed unused handlers/refs/imports (updateHeroMedia, validateHeroFile, Upload icon); poster input accept `image/*`. |
| `app/admin/events/page.tsx` | Event row clickable to open edit; `stopPropagation` on action buttons; UniversalUploader for thumbnail with `acceptOverride="image/*"` and labels; `type="button"` on buttons. |
| `app/events/page.tsx` | Centered rail: Container `max-w-[1100px] mx-auto px-4 md:px-6`. |
| `components/events/EventsListClient.tsx` | No structural change (reverted temporary flex centering; list stays full width in rail). |
| `app/media/page.tsx` | Centered rail; fetch `getLibraryVideoAssets()` and merge with `getVideos()` for `videos` prop. |
| `app/booking/page.tsx` | Booking section Container `max-w-[1100px] mx-auto px-4 md:px-6`. |
| `components/ui/Grid.tsx` | Gap `gap-8 md:gap-10`. |
| `components/media/MediaPageClient.tsx` | Gallery grid `justify-items-center`. |
| `lib/content/server.ts` | Added `getLibraryVideoAssets()`; returns video assets from `external_media_assets` (provider supabase, mime_type video/*). |
| `lib/content/shared.ts` | `MediaPageVideo`: `youtube_id` and `video_url` optional; JSDoc updated. |
| `components/media/VideoFeed.tsx` | Render `<video>` when `video_url` is set; else YouTube iframe when `youtube_id` is set. |
| `components/layout/Footer.tsx` | 3-column grid layout; center column for brand/nav/social; left/right empty for symmetry. |
| `components/layout/Header.tsx` | Book Now: gold bg, white border, black text; hover white bg, black text, underline. Nav links: `group`, hover text kept. |
| `app/admin/media/page.tsx` | Subtitle updated to mention that video uploads appear in the public Media → Videos tab. |

---

## 3. Before/after behavior

| Area | Before | After |
|------|--------|--------|
| Hero media upload | Two entry points (hidden input + button, and UniversalUploader) | One: UniversalUploader only (image + video). |
| Hero logo | Two entry points (hidden input + button, and UniversalUploader) | One: UniversalUploader only (image/png). |
| Event thumbnail | One UniversalUploader + library picker; accept already image | Explicit `acceptOverride="image/*"` and labels. |
| Admin Events | Edit only via small Edit icon | Row click or Edit opens modal; save/refresh/toasts unchanged. |
| Public Events | Already had thumbnails and rail | Rail set to max-w-[1100px] mx-auto. |
| Events/Media/Booking | Mixed widths | All use max-w-[1100px] mx-auto for main content. |
| Media collections | gap-6/8, 4-col grid | gap-8/10, justify-items-center. |
| Media Videos tab | YouTube only (Admin → Videos) | YouTube + library video assets (MP4 etc.) as HTML5. |
| Footer | Single centered column | 3-column grid; center column for content. |
| Nav Book Now | Accent bg, accent2 hover | Gold bg, white border, black text; hover white bg, black text, underline. |

---

## 4. Remaining blockers

- None identified. Optional follow-ups: surface “library video” vs “YouTube” in the Videos tab (e.g. badge or section labels); or allow reordering/display_order for library videos.

---

## 5. Manual QA checklist

- [ ] **Hero:** Admin → Hero → Home. One “Upload image or video” control; one “Upload logo (PNG)” or “Replace logo” when applicable; one poster upload when hero is video. Accept: hero image/video, logo PNG, poster image.
- [ ] **Events admin:** /admin/events. List shows title, venue/city, date, status, thumbnail. Click row → modal opens prefilled. Edit, save → “Event updated” toast, list refreshes. Delete → confirm, toast, list refreshes. Thumbnail: upload image only.
- [ ] **Public Events:** /events. Thumbnails show (or placeholder). Content in a centered rail; equal margins on desktop.
- [ ] **Public Media:** /media. Collections tab: larger gaps, centered grid when few items. Videos tab: YouTube entries and any uploaded library videos; library videos play as HTML5.
- [ ] **Booking:** /booking. Form and sidebar in centered rail (max-w 1100px).
- [ ] **Footer:** Desktop: 3 columns; center column has brand, links, social; visually centered.
- [ ] **Nav:** Book Now: gold background, white outline, black text; hover → white background, black text, underline. Other links: readable, underline on hover.
