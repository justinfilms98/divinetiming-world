# Phase 28 — Emotional Flow Refinement

## Scope

Refine how pages *feel* as you move through them: narrative rhythm, visual pacing, intentional transitions, and avoiding abrupt context shifts. No new sections, no layout/grid redesign. Same constraints: hero untouched (Phase 35), CornerNav untouched, Uploadcare untouched.

## Pages reviewed

| Page | Flow pattern | Adjustments |
|------|--------------|-------------|
| **Home** | Hero → SignatureDivider. Minimal; divider provides breathing moment. | No change (hero out of scope). |
| **Events** | Hero → section label → list/tabs. | Added short contextual line under label. |
| **Media** | Hero → divider → Section (tabs + grid). | Added section intro (label + one line) before tabs. |
| **Gallery detail** | Back link → h1 → description → grid. | Added fallback line when no description; kept spacing. |
| **Shop** | Hero → divider → Section → product grid. | Added section intro (label + one line) before grid. |
| **Product detail** | Back → h1 → price → description → CTAs. | Description split into paragraphs with spacing. |
| **Booking** | Hero → divider → story scroll → divider → form section. | Story body as multiple paragraphs; form section title/subtitle. |
| **About** | Hero → bio → photos → Members → Timeline. | Already clear sections and spacing; no change. |

## Adjustments made

### 1. Section entry tone

- **Events** (`app/events/page.tsx`): Under the "DIVINE:TIMING / EVENTS" label, added one line: "Upcoming and past shows." Label margin reduced to `mb-4`, intro line `mb-10`.
- **Media** (`app/media/page.tsx`): Before `MediaPageClient`, added a centered block: section label "DIVINE:TIMING / MEDIA" and line "Browse photo collections and videos." (`mb-10`).
- **Shop** (`components/shop/ShopPageClient.tsx`): At top of content, added section label "DIVINE:TIMING / SHOP" and line "Official merchandise and music." (`mb-10 md:mb-12`).
- **Gallery detail** (`components/media/GalleryDetailClient.tsx`): When `galleryDescription` is absent, added one line: "Photos and media from this collection." so the section doesn’t jump straight to the grid.
- **Booking** (`app/booking/page.tsx`): Form section now uses `Section`’s `title="Get in touch"` and `subtitle="Send us your details and we'll get back to you."` so the form area has a clear entry.

### 2. Text density balance

- **Booking story** (`components/booking/BookingStoryScroll.tsx`): Section body is split on double newlines (`\n\n+`) and rendered as multiple `<p>` with `space-y-4`. Single-line or single-block body still renders as one paragraph. No content rewritten.
- **Product description** (`app/shop/[slug]/page.tsx`): Description split on `\n\n+` into multiple `<p>` with `space-y-4` and `leading-relaxed`. Content unchanged.

### 3. Visual pacing and CTA placement

- Existing pacing kept: `mt-20` after hero, `SignatureDivider` between major areas (Booking: story ↔ form). No new dense→dense transitions.
- CTAs confirmed after context: Booking (View EPK / Press Photos after contact/about); Product (Add to Cart / Buy Now after description and options); Shop (per-card actions). No CTA styling changes.

### 4. Scroll experience

- No structural or layout changes. Section intros and paragraph spacing only; scroll paths (Home→Media, Home→Events, Media→Gallery, Shop→Product, Booking→Form) unchanged and calmer with the new entry lines and text breaks.

## Files changed

| File | Change |
|------|--------|
| `app/events/page.tsx` | Section label + short contextual line before events list. |
| `app/media/page.tsx` | Section intro (label + line) above MediaPageClient. |
| `app/booking/page.tsx` | Section title/subtitle for form section. |
| `app/shop/[slug]/page.tsx` | Product description as multiple paragraphs with spacing. |
| `components/shop/ShopPageClient.tsx` | Section intro (label + line) above product grid. |
| `components/booking/BookingStoryScroll.tsx` | Story body rendered as multiple paragraphs (split on `\n\n+`). |
| `components/media/GalleryDetailClient.tsx` | Fallback line when gallery has no description. |
| `docs/PHASE28_EMOTIONAL_FLOW_REFINEMENT.md` | This file. |

## Flow improvements (summary)

- **Section order:** Verified; intro → context → main content → supporting → CTA holds. No section reordering.
- **Section starts:** No abrupt grid/tabs; Events, Media, Shop, Gallery (when no description), and Booking form now have a short contextual line or title/subtitle.
- **Heavy sections:** Existing spacing and dividers retained; no new dense→dense stacking.
- **CTAs:** Remain after sufficient context; no placement or style changes.
- **Text density:** Booking story and product description use paragraph breaks and spacing only.

## Acceptance checklist

- [x] Sections flow logically (intro → context → main → supporting → CTA).
- [x] No abrupt section starts; intros/labels where needed.
- [x] Heavy content areas separated (existing spacing/dividers).
- [x] CTA placement feels natural; no changes to buttons.
- [x] Text density improved via paragraph breaks and spacing only.
- [x] Scroll experience refined with entry tone and text balance only.
- [x] Hero untouched (Phase 35).
- [x] CornerNav untouched.
- [x] Uploadcare untouched.
- [x] `npm run build` passes.

## Next phase

**Phase 29 — Atmosphere Layer.**
