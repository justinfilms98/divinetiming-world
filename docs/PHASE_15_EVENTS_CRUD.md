# Phase 15 — Events Admin Full CRUD + Thumbnail Reliability

## Files changed

| File | Change |
|------|--------|
| `app/api/admin/events/route.ts` | GET list added; auth via `requireAdmin`; all responses use `apiSuccess`/`apiError`; slug collision check on create/update; no raw error leaks |
| `app/admin/events/page.tsx` | Load events from GET `/api/admin/events`; parse `{ ok, data, error }` for all API calls; use `resolved_thumbnail_url` for list and edit preview; removed direct Supabase client |
| `app/events/[slug]/page.tsx` | Event detail always renders cover block: image when `resolved_thumbnail_url`/`thumbnail_url` present, else premium placeholder (date label) |

## What changed

- **Admin Events API**
  - **GET** `/api/admin/events`: returns events with `resolved_thumbnail_url` (via `withResolvedThumbnails`). Admin auth required. Response: `{ ok: true, data: Event[] }`.
  - **POST**: create/update unchanged behavior; responses use `apiSuccess({ event })`; slug normalized (kebab-case, lower); collision check returns 409 if slug taken.
  - **PATCH**: swap reorder; response `apiSuccess({})`.
  - **DELETE**: response `apiSuccess({})`. All errors via `apiError(message, status)`.
- **Admin Events UI**
  - List loaded from API (not direct Supabase). Edit/Create modal unchanged; thumbnail picker (library + upload + clear) and preview work as before. Edit opens with `resolved_thumbnail_url ?? thumbnail_url` for preview. List cards show resolved thumbnail or placeholder.
- **Public Events**
  - List: `getEvents()` already attaches `resolved_thumbnail_url`; `EventCard` uses it and `EventCardPlaceholder` when missing (no broken image).
  - Detail: hero uses `resolved_thumbnail_url ?? thumbnail_url`; content block always shows either cover image or a premium placeholder (month/year style).

## Acceptance checklist (browser-verified)

- [x] Admin: create event → list shows it → edit works → delete works
- [x] Admin: set thumbnail (choose from library) — picker opens; *image-everywhere* not run (media library empty in test env)
- [x] Admin: changing slug updates link behavior (old slug → 404, new slug works)
- [x] Public: events list has no broken images; placeholders used (event without thumbnail shows date-style placeholder on card and detail)
- [x] Build passes
