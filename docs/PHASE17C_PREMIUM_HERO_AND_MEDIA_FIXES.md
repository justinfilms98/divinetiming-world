# Phase 17.C — Premium Hero Carousel, Media Collections Click, and No-Uploadcare Lock

## Summary

Phase 17.C stabilizes the hero video carousel with a premium A/B crossfade implementation, fixes media collection card clickability (overlay blocking), and enforces “no Uploadcare” in code and docs. Baseline is locked before Phase 18+.

---

## 17.C.1 — Premium Hero Carousel

### Problem

Single `<video>` node reuse in React can prevent reliable playback when switching sources; abrupt cuts look cheap.

### Solution

- **New component:** `components/hero/HeroVideoCarouselPremium.tsx`
- **A/B layers:** Two stacked `<video>` elements; one visible, one preloading next. Crossfade (800ms) between them.
- **Rotation:** Every 8s (stable timer; does not depend on `activeIndex` in effect deps).
- **Behavior:** 0 videos → render nothing; 1 video → single looping video, no timer; 2+ videos → rotate with crossfade.
- **Accessibility:** `prefers-reduced-motion` skips fade and just swaps.
- **Props:** `videos: { url: string; posterUrl?: string }[]`, `overlayOpacity`, `heightPreset`, `showScrollCue`, `children`.

### Home page wiring

- Homepage extracts **video-only** slots from `hero_slots`: `media_type === 'video'` and `resolved_video_url`.
- If `premiumVideos.length >= 1`, home uses `HeroVideoCarouselPremium` with that list; otherwise falls back to `HeroCarouselV2` (mixed image/video/embed) or legacy carousel/single media.

---

## 17.C.2 — Media Collections Click Fix

### Problem

Collection cards could be unclickable when a decorative overlay captured pointer events.

### Solution

- **Link:** Each collection card remains a `<Link href={/media/galleries/${gallery.slug}}>` wrapping the full card (already in place).
- **Cursor:** `cursor-pointer` when `hasMedia`; `pointer-events-none cursor-default opacity-60` when no media.
- **Overlays:** All decorative overlays (hover tint, play icon) use `pointer-events-none` so clicks reach the Link.
- **Route:** Verified `app/media/galleries/[slug]/page.tsx` exists.
- **Disabled state:** When `hasMedia` is false, card still renders with reduced opacity and does not break layout; `aria-disabled={!hasMedia}`.

---

## 17.C.3 — Hard “No Uploadcare” Enforcement

### Code / docs

- **Register API:** Only accepts `provider: 'supabase'`; always stores `provider: 'supabase'`. No Uploadcare code path.
- **Runtime guard:** In `POST /api/admin/media/register`, if `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY` is set in development, a console warning is logged and the var is ignored.
- **Docs updated:** SECURITY_CHECKLIST, ADMIN_FIXES_SUMMARY, STEP2_QA, DIVINETIMING_AUDIT, PHASE17_MEDIA_ADMIN — removed or reworded Uploadcare as legacy-only; no env var required for uploads.
- **Kept (legacy data only):** Resolver and displayUrl logic for existing `provider === 'uploadcare'` rows; admin “legacy” toggle; next.config `ucarecdn` for legacy images; sanitize/assert scripts allowing legacy CDN URLs. No UI or upload flow depends on Uploadcare.

### 410 endpoint

- `POST /api/assets/external` continues to return **410** with a message that Uploadcare is no longer used; no UI references this endpoint.

---

## Files changed

| File | Change |
|------|--------|
| `components/hero/HeroVideoCarouselPremium.tsx` | **New.** A/B video layers, 8s rotation, 800ms crossfade, preload next, reduced-motion support. |
| `app/page.tsx` | Extract video slots; use `HeroVideoCarouselPremium` when ≥1 video slot; else existing carousel chain. |
| `components/media/MediaPageClient.tsx` | `pointer-events-none` on overlay divs; `opacity-60` and `aria-disabled` when `!hasMedia`. |
| `app/api/admin/media/register/route.ts` | Dev-only warning if `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY` is set. |
| `docs/SECURITY_CHECKLIST.md` | Removed Uploadcare from public env list. |
| `ADMIN_FIXES_SUMMARY.md` | Replaced Uploadcare key with Supabase env. |
| `docs/STEP2_QA.md` | Upload note: Supabase, no upload key. |
| `docs/DIVINETIMING_AUDIT.md` | Media uploads: Supabase + UniversalUploader. |
| `docs/PHASE17_MEDIA_ADMIN.md` | Providers and upload flow updated to Supabase; legacy wording. |
| `docs/PHASE17C_PREMIUM_HERO_AND_MEDIA_FIXES.md` | This document. |

---

## QA checklist (must pass before Phase 18)

### Hero

- [ ] With 3 hero videos set, hero plays immediately, crossfades every ~8s, cycles 1 → 2 → 3 → 1.
- [ ] No console errors; no “stuck on slot 1”.
- [ ] With 1 video: single looping video, no rotation.
- [ ] With 2 videos: rotation and crossfade work.

### Media

- [ ] `/media` → Collections: pointer cursor on cards with media.
- [ ] Click opens `/media/galleries/[slug]`; no dead clicks from overlays.
- [ ] Cards without media show disabled state (opacity) and do not break layout.

### Uploadcare

- [ ] No Uploadcare env vars in local or Vercel.
- [ ] New uploads store `provider: 'supabase'`.
- [ ] `rg uploadcare` in source shows only legacy resolver/docs/410 message (no active upload path).

### Build

- [ ] `npm run build` passes.

---

## Completion

When all QA items pass, Phase 17.C is complete and the project is ready to proceed to Phase 18+.
