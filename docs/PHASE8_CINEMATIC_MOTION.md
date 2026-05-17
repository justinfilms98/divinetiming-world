# Phase 8 — Cinematic Motion & Scroll Atmosphere

## Goal
Add subtle environmental motion so the site feels **alive and immersive** while staying minimal. No layout redesign.

---

## 1) Files modified

| File | Change |
|------|--------|
| `components/hero/HeroCarouselV2.tsx` | **8.1** Slide interval 7s; cross-dissolve 1000ms (opacity only, no slide); activeIndex set immediately on transition; **8.2** Micro parallax: media layer translateY(0→40px) over 100vh scroll, rAF scroll listener, disabled for reduced-motion and mobile; **8.4** Scroll atmosphere: overlay deepens by +0.1 opacity over 100vh scroll. |
| `components/motion/Reveal.tsx` | **8.3** Section reveal: fadeUpSubtle (opacity 0→1, y 8→0), duration 280ms, viewport-triggered once. |

---

## 2) Motion improvements

### 8.1 Hero carousel cinematic timing
- **Slide duration:** 7s per slot (within 6–8s target).
- **Transition:** Fade cross-dissolve only; no slide or zoom. Outgoing slide exits with opacity 0, incoming enters from opacity 0 to 1 over **1000ms** (ease [0.4, 0, 0.2, 1]).
- Index advances at the start of the transition (with flare); no 350ms delay. Film flare (900ms) runs in parallel with the crossfade.

### 8.2 Micro parallax
- **Effect:** Hero background media (video/image) moves slightly slower than scroll: **translateY(0 → 40px)** over the first viewport of scroll (100vh).
- **Implementation:** Single scroll listener with `requestAnimationFrame`; transform applied to the media wrapper only. Disabled when `prefers-reduced-motion` or viewport `max-width: 768px` to avoid jitter and protect mobile performance.

### 8.3 Section reveal
- **Reveal component:** Uses `fadeUpSubtle` (opacity 0→1, translateY 8px→0) with **280ms** duration. Triggered when the element enters the viewport; **once** only (no re-animate on scroll back).
- Existing `Reveal` usage (Events, Booking, EPK, etc.) now gets this shorter, subtler reveal.

### 8.4 Scroll atmosphere
- **Effect:** As the user scrolls away from the hero, the hero overlay opacity increases slightly (e.g. base + up to **0.1** over 100vh scroll) so readability and depth hold as the hero leaves the viewport.
- Implemented in HeroCarouselV2 via `scrollProgress = min(1, scrollY / vh)` and `overlayDeepen = scrollProgress * 0.1`; applied to the gradient and radial overlay. Disabled when `prefers-reduced-motion`.

### 8.5 Performance
- No new animation libraries; Framer Motion (existing) and CSS.
- Parallax and scroll overlay use one passive scroll listener and rAF.
- Reduced-motion respected for parallax, overlay deepen, and section reveal (Reveal already used reducedMotionVariants).
- Parallax off on mobile (≤768px) to avoid performance issues.

---

## 3) Acceptance checklist

- [x] Hero transitions feel cinematic (7s per slot, 1s cross-dissolve, no slide).
- [x] Parallax adds depth and is subtle (0→40px over 100vh); off on mobile and when reduced-motion.
- [x] Section reveals are smooth and premium (280ms, opacity + y:8, once).
- [x] Motion respects reduced-motion (parallax, overlay deepen, Reveal fallback).
- [x] Performance: rAF, passive scroll, no extra heavy libs; parallax disabled on mobile.
- [x] Build passes.
