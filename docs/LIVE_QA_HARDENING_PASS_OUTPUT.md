# Live QA Hardening Pass — Output Summary

Baseline: footer rebuild, booking rebuild V2, premium composition, shop operator confidence, event thumbnail API hardening, video feed UX, public empty-state hardening. This pass focused only on issues visible or testable in the browser and on runtime resilience.

---

## 1. Runtime issues found

### Event thumbnail (P1)
- **Admin form:** Hidden inputs could submit whitespace if DOM was ever out of sync; payload already normalized in API but client now trims before send for consistency.
- **API persistence / DB:** Already correct: API trims `thumbnail_url` and `external_thumbnail_asset_id` and coerces empty string to null (Phase AO). GET returns full row; `withResolvedThumbnails` attaches `resolved_thumbnail_url`.
- **Asset resolution:** `resolveEventThumbnailUrl` uses storage path → `thumbnail_url` (https) → `external_thumbnail_asset_id` via `resolveMediaUrl`. No code bug found; failure would be environmental (e.g. RLS, missing asset).
- **Public rendering:** `getEvents` / `getEventBySlug` attach `resolved_thumbnail_url`; list and detail use `resolved_thumbnail_url ?? thumbnail_url`. No fix required.

### Videos migration (P2)
- **Read path:** `getVideos()` and admin videos load used explicit `.select('id, title, ..., caption, is_vertical, ...')`. If migration 034 is not applied, those columns don’t exist and the query fails → app breaks.
- **Write path:** API POST sends `caption` and `is_vertical`; insert/update would fail with “column does not exist” if migration is missing.
- **Rendering:** VideoFeed already uses `current.caption &&`; no crash, but we hardened reads and writes so the app doesn’t break when columns are missing or null.

### Desktop polish (P3)
- No new issues identified. Shop, events, media, booking, and footer use consistent Section/Container/divider rhythm and existing spacing; no targeted visual changes made.

### Shop admin (P4)
- Phase AN already improved product cards, image states, modal, and badges. No further weak spots identified; no changes made.

---

## 2. Exact fixes made

### P1 — Event thumbnail
- **app/admin/events/page.tsx:** In `handleSubmit`, read `thumbnail_url` and `external_thumbnail_asset_id` from formData, trim both, and use trimmed values when building the payload (and fallback to `editingEvent` when empty). Ensures we never send whitespace and keeps client in sync with API.

### P2 — Videos migration / runtime safety
- **lib/content/server.ts — getVideos():**
  - Switched from `.select('id, title, youtube_id, thumbnail_url, caption, is_vertical, status')` to `.select('*')` so only existing columns are requested.
  - Mapped rows with `caption: (v.caption ...) ?? null` and `is_vertical: (v.is_vertical ...) ?? false` and an explicit return shape (id, title, youtube_id, thumbnail_url, caption, is_vertical, resolved_thumbnail_url) so missing columns or nulls don’t break the app.
- **app/admin/videos/page.tsx — load():**
  - Switched from `.select('id, title, youtube_id, thumbnail_url, caption, is_vertical, display_order, status')` to `.select('*')`.
  - On error, set videos to `[]`.
  - Normalize each row with `caption: (r.caption ...) ?? null`, `is_vertical: (r.is_vertical ...) ?? false`, and safe casts for other fields so missing or null columns don’t crash the admin.
- **app/api/admin/videos/route.ts:**
  - Added `isColumnMissingError(error)` (checks for code `42703` or message like “column … does not exist”).
  - Update path: run update with full `updates`; if `result.error && isColumnMissingError(result.error)`, delete `caption` and `is_vertical` from `updates` and retry update.
  - Insert path: build `insertPayload` with caption and is_vertical; run insert; if error and `isColumnMissingError`, delete those keys and retry insert. Ensures videos can still be created/updated when migration 034 is not applied.

---

## 3. Files changed

| File | Change |
|------|--------|
| `app/admin/events/page.tsx` | Trim `thumbnail_url` and `external_thumbnail_asset_id` from formData in handleSubmit before building payload. |
| `lib/content/server.ts` | getVideos: use `.select('*')`, map with caption/is_vertical fallbacks and explicit return shape. |
| `app/admin/videos/page.tsx` | load: use `.select('*')`, handle error, normalize each row with caption/is_vertical and safe casts. |
| `app/api/admin/videos/route.ts` | Add isColumnMissingError; on update/insert failure with column error, retry without caption and is_vertical. |

---

## 4. Remaining blockers

- **Event thumbnails:** If thumbnails still don’t appear in production, verify: (1) DB row has `thumbnail_url` and/or `external_thumbnail_asset_id` after save, (2) `external_media_assets` has valid `preview_url` and is readable (RLS) for the client used by the API.
- **Videos:** If migration 034 is not applied, caption and is_vertical are not stored; reads and writes still succeed with fallbacks. Apply migration 034 for full caption/vertical support.
- **display_order on videos:** getVideos still uses `.order('display_order', …)`. If the table has no `display_order` column in some env, that call could fail; not changed in this pass (only caption/is_vertical were in scope).

---

## 5. Exact local browser QA checklist

### P1 — Event thumbnail runtime proof
1. **Admin → Events → Edit an event.** Click “Choose from library”, pick an image, close picker. Save. Close modal.
2. Reopen the same event in edit. **Confirm:** Thumbnail still shows in the modal.
3. Open **public /events**. **Confirm:** That event’s card shows the same thumbnail.
4. Open **public /events/[slug]** for that event. **Confirm:** Hero (or detail area) shows the same thumbnail.
5. **Upload path:** Edit the same event, use “Upload” for thumbnail (new image), save. Repeat steps 2–4 and confirm thumbnail persists and appears in admin and on list + detail.
6. **Clear path:** Edit event, click “Remove” on thumbnail, save. Reopen edit and confirm “No thumbnail”; on public list/detail confirm no thumbnail or placeholder.

### P2 — Videos migration safety
1. **With migration 034 applied:** Admin → Videos: add/edit a video with caption and “Vertical” checked. Save. Public Media → Videos tab: confirm caption and 9:16 layout.
2. **Without migration 034 (if possible):** In a clone or env where migration 034 is not run, open public /media and switch to Videos. **Confirm:** Page loads, no crash; videos show with title and default thumbnail (caption/vertical ignored). Admin → Videos: list loads; adding a new video (title + YouTube ID only) succeeds; no crash.

### P3 — Desktop polish
- **/shop, /events, /media, /booking:** Check on a wide desktop: no obviously empty horizontal strip, cards/sections feel anchored, intro copy and section rhythm consistent. Footer: single centered rail, links and social aligned.
- No specific new behavior to verify; only that existing layout still looks correct.

### P4 — Shop admin
- **/admin/shop:** Product cards show image or “No image” + “Add in edit”; status/Featured/badge visible; Edit/Delete clear. Modal: readable, good spacing. No new changes to verify.

### General
- After any change, run through: home, shop list, shop detail, events list, event detail, media (Collections + Videos), booking, press kit, footer. Confirm no header overlap, no broken alignment, and no new console/network errors.
