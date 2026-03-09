# Phase 30 — Motion Restraint Pass

## Scope

Ensure motion across the site is restrained, calm, and intentional. Remove unnecessary motion; keep only meaningful animations. No layout or structure changes. Hero (Phase 35), CornerNav, Uploadcare unchanged.

## Files changed

| File | Change |
|------|--------|
| `lib/ui/motion.ts` | scrollRevealTransition duration 0.3 → 0.25; scrollRevealStagger 0.08 → 0.06. |
| `components/ui/GlassPanel.tsx` | Entrance y 20 → 8; added useReducedMotion (opacity-only, duration 0.01 when reduced). |
| `components/media/VideoPlayerModal.tsx` | Backdrop transition 0.2 + ease; inner content y 12 → 8, explicit ease. |
| `components/shop/CartSlideOut.tsx` | Spring → tween (duration 0.2, ease); useReducedMotion (duration 0.01 for slide/backdrop when reduced). |
| `components/ui/LuxuryButton.tsx` | Added transform to transition and active:scale-[0.98]. |
| `components/shop/ShopPageClient.tsx` | staggerChildren 0.1 → 0.06; ProductCard transition 0.2 + ease. |
| `components/media/MediaPageClient.tsx` | Gallery grid delayChildren 0; child transition 0.2 + ease. |
| `docs/PHASE30_MOTION_RESTRAINT_PASS.md` | This file. |

## Motion reductions and discipline

### 1. Page transition restraint

- **PageTransition** (unchanged): Already duration 0.25 (durations.med), fadeUpSubtle (opacity + y: 8). Reduced motion → opacity only, duration 0.01. No nested page animations modified.

### 2. Card hover restraint

- **EventCard:** hover -translate-y-0.5 (2px), shadow shift, active scale 0.995. No scale > 1.01, no rotation/bounce. Left as-is.
- **Media cards / Gallery tiles / Shop product cards:** hover -translate-y-0.5 or equivalent, shadow/brightness only. No changes to hover values; only entrance/stagger tightened.

### 3. Button interaction restraint

- **LuxuryButton:** transition extended to include transform; added active:scale-[0.98]. Duration remains 200ms. No bounce or long animations.

### 4. Scroll reveal discipline

- **Reveal:** Already 0.25s, y ≤ 8, opacity; reduced motion uses fadeUpSafe (opacity only). Unchanged.
- **GlassPanel:** initial y 20 → 8; duration 0.25. Reduced motion: opacity only, duration 0.01.
- **MediaPageClient (galleries):** stagger 0.06, delayChildren 0; child transition 0.2 + ease. Child y: 8, opacity.
- **ShopPageClient:** stagger 0.1 → 0.06; ProductCard transition 0.2 + ease. Child y: 8, opacity.
- **motion.ts:** scrollRevealTransition 0.3 → 0.25; scrollRevealStagger 0.08 → 0.06.

### 5. Loading animation calmness

- **LuxurySkeleton:** Already subtle (shimmer-free, animate-pulse). No change.

### 6. Modal / overlay behavior

- **ViewerModal:** Backdrop and content opacity only, 0.25 / 0.22. No scale or bounce. Unchanged.
- **VideoPlayerModal:** Backdrop transition 0.2 + ease; inner content y 12 → 8, transition 0.2 + ease. No spring/bounce.
- **CartSlideOut:** Spring (damping 25, stiffness 200) replaced with tween duration 0.2, ease [0.4, 0, 0.2, 1]. Minimal motion.

### 7. Reduced motion respect

- **Existing:** PageTransition, Reveal use useReducedMotion; globals.css @media (prefers-reduced-motion) shortens CSS animations/transitions.
- **Added:** GlassPanel uses useReducedMotion (opacity-only, 0.01s when reduced). CartSlideOut uses useReducedMotion (backdrop and slide 0.01s when reduced). Opacity-only or near-instant behavior when reduced.

## Acceptance checklist

- [x] Page transitions calm (≈250ms, opacity + small translateY; reduced → opacity only).
- [x] Card hover motion restrained (translateY -2px, shadow, no scale > 1.01).
- [x] Button interactions minimal (active scale 0.98, duration ≤200ms).
- [x] Reveal animations subtle (y ≤ 8, duration ≤250ms, stagger 0.06).
- [x] Loading animations smooth (LuxurySkeleton unchanged).
- [x] Modal transitions minimal (tween only; VideoPlayerModal y 8; CartSlideOut no spring).
- [x] Reduced-motion respected (GlassPanel, CartSlideOut; existing PageTransition, Reveal, globals).
- [x] Hero untouched (Phase 35).
- [x] CornerNav untouched.
- [x] Uploadcare untouched.
- [x] `npm run build` passes.

## Next phase

**Phase 31 — Color Discipline Pass.**
