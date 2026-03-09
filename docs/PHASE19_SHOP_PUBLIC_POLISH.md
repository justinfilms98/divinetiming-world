# Phase 19 — Shop Public Polish

**Goal:** Make `/shop` feel premium and consistent with the rest of the site, with clear hierarchy, reliable cards, and clean product detail—without touching hero, CornerNav, or Uploadcare.

## Scope

- `/shop` page: layout hierarchy, card consistency (ratio, hover/focus, tokens), empty/loading states
- Product detail `/shop/[slug]`: header spacing, constrained media area, brand-consistent CTAs, mobile layout
- Shop navigation: Back to Shop link, no conflict with corner nav
- Performance + accessibility: lazy load where applicable, visible focus states, avoid layout shift

**Out of scope:** Hero, Phase 35 backlog, CornerNav positioning, Uploadcare, new dependencies.

---

## Files changed

| File | Change |
|------|--------|
| `components/shop/ShopPageClient.tsx` | Card design tokens (radius-card, shadow-card, shadow-card-hover); grid gap 8/12; empty state intentional (py-20, type-body); focus-visible on product Link and buttons; type-h3/type-button; secondary-style Add to Cart and View Options. |
| `app/shop/[slug]/page.tsx` | Back to Shop link (Link); main pt-20 md:pt-24; section padding py-12 md:py-16, px-4 md:px-8; image column max-w-md, max-h-[480px] on mobile; card border/shadow on image container; typography tokens; “No image” empty state. |
| `components/shop/ProductDetailClient.tsx` | Select/quantity/buttons use --radius-button, min-h-[48px], focus-visible ring; CTAs aligned with brand (secondary Add to Cart, primary Buy Now with shadow-button); type-label/type-body; flex-col sm:flex-row on button row for mobile. |
| `docs/PHASE19_SHOP_PUBLIC_POLISH.md` | **New.** This doc. |

---

## What changed

### 1) /shop page polish

- **Cards:** Product cards use `rounded-[var(--radius-card)]`, `shadow-[var(--shadow-card)]`, `hover:shadow-[var(--shadow-card-hover)]`, `border-[var(--accent)]/20` with hover `border-[var(--accent)]/50`. Transition duration 200ms. Image container uses same radius; hover uses `brightness-[1.03]` instead of scale to reduce layout risk.
- **Grid:** Gap reduced from gap-16 md:gap-24 to gap-8 md:gap-12 for tighter premium rhythm while keeping Container max-width.
- **Empty state:** “No products yet.” wrapped in a div with py-20, text-lg, tracking-wide, type-body for a clear intentional state.
- **Focus:** Product link and both buttons (Add to Cart, View Options) have `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]`. Buttons use `rounded-[var(--radius-button)]` and type-button for consistency.

### 2) Product detail

- **Back link:** “← Back to Shop” as `<Link href="/shop">` with accent hover and focus-visible ring for nav consistency (matches gallery “Back to Media”).
- **Header spacing:** `main` uses `pt-20 md:pt-24` so content clears the corner nav and feels consistent with other pages.
- **Media area:** Image column wrapped in `w-full max-w-md mx-auto md:mx-0`; image container has `max-h-[480px] md:max-h-none` so the product image doesn’t dominate on large screens. Container uses `rounded-[var(--radius-card)]`, border, and shadow-card. “No image” uses type-body and muted text.
- **CTAs:** Add to Cart and Buy Now use `min-h-[48px]`, `rounded-[var(--radius-button)]`, type-button. Add to Cart: border style consistent with secondary CTAs. Buy Now: `bg-[var(--accent)]`, `hover:bg-[var(--accent-hover)]`, `shadow-[var(--shadow-button)]`, focus-visible ring. Variant select and quantity buttons use same radius and focus styles.
- **Mobile:** Button row is `flex-col sm:flex-row gap-4` so stacked on small screens; details column has `min-w-0` to avoid overflow.

### 3) Shop navigation

- Back to Shop is the only nav change; CornerNav and Shop link behavior are unchanged.

### 4) Performance + accessibility

- Product list images already use `loading="lazy"`; product detail hero image keeps `priority`. No new layout shift: aspect ratios and containers unchanged except for intentional max-height on product image.
- All interactive elements (product link, Add to Cart, View Options, variant select, quantity ±, Add to Cart, Buy Now, Back to Shop) have visible focus-visible styles.

---

## Acceptance checklist

- [ ] **/shop** loads, looks consistent with the rest of the site, has clear spacing, and no overlap with header/corner nav.
- [ ] **Product cards** are clickable with clear hover and focus states; card style matches design tokens.
- [ ] **Product detail** exists: Back to Shop works, CTA works, layout is constrained (no giant overflow), mobile is clean (no overlap, no cramped columns).
- [ ] **No regressions:** Media pages still work; hero untouched; Uploadcare untouched; CornerNav untouched.
- [x] **Build** passes (`npm run build`).

---

When all items pass, Phase 19 is complete. Proceed to **Phase 20 — SEO + Metadata final polish / verification**.
