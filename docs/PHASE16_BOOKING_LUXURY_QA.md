# Phase 16 — Booking Luxury Rebuild QA Fixes

## Files changed

| File | Change |
|------|--------|
| `app/booking/page.tsx` | Removed double Section wrapper around story; form section uses `scroll-mt-[5.5rem] md:scroll-mt-32`, `overflow-x-clip`, `min-w-0`; form + sidebar blocks use `Card`; sidebar `space-y-8` → `space-y-6`; Contact/Partners use micro labels; EPK/Press links use softer accent (`/15`, `/25`); added `aria-label` on aside. |
| `components/booking/BookingStoryScroll.tsx` | Section padding `py-20 md:py-28` → `py-12 md:py-16`; inner spacing `space-y-24 md:space-y-32` → `space-y-16 md:space-y-20`; body/heading `max-w-[60ch]` / `max-w-[40ch]` → `max-w-[65ch]`; motif wrapper `text-[var(--accent)]` → `text-[var(--accent)]/70`; body font `var(--font-ui)` → `var(--font-body)`; added `min-w-0` on section. |
| `components/booking/BookingForm.tsx` | Success/error messages use design tokens (accent/muted) instead of green/red; form `space-y-6` → `space-y-5`; inputs use `border-[var(--accent)]/10`, focus `focus:border-[var(--accent)]/50`, `transition-colors duration-200`; submit button `transition-opacity duration-200`; heading `mb-8` → `mb-6`. |
| `components/booking/BookingAboutCard.tsx` | Replaced custom card div with `Card` component. |
| `components/booking/BookingBioSection.tsx` | Replaced custom section div with `Card as="section"`; headings/labels use `type-h3` and design tokens; removed `text-white` in favor of `var(--text)` / `var(--text-muted)`; bio content uses `var(--font-body)`. |

## What changed

### A) Layout + rhythm
- **Hero → Story → Form → Footer:** Single story section (no extra Section wrapper); story section uses design-system padding `py-12 md:py-16`; form section uses default Section padding.
- **Container/Section:** Form section uses `Section` + `Container` with `min-w-0` and `overflow-x-clip` to avoid horizontal scroll.
- **Spacing:** Sidebar blocks use `space-y-6`; story block spacing reduced for calmer rhythm.

### B) Header overlap + scroll target
- **`id="booking-form"`** kept on the form Section.
- **Scroll offset:** `scroll-mt-[5.5rem]` (88px) on mobile, `md:scroll-mt-32` (128px) on desktop so “Book Now” lands with the form visible below the sticky header.
- Hero CTA still uses `#booking-form`; browser respects `scroll-margin-top` on the target.

### C) Story blocks (BookingStoryScroll)
- **Typography:** Headings and body constrained to `max-w-[65ch]`; body uses `var(--font-body)`.
- **Motifs:** Wrapper uses `text-[var(--accent)]/70` to reduce visual noise; section has `overflow-x-clip` and `min-w-0`.
- **Vertical rhythm:** `py-12 md:py-16` and `space-y-16 md:space-y-20` for consistent spacing.

### D) Form + sidebar
- **Form card:** Wrapped in `Card` with `p-6 md:p-8`; inputs keep 48px min height; success/error use tokens; 200ms transitions.
- **Sidebar:** Contact, About, Partners, Bio use `Card`; “Partners & affiliations” uses micro label (`text-xs font-semibold uppercase`); EPK/Press links use softer accent and `duration-200`.

## Acceptance checklist (visual verification run)

- [x] At 375px / 768px / 1440px spacing feels even; no section cramped; no random color shifts.
- [x] “Book Now” scrolls to form with form title visible below header on mobile (375) and desktop (scroll-mt applied).
- [x] No header overlapping hero or booking form content (scroll-mt-[5.5rem] md:scroll-mt-32).
- [x] Story reads like an editorial page; no horizontal scroll; motifs contained (overflow-x-clip, min-w-0).
- [x] Form is easy to scan and complete on mobile (48px inputs); desktop 2-column layout balanced; hierarchy clear.
- [x] Build passes.

## Mobile test steps (375 / 390 / 430)

1. Open `/booking` at 375px width.
2. Confirm hero, story, and form sections have consistent vertical spacing and no horizontal scroll.
3. Tap “Book Now” in the hero; confirm the form section scrolls into view and the “Send an Inquiry” heading is visible below the top (no overlap by nav/logo).
4. Resize to 390px and 430px; repeat spacing and “Book Now” scroll check.
5. Fill and submit the form; confirm success message uses design tokens (no raw green).

## “Book Now” anchor test steps

1. Desktop: Scroll down past hero so sticky header is visible; click “Book Now” in hero (or a link with `href="#booking-form"`). Form section should scroll into view with ~128px offset so the form title is not under the header.
2. Mobile: From top of page, tap “Book Now”. Form should scroll into view with ~88px offset so the form is fully usable and not hidden under the corner logo/hamburger area.
3. Direct URL: Open `/booking#booking-form`. Page should load with the form section in view and offset correctly (scroll-margin applied on load where supported).
