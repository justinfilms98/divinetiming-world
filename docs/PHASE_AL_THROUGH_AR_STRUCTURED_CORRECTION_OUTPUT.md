# Phases AL–AR — Structured Correction Wave — Output Summary

Baseline: footer rebuild, booking rebuild V2, detail spacing, event thumbnail admin fallback, media videos schema/admin/feed scaffold. This pass adds premium composition, booking beauty, shop operator confidence, event thumbnail hardening, detail-page destination feel, video feed UX, and public QA hardening.

---

## 1. Phase AL — Premium Composition Pass

**Objective:** Stronger spacing rhythm, section weighting, and visual balance across public pages without changing architecture.

**Changes made:**

- **Home:** `SignatureDivider` given `className="my-14 md:my-20"` for more breathing room below the hero.
- **Shop:** `SignatureDivider` set to `my-14 md:my-16`; `Section` to `py-14 md:py-20`. Intro copy in `ShopPageClient` uses `mb-12 md:mb-14` and `leading-relaxed`.
- **Events:** `Section` uses `py-14 md:py-20`; intro paragraph `mb-12 md:mb-14` and `leading-relaxed`.
- **Media:** `SignatureDivider` `my-14 md:my-16`; `Section` `py-14 md:py-20`; intro `mb-12 md:mb-14` and `leading-relaxed`.
- **Shop list empty state:** `py-24 md:py-32`, copy `max-w-[40ch] mx-auto` and “Check back soon.”

**Result:** More consistent vertical rhythm and intro placement; empty states feel intentional rather than cramped.

---

## 2. Phase AM — Booking Beauty Pass

**Objective:** Refine hero-to-band transition, form and aside card styling, and typography for a calmer, premium feel.

**Changes made:**

- **Band:** Background `bg-[var(--bg-secondary)]/40` → `bg-[var(--bg-secondary)]/30`; border `border-[var(--text)]/5` → `border-[var(--text)]/[0.06]`.
- **Section spacing:** Container `py-16 md:py-24`; header `mb-14 md:mb-16`; subtext `mt-5`; grid `gap-14 lg:gap-16`.
- **Form card:** `shadow-[var(--shadow-card)]`, `border-[var(--accent)]/10`, `bg-[var(--bg)]`, `rounded-2xl`.
- **Aside cards:** `border-[var(--accent)]/[0.08]`, `bg-[var(--bg)]/80`, `rounded-xl`; headings `font-medium` and `mb-3.5`.
- **BookingBioSection / BookingAboutCard:** Same border and background overrides and heading weight so all aside blocks match.
- **SignatureDivider** above/below story: `my-14 md:my-16`.

**Preserved:** Architecture, form behavior, and all content blocks.

---

## 3. Phase AN — Shop Operator Confidence

**Objective:** Clearer admin product cards, image state, and modal; more polished public product cards.

**Admin shop** (`app/admin/shop/page.tsx`):

- Product card: Flex layout so content and status sit in a clear hierarchy; image area shows “No image” plus “Add in edit” when empty; on image error, “Image unavailable” plus icon.
- Status/featured/badge: `rounded-md`, `font-medium`, tighter `gap-1.5` and `mt-auto pt-2` so badges sit at bottom of card.
- Title: `font-semibold` with `var(--font-display)`; price with `text-sm`.
- Edit/Delete: `p-2.5`, hover `bg-white/10` and `bg-red-400/10` for clearer affordance.
- Modal: `rounded-2xl`; header padding `px-5 py-4`; form `p-5 space-y-5`; modal title uses display font.

**Public shop** (`components/shop/ShopPageClient.tsx`):

- Product card: `rounded-2xl`, `p-6 md:p-8`, border `border-[var(--accent)]/15`, hover `hover:-translate-y-0.5`.
- Image container: `mb-6`, `border border-[var(--accent)]/5`, `bg-[var(--bg)]/80`; placeholder when no image: display font, `text-[var(--text-muted)]/50`, “—” with `tracking-widest`.
- Badges: `gap-2`, `mb-3`, `rounded-md`, `px-2.5 py-1`; title `mb-1.5`; subtitle `mb-2.5`; price `mb-6`.
- Empty state: `py-24 md:py-32`, copy `max-w-[40ch] mx-auto`, “Check back soon.”

**Result:** Admin cards and modal are easier to scan; public cards feel less skeletal when image or copy is minimal.

---

## 4. Phase AO — Event Thumbnail Proof Pass

**Objective:** Ensure event thumbnails are stored and displayed reliably for both upload and library flows.

**Flow verified:**

- **Admin:** Upload sets `thumbnail_url` (and optionally asset id); library sets `thumbnail_url` = asset `preview_url` and `external_thumbnail_asset_id` = asset `id`. Hidden inputs and submit include both. Display uses `resolved_thumbnail_url` when `thumbnail_url` is missing (fix from Phase AH).
- **API:** Event POST now trims `thumbnail_url` and `external_thumbnail_asset_id` and coerces empty string to null (`app/api/admin/events/route.ts`), so whitespace or empty strings are not stored.

**Change made:** In `app/api/admin/events/route.ts`, build `eventData` using `thumbUrl` and `extThumbId` derived from trimmed strings and null fallback.

**Result:** Save/reopen and public list/detail already use the same resolution path; API is more robust to input quirks.

---

## 5. Phase AP — Detail Page Destination Pass

**Objective:** Stronger narrative spacing and hierarchy on shop, event, and gallery detail so they feel like destination pages.

**Shop detail** (`app/shop/[slug]/page.tsx`):

- Description block: `space-y-5`, `mb-12`.
- CTA separator: `pt-6 mt-2` and `border-t border-[var(--accent)]/10` for clearer split between description and purchase block.

