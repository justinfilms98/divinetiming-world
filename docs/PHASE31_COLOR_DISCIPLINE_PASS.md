# Phase 31 — Color Discipline Pass

## Scope

Tighten color usage so the site feels controlled, calm, cohesive, and premium. No new colors; palette consistency and restraint only. No layout or structure changes. Hero (Phase 35), CornerNav, Uploadcare unchanged.

## Files changed

| File | Change |
|------|--------|
| `app/globals.css` | Surface consistency (.glass, .luxury-card); border token (--border-subtle); gradient restraint (Phase 29 vars); shadow alignment. |
| `docs/PHASE31_COLOR_DISCIPLINE_PASS.md` | This file. |

## Color adjustments made

### 1. Surface consistency

- **.glass:** Unchanged background (rgba(244, 239, 232, 0.6) = --bg family). Border now uses `var(--border-subtle)` for a single source of truth. Box-shadow 0.08 → 0.06 to align with --shadow-card softness.
- **.luxury-card:** Background changed from `rgba(255, 255, 255, 0.5)` to `rgba(244, 239, 232, 0.92)` so the surface is clearly from the sand palette (--bg) and no longer reads as cool white. Border default `rgba(198, 167, 94, 0.25)` → `0.22`; hover `0.5` → `0.45` for slightly softer accent borders. Cards that also set `bg-[var(--bg-secondary)]` (e.g. EventCard) still use that for the main fill; .luxury-card then provides the same warm family when the class is used alone.

### 2. Accent discipline

- Audited: accent is used for primary CTAs, key labels (e.g. event date), links, and focus rings. No over-highlighting in a single section; strongest accent remains on major CTAs. No code changes.

### 3. Text contrast consistency

- Headings use `var(--text)`; body and metadata use `var(--text)` or `var(--text-muted)`. Labels use `var(--text-muted)` via .type-label / .type-small. Dark sections (About, Gallery detail, hero areas) use white/X as intended. No changes.

### 4. Border and shadow tone harmony

- **--border-subtle:** New token `rgba(28, 28, 28, 0.08)` for soft neutral borders (e.g. .glass). Card borders remain `var(--accent)` at /20–/25 (default) and /45–/50 (hover). Shadows: --shadow-card and --shadow-card-hover unchanged; .glass shadow softened to 0.06 for consistency.

### 5. Gradient and highlight discipline

- **--atmosphere-card-highlight:** Top highlight opacity 0.035 → 0.025 so it stays clearly subordinate to content.
- **--atmosphere-section-lift:** Section lift opacity 0.02 → 0.015 so the gradient does not read as a visible design element.

### 6. Admin color sanity

- Light pass: admin (MediaLibraryPicker, DashboardHeroEditor, etc.) uses slate for a distinct admin UI. No redesign; no changes. Public palette (--bg, --text, --accent) unchanged; admin remains intentionally separate.

## Before / after notes

- **Before:** .luxury-card could read as a cooler white; glass had a hardcoded border rgba; Phase 29 gradients at slightly higher opacity; no shared border token.
- **After:** Card surface is warm and from the palette; glass uses --border-subtle; gradients more restrained; borders and shadows aligned to the same soft, palette-based system.

## Acceptance checklist

- [x] Backgrounds feel cohesive (glass and luxury-card from --bg family).
- [x] Accent usage controlled (audited; no changes).
- [x] Text contrast consistent (tokens only; no typography scale changes).
- [x] Borders and shadows harmonious (--border-subtle, softer glass shadow, accent borders slightly softened).
- [x] Gradients restrained (card highlight and section lift opacity reduced).
- [x] Admin colors sane (light pass; slate retained by design).
- [x] Hero untouched (Phase 35).
- [x] CornerNav untouched.
- [x] Uploadcare untouched.
- [x] `npm run build` passes.

## Next phase

**Phase 32 — Silence Pass.**
