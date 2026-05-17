# Handoff: Continue Divine Timing Phases 18–34

**For:** ChatGPT (or next AI assistant)  
**Purpose:** Finish hero cycling polish, then continue from Phase 18 through Phase 34.  
**Date:** March 2026

---

## Project snapshot

- **Stack:** Next.js (App Router), Supabase (DB + Storage), Tailwind CSS.
- **Repo:** Divine Timing — luxury artist site (Home, Events, Media, Booking, Admin).
- **Phases completed through this handoff:** 0–17, including 17.A (admin UX), 17.B (regressions, no Uploadcare), 17.C (premium hero + media fixes), 17.D (hero rotation + media stability), plus hero transition polish below.

---

## Hero carousel (Phase 17) — final state

- **Component:** `components/hero/HeroVideoCarouselPremium.tsx`
  - **Rotation:** Every 8s (`ROTATION_MS = 8000`), 3 slots cycle 1→2→3→1.
  - **Transitions:** 1.2s crossfade (`CROSSFADE_MS = 1200`) with easing `cubic-bezier(0.4, 0, 0.2, 1)`. Brief pre-fade delay (`PRE_FADE_MS = 120`) so the incoming video can buffer and reduce stutter. `will-change: opacity` during fade to reduce paint jank.
  - **Reduced motion:** Interval still runs; transition is an instant swap (no crossfade) when `prefers-reduced-motion: reduce`.
- **Wiring:** `app/page.tsx` — `videoSlots` from `validSlots` (video type + `resolved_video_url`); `premiumVideos` mapped to `{ url, posterUrl }`. If `premiumVideos.length >= 1` → `HeroVideoCarouselPremium`, else `HeroCarouselV2` or legacy.
- **Slot resolution:** `lib/content/server.ts` — `resolveHeroSlots(raw)` supports array or object (`slot_1`/`slot_2`/`slot_3`); video via `resolveHeroSlotVideoUrl(s.video_storage_path)` with fallback to `video_url`.
- **Dev:** Optional `devLogLabel` (e.g. `"Phase 17.D"`) shows overlay and logs; server logs `[Phase 17.D]` hero_slot_1/2/3 and premiumVideos length in terminal.

---

## Key paths (for Phase 18+)

| Area | Paths |
|------|--------|
| Hero carousel | `components/hero/HeroVideoCarouselPremium.tsx`, `app/page.tsx` |
| Hero slot resolution | `lib/content/server.ts` — `resolveHeroSlots`, `resolveHeroSlotVideoUrl` |
| Media / uploads | `lib/supabaseStorage.ts`, `app/api/admin/media/register/route.ts` (accepts `provider: 'supabase'`) |
| Media collections | `components/media/MediaPageClient.tsx` — galleries clickable, empty state on gallery page |
| Phase docs | `docs/PHASE17A_ADMIN_UX_POLISH.md` through `docs/PHASE17D_HERO_ROTATION_AND_MEDIA_STABILITY.md` |
| Summaries / checkpoints | `docs/PHASE_SUMMARIES.md`, `docs/PHASE_30_CHECKPOINT.md` |

---

## What to do next

1. **Confirm hero behavior (optional)**  
   Run `npm run dev`, open home, confirm hero cycles every ~8s with a smooth 1.2s crossfade and no stutter. If “Reduce motion” is on (OS/browser), rotation should still advance with an instant swap.

2. **Continue from Phase 18**  
   - Phase 18 was previously framed as **Performance + Media Optimization** (e.g. responsive images, WebP/AVIF, video lazy load, hero preload, caching/CDN). Use `docs/PHASE13_PERFORMANCE_OPTIMIZATION.md` and `docs/PHASE14_PRODUCTION_READINESS_SECURITY.md` as references; define or extend Phase 18–34 from existing phase list and product goals.
   - Follow existing patterns: phase docs in `docs/`, migrations in `supabase/migrations/`, no Uploadcare (Supabase-only uploads).

3. **If dev server fails**  
   Port in use → kill process on 3000 (e.g. PowerShell `Get-NetTCPConnection -LocalPort 3000` then `Stop-Process` on OwningProcess). Remove `.next/dev/lock` if “Unable to acquire lock” appears. Use the port shown in terminal (e.g. 3001 if 3000 is taken).

---

## Checklist before starting Phase 18

- [ ] `npm run build` passes  
- [ ] Home hero cycles with smooth crossfade (and instant swap when reduced motion)  
- [ ] Admin hero editor: 3 slots, save, purge legacy; media picker and collections work  
- [ ] No Uploadcare dependency; new uploads use Supabase only  

When these pass, proceed to Phase 18 and then 19–34 using the same doc-and-implement approach as earlier phases.
