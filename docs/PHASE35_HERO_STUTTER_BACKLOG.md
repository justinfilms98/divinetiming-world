# Phase 35 — Hero transition stutter (backlog)

**Status:** Deferred. Hero cycles and ready-gated crossfade are in place; stutter when slot 2 (or next clip) appears may still occur in some environments. To be fixed later.

## Symptom

- Strong stutter or hitch **right when slot 2 plays** (or when any “next” clip becomes visible).
- Can feel like a freeze or decode spike at the moment of swap.

## What’s already in place

- **Phase 17.E** — Single `setTimeout` chain (no `setInterval`), no double advance.
- **Phase 17.F (duration-aware)** — Rotation uses per-clip duration; `loop={false}` on both layers; keys by URL.
- **Phase 17.F (ready-gated)** — `warmVideo()` + `waitForReady()` before fade; crossfade only when back video is ready (or after 1500 ms fallback); `isFading` blocks overlapping transitions; dev overlay shows `readyState` and `canplay` for A/B.
- Scheduler and effect dependencies were stabilized (refs for `videos`, effect depends only on `total`) to avoid timer reset on re-renders.

## Likely remaining causes (for when you pick this up)

1. **Decode throttling** — Browser still throttles decode for hidden/off-screen video despite warm + `waitForReady`; may need different strategy (e.g. single video element with `src` swap after preload, or ensure back video is in a “visible” layer for compositing).
2. **Network / file size** — Slot 2 (or later) might not be fully buffered in time; consider preloading next clip earlier or using smaller/optimized encodes.
3. **GPU/compositing** — Two video layers with opacity flip might cause a composite hitch; try `will-change: opacity` only during fade or experiment with a single `<video>` and swap `src` + wait for `canplay` before showing.
4. **Environment-specific** — May only reproduce on certain devices, browsers, or connection speeds; note those when debugging.

## Files

- `components/hero/HeroVideoCarouselPremium.tsx` — All hero rotation, warm, wait, fade, and scheduler logic.
- `docs/PHASE17F_HERO_READY_GATED_CROSSFADE.md` — Ready-gated design and QA.
- `docs/PHASE17F_HERO_DURATION_AWARE_ROTATION.md` — Duration-aware timing.

## Exit criteria (when you fix it)

- [ ] 10+ transitions with no visible stutter when slot 2 (and any next slot) appears.
- [ ] Dev overlay shows back layer `readyState >= 3` before swap when possible.
- [ ] No large network spike at swap moment (or next clip is clearly preloaded).

---

*Created so the issue is tracked; proceed with Phase 18–34 and return to this when ready.*
