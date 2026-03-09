# Phase 17.D — Hero Carousel Rotation + Public Media Stability

## Summary

Phase 17.D fixes hero carousel rotation (so 3 video slots cycle 1→2→3→1), adds dev logging and a dev-only debug overlay to verify slot resolution and rotation, hardens the premium carousel (index guard, stable timer), and stabilizes the public `/media` collections list so galleries are always clickable (including 0-asset galleries) with a clear empty state on the gallery page.

---

## A) Hero: Debug and fix rotation

### A1) Dev logging (server)

On the home page code path, in development only:

- Log `hero_slots` raw (from DB).
- Log `validSlots` length and `premiumVideos` length.
- Log `premiumVideos` URLs (last 60 chars).

**Location:** `app/page.tsx` — runs on server; check terminal (not browser console) for `[Phase 17.D]` lines.

If `premiumVideos.length` is 1, the issue is slot resolution or only slot 1 having a valid video; use the raw log to confirm what’s stored.

### A2) Slot resolution (all slots)

- **Resolver** (`lib/content/server.ts` — `resolveHeroSlots`):
  - Support `hero_slots` as **object** (e.g. `{ 0: slot0, 1: slot1, 2: slot2 }` or `slot_1`/`slot_2`/`slot_3`) by normalizing to an array before processing.
  - For **video** slots: resolve from `video_storage_path`; fallback to `video_url` (direct URL) when path resolution is null so slot2/slot3 are not dropped when stored differently.
- Ensures all 3 slots can contribute when 3 videos are configured.

### A3) Carousel hardening

- **Index guard:** If `frontIndex >= videos.length`, reset to 0 in a `useEffect` so we never show an invalid index.
- **Timer:** Effect depends only on `total` (videos.length), `reducedMotion`, and `goToNext`; interval stored in `useRef` and cleared on unmount.
- No dependency on full `videos` array identity so the timer is not recreated every render.

### A4) Dev-only overlay

- When `devLogLabel` is set (e.g. `"Phase 17.D"`) and `NODE_ENV === 'development'`, a small overlay shows:
  - `videos.length`
  - `activeIndex` (frontIndex)
  - Current URL filename (truncated).
- Confirms rotation in the UI without opening devtools.

### A5) Verification

1. Start dev server, go to `/`.
2. In **terminal** (server logs): check `[Phase 17.D] hero_slot_1`, `hero_slot_2`, `hero_slot_3` — each should show `video_storage_path` if that slot has a video. If only `hero_slot_1` has a path and slot_2/slot_3 are `null`, the carousel will only have 1 video; upload videos to Slot 2 and Slot 3 in Admin → Hero and save.
3. Confirm `[Phase 17.D] premiumVideos length: 3` (or 2) so the carousel receives multiple slots.
4. On **page**: confirm overlay shows `videos: 3` and `active` advancing every ~8s (1→2→3→1).
5. No console errors.

---

## B) Public media: Collections render and clickable

### B1) Collections from galleries

- Collections list comes from **galleries** table via `getGalleriesForHub()` (unchanged).
- Galleries with **0 items** are still shown and are **clickable**.

### B2) Clickability

- Each collection card is a **`<Link href={/media/galleries/${gallery.slug}}>`** wrapping the full card.
- **All** galleries with a slug are clickable (`cursor-pointer`); no `pointer-events-none` based on asset count.
- Decorative overlays keep **`pointer-events-none`** so clicks reach the Link.

### B3) Gallery route and empty state

- Clicking a collection goes to **`/media/galleries/[slug]`**.
- If the gallery has no assets, **GalleryDetailClient** shows: “No media in this collection yet.”
- No 404; empty state is intentional.

---

## C) Uploadcare

- No new uploads use `provider='uploadcare'`; register API accepts only `supabase`.
- Legacy rows may still have `provider='uploadcare'`; they remain behind the admin toggle and the public resolver still resolves them. No mass delete or schema change in this phase.

---

## Files changed

| File | Change |
|------|--------|
| `app/page.tsx` | Dev logging (hero_slots raw, validSlots length, premiumVideos length/URLs). Pass `devLogLabel="Phase 17.D"` to premium carousel. |
| `lib/content/server.ts` | `resolveHeroSlots`: support raw as object (normalize to array); video fallback to `video_url` when path resolution is null. |
| `components/hero/HeroVideoCarouselPremium.tsx` | Index guard (frontIndex >= total → 0); optional `devLogLabel`; dev-only overlay (videos.length, activeIndex, current URL filename). |
| `components/media/MediaPageClient.tsx` | Collections: always use `href=/media/galleries/${gallery.slug}` when slug exists; always `cursor-pointer`; remove hasMedia-based disable. |
| `docs/PHASE17D_HERO_ROTATION_AND_MEDIA_STABILITY.md` | This document. |

---

## Manual QA checklist

- [ ] Home hero with 3 video slots rotates 1→2→3→1 automatically (~8s).
- [ ] Terminal shows `[Phase 17.D] premiumVideos length: 3` (or 2) when 3 (or 2) slots are configured.
- [ ] Dev overlay shows `videos: 3` and `active` changing; no console errors.
- [ ] `/media` shows collections; every collection card is clickable (pointer cursor).
- [ ] Clicking a collection opens `/media/galleries/[slug]`.
- [ ] Gallery with 0 assets shows “No media in this collection yet.”
- [ ] No Uploadcare env required; no Uploadcare upload path.
- [ ] `npm run build` passes.

---

## Completion

When all checklist items pass, Phase 17.D is complete. Do not advance to Phase 18 until hero rotation is confirmed.
