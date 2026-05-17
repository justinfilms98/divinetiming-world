# Phase 17.F — Ready-Gated Hero Crossfade (No Stutter)

**Objective:** Remove lag/stutter during hero transitions by **gating the fade/swap** on the next video being ready (`canplay` / `readyState`) and “warming” it so decode isn’t delayed.

## Root cause

- Hidden video (opacity 0) often isn’t decoded/buffered; browsers throttle off-screen media.
- Swap was happening before the next clip could render a frame → visible stutter (especially “slot 2”).

## Approach

1. **Preload + warm the next clip** — seek to ~0.05s, play, pause to force the decode pipeline to start.
2. **Only fade/swap once the next clip reports it can render** — wait for `canplay` / `readyState >= 3`, with a **deadline fallback** (e.g. 1500ms) so we never hang.
3. **Single fade state** — one `isFading` flag and one swap timeout to avoid timer drift and overlapping transitions.

## Changes (HeroVideoCarouselPremium.tsx)

### A) Refs + state

- **isFading** — true while the crossfade is in progress; blocks starting another transition.
- **isFadingRef** — mirror so `goToNext` can skip if a transition is already running.
- **pendingSwapRef** — `{ nextIndex }` while a swap is pending (for debugging).
- **canplayRef** — `{ a: boolean; b: boolean }` so dev overlay can show whether A/B have fired `canplay`.
- **swapTimeoutRef** — timeout that commits the swap after `FADE_MS`; cleared on unmount.

### B) Helpers

- **warmVideo(el)** — If `el.readyState >= 3` return. Else set `currentTime` to ~0.05 (or duration − 0.05), then `play().then(() => pause()).catch()`. Forces decode to start.
- **waitForReady(el, timeoutMs = 1200)** — If `readyState >= 3` resolve `true`. Else listen for `canplay` and `playing`, resolve `true`; also `setTimeout(timeoutMs)` resolve `false`. Clean up listeners and timeout; guard so the promise settles only once.

### C) goToNext (async, ready-gated)

1. If `total <= 1` or `isFadingRef.current` return.
2. Compute `nextIndex`, get `backEl` (frontIsA ? videoBRef : videoARef). If no `backEl`, schedule next and return.
3. Set `pendingSwapRef = { nextIndex }`, reset `canplayRef`.
4. **Reduced motion:** warm + wait (best-effort), then instant swap (setFrontIndex, setFrontIsA), clear pending, schedule next, return.
5. **Normal:** `await warmVideo(backEl)`, `await waitForReady(backEl, 1500)`.
6. `setIsFading(true)`.
7. `swapTimeoutRef = setTimeout(FADE_MS)` → setFrontIndex(nextIndex), setFrontIsA(flip), setIsFading(false), clear pending and swapTimeoutRef, `scheduleNextRef.current(next)`.

Scheduler still uses a single `setTimeout` chain; it only calls `goToNext()`. No new transition starts while `isFading` is true.

### D) Video attributes

On both `<video>`: `preload="auto"`, `playsInline`, `muted`, `autoPlay`, `controls={false}`, `disablePictureInPicture`, `controlsList="nodownload noplaybackrate"`, `crossOrigin="anonymous"`. Keeps buffering predictable and avoids extra UI.

### E) Opacity / transition

- Front layer: `opacity: isFading ? 0 : 1`, back: `opacity: isFading ? 1 : 0`.
- Transition: only when `!reducedMotion` — `transition: opacity ${FADE_MS}ms ease-out`. When reduced motion, no transition (instant swap).

### F) Dev overlay

- **ready A / ready B** — `videoARef.current?.readyState` and `videoBRef.current?.readyState` (3 = HAVE_FUTURE_DATA, 4 = HAVE_ENOUGH_DATA).
- **canplay A/B** — from `canplayRef.current.a` and `.b` (reset at start of each transition).

## QA checklist (must pass to exit Phase 17)

- [ ] Watch 10+ transitions: no hitch, no “slot 2 freeze”.
- [ ] Dev overlay: back layer `readyState` is usually >= 3 before swap.
- [ ] Network tab: videos are prefetched; no big download spike exactly at swap moment.
- [ ] `npm run build` passes.

When all items pass, Phase 17.F (ready-gated crossfade) is complete. Proceed to **Phase 18** (Performance + Media Reliability).
