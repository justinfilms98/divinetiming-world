# Phase 13 — Performance Optimization

## Goal
Improve loading speed, image handling, and motion performance without changing visual behavior. The site should look identical but load faster and feel smoother.

---

## 1) Files modified

| File | Change |
|------|--------|
| `components/hero/UnifiedHero.tsx` | **13.1/13.2** Hero media always loads with `priority={true}` (all height presets are above the fold). |
| `components/hero/HeroCarouselV2.tsx` | **13.2** Hero video slot: `preload="metadata"` so poster/first frame show quickly; first image slot already uses `priority={activeIndex === 0}`. |
| `components/ui/MediaAssetRenderer.tsx` | **13.1** Image: `decoding={priority ? 'sync' : 'async'}` and `fetchPriority={priority ? 'high' : undefined}` for non-hero images to keep main thread responsive. |

---

## 2) Performance improvements

### 13.1 Image optimization
- **Hero:** UnifiedHero passes `priority={true}` to MediaAssetRenderer for all presets (full, tall, standard, compact) so hero media loads with high priority. HeroCarouselV2 uses Next/Image with `priority={activeIndex === 0}` for the first slot; only the active slot is mounted, so subsequent slots load when they become active (implicitly lazy).
- **Event thumbnails, gallery, collection covers:** Already use Next/Image or MediaAssetRenderer with `loading="lazy"`, `sizes` (e.g. collection cards `(max-width: 640px) 100vw, ...`), and blur placeholders where applicable.
- **MediaAssetRenderer (img):** `decoding="async"` for non-priority images; `fetchPriority="high"` only when `priority` is true. Reduces main-thread work and lets the browser prioritize hero assets.

### 13.2 Hero media loading
- **First slot only priority:** Carousel mounts a single slot at a time; first visible slot (index 0) has `priority` on its Image; other slots load when they become active (no preload of off-screen slides).
- **Video poster:** Hero carousel video already uses `poster={currentSlot.resolved_poster_url ?? undefined}`.
- **Video preload:** `preload="metadata"` on hero carousel video so poster or first frame appears without loading the full file first.
- **Layout shift:** Hero uses fixed height/aspect (`heightClasses[heightPreset]`: min-h-screen, aspect-16/9, etc.) so the hero shell is stable before media loads.

### 13.3 Layout stability (CLS)
- **Hero:** Fixed min-height and aspect ratio on the hero container (full: min-h-screen; others: aspect-16/9 or aspect-3/1 with min-height). No content jumping when media loads.
- **Media grid:** Gallery grid tiles use `aspect-video`; collection cards use `aspect-[4/5]`; EventCard uses `aspect-[16/9] md:aspect-[4/3]`. All use `fill` inside a sized container.
- **Placeholders:** Blur placeholders (Next/Image) or MediaEmptyCard / EventCardPlaceholder where no image; aspect ratio is reserved so layout doesn’t shift.

### 13.4 Motion performance
- **Scroll:** Single scroll listener in HeroCarouselV2 for parallax (passive, rAF-throttled). CornerNav has a separate listener for scroll threshold; both are passive and lightweight.
- **Parallax:** Disabled on mobile (`max-width: 768px`) and when `prefers-reduced-motion` to avoid jank.
- **Animations:** Phase 8 motion uses transform (`translateY`) and opacity only for cross-dissolve and parallax. No box-shadow or filter in scroll-driven updates; overlay uses opacity. Framer Motion is used for transitions (opacity/transform).

### 13.5 Bundle safety
- **Single animation library:** Only `framer-motion` is used for UI motion; no GSAP, anime.js, or react-spring duplicate.
- **Heavy deps:** Stripe, Uploadcare, Tiptap, etc. are used in admin/shop flows and are code-split by route; not on the critical path for public hero/media/events.
- **Server/client:** No server-only code was added to client components in this phase.

---

## 3) Metrics / observations

- **Hero:** Priority loading and fixed dimensions give a stable first paint; video metadata preload and poster reduce perceived delay.
- **Images:** Lazy loading and `sizes` are in place for grids and cards; decoding async and fetchPriority keep hero fast without blocking.
- **CLS:** Aspect ratios and placeholders are applied on hero, event cards, collection cards, and gallery tiles.
- **Motion:** One parallax scroll listener, transform+opacity only, and mobile/reduced-motion guards keep motion cheap.

---

## 4) Acceptance checklist

- [x] Hero loads quickly without layout shift (priority + fixed aspect/min-height).
- [x] Images use optimized loading (priority for hero, lazy + sizes elsewhere; decoding/fetchPriority in MediaAssetRenderer).
- [x] Media grids maintain stable layout (aspect-ratio + fill; placeholders where needed).
- [x] Motion remains smooth and lightweight (one parallax listener, transform+opacity, disabled on mobile when appropriate).
- [x] No unnecessary bundle growth (single animation lib; heavy deps code-split).
- [x] Build passes.

---

**Phase 7–12 behavior unchanged.** Visual output is unchanged; only loading and performance behavior were tuned.
