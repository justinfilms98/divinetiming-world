# Phase 34 — Final Harmony Pass

## Goal

Full-site harmony audit so the site feels balanced, calm, and intentional. Only small refinements; no major additions, no layout or structure changes. Hero (Phase 35), CornerNav, Uploadcare unchanged.

## Pages audited

| Page | Rhythm | Divider | Typography | Motion | Surfaces | CTA |
|------|--------|---------|------------|--------|----------|-----|
| **Home** | Hero → divider (my-12/16) | One divider below hero | N/A | Page ~250ms | Cohesive | Listen / Booking in hero |
| **Events** | mt-20 → Section (py-12/16) | None (single section) | Intro line mb-10, 45ch | Reveal 0.25 | section-lift, cards | View details / Tickets |
| **Event detail** | py-16 main | N/A | Readable | Card/Reveal | Card, sidebar | Get Tickets |
| **Media** | mt-20 → divider → Section | One before gallery | Intro mb-10, 45ch | 0.2/0.25 | section-lift, GlassPanel | Browse collections/videos |
| **Gallery detail** | py-16 main | N/A | h1 + description mb-12 | Grid reveal | Tiles | View media |
| **Shop** | mt-20 → divider → Section | One before grid | Intro mb-10/12, 45ch | 0.2 stagger | section-lift, cards | Add to Cart / View options |
| **Product detail** | py-12/16 section | N/A | prose-readability, space-y-4 | N/A | Card | Add to Cart / Buy Now |
| **Booking** | mt-20 → divider → story → divider → Section | Two (around story) | Section title+subtitle, form space-y-5 | 0.2/0.25 | section-lift, Cards | Submit form, View EPK / Press Photos |
| **About** | pt-16 → Hero → AboutContent | None | Bio, Members, Timeline spacing | 0.25 | Container, border-t | N/A (narrative) |
| **Press Kit** | py-20 centered | N/A | space-y-12 blocks | N/A | GlassPanel | Download / links |
| **EPK** | mt-20 → section py-16 | One inside section | mb-8 blocks | Reveal 0.25 | Section | Press Photos / EPK PDF |
| **Footer** | pt-20 pb-16 | border-t | Clear link groups | 200ms transitions | bg/50 | Nav + social |

Admin: Light pass on spacing (AdminCard p-4/p-6, AdminPageHeader), card readability, form spacing. No redesign.

## Refinements made

- **EPK post-hero rhythm:** Added `mt-20` to the EPK content section so the gap between hero and first content matches Events, Media, and Shop (80px). Previously the section used only `py-16`, giving 64px top; now 80px then section padding for consistent section rhythm.

No other code changes. All other items were audited and found consistent.

## Harmony observations

1. **Section rhythm:** Section uses `py-12 md:py-16` (48–64px). Post-hero gap is `mt-20` (80px) on Events, Media, Shop, Booking; now also on EPK. SignatureDivider uses `my-12 md:my-16` (48–64px). Aligns with “section → 80px, divider → 48–64px”.

2. **Divider pacing:** SignatureDivider appears on Home (1), Booking (2 with story between), Media (1), Shop (1), EPK (1). Not stacked; no missing breaks. Rhythm is calm.

3. **Typography balance:** Section headers use `mb-8 md:mb-10`. Intro lines use `mb-10` or `mb-10 md:mb-12` and `max-w-[45ch]` or `prose-readability` where appropriate. No cramped or overspaced blocks; typography scale unchanged.

4. **Motion harmony:** Hover/UI transitions ~200ms (duration-200, 0.2). Reveal and page transitions ~250ms (0.25, durations.med). Cards, buttons, modals, and scroll reveals use these. Phase 30 motion restraint kept; no new animations.

5. **Surface balance:** Cards use `--shadow-card`, `--shadow-card-hover`, `card-atmosphere`, `--bg-secondary`. GlassPanel and Section use section-lift where applied. Footer uses `bg-[var(--bg)]/50` and `border-[var(--text)]/10`. Surfaces feel cohesive.

6. **CTA clarity:** Booking (submit + EPK/Photos), Shop (Add to Cart / Buy Now), Media (view gallery/video), Events (view details / Tickets), Product (Add to Cart / Buy Now). Primary actions are clear and not aggressive.

7. **Admin:** Spacing and card/form layout are readable; no redesign.

## Files changed

| File | Change |
|------|--------|
| `app/epk/page.tsx` | Added `mt-20` to content section for post-hero rhythm consistency. |
| `docs/PHASE34_FINAL_HARMONY_PASS.md` | This file. |

## Acceptance checklist

- [x] Section rhythm feels consistent (mt-20 post-hero where applicable; EPK aligned).
- [x] Divider pacing balanced (no stacking; breaks where needed).
- [x] Typography spacing calm (header/body/intro; no scale change).
- [x] Motion timing unified (~200ms / ~250ms).
- [x] Surfaces cohesive (cards, glass, section-lift, footer).
- [x] CTAs clear on all audited pages.
- [x] Admin readable (light pass).
- [x] Hero untouched (Phase 35).
- [x] CornerNav untouched.
- [x] Uploadcare untouched.
- [x] `npm run build` passes.

## After Phase 34

Return control to backlog phases. **Phase 35** remains the hero stutter backlog.
