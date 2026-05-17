# Phase 33 — Signature Element

## Goal

Introduce a single, consistent signature design element across the site for recognition without decoration. The element should feel calm, intentional, and repeated sparingly. The **SignatureDivider** is used as the site’s brand signature and was refined into this role.

## Files changed

| File | Change |
|------|--------|
| `app/globals.css` | Added `.signature-divider-line`: gradient (left fade → soft center → right fade) and very subtle glow, using accent at low opacity. |
| `components/brand/SignatureDivider.tsx` | Uses `.signature-divider-line`; removed inline gradient; kept max-w-2xl, spacing, aria-hidden. |
| `docs/PHASE33_SIGNATURE_ELEMENT.md` | This file. |

## Design explanation

- **Structure:** Single 1px line with a horizontal gradient: transparent at 0%, very faint accent at 18%, soft center at 50% (accent 20% opacity), very faint at 82%, transparent at 100%. This gives a clear “left fade → center highlight → right fade” with a slight taper in perceived weight toward the edges.
- **Glow:** Optional, minimal: `box-shadow: 0 0 20px rgba(198, 167, 94, 0.06)` so the line reads as a quiet brand cue, not a bright bar.
- **Palette:** Accent gold (`#C6A75E` / rgba(198, 167, 94)) only; all opacities ≤ 0.2 except the glow at 0.06. No animation, no bright color.
- **Constraints:** Thin, minimal, calm; no new design system; no changes to hero (Phase 35), CornerNav, Uploadcare, or layout.

## Locations where the divider appears

| Page | Usage |
|------|--------|
| **Home** | Between hero and main (below hero content). |
| **Booking** | Before and after `BookingStoryScroll`. |
| **Media** | Between hero and gallery section. |
| **Shop** | Between hero and product grid. |
| **EPK** | Between major content blocks. |

No new instances were added; placement was already correct.

## Acceptance checklist

- [x] SignatureDivider refined (gradient + optional glow).
- [x] Visual identity cue consistent (same class everywhere).
- [x] No additional UI noise (opacity ≤ 0.25; no animation).
- [x] Used sparingly across listed pages only.
- [x] Hero untouched (Phase 35).
- [x] CornerNav untouched.
- [x] Uploadcare untouched.
- [x] Layout unchanged.
- [x] `npm run build` passes.

## Next phase

**Phase 34 — Final Harmony Pass.**
