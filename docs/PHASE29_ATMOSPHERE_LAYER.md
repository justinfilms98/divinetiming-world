# Phase 29 — Atmosphere Layer

## Scope

Enhance the visual atmosphere of the site for a calm, cinematic, intentional feel. Atmosphere is created through subtle background tone variation, lighting/highlight cues, restrained gradients, consistent depth, and soft contrast. No new sections, no layout or structure changes. Hero (Phase 35), CornerNav, Uploadcare unchanged.

## Files changed

| File | Change |
|------|--------|
| `app/globals.css` | Added `--atmosphere-card-highlight`, `--atmosphere-section-lift`; `.card-atmosphere` and `.section-lift` utilities. |
| `app/events/page.tsx` | Section uses `section-lift`. |
| `app/media/page.tsx` | Section uses `section-lift`. |
| `app/shop/page.tsx` | Section uses `section-lift`. |
| `app/booking/page.tsx` | Form section uses `section-lift`. |
| `components/layout/Footer.tsx` | Border and background for grounded tone; increased top padding. |
| `components/events/EventCard.tsx` | Added `card-atmosphere`. |
| `components/media/MediaPageClient.tsx` | Gallery and video cards use `card-atmosphere`. |
| `components/media/MediaTile.tsx` | Added `shadow-[var(--shadow-card)]` and `card-atmosphere`. |
| `components/shop/ShopPageClient.tsx` | Product card uses `card-atmosphere`. |
| `components/ui/Card.tsx` | Default variant uses `relative` and `card-atmosphere`. |
| `components/ui/GlassPanel.tsx` | Added `relative overflow-hidden` and `card-atmosphere`. |
| `docs/PHASE29_ATMOSPHERE_LAYER.md` | This file. |

## Atmosphere refinements

### 1. Background tone harmony

- **Section lift:** New utility `.section-lift` uses `--atmosphere-section-lift`: a very subtle top gradient (rgba(255,255,255,0.02) → transparent) so content sections feel slightly lifted from the base backdrop. Applied to Events, Media, Shop, and Booking form sections. Base (SpaceBackdrop gradient) → lifted section → footer.
- No new layout or structure; only background tone.

### 2. Card depth consistency

- **Design tokens:** Cards already used `--shadow-card`, `--shadow-card-hover`, `border-[var(--accent)]/20` (hover /50). No token changes.
- **MediaTile:** Had no rest-state shadow; now uses `shadow-[var(--shadow-card)]` so gallery tiles match other cards.
- **Highlight gradient:** New `.card-atmosphere` adds a ::before pseudo-element with `--atmosphere-card-highlight` (linear-gradient to bottom, rgba(255,255,255,0.035) → transparent 45%). Applied to: EventCard, Media gallery cards, Media video cards, MediaTile, Shop ProductCard, Card (default variant), GlassPanel. Cards feel slightly lifted without looking floating; border and shadow unchanged.

### 3. Highlight gradients

- Single pattern used: `--atmosphere-card-highlight` (top-only, very low opacity). No visible gradients; used sparingly on card surfaces only. Hero and other surfaces unchanged.

### 4. Surface calmness

- No strong contrast or noisy areas changed. Section lift and card highlight are additive and subtle. Transitions between sections remain smooth via existing spacing and SignatureDivider.

### 5. Footer atmosphere

- **Border:** `border-white/10` → `border-[var(--text)]/10` so the line reads as a soft dark separator on the light backdrop.
- **Background:** `bg-[var(--bg)]/50` so the footer has a slight base tone and feels grounded.
- **Spacing:** `py-16` → `pt-20 pb-16` for more space above the footer content. Layout and structure unchanged.

### 6. Atmosphere consistency

- Same card treatment (depth + highlight) across Events, Media hub, Gallery tiles, Shop, and shared Card/GlassPanel. Section lift on main content sections (Events, Media, Shop, Booking) keeps a consistent base → lift rhythm. Home (hero + divider), About, Gallery detail, Product detail unchanged except where they use Card (e.g. Booking sidebar).

## Before / after notes

- **Before:** Sections were flat on the backdrop; cards had depth but no shared highlight; footer had a light border and even padding; MediaTile had no rest shadow.
- **After:** Content sections have a barely perceptible lift; all main cards share a soft top highlight and consistent shadow; footer has a clearer edge and more space above; overall tone is calmer and more unified without changing layout or structure.

## Acceptance checklist

- [x] Backgrounds feel cohesive (section lift, footer tone).
- [x] Cards have consistent depth (shadow + card-atmosphere).
- [x] Gradients subtle and restrained (card highlight only, low opacity).
- [x] Section tone transitions smooth (section-lift, existing spacing).
- [x] Footer atmosphere balanced (border, bg, spacing).
- [x] Overall site tone calm and intentional.
- [x] Hero untouched (Phase 35).
- [x] CornerNav untouched.
- [x] Uploadcare untouched.
- [x] `npm run build` passes.

## Next phase

**Phase 30 — Motion Restraint Pass.**