**Event and gallery detail:** No further changes this pass; existing spacing and sticky sidebar from Phase AG/AD remain.

---

## 6. Phase AQ — Media Videos UX Pass

**Objective:** Make the video feed feel intentional and premium rather than scaffold-only.

**Changes made** (`components/media/VideoFeed.tsx`):

- Wrapper: `max-w-[min(380px,92vw)]`, `py-4`.
- Player frame: `max-h-[78vh]`, border `border-[var(--accent)]/15`, `ring-1 ring-[var(--text)]/5`.
- Title: No truncate; `line-clamp-2`, `font-medium`, `tracking-tight`.
- Caption: `mt-2`, `type-small`, `line-clamp-3`, `max-w-[90%] mx-auto`.
- Prev/next: `gap-8`, `mt-8`, buttons `min-w-[48px] min-h-[48px]`, `border-[var(--accent)]/25`, `hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/40`, `transition-all duration-200`, focus ring with offset.
- Counter: `min-w-[4ch]` for stable layout.

**Result:** Clearer hierarchy, calmer frame, and more consistent controls.

---

## 7. Phase AR — Public QA Hardening

**Objective:** Consistent empty states, spacing, and alignment across public pages.

**Changes made:**

- **Events list empty:** `py-20 md:py-24`; copy `type-body leading-relaxed max-w-[40ch] mx-auto` (`components/events/EventsListClient.tsx`).
- **Media empty (Collections / Videos):** `py-24 md:py-32`; copy `type-body leading-relaxed max-w-[40ch] mx-auto` (`components/media/MediaPageClient.tsx`).
- **Booking aside cards:** Bio and About cards aligned with Contact/EPK/Partners styling (border, background, rounded-xl, heading weight) in `BookingBioSection.tsx` and `BookingAboutCard.tsx`.

**Checked:** Home, shop, shop detail, events, event detail, media, gallery detail, booking, and press kit use `pt-24 md:pt-28` (or equivalent) where content sits under the sticky nav; footer uses the shared rail. No additional overlap or alignment issues were changed in this pass.

---

## 8. Files Changed

| File | Changes |
|------|--------|
| `app/page.tsx` | SignatureDivider my-14 md:my-20 |
| `app/shop/page.tsx` | SignatureDivider + Section padding; fix my-18 → my-16 |
| `app/events/page.tsx` | Section padding; intro mb + leading-relaxed |
| `app/media/page.tsx` | SignatureDivider + Section padding; intro mb + leading-relaxed |
| `components/shop/ShopPageClient.tsx` | Intro spacing; empty state; card style, image placeholder, badges, price spacing |
| `app/booking/page.tsx` | Band bg/border; section/header/grid spacing; form + aside card styling |
| `components/booking/BookingBioSection.tsx` | Card border/bg/rounded + heading weight |
| `components/booking/BookingAboutCard.tsx` | Card border/bg/rounded + heading weight (both branches) |
| `app/admin/shop/page.tsx` | Product card layout, image states, status badges, modal padding/title |
| `app/api/admin/events/route.ts` | Trim thumbnail_url and external_thumbnail_asset_id; null fallback |
| `app/shop/[slug]/page.tsx` | Description space-y-5 mb-12; CTA block pt-6 mt-2 |
| `components/media/VideoFeed.tsx` | Frame, title/caption hierarchy, prev/next styling and spacing |
| `components/media/MediaPageClient.tsx` | Empty state padding and copy styling |
| `components/events/EventsListClient.tsx` | Empty state padding and copy styling |

---

## 9. Blockers Still Remaining

- **Event thumbnails:** If they still fail in production, confirm in DB that `thumbnail_url` or `external_thumbnail_asset_id` is set after save and that `external_media_assets` has a valid `preview_url` and is readable (RLS).
- **Videos migration:** Ensure `034_videos_caption_vertical.sql` is applied where the app expects `caption` and `is_vertical`.
- **Shop admin:** Reorder products, bulk actions, and richer empty states were not in scope; can be a follow-up.

---

## 10. Manual QA Checklist

Use this to verify locally.

**Phase AL — Premium composition**
- [ ] Home: Space below hero (SignatureDivider) feels balanced.
- [ ] Shop / Events / Media: Section padding and intro copy spacing feel consistent; no cramped blocks.
- [ ] Shop list empty state: Centered, readable, “Check back soon.”

**Phase AM — Booking**
- [ ] Inquiry band feels calm; form and aside cards share a clear visual system.
- [ ] All aside blocks (Contact, EPK, Bio, About, Partners) look consistent (border, bg, rounded, heading weight).

**Phase AN — Shop**
- [ ] Admin: Product cards show image or clear “No image” / “Add in edit”; status/featured/badge are easy to see; Edit/Delete are obvious.
- [ ] Admin: Modal is readable; form spacing and title font look correct.
- [ ] Public: Product cards have clear hierarchy; placeholder when no image is subtle; empty state is centered and friendly.

**Phase AO — Event thumbnails**
- [ ] Set event thumbnail (upload), save, reopen: thumbnail still shows.
- [ ] Set event thumbnail (library), save, reopen: thumbnail still shows.
- [ ] Public events list and event detail show the same thumbnail when set.

**Phase AP — Detail pages**
- [ ] Shop detail: Description and CTA block are clearly separated; spacing feels narrative.

**Phase AQ — Videos**
- [ ] Media → Videos tab: 9:16 frame, title/caption, prev/next with hover and focus; counter stable.

**Phase AR — QA**
- [ ] Events list: Empty state (upcoming or past) has comfortable padding and centered copy.
- [ ] Media: Empty Collections and empty Videos states have comfortable padding and copy.
- [ ] All public pages: No content under the sticky nav; footer aligned on the same rail.
