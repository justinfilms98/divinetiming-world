# Phase 25 — Typography & Spacing Refinement

## Scope

Unify typography hierarchy and spacing rhythm for calm, balanced, editorial feel. Refinement only: no layout or page structure redesign, no hero (Phase 35), no CornerNav changes, no new media providers.

## 1. Typography hierarchy audit

- **H1 (one per page):** Home (HeroContent), Media hub (MediaPageClient), Gallery detail (GalleryDetailClient), Shop product (shop/[slug]), Presskit, Login, Admin pages. All public H1s now use `type-h1` or equivalent token.
- **H2:** Section titles (Section component, BookingStoryScroll story headings, BookingForm). Use `type-h2`.
- **H3:** Cards/subsections (EventCard title, BookingAboutCard, BookingBioSection, shop product card name, Contact heading on booking). Use `type-h3`.
- **Body:** Paragraphs and descriptions use `type-body`.
- **Label:** Metadata, form labels, small UI use `type-label` or `type-small`.

Inconsistent usages corrected: Media hub and Gallery detail H1s use `type-h1`; product detail H1 uses `type-h1` only; shop grid product name uses `type-h3` (removed redundant `text-xl`).

## 2. Heading scale consistency

**Tokens updated in `app/globals.css`:**

| Token       | Before                    | After (Phase 25)                |
|------------|---------------------------|----------------------------------|
| --text-h1  | clamp(2.25rem, 4vw, 4.5rem) | clamp(2.25rem, 3vw, 3rem)      |
| --text-h2  | clamp(1.625rem, 2.5vw, 2.5rem) | clamp(1.75rem, 2vw, 2rem)   |
| --text-h3  | clamp(1.25rem, 1.5vw, 1.5rem) | clamp(1.25rem, 1.35vw, 1.375rem) |
| --text-label | 0.75rem                  | 0.875rem                         |

- **H1:** ~2.25–3rem (was up to 4.5rem).
- **H2:** ~1.75–2rem (was up to 2.5rem).
- **H3:** ~1.25–1.375rem.
- **Body:** 1.125rem (1rem on mobile via --text-body-mobile).
- **Label:** 0.875rem for readability.

## 3. Paragraph readability

- **New utility:** `.prose-readability` in `app/globals.css`: `max-width: 65ch`, `line-height: var(--line-height-body)` (~60–70 characters per line).
- **Booking:** BookingStoryScroll already used `max-w-[65ch]` for story body and headings; no change.
- **BookingAboutCard:** Body paragraphs use `prose-readability`.
- **BookingBioSection:** Plain-text bio block uses `prose-readability`.
- **Shop product description:** Wrapper uses `prose-readability`.
- **Gallery description:** Uses `type-body` and `prose-readability`.
- **Section subtitle:** Section component subtitle uses `prose-readability`.
- **Media hub subtext:** Centered subtext under H1 uses `max-w-[65ch] mx-auto`.

## 4. Vertical spacing rhythm

- **Spacing variables added** (8px scale): `--space-sm: 1rem`, `--space-md: 2rem`, `--space-section: 5rem` for future use. Existing section padding (--section-padding-*) and Section component (`py-12 md:py-16`, header `mb-8 md:mb-10`) unchanged; already consistent.
- No structural layout changes; spacing scale documented for consistency.

## 5. Card content spacing

- **Event cards:** Existing `p-6`, `gap-4` retained; typography uses type-label, type-h3, type-small.
- **Media/Shop cards:** Existing `p-6` (Shop), internal spacing unchanged; headings use type-h3.
- **Booking cards:** BookingAboutCard, BookingBioSection use Card with `p-6`; body uses prose-readability to avoid overly long lines within the card.
- No padding or layout changes; balance verified.

## 6. Mobile typography

- **Existing:** `--text-body-mobile: 1rem` and `@media (max-width: 768px)` switch body to it. H1/H2/H3 use `clamp()` so they scale down on small viewports.
- **No changes:** Min H1 size 2.25rem is acceptable for page titles; labels at 0.875rem remain readable. No adjustments made.

## 7. Admin typography

- **AdminPageHeader:** Added classes `admin-page-title` and `admin-page-desc` for dark mode in `app/admin/admin.css` (`.dark-admin .admin-page-title`, `.dark-admin .admin-page-desc`) so headings and descriptions stay readable in dark-admin theme.
- **Scale:** Admin continues to use `text-2xl` for page title, `text-lg` for section headings, `text-sm` for descriptions; secondary to public pages, no layout redesign.

## Files changed

| File | Change |
|------|--------|
| `app/globals.css` | Typography tokens (H1/H2/H3/label); --space-sm/md/section; .prose-readability |
| `components/booking/BookingAboutCard.tsx` | prose-readability on body paragraphs |
| `components/booking/BookingBioSection.tsx` | prose-readability on plain bio block |
| `components/ui/Section.tsx` | prose-readability on subtitle |
| `app/shop/[slug]/page.tsx` | type-h1 only for product name; prose-readability on description |
| `components/media/MediaPageClient.tsx` | type-h1 + type-body for headline/subtext; subtext max-w-[65ch] |
| `components/media/GalleryDetailClient.tsx` | type-h1, type-body + prose-readability on description |
| `components/shop/ShopPageClient.tsx` | type-h3 only for product name (removed text-xl) |
| `components/admin/AdminPageHeader.tsx` | admin-page-title, admin-page-desc for dark styling |
| `app/admin/admin.css` | .dark-admin .admin-page-title, .admin-page-desc |
| `docs/PHASE25_TYPOGRAPHY_SPACING_REFINEMENT.md` | This file |

**Not changed:** Hero (Phase 35), CornerNav, Uploadcare, layout/page structure, Events list (hero provides title), Presskit/Login custom H1 styling.

## Acceptance checklist

- [x] Heading hierarchy consistent (H1/H2/H3/body/label; type-* tokens)
- [x] Paragraph widths readable (prose-readability / max-w-[65ch] where needed)
- [x] Spacing rhythm consistent (vars added; Section/section padding unchanged)
- [x] Card padding balanced (verified; no changes)
- [x] Mobile typography stable (clamp + body-mobile; no changes)
- [x] Admin typography consistent (dark mode header; same scale)
- [x] Hero untouched (Phase 35)
- [x] CornerNav untouched
- [x] Uploadcare untouched
- [x] `npm run build` passes

## Next phase

**Phase 26 — Brand Authority Layer.**
