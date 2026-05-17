# Phase 35 — Hero Stutter Audit

## Goal

Determine whether the hero carousel still stutters and, if so, identify the exact cause with evidence. This is a **verification-only** phase unless a clear, isolated fix is found.

---

## Files touched

| File | Change |
|------|--------|
| `components/hero/HeroVideoCarouselPremium.tsx` | Dev-only: extended overlay (Phase 35 audit), `[PHASE35_AUDIT]` console timing logs at scheduler_tick, next_video_ready_before_fade, fade_start, active_index_commit, fade_end, canplay, playing, ended. Per-video inspection in overlay (readyState, networkState, paused, currentTime, duration). |
| `docs/PHASE35_HERO_STUTTER_AUDIT.md` | This file. |

All audit code is **dev-only** (`process.env.NODE_ENV === 'development'`); production build is unchanged.

---

## How to run the audit

1. **Start dev server:** `npm run dev`
2. **Open Home** with at least **3 hero video slots** configured (Admin → Hero → upload/set 3 slots).
3. **Open DevTools → Console.** Filter or search for `[PHASE35_AUDIT]`.
4. **Dev overlay:** Top-left green overlay shows (when `devLogLabel` is set, e.g. from home):
   - active index, next index, tick count
   - current video URL filename
   - fade active (ON / —)
   - For A and B: readyState, canplay flag, currentTime, paused
   - duration, networkState
5. **Watch ≥10 transitions** (e.g. 1→2, 2→3, 3→1, repeat). Note any visible stutter and the **exact transition** (slot X→Y).

---

## Console events (prefix `[PHASE35_AUDIT]`)

| Event | When |
|-------|------|
| `scheduler_tick` | Rotation timer fires; `goToNext()` entered. Includes frontIndex, nextIndex, ts. |
| `next_video_ready_before_fade` | After `waitForReady(backEl)`. ready, backReadyState, ts. |
| `fade_start` | Just before opacity transition. frontIndex, nextIndex, ts. |
| `active_index_commit` | Inside swap timeout; index is about to change. newIndex, ts. |
| `fade_end` | After setIsFading(false). activeIndex, ts. |
| `canplay` | Fired by either video. index, readyState, networkState, paused, currentTime, duration, ts. |
| `playing` | Fired by either video. index, ts. |
| `ended` | Fired by either video when it reaches end. index, frontIndex (at event time), ts. |

**What to watch for:**

- **Next video not ready before fade:** `next_video_ready_before_fade` has `ready: false` or `backReadyState < 3`.
- **Current video ends before fade:** `ended` for the **current** index (index === frontIndex) with ts **before** `fade_start` for that transition.
- **Double timer:** Two `scheduler_tick` in quick succession without a full fade cycle.
- **Fade overlap with ended/loop:** `ended` and `fade_start` / `fade_end` very close in time.
- **Remount:** canplay/playing for the same index firing again after a swap (possible key/remount issue).

---

## Browser test matrix (to be filled when run)

Test with **3 video slots**. For each browser, watch ≥10 transitions and note whether stutter occurs and on which transition(s).

| Browser | 1→2 | 2→3 | 3→1 | Stutter? | Notes |
|---------|-----|-----|-----|----------|--------|
| Chrome desktop | | | | | |
| Safari desktop | | | | | |
| Mobile Safari | | | | | |

**Environment tested:** _(e.g. OS, Node version, local vs deployed)_  
**Date:** __

---

## Audit findings (fill after run)

### 1. Does the hero still stutter?

- [ ] Yes  
- [ ] No  
- [ ] Only in specific browser(s): ___

### 2. Exactly when?

_(e.g. “On 2→3 transition only, after ~3 rotations”, “Every time when next video is long”.)_

---

### 3. Evidence

_(Paste or describe console log excerpts: e.g. `next_video_ready_before_fade` with ready:false, or `ended` ts before `fade_start`, or gap between fade_end and next scheduler_tick.)_

---

### 4. Suspected cause

_(One or more, with brief reasoning.)_

- [ ] Decode delay (next video not decoded in time)
- [ ] Network buffering (next video not loaded in time)
- [ ] Hidden video autoplay throttling (browser policy)
- [ ] Crossfade timing mismatch (fade starts before next ready, or too late)
- [ ] React remounting (video element recreated)
- [ ] Duplicate timers (scheduler firing twice)
- [ ] Browser/GPU behavior (compositing, power saving)
- [ ] Other: ___

---

### 5. Recommended next action

_(Choose one and add short detail.)_

- [ ] **No fix needed** — stutter not reproducible or acceptable.
- [ ] **Minor timing adjustment** — e.g. gate fade until next video readyState ≥ 3, or delay fade start by N ms, or extend waitForReady timeout.
- [ ] **Deeper video buffering rework** — e.g. preload next video earlier, or different ready check, or two-video buffer strategy. Only if audit proves necessary.

---

## Acceptance checklist

- [x] Dev overlay added for audit (active/next index, tick, current URL, A/B readyState/currentTime/paused/duration/networkState, fade).
- [x] Console timing logs added (dev only, prefix `[PHASE35_AUDIT]`).
- [ ] 10+ transitions observed and browser results documented above.
- [ ] Root cause identified OR stutter confirmed resolved.
- [x] Build passes.
