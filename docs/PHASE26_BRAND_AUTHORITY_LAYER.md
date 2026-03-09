# Phase 26 — Brand Authority Layer

## Files changed

| File | Change |
|------|--------|
| `components/layout/Footer.tsx` | Added "Press Kit" → `/presskit` and "EPK" → `/epk` to `FOOTER_LINKS`; same style as existing links. |
| `app/booking/page.tsx` | Booking hero links: container uses `type-small`, links use `transition-colors duration-200`; labels "View EPK", "Press Photos" unchanged. |
| `components/authority/ListenNow.tsx` | Section label "Listen now" → "Listen Now", uses `type-label` for typography token consistency. |
| `docs/PHASE26_BRAND_AUTHORITY_LAYER.md` | This doc: implementation summary, authority locations, acceptance results. |

---

## What was implemented

1. **Footer navigation** — Press Kit and EPK added to footer with same styling as Events, Media, Shop, Booking (text-xs uppercase tracking-wider, same Link component).
2. **Booking page authority links** — Hero area "View EPK" and "Press Photos" links use `type-small` and `duration-200`; wording kept as "View EPK" / "Press Photos".
3. **SignatureDivider audit** — All usages located and documented below; no new placements added.
4. **Byline consistency** — Single source: `site_settings` (`member_1_name`, `member_2_name`). Used in Footer and, via MemberLine, on home and about; documented below.
5. **Authority components** — ListenNow label aligned to "Listen Now" and `type-label`; PressLogosRow ("Featured in"), CollabsGrid ("With"), StatsRow, AuthorityCTAs ("Book", "View EPK") verified; spacing and capitalization consistent.
6. **Press Kit / EPK routes** — `/presskit` and `/epk` both exist and are linked from footer and booking; no layout changes to those pages.

---

## Authority element locations

- **Footer:** Divine Timing title, byline ("By {member1} & {member2}"), nav links (Events, Media, Shop, Booking, Press Kit, EPK), platform icons. Byline source: `siteSettings.member_1_name`, `member_2_name`.
- **Booking hero:** Primary CTA (e.g. Book Now) + "View EPK" (→ `/epk`), "Press Photos" (→ `/media`). Same wording style as AuthorityCTAs.
- **SignatureDivider:** Used in `app/page.tsx` (home, between sections), `app/booking/page.tsx` (before and after BookingStoryScroll), `app/media/page.tsx`, `app/shop/page.tsx`, `app/epk/page.tsx`. Editorial use only; no new instances added.
- **Byline:** Footer (text-xs, "By {byline}"); MemberLine on home and about (text-sm/md:text-base, hero context). Both derive from site_settings; no redesign.
- **Authority components:** ListenNow, PressLogosRow, AuthorityCTAs, CollabsGrid, StatsRow live in `components/authority/`; used on home, EPK, and/or booking as per existing layout.

---

## Acceptance checklist (results)

- [x] Footer includes Press Kit and EPK with same styling as other footer links.
- [x] Booking hero area uses consistent labels ("View EPK", "Press Photos") and typography tokens.
- [x] SignatureDivider usage audited and documented; no new placements.
- [x] Byline source verified (site_settings); locations documented.
- [x] Authority components audited; labels and spacing consistent.
- [x] Press Kit / EPK linked from footer and booking; routes verified.
- [x] Hero untouched (Phase 35).
- [x] CornerNav untouched.
- [x] Uploadcare untouched.
- [x] `npm run build` passes.
- [x] Phase 26 doc updated with Files changed, What was implemented, Authority locations, Acceptance results.

---

## Goal (spec)

Strengthen perceived credibility and brand consistency across the site by:

- Making trust cues (press, EPK, booking) easy to find and consistent in voice.
- Aligning use of brand elements (signature divider, byline, “By Lex Laurence & Liam Bongo”).
- Ensuring Press Kit / EPK and booking are clearly available from key entry points (e.g. footer, booking page) without changing layout or hierarchy.

No new brand system or visual redesign—refinement and consistency only.

---

## Scope

1. **Footer**
   - Add **Press Kit** (and optionally **EPK**) to footer navigation where it makes sense, so press/industry users can find them next to Events, Media, Shop, Booking.
   - Keep existing footer structure and styling (typography, spacing, links). Use same link pattern as existing items.

2. **Booking page**
   - Ensure existing “View EPK” and “Press Photos” (or equivalent) links in the hero area are clearly visible and use consistent labeling (e.g. “Press Kit”, “EPK” as in the rest of the site).
   - No layout or structure change; wording/labels only if inconsistent.

3. **Brand elements audit**
   - **SignatureDivider:** Confirm it’s used between major sections where it already is (e.g. media, booking). No new placements required unless one key section is missing it and it fits the current design.
   - **Byline:** Footer “By {member1} & {member2}” and any other byline (e.g. home) use the same source (e.g. site settings). Document where byline appears.
   - **Authority components:** Existing components in `components/authority/` (ListenNow, PressLogosRow, AuthorityCTAs, etc.)—verify they’re used on intended pages and that labels/copy are consistent (e.g. “Listen now”, “Press”, “As seen in” if present).

4. **Press Kit / EPK pages**
   - Ensure `/presskit` and `/epk` (if both exist) are linked from the same places (e.g. footer, booking) with consistent names (e.g. “Press Kit” vs “EPK” as decided).
   - No content or layout redesign; links and labels only.

5. **Documentation**
   - Update or create a short section (e.g. in this doc or in a central “Brand & content”) that lists:
     - Where brand authority elements live (footer, booking hero, authority components).
     - Where Press Kit / EPK are linked.
     - That no Phase 35 hero stutter work, CornerNav changes, or Uploadcare was introduced.

---

## Constraints

- **Do not** reopen Phase 35 hero stutter work.
- **Do not** modify CornerNav structure or placement.
- **Do not** introduce Uploadcare or new media providers.
- **Do not** redesign layouts or page structure.
- **Build must** continue to pass (`npm run build`).
- Changes are **additive or refinement only** (links, labels, optional use of existing dividers); no large new features.

---

## Acceptance checklist

- [x] Footer includes Press Kit (and EPK if applicable) with same styling as other footer links.
- [x] Booking hero area uses consistent labels for “View EPK” / “Press Photos” (or as decided).
- [x] SignatureDivider usage audited and documented (no mandatory new placements).
- [x] Byline usage documented (footer + any other; same source of truth).
- [x] Authority components (ListenNow, PressLogosRow, etc.) usage and labels verified.
- [x] Press Kit / EPK link targets and names consistent across footer and booking.
- [x] Hero untouched (Phase 35).
- [x] CornerNav untouched.
- [x] Uploadcare untouched.
- [x] `npm run build` passes.
- [x] Phase 26 doc updated with “Files changed” and “What was done” after implementation.

---

## Next phase

**Phase 27 — Spacing Balance Pass.**

---

## Notes for implementation

- **Footer:** Add one or two links (e.g. “Press Kit”, “EPK”) to `FOOTER_LINKS` in `components/layout/Footer.tsx`; keep existing `max-w-[1200px]`, `py-16`, and link classes.
- **Booking:** If hero CTA area has “View EPK” and “Press Photos”, ensure they point to `/epk` and `/media` (or correct URLs) and that wording matches footer/nav.
- **Doc:** After implementation, fill in “Files changed” and “What was done” at the top of this file (or in a short “Phase 26 summary” section).
