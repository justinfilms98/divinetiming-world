# Phase 11 — Design System Lock

## Goal
Create reusable UI components and tokens so every page follows the same design language. No visual redesign; lock spacing, containers, cards, buttons, and typography.

---

## 1) Files modified

| File | Change |
|------|--------|
| `app/globals.css` | **11.1** `.container-standard` (max-width 1200px, px-5 md:px-8). **11.5** `.type-h1` / `.type-h2` + `font-weight: 600`; new `.type-micro-label` (text-xs uppercase tracking-[0.18em]). |
| `components/ui/Container.tsx` | **New.** **11.1** Shared container: `max-w-[1200px] mx-auto px-5 md:px-8`, optional `noPadding`. |
| `components/ui/Section.tsx` | **New.** **11.2** Section wrapper: `py-12 md:py-16`, optional `title`, `subtitle`; spreads HTML section attributes (`id`, `aria-label`, etc.). |
| `components/ui/Card.tsx` | **New.** **11.3** Shared card: `rounded-xl`, default variant `border-[var(--accent)]/20`, `shadow-[var(--shadow-card)]`; optional `hover`, `variant="dark"` (white/10); optional `as` (e.g. `aside`). |
| `components/ui/LuxuryButton.tsx` | **11.4** Removed `active:scale-[0.98]`; transition limited to `duration-[200ms]` and color/border/shadow/filter only (no scale). |
| `app/events/page.tsx` | Uses `Section` + `Container` for events list. |
| `app/events/[slug]/page.tsx` | Uses `Container` for main content. |
| `app/media/page.tsx` | Uses `Section` + `Container` around `MediaPageClient`. |
| `components/media/MediaPageClient.tsx` | GlassPanel no longer sets `max-w-[1200px]` (Container provides width). |
| `app/media/galleries/[slug]/page.tsx` | Uses `Container` for main. |
| `app/booking/page.tsx` | Uses `Section` and `Container` for story and booking-form sections. |
| `app/shop/page.tsx` | Uses `Section` for shop content. |
| `components/shop/ShopPageClient.tsx` | Uses `Container`; empty state text uses `text-[var(--text-muted)]`. |
| `components/about/AboutContent.tsx` | Uses `Container` for content (replaces max-w-5xl mx-auto px-4). |
| `components/events/EventDetailCard.tsx` | Uses shared `Card` with `as="aside"`. |

---

## 2) New shared components

### Container (`components/ui/Container.tsx`)
- **Behavior:** `max-w-[1200px] mx-auto px-5 md:px-8`, optional `noPadding`, merge `className`.
- **Use:** Events, Media, Booking, Shop, About — any page that needs the standard content width.

### Section (`components/ui/Section.tsx`)
- **Behavior:** `py-12 md:py-16`, optional `title` (H2), `subtitle`; forwards `id`, `aria-label`, etc.
- **Use:** Vertical rhythm between sections; wrap content that needs consistent section padding.

### Card (`components/ui/Card.tsx`)
- **Behavior:** `rounded-xl`, default: `border-[var(--accent)]/20`, `bg-[var(--bg-secondary)]`, `shadow-[var(--shadow-card)]`. Optional `hover` (border/shadow on hover), `variant="dark"` (border-white/10, bg-white/5). Optional `as` (e.g. `"aside"`, `"article"`).
- **Use:** Event cards, collection cards, shop items, event detail panel, admin panels where appropriate.

### Button system (existing `LuxuryButton`)
- **Variants:** `primary` (accent, strong CTA), `secondary` (outline), `ghost`, `subtle`, `danger`.
- **Rules:** 200ms transition on color/border/shadow/filter only; no scale on hover or active.

---

## 3) Pages updated to use shared components

- **Events list:** `Section` + `Container` (replaces content-width + px-6).
- **Event detail:** `Container`; event card uses `Card as="aside"`.
- **Media hub:** `Section` + `Container`; `MediaPageClient` no longer sets max-width.
- **Gallery detail:** `Container`.
- **Booking:** `Section` for story and booking-form; `Container` for form grid.
- **Shop:** `Section`; `ShopPageClient` uses `Container`.
- **About:** `AboutContent` uses `Container` (replaces max-w-5xl px-4).

---

## 4) Typography scale (locked)

- **H1:** `.type-h1` — font-display, var(--text-h1), **font-semibold**, tight line-height/letter-spacing.
- **H2:** `.type-h2` — font-display, var(--text-h2), **font-semibold**, tight.
- **Body:** `.type-body` — font-ui, var(--text-body), var(--line-height-body).
- **Micro label:** `.type-micro-label` — 0.75rem, uppercase, letter-spacing 0.18em, muted (hero labels, metadata).

---

## 5) Acceptance checklist

- [x] Container width standardized (1200px, px-5 md:px-8) across Events, Media, Booking, Shop, About.
- [x] Section spacing consistent (py-12 md:py-16) where Section is used.
- [x] Shared Card component implemented (default + dark variant, optional hover, optional `as`).
- [x] Button variants standardized (LuxuryButton: primary/secondary/ghost, 200ms, no scale).
- [x] Typography scale applied (type-h1/type-h2 font-semibold; type-micro-label added).
- [x] No layout regressions (same pages, same structure; only container/section/card standardized).
- [x] Build passes.

---

**Phase 7–10 behavior unchanged.** Future pages should use `Container`, `Section`, `Card`, and `LuxuryButton` (and typography classes) to stay on-system.
