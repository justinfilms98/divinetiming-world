# Phase 32 — Silence Pass

## Scope

Reduce visual noise: remove redundant labels, avoid duplicate UI signals, simplify surfaces. Nothing new added. No layout or structure changes. Hero (Phase 35), CornerNav, Uploadcare unchanged.

## Files changed

| File | Change |
|------|--------|
| `app/events/page.tsx` | Removed redundant section label "DIVINE:TIMING / EVENTS"; kept contextual line "Upcoming and past shows." |
| `app/media/page.tsx` | Removed redundant section label "DIVINE:TIMING / MEDIA"; kept single line "Browse photo collections and videos." |
| `components/shop/ShopPageClient.tsx` | Removed redundant section label "DIVINE:TIMING / SHOP"; kept single line "Official merchandise and music." |
| `components/booking/BookingForm.tsx` | Removed duplicate heading "Send an Inquiry" (section already has "Get in touch" and subtitle). |
| `docs/PHASE32_SILENCE_PASS.md` | This file. |

## Elements removed or simplified

### 1. Redundant labels

- **Events:** Hero headline is "Events"; section had "DIVINE:TIMING / EVENTS" plus "Upcoming and past shows." The brand+page label duplicated the hero. Removed "DIVINE:TIMING / EVENTS"; kept the contextual line only.
- **Media:** Hero "Media"; section had "DIVINE:TIMING / MEDIA" plus "Browse photo collections and videos." Removed the redundant label; kept the single descriptive line.
- **Shop:** Hero "Shop"; ShopPageClient had "DIVINE:TIMING / SHOP" plus "Official merchandise and music." Removed the redundant label; kept the single line. Intro block simplified to one paragraph.

### 2. Duplicate separators

- **Audit:** SignatureDivider appears on Home (once), Media (once after hero), Shop (once), Booking (twice with story in between), EPK (once). No back-to-back dividers or stacked separators. No changes.

### 3. Icon noise

- **Audit:** Event detail uses Calendar, Clock, MapPin, Building2, Link2 for metadata and share—all add scanning value. Footer uses platform icons for social links. No decorative-only icons removed. No changes.

### 4. Button overload

- **Audit:** Booking hero has primary CTA + View EPK / Press Photos; sidebar repeats View EPK / Press Photos after contact and about—intentional for context. Product detail has Add to Cart (primary) and Buy Now. No redundant duplicate actions removed. No changes.

### 5. Metadata density

- **Audit:** Event cards and event detail use date, location, venue; gallery and product use item counts and descriptions. Spacing already consistent. No changes.

### 6. Footer clarity

- **Audit:** Footer has brand, byline, nav links, social icons; spacing and hierarchy are clear. No changes.

### 7. Admin noise pass

- **Audit:** Admin uses AdminPageHeader (page title) and card-level titles where needed (e.g. "Hero Editor"). No obvious duplicate labels that warranted removal without redesign. No changes.

## Acceptance checklist

- [x] Redundant labels reduced (Events, Media, Shop section labels; Booking form heading).
- [x] Unnecessary separators removed (none found; no change).
- [x] Icons simplified where possible (audited; kept meaningful icons).
- [x] Action buttons clearer (audited; no change).
- [x] Metadata easier to scan (audited; no change).
- [x] Footer remains calm (no change).
- [x] Admin UI cleaner (light pass; no duplicate labels removed).
- [x] Hero untouched (Phase 35).
- [x] CornerNav untouched.
- [x] Uploadcare untouched.
- [x] `npm run build` passes.

## Next phase

**Phase 33 — Signature Element.**
