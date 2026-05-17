# Phase 17.F — Duration-Aware Hero Timing

**Goal:** Hero crossfades should start **before the current clip ends**. The swap should land cleanly on the next clip with no visible “end-of-clip loop/jump.”

## Symptom

- At ~7s the current `<video>` hits the end and loops/restarts (or flashes).
- At ~8s the scheduler triggers the crossfade/advance.
- Result: clip “tries to cycle” or “jumps” right before the transition.

## Root cause

Rotation timing (fixed 8s) did not match actual clip length (e.g. 7s). The clip’s native loop/restart happened before the scheduled crossfade, so the viewer saw an end-of-clip flash then the fade.

## Fix (HeroVideoCarouselPremium.tsx)

### 1. No looping on front/back layers

- Set **`loop={false}`** on both video layers (A and B) in the multi-slot branch.
- Keeps `muted autoPlay playsInline preload="auto"`.
- Prevents visible restart at end of clip; only the controlled crossfade advances.

### 2. Per-video duration from metadata

- **`durationMapRef = useRef<Record<string, number>>({})`** — stores duration in seconds keyed by video URL.
- On each `<video>`: **`onLoadedMetadata={(e) => { durationMapRef.current[url] = (e.currentTarget.duration ?? 0); }}`** so we know each clip’s length.

### 3. Duration-aware scheduler

- **Constants:** `DEFAULT_ROTATION_MS = 8000`, `FADE_MS = 1200`, `PREFADE_BUFFER_MS = 120`, `MIN_ROTATION_MS = 4000`.
- **Per tick** (for the active clip index):
  - `activeUrl = videos[forIndex]?.url`
  - `durSec = durationMapRef.current[activeUrl] ?? 0`
  - `durMs = durSec > 0 ? floor(durSec * 1000) : DEFAULT_ROTATION_MS`
  - `waitMs = max(MIN_ROTATION_MS, durMs)` (base cycle length)
  - **`triggerMs = max(1500, waitMs - FADE_MS - PREFADE_BUFFER_MS)`**
- **Schedule:** wait `triggerMs` → call `goToNext()` (starts crossfade). When the crossfade completes (or on reduced-motion instant swap), **`scheduleNext(nextIndex)`** runs to schedule the next tick for the new clip.
- So we start the fade before the clip ends; no fixed 8s, no end-of-clip restart visible.

### 4. Keys by URL (no unexpected remount)

- **`key={videoA!.url}`** and **`key={videoB!.url}`** for the two video elements.
- Avoids remount/restart when only index changes; same URL keeps the same element.

### 5. Chain: one scheduler, reschedule after each advance

- **`scheduleNext(forIndex)`** sets a single `setTimeout(triggerMs)` then calls `goToNext()` (no recursive `scheduleNext` inside the timeout).
- **`goToNext()`** when done (reduced-motion path or crossfade completion) calls **`scheduleNext((frontIndexRef.current + 1) % total)`** so the next tick is for the clip we’re now showing.
- **`frontIndexRef`** is updated each render so completion callbacks know the current index and can pass the correct next index.

## QA checklist (must pass)

- [ ] With ~7s clips, hero feels like a clean loop: fade starts near the end of each clip (no visible “restart”).
- [ ] Sequence stays **1 → 2 → 3** smoothly; no black frames / no flicker.
- [ ] Test with clips of different lengths (e.g. 5s, 10s) if available — behavior remains correct.

When all items pass, Phase 17.F is complete. Proceed to Phase 18 (Performance + Media Reliability).
