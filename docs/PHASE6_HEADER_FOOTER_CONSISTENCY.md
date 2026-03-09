# Phase 6 — Header / Footer Consistency Layer

## Goal
Polish global site structure and behavior while **keeping corner navigation exactly where it is**. Refine only: spacing, animation, hover, mobile safety, footer.

---

## 1) Files changed

| File | Change |
|------|--------|
| `components/layout/CornerNav.tsx` | Transitions 200ms ease-out (opacity + color); safe-area and max-width on corner links; mobile logo/hamburger smaller and truncate; removed scale on social buttons. |
| `components/layout/Footer.tsx` | Replaced with minimal luxury footer: centered, “Divine Timing” / “By {member1} & {member2}”, links Events/Media/Shop/Booking, social Spotify/YouTube/Instagram; accepts `siteSettings`. |
| `components/layout/PublicLayout.tsx` | Added global `Footer`; layout flex so footer sticks to bottom (`min-h-screen`, `flex-1` on content). |
| `app/events/page.tsx` | First section after hero: `mt-20 py-16` (replaced `section-padding`). |
| `app/media/page.tsx` | `mt-20` after hero; main content wrapped in `section` with `py-16`. |
| `app/shop/page.tsx` | `mt-20` after hero; `section.py-16` around ShopPageClient. |
| `app/booking/page.tsx` | `mt-20` after hero; BookingStoryScroll in `section.py-16`. |
| `app/events/[slug]/page.tsx` | Removed local `Footer` (uses layout footer). |
| `app/about/page.tsx` | Removed local `Footer`. |
| `app/media/galleries/[slug]/page.tsx` | Removed local `Footer`. |
| `lib/ui/motion.ts` | Added `fadeUpSubtle` (opacity + y: 8). |
| `components/motion/PageTransition.tsx` | Uses `fadeUpSubtle` when motion allowed, 250ms; respects `prefers-reduced-motion`. |

---

## 2) Behavior improved

### 6.1 Navigation behavior (no layout change)
- All nav link and logo hovers use **200ms** transitions (opacity + color). No scale or bounce.
- Sticky bar animation set to **0.2s**. Center logo (non-home) uses **0.22s** with optional reduced-motion shortcut.
- Corner links use the same transition style for consistency.

### 6.2 Mobile safety
- Corner nav cells use `min-w-0 max-w-[calc(100vw-8rem)]` and `env(safe-area-inset-*)` so links don’t overflow or clip.
- Mobile logo: `text-base`, `max-w-[60vw]`, `truncate` so “DIVINE:TIMING” doesn’t overflow on 375px.
- Hamburger icon: `w-5 h-5` on small screens, `w-6 h-6` from `sm` up; no layout shift.
- Social buttons in mobile menu: removed `active:scale-[0.98]` to avoid scale effects.

### 6.3 Footer
- Single **minimal luxury** footer: “Divine Timing”, “By Liam Bongo & Lex Laurence” (or `site_settings` member names).
- Links: Events, Media, Shop, Booking.
- Social: Spotify, YouTube, Instagram (from `getPlatformLinks`, filtered).
- Centered, small text, `border-t border-white/10`, `py-16`, no heavy styling.
- Rendered once in **PublicLayout** so it appears on all public pages; duplicate footers removed from events/[slug], about, media/galleries/[slug].

### 6.4 Section rhythm
- **Hero → first section:** `mt-20` (5rem) on Events, Media, Shop, Booking.
- **Sections:** `py-16` for main content blocks on those pages.
- Calm, consistent vertical spacing without changing nav or hero structure.

### 6.5 Motion
- **PageTransition:** When motion is allowed, uses opacity + **translateY(8px)** over **250ms**; when `prefers-reduced-motion`, opacity-only and ~0.01s.
- No dramatic motion; same philosophy across the app.

---

## 3) Acceptance checklist

- [x] Corner navigation remains exactly where it is (no repositioning).
- [x] Mobile layout: no overflow; safe-area and max-width on corner nav; logo truncates; hamburger sized for touch.
- [x] Footer appears on all public pages via PublicLayout; duplicate footers removed from event detail, about, gallery detail.
- [x] Section spacing: Hero → first section `mt-20`; sections `py-16` on Events, Media, Shop, Booking.
- [x] Motion: subtle (opacity + 8px Y, 200–250ms); respects `prefers-reduced-motion`; no scale/bounce on nav.
