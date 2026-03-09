# Phase 24 — Motion Discipline & Animation Consistency

## Scope

Unify timing, easing, and motion scale across the site so the experience feels calm and premium. No hero (Phase 35) work, no CornerNav changes, no new media providers, no layout or visual hierarchy redesign.

## What Was Standardized

### 1. Motion timing

| Context | Before | After |
|--------|--------|--------|
| Small interactions (buttons, hovers) | Mixed 200–300ms | 150–200ms (200ms standard) |
| Medium (cards, section reveals) | 400ms, 500ms, 600ms | 200–250ms |
| Page transition | 250ms | 250ms (unchanged) |
| Scroll reveal | 600ms | 300ms |
| Stagger child (entrance Y) | 30px | 8px |

- **lib/ui/motion.ts:** `durations` now: fast 0.15, standard 0.2, med 0.25, slow 0.3. `defaultTransition` uses 0.2s and single easing. `scrollRevealTransition` 0.6 → 0.3. `staggerChild` y 30 → 8.
- **EventCard:** entrance 0.4s → 0.2s, y 16 → 8; inner transitions 300ms → 200ms.
- **ShopPageClient:** card entrance y 24 → 8.
- **MediaPageClient:** gallery card entrance y 16 → 8.
- **Header:** all link/button transitions 200ms; mobile menu 0.3 → 0.25.
- **VideoSection, BookingHero, AboutHero, EventsSection, GlassPanel, BookingPresentationSections, MediaCarousel:** section/modals 0.5–0.6s → 0.25s with single easing.
- **Reveal:** section reveal 0.28 → 0.25.
- **AboutContent:** duration 0.5 → 0.25, y 24 → 8.
- **ListenNow:** 250ms → 200ms.

### 2. Easing curves

- **Single curve:** `cubic-bezier(0.4, 0, 0.2, 1)` used everywhere (Framer: `[0.4, 0, 0.2, 1]`).
- **lib/ui/motion.ts:** `easings.standard` and `easings.smooth` both set to `[0.4, 0, 0.2, 1]`; `defaultTransition` uses it.
- **PageTransition, Reveal, section components:** explicit `ease: [0.4, 0, 0.2, 1]` where applicable.
- **globals.css:** `--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)`; `.glow`, `.hero-cta-primary`, `.luxury-card` use `var(--ease-standard)` with motion tokens.

### 3. Motion scale discipline

- **Hover lift:** `translateY(-2px)` (Tailwind `-translate-y-0.5`) on EventCard, MediaPageClient gallery cards, MediaTile, Shop product cards. No larger lifts.
- **Active press:** `scale(0.98)` on buttons; cards use `scale(0.995)` (within limit).
- **Page/section entrance:** `translateY(8px)` (fadeUpSubtle, Reveal, AboutContent, EventCard, etc.). Entrance y reduced from 16/24/30 to 8 where applicable.
- **fadeUp, fadeDown, staggerChild:** y values set to 8/4 (no 16/30).

### 4. Redundant motion wrappers

- **Audit:** Modal components (ViewerModal, VideoModal) use outer + inner `motion.div` for backdrop vs content; kept as-is (different roles). No unnecessary nesting removed; no behavior changed.

### 5. Reduced motion compliance

- **PageTransition:** Already uses `useReducedMotion()`; switches to opacity-only and 0.01s duration when reduced. Unchanged.
- **Reveal:** Uses `reducedMotionVariants.fadeUpSafe` (opacity only). Unchanged.
- **globals.css:** `@media (prefers-reduced-motion: reduce)` forces `transition-duration` and `animation-duration` to 0.01ms. Unchanged.
- Hover transforms (e.g. -translate-y-0.5) are covered by the global media query and do not cause layout shift (transform-only).

### 6. Motion tokens (lightweight)

- **app/globals.css** (under `:root`):
  - `--motion-fast: 150ms`
  - `--motion-standard: 200ms`
  - `--motion-page: 250ms`
  - `--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)`
- Used in `.glow`, `.btn-primary-glow`, `.hero-cta-primary`, `.luxury-card`. No design-system rewrite.

## Files Changed

| File | Change |
|------|--------|
| `app/globals.css` | Motion tokens; .glow, .hero-cta-primary, .luxury-card use tokens + --ease-standard |
| `lib/ui/motion.ts` | durations (standard 0.2, med 0.25, slow 0.3); easings.standard = smooth; defaultTransition; scrollReveal 0.3; staggerChild y 8; fadeUp/fadeDown y 8/4 |
| `components/motion/PageTransition.tsx` | Use durations.med, easings.standard from motion |
| `components/motion/Reveal.tsx` | sectionReveal 0.25; fadeDown y -8/-4 |
| `components/events/EventCard.tsx` | entrance 0.2, y 8; inner duration-200 |
| `components/shop/ShopPageClient.tsx` | card entrance y 8 |
| `components/media/MediaPageClient.tsx` | gallery card entrance y 8 |
| `components/layout/Header.tsx` | transition-colors duration-200; mobile menu 0.25 + ease |
| `components/home/VideoSection.tsx` | 0.6 → 0.25 + ease; duration-200 on link |
| `components/home/EventsSection.tsx` | 0.6 → 0.25, delay 0.05; duration-200 on card |
| `components/booking/BookingHero.tsx` | 0.6 → 0.25 + ease |
| `components/booking/BookingPresentationSections.tsx` | 0.5 → 0.25 + ease |
| `components/about/AboutHero.tsx` | 0.6 → 0.25 + ease |
| `components/about/AboutContent.tsx` | 0.5 → 0.25, y 24 → 8, add ease |
| `components/ui/GlassPanel.tsx` | 0.6 → 0.25 + ease |
| `components/media/MediaCarousel.tsx` | 0.5 → 0.25 + ease |
| `components/authority/ListenNow.tsx` | duration-250 → duration-200 |
| `docs/PHASE24_MOTION_DISCIPLINE.md` | This file |

**Not changed:** Hero components (Phase 35), CornerNav, Uploadcare/media providers, layout structure.

## Motion timing summary

- **Small (buttons, hovers):** 150–200ms (--motion-fast / --motion-standard).
- **Medium (cards, section reveals):** 200–250ms (durations.standard / durations.med).
- **Page transition:** 250ms (durations.med).
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` everywhere.
- **Transform cap:** hover -2px, active 0.98, entrance 8px.

## Acceptance checklist

- [x] Motion durations standardized (150–250ms; nothing >300ms except globals reduced-motion)
- [x] Easing curves consistent (0.4, 0, 0.2, 1)
- [x] Hover lift consistent across cards (-translate-y-0.5)
- [x] Button active states consistent (scale 0.98)
- [x] Page transition timing aligned (250ms)
- [x] Redundant motion wrappers audited (none simplified; modals kept)
- [x] Reduced-motion respected (PageTransition, Reveal, globals)
- [x] Hero untouched (Phase 35)
- [x] CornerNav untouched
- [x] Uploadcare untouched
- [x] `npm run build` passes

## Next phase

**Phase 25 — Typography & Spacing Refinement.**
