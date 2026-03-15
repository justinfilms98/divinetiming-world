# Phase 43 — Visual alignment and polish output

**Status:** Code changes applied. Push to preview branch and capture before/after screenshots from the new preview URL.

---

## 1. Root cause: why content was still left-biased after rails

- **ContentRail** only provided a centered *outer* band (`max-w-[1200px] mx-auto`). It did not center the *content block* inside that band. So the rail was centered on the page, but the **inner** wrappers (grids, panels, flex) had no `items-center` / `justify-items-center` / `max-w-* mx-auto`, so the visible block stayed left-aligned within the rail.
- **Grid** had no default `w-full`, so the grid could shrink to content width and sit at the start of the rail.
- **GlassPanel** used `max-w-4xl` on the media page, so the panel was narrow and the grid inside could still sit left within the panel.
- **Footer** had no max-width on the inner block, so the “centered” column could stretch and feel left-heavy.
- **Booking and detail pages** used full-width grids without a centered cap, so the form/detail block was not visually centered as a group.

---

## 2. Exact files changed

| File | Change |
|------|--------|
| `components/layout/ContentRail.tsx` | Wrap children in `<div className="w-full flex flex-col items-center">` so the content block is centered inside the rail. |
| `components/ui/Grid.tsx` | Add default `w-full` so grids take full rail width and `justify-items-center` centers items. |
| `components/shop/ShopPageClient.tsx` | Add `w-full` to wrapper and motion.div; add `w-full` to Grid. |
| `app/globals.css` | `.hero-cta-primary`: add `!important` to color, background, border so overrides don’t flip to white/gold; fix transition to `text-decoration`. |
| `components/layout/Footer.tsx` | Add `max-w-2xl mx-auto` to the inner content div so footer is a single centered column. |
| `components/media/MediaPageClient.tsx` | Use full rail width: `flex-1 w-full max-w-full`; GlassPanel `className="w-full !max-w-none mx-auto"`; Grid `cols={3}`, `gap-10 md:gap-12`, `w-full`. |
| `components/ui/GlassPanel.tsx` | Keep default `max-w-4xl mx-auto`; media page overrides with `!max-w-none`. |
| `app/booking/page.tsx` | Wrap form grid in `max-w-5xl mx-auto` so form + side cards are a centered block. |
| `components/events/EventsListClient.tsx` | Add `w-full max-w-full` to root; wrap event list in `max-w-4xl mx-auto` so cards are a centered column. |
| `app/events/[slug]/page.tsx` | Add `max-w-5xl mx-auto w-full` to the detail grid so event content + sidebar are centered. |
| `app/shop/[slug]/page.tsx` | Add `max-w-5xl mx-auto w-full` to the product grid so image + details are centered. |
| `app/admin/events/page.tsx` | Add `min-w-0 flex-1` to content div; add `min-w-0 flex-1` and fallback "Untitled" / "—" for title and venue so cards stay readable and editable. |
| `components/media/VideoFeed.tsx` | Detect orientation: `onLoadedMetadata` reads `videoWidth`/`videoHeight`; if `width >= height` use `aspect-video`, else `aspect-[9/16]`. Horizontal footage fills a 16:9 container instead of letterboxed vertical. |

---

## 3. What was fixed (summary)

- **Inner centering:** ContentRail now wraps content in a centered flex column; grids and key sections use `w-full` and/or `max-w-* mx-auto` so the visible block is centered with balanced margins.
- **Footer:** Footer content is a single column with `max-w-2xl mx-auto` so it’s a centered block.
- **CTA:** Primary CTA uses `!important` on color, background, and border so default stays gold/white border/black text and hover stays white/black/underline.
- **Shop:** Product grid and product detail use full width plus centered cap (`max-w-5xl mx-auto` where appropriate).
- **Events:** Events list in a centered column (`max-w-4xl mx-auto`); event detail grid centered (`max-w-5xl mx-auto`).
- **Media:** Media page uses full rail width; collections grid 3 cols, larger gap, full width; VideoFeed aspect ratio by orientation.
- **Booking:** Form + side cards wrapped in `max-w-5xl mx-auto` for a centered composition.
- **Admin events:** Card content given min-width and fallbacks so title, venue, date, status, thumbnail stay visible and editable.
- **Video orientation:** Horizontal library videos use a 16:9 container so they fill without large letterboxing.

---

## 4. Required next steps (operator)

1. **Push** the Phase 43 changes to your preview branch and wait for the new Vercel deployment.
2. **Note the new preview URL** (e.g. from Vercel dashboard or GitHub).
3. **Capture before/after screenshots** from that **new** preview for:
   - Homepage (hero + nav CTA)
   - Footer
   - /shop
   - /shop/[slug]
   - /events
   - /events/[slug]
   - /media (Collections tab)
   - /media (Videos tab; confirm horizontal video uses landscape container)
   - /booking
   - Admin events list
   - Admin booking inquiries
4. **Do not mark the phase complete** until the site is visually centered, the footer is a single centered block, and the CTA styles match the requested behavior (gold default, white hover with underline) on the new preview.

---

## 5. Remaining / follow-up

- If any page still feels left-biased, add a `max-w-* mx-auto` (or equivalent) to the **inner** content wrapper for that page so the visible block is centered within the rail.
- CTA hover (underline) is in CSS; if a component adds a conflicting background/border, remove that class or increase CTA selector specificity.
