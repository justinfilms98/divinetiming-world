# Phase 27 — Spacing Balance Pass

## Scope

Tight pass to reinforce spacing rhythm without layout or structure changes. Same constraints: no hero (Phase 35), no CornerNav, no Uploadcare, no redesign.

## What was done

1. **Spacing variables (Phase 25)** — Already in `:root`: `--space-sm: 1rem`, `--space-md: 2rem`, `--space-section: 5rem`. Section padding uses `--section-padding-*` (60/80/120px).

2. **Utility classes added** — In `app/globals.css`:
   - `.gap-sm` → `var(--space-sm)` (16px)
   - `.gap-md` → `var(--space-md)` (32px)
   - `.mb-section` / `.mt-section` → `var(--space-section)` (80px)
   Use these where new UI or refactors need consistent rhythm.

3. **Audit** — Public pages already follow a consistent pattern:
   - **Post-hero gap:** `mt-20` (5rem = 80px) on Events, Media, Shop, Booking = aligns with `--space-section`.
   - **Section padding:** `Section` uses `py-12 md:py-16`; header uses `mb-8 md:mb-10`.
   - **Container:** `max-w-[1200px] mx-auto px-5 md:px-8`.
   No changes made to existing layout; spacing is already aligned to the scale.

4. **Card grids** — Media, Shop, Events use `gap-6` or `gap-8` (24px/32px) between cards; within the medium-gap range. No change.

## Files changed

| File | Change |
|------|--------|
| `app/globals.css` | Added `.gap-sm`, `.gap-md`, `.mb-section`, `.mt-section` using spacing vars. |
| `docs/PHASE27_SPACING_BALANCE_PASS.md` | This file. |

## Spacing scale (reference)

| Use | Value | CSS var / pattern |
|-----|--------|-------------------|
| Small gap | 16px | `--space-sm`, `gap-4` |
| Medium gap | 32px | `--space-md`, `gap-8` |
| Section margin | 80px | `--space-section`, `mt-20` |
| Section padding (mobile) | 60px | `--section-padding-mobile` |
| Section padding (tablet) | 80px | `--section-padding-tablet` |
| Section padding (desktop) | 120px | `--section-padding-desktop` |

## Acceptance

- [x] Spacing utilities available; no layout or structure changes.
- [x] Hero untouched (Phase 35).
- [x] CornerNav untouched.
- [x] Uploadcare untouched.
- [x] `npm run build` passes.
