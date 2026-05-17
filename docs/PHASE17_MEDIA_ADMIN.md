# Phase 17 — Media Admin Cleanup + Legacy Handling

## Step 1 — Inventory

### Current media source
- **Table:** `external_media_assets` (Supabase). Columns: `id`, `provider`, `file_id`, `name`, `mime_type`, `size_bytes`, `thumbnail_url`, `preview_url`, `created_at`, `updated_at`, etc.
- **Providers:** `supabase` (new uploads), `google_drive`, `dropbox`. Legacy: `uploadcare` (historical DB rows only).
- **Admin uploads:** Supabase Storage via `UniversalUploader` → `/api/admin/media/register` → rows with `provider: 'supabase'`.
- **Usage:** Hero (`external_media_asset_id`), events (`external_thumbnail_asset_id`), galleries (`external_cover_asset_id`), gallery_media (`external_media_asset_id`), products, booking, about.

### Legacy detection rule
- **Legacy:** `provider === 'uploadcare'` (historical). Default admin and picker views hide these; "Show legacy items" toggle reveals them.
- **Current (non-legacy):** `provider !== 'uploadcare'` (e.g. `supabase`, `google_drive`, `dropbox`).

### Resolver function location
- **Server (async, full resolution):** `lib/media/resolveMediaUrl.ts` — `resolveMediaUrl(directUrl, externalAssetId)`, `resolveExternalAsset(assetId)`. Used by event thumbnails (`lib/eventMedia.ts`), gallery cover (`lib/mediaGallery.ts`), etc.
- **Client (sync, URL-only):** `lib/media/displayUrl.ts` — `parseDisplayUrl(url)` returns `{ url?, isLegacy, isValid }` for placeholder/legacy display decisions without server calls.

---

## Files changed

| File | Change |
|------|--------|
| `docs/PHASE17_MEDIA_ADMIN.md` | New: inventory, resolver locations, deliverables. |
| `lib/media/displayUrl.ts` | New: client-safe `parseDisplayUrl(url)` → `{ url?, isLegacy, isValid }`. |
| `app/admin/media/page.tsx` | Load `provider`; split current vs legacy; default show only current; "Show legacy items" toggle; legacy section with "Legacy" label; grid `gap-6 md:gap-8`; hint when all legacy; Advanced (asset IDs) in details. |
| `components/admin/MediaLibraryPicker.tsx` | Query includes `provider`; default pool = non-legacy only; `showLegacyToggle` prop + "Include legacy items" checkbox; empty state CTA "Upload media" link to `/admin/media`. |
| `app/admin/collections/page.tsx` | Cover: "Choose from library" + "Clear cover"; `handleClearCover`; picker `filter="image"`. |
| `app/api/admin/galleries/route.ts` | POST accepts `clear_cover: true`; sets `cover_image_url` and `external_cover_asset_id` to null. |

## What changed

- **Media library:** Default view shows only non-legacy assets. "Show legacy items" reveals legacy (e.g. historical uploadcare) assets in a "Legacy" section. Grid spacing `gap-6 md:gap-8`. Copy URL and Delete per card.
- **Picker:** By default only non-legacy assets are shown. Optional `showLegacyToggle` adds "Include legacy items" so picker can include legacy when needed. Empty library shows "Upload media" link to `/admin/media`.
- **Collections:** Edit modal has "Choose from library" (image filter) and "Clear cover"; API supports `clear_cover: true`.
- **Resolved URLs:** Server resolution unchanged (`resolveMediaUrl`, `resolveGalleryCoverUrl`, `eventMedia`). Client can use `parseDisplayUrl` for URL-only checks.

## Legacy toggle behavior

- **Admin Media page:** Default = only assets with `provider !== 'uploadcare'`. Button "Show legacy items" toggles visibility of the "Legacy" section. Legacy count shown next to the toggle when > 0.
- **MediaLibraryPicker:** Default = only non-legacy assets. If `showLegacyToggle={true}` (not used by Events/Collections by default), a checkbox "Include legacy items" appears and when checked legacy assets are included in the grid. Events and Collections pickers do not pass `showLegacyToggle`, so they only show non-legacy by default.

## Manual test steps

### Events thumbnail
1. Go to `/admin/media`, upload one image (or ensure at least one non-legacy image exists).
2. Go to `/admin/events`, create or edit an event.
3. Click "Choose from library"; select the image; save.
4. Confirm admin list shows the thumbnail; go to `/events` and confirm card shows it; open event detail and confirm hero shows it (or placeholder if removed).

### Collections cover
1. Go to `/admin/collections`, edit a collection.
2. Click "Choose from library", select an image; save. Confirm list shows cover and `/media` card shows it.
3. Edit again, click "Clear cover"; save. Confirm list shows "No cover" and `/media` shows premium placeholder (MediaEmptyCard).
4. Open a collection with no cover and no media; confirm gallery detail page does not break.

## Acceptance checklist

- [ ] **1) Media library:** `/admin/media` loads with clean grid; Upload works; no broken thumbnails (placeholder used).
- [ ] **2) Legacy:** Default view does NOT show legacy; "Show legacy items" reveals them in labeled section; Picker defaults to non-legacy unless toggled.
- [ ] **3) Events thumbnail:** Upload/add 1 image → Edit event → Choose from library → select → save → admin list + `/events` + `/events/[slug]` show thumbnail or placeholder.
- [ ] **4) Collections cover:** Admin can set/clear cover from library; `/media` shows cover or premium placeholder; gallery detail does not break when cover missing.
- [x] **5) Build / architecture:** `npm run build` passes; no server-only imports in client; Corner nav unchanged.
