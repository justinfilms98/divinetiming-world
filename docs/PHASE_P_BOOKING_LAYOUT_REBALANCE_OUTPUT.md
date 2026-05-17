# Phase P — Booking Layout Rebalance — Output

**Focus:** Booking page centered, premium, and conversion-oriented. Hero admin, media, and shop untouched.

---

## 1. Root cause of booking left-heaviness

- **Section heading outside container:** The "Booking inquiries" section used `Section`'s `title` and `subtitle` props, which render a `<header>` as the first child of the section. That header is **not** inside the `Container`; only the grid was inside the container. So the heading spanned the full viewport width with no horizontal padding or max-width, while the form and aside sat in a 1200px container below. The heading could align to the left edge of the viewport and the content block started at the container’s left edge, which made the whole block feel left-aligned and heavy on the left.
- **Full-width grid in 1200px container:** The two-column grid used `grid-cols-12` with form `col-span-7` and aside `col-span-5` and no max-width on the grid itself. So the grid stretched to the full 1200px container (minus padding). The form column (7/12 ≈ 700px) dominated; the aside (5/12 ≈ 500px) felt like a narrow strip with no intentional cap, and the block didn’t feel centered on wide viewports.
- **Large gap:** `gap-10 lg:gap-14` (2.5rem / 3.5rem) between columns added empty space without a clear “centered block” boundary.
- **Aside cards not explicitly full-width:** Cards in the aside didn’t all have `w-full`, so in some flex/layout cases they might not have filled the column, leaving dead space to the right of the cards.

---

## 2. Exact layout fixes made

- **Heading inside container:** Removed `title` and `subtitle` from `Section` and rendered the heading inside the same `Container` as the grid. The "Booking inquiries" H2 and subtitle now share the container’s max-width and horizontal padding, so they align with the form and aside and the section reads as one centered block.
- **Centered two-column block:** Wrapped the grid in a wrapper with `max-w-[1000px] mx-auto`. The form + aside block is now capped at 1000px and centered within the container, so it no longer stretches to full 1200px and feels intentionally centered.
- **Rebalanced grid:** Replaced `lg:grid-cols-12` with `lg:grid-cols-[1fr_minmax(280px,340px)]`. The form column takes the remaining space (`1fr`); the aside is a fixed rail between 280px and 340px. The form stays substantial; the aside reads as a supporting rail instead of an afterthought.
- **Reduced gap:** Column gap changed from `gap-10 lg:gap-14` to `gap-8 lg:gap-12` to tighten the relationship between form and aside.
- **Mobile unchanged:** Layout remains a single column on small screens (`grid-cols-1`); form and aside stack with the same gap.

---

## 3. Hero-to-form transition changes

- **Tighter section top padding:** The inquiry section no longer uses the default `Section` vertical padding. It uses `pt-10 md:pt-12 pb-12 md:pb-16` so the top padding is slightly reduced and the transition from the divider (or story scroll) into "Booking inquiries" is tighter.
- **Divider above form:** When `BookingStoryScroll` is present, the `SignatureDivider` that sits directly above the form section is given `className="mb-8 md:mb-10"` so its bottom margin is smaller than the default `my-12 md:my-16`, shortening the gap between divider and section content.
- **Single rhythm:** Heading (inside container) uses `mb-8 md:mb-10` so the spacing from heading → grid is consistent with other sections. Hero → divider → [story] → divider → heading → grid now has a clear, tightened rhythm.

---

## 4. Aside-card improvements

- **Unified rail:** The aside is a single `flex flex-col gap-6` column with `lg:min-w-[280px]` so it behaves as one supporting rail. All cards use consistent `gap-6` (reduced from `gap-8`) for even vertical rhythm.
- **Card width:** Every card in the aside has `w-full` so they fill the aside column and there’s no dead space to the right. Applied to inline Cards and to `BookingBioSection` / `BookingAboutCard` (Card `className` includes `w-full`).
- **Typography and spacing:** Contact and EPK cards use `mb-3` for title-to-content; EPK body and button group use `text-sm` and slightly smaller padding (`px-4 py-2.5`) so the rail feels compact and hierarchical. Partners card uses `type-h3`-style label with `text-xs font-semibold uppercase` and `text-sm` body for a clear secondary hierarchy.
- **Borders:** All aside cards keep `border border-[var(--accent)]/10` so the rail is visually unified.

---

## 5. Footer / page-end alignment fixes

- **Verification only:** The site `Footer` already uses `max-w-[1200px] mx-auto px-5 md:px-8`, matching the `Container` used on the booking page. The booking content is inside the same layout (PublicLayout) and uses the same container constraints for the inquiry section. No code change was made to the footer.
- **Content rail:** With the section heading and grid both inside the container and the grid wrapper at `max-w-[1000px] mx-auto`, the main content sits on a single centered rail. The footer remains on the same 1200px centered rail, so there is no horizontal drift at the bottom of the page.

---

## 6. Files changed

| File | Change |
|------|--------|
| `app/booking/page.tsx` | Moved section heading inside Container; added `max-w-[1000px] mx-auto` wrapper around grid; grid changed to `lg:grid-cols-[1fr_minmax(280px,340px)]` with `gap-8 lg:gap-12`; Section given custom padding `pt-10 md:pt-12 pb-12 md:pb-16`; aside given `gap-6`, cards given `w-full` and tightened typography/padding; SignatureDivider above form given `className="mb-8 md:mb-10"` when story scroll exists. |
| `components/booking/BookingBioSection.tsx` | Card `className` updated to include `w-full`. |
| `components/booking/BookingAboutCard.tsx` | Card `className` updated to include `w-full` in both return branches. |

---

## 7. Remaining blockers before P5 (admin shell confidence)

- **None specific to booking.** The booking page layout is rebalanced, centered, and aligned with the footer. Next step is P5 (admin shell: centering, width, spacing, success/error feedback, published/draft/incomplete states) per Phase M–R.
