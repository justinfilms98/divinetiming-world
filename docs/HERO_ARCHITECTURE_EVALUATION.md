# Hero Architecture Evaluation

## Current implementation

- **Home:** HeroVideoCarouselPremium (video slots) → HeroCarouselV2 (image/embed slots) → HeroCarousel (legacy slides) → UnifiedHero (single media or empty). Multiple code paths; video carousel uses A/B swap with fade, rotation timer (default 8s), and canplay/error handling.
- **Other pages:** UnifiedHero only (single media + overlay + headline/subtext). Uses MediaAssetRenderer with HeroEclipseFallback on error.

## Audit: video loading, timing, errors, fallback

| Area | Finding |
|------|---------|
| **Video loading** | HeroVideoCarouselPremium warms and waits for `canplay`/`playing` with timeout (1200ms); preloads next video. Possible stutter if next video not ready in time. |
| **Carousel timing** | DEFAULT_ROTATION_MS = 8000; MIN = 4000. Single timer drives rotation; fade duration 800ms. Logic is clear. |
| **Error handling** | Video elements have `onError`; `waitForReady` resolves false on error. Front index can advance on error; fallback surface (HeroEclipseFallback) used in UnifiedHero/MediaAssetRenderer, not in premium carousel. |
| **Fallback logic** | If no premium videos, falls back to V2 carousel → legacy carousel → single media → UnifiedHero. Many branches; failure in one can leave blank or wrong variant. |

## Recommendation

**B) Simplify to single hero surface** — with a clear path to re-add rotation later if needed.

### Reasoning

1. **Reliability:** Fewer code paths (carousel vs V2 vs legacy vs unified) reduce race conditions and “wrong hero” states. One component (e.g. UnifiedHero extended) with one rule (“show this video or this image, or eclipse fallback”) is easier to reason about and debug.
2. **Brand:** A single, strong hero is often better for a label-grade site than a rotating carousel that can feel busy or break on slow networks.
3. **Performance:** One video or one image loads; no preloading of multiple videos. Faster LCP and less battery use on mobile.
4. **Maintainability:** One hero component with optional “rotation” (e.g. switch source every N seconds) is easier to tune and fix than multiple carousel implementations.

### Suggested approach

- **Phase 1:** Keep current behavior but add a single “hero mode” flag or env (e.g. `NEXT_PUBLIC_HERO_SIMPLE=true`). When set, home uses UnifiedHero with the first available video or image from hero_slots (or legacy hero_sections media), and no carousel.
- **Phase 2:** If stable, make single-surface the default; remove or gate the premium carousel behind a feature flag.
- **Phase 3:** If rotation is required, add timed source switching inside UnifiedHero (e.g. cycle through 1–3 URLs every 8s) instead of a separate carousel component.

### If keeping the carousel (A)

- Add explicit error UI in HeroVideoCarouselPremium (e.g. show HeroEclipseFallback for the current slot on video error and skip to next or stop).
- Ensure “no videos ready” shows a single fallback surface instead of a blank or wrong layout.
- Document the decision and the fallback order in code (e.g. in `app/page.tsx` and HeroVideoCarouselPremium).

---

**Conclusion:** Recommend **B) Simplify to single hero surface** for reliability, brand clarity, and performance; reintroduce rotation inside that surface if needed.
