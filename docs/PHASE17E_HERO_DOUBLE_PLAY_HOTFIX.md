# Phase 17.E — Hero Rotation “No Double Play” Hotfix

**Goal:** Hero must play **1 → 2 → 3 → 1 → 2 → 3** with no extra replay of slot 1 after wrap.

## Symptom

- Slot 1 appears to play twice in a row (e.g. 1 → 2 → 3 → 1 → 1 → 2 …).
- Perceived as “double advance” or “double replay” at the wraparound boundary.

## Root cause

1. **Two advancement mechanisms** — If both an interval and something else (e.g. `onEnded`, `onTimeUpdate`, or a second timer) advance the carousel, two updates can occur in quick succession.
2. **setInterval at boundary** — `setInterval` can fire during state transitions or remounts near wrap, causing a second tick in the same period.
3. **Index guard + increment in same tick** — A guard that resets `frontIndex` to 0 when `frontIndex >= total` can run in the same tick as the normal “next” increment, effectively advancing twice (e.g. 2 → 0 and then 0 → 1, or 3 → 0 displayed twice).

## Changes (HeroVideoCarouselPremium.tsx)

### 1. Single advancement mechanism

- Verified: no `onEnded`, `onTimeUpdate`, or `ended` listeners on `<video>`.
- **Removed** `setInterval` as the scheduler.
- **Only** advancement is the single `scheduleNext()` timeout chain.

### 2. setInterval replaced with setTimeout chain

- **Removed:** `setInterval(goToNext, ROTATION_MS)`.
- **Added:** `timeoutRef` and `scheduleNext()`:
  - `scheduleNext()` clears any pending timeout, then sets `timeoutRef = setTimeout(() => { goToNext(); scheduleNext(); }, ROTATION_MS)`.
  - One tick every `ROTATION_MS` (8s); no boundary double-fire from interval.
- Effect: if `total >= 2`, call `scheduleNext()` on mount; cleanup clears `timeoutRef` and `fadeTimeoutRef`.

### 3. Single modulo; passive guard only on total

- **Single place for next index:** `setFrontIndex((i) => (i + 1) % total)` in `goToNext` only (reduced-motion path and end of crossfade path). No other code advances the index.
- **Index guard:** Replaced the guard that ran on `[total, frontIndex]` with a **passive** guard that runs only when `total` changes: `useEffect(() => { if (total > 0) setFrontIndex((i) => (i >= total ? 0 : i)); }, [total])`. This clamps when the number of slots changes (e.g. config goes from 3 to 2) and never runs at wrap time, so it cannot cause a second advance in the same tick.

### 4. Dev-only sanity overlay

- **tick: &lt;n&gt;** in the dev overlay (when `devLogLabel` is set), incremented each time the scheduler calls `goToNext()`.
- Confirms one tick per rotation (~8s).

## QA checklist (must pass)

- [ ] Watch hero for 2 full minutes: sequence is strictly **1 → 2 → 3 → 1 → 2 → 3** (no 1 twice in a row).
- [ ] Dev overlay **tick** increments once per rotation (~8s).
- [ ] No console errors.

When all items pass, Phase 17.E is complete. Proceed to Phase 18 (Performance + Media Reliability).
