# Phase 18 — Performance + Media Reliability

**Goal:** Stabilize public media behavior and improve reliability/performance without reopening hero-stutter work.

## Scope

- Media hub reliability (collections, gallery routes, empty states, covers/placeholders)
- Public media performance (lazy load, blur/skeleton/fallback behavior)
- Reliability pass on `/media`, `/media/galleries/[slug]`, collection cards
- No hero redesign, no Uploadcare in active flows, no new large visual systems

---

## Files changed

| File | Change |
|------|--------|
| `app/media/galleries/[slug]/loading.tsx` | **New.** Loading UI for gallery detail route: back link placeholder, title/description skeletons, `LuxurySkeletonGrid` for grid. |
| `components/media/MediaTile.tsx` | Added `loading="lazy"` to both `Image` instances (image and video thumbnail) for gallery grid tiles. |
| `components/media/MediaPageClient.tsx` | Collection cards: when gallery has no slug, render a non-link card (same visual, no `href="#"`) so navigation is not broken; play icon overlay only when `hasSlug`. |
| `docs/PHASE18_PERFORMANCE_MEDIA_RELIABILITY.md` | **New.** This doc. |

---

## What changed

### 1. Gallery detail loading state

- **`app/media/galleries/[slug]/loading.tsx`** — Next.js loading UI for the dynamic segment. Shows a simple header bar, skeleton lines for back link, title, and description, and `LuxurySkeletonGrid` (8 items, 2/3/4 columns) so the gallery detail route has a deliberate loading state instead of a blank or layout shift.

### 2. Lazy load on gallery grid tiles

- **`MediaTile.tsx`** — Both `Image` components (image type and video thumbnail) now use `loading="lazy"` so non-critical gallery images load as they enter the viewport. Blur placeholder and sizes unchanged.

### 3. Collection cards without slug

- **`MediaPageClient.tsx`** — Galleries are still always shown. If a gallery has a valid `slug`, the card is a `Link` to `/media/galleries/[slug]` and shows the play overlay on hover. If a gallery has no slug (edge case / bad data), the card is a non-interactive `div` with the same layout and styling and `aria-label` for accessibility; no `href="#"` and no click tracking. Keeps collection list stable and avoids broken links.

### 4. Unchanged by design

- **Hero:** Not modified (Phase 35 deferred).
- **Uploadcare:** Not touched; active flows remain Supabase-only.
- **Corner nav:** Unchanged.
- **Empty states:** Existing copy kept (“Media collections coming soon.”, “Videos coming soon.”, “No media in this collection yet.”).
- **`/media` page:** Still uses existing `loading.tsx` and `MediaPageClient`; no structural change beyond the card link/slug handling above.

---

## Acceptance checklist

- [ ] **`/media`** — Loads; Collections and Videos tabs work; collection cards with slug link to gallery detail; cards without slug render as non-links with same look; empty states show when no galleries/videos; no broken covers (placeholder or resolved cover).
- [ ] **`/media/galleries/[slug]`** — Valid slug loads gallery; loading UI (skeleton) appears during navigation; empty gallery shows “No media in this collection yet.”; back link and grid behave; invalid slug returns 404.
- [ ] **Performance** — Gallery grid images and video thumbnails use lazy loading; blur placeholders and skeletons remain; no new heavy assets or layout thrash.
- [ ] **Build** — `npm run build` passes.
- [ ] **No regressions** — Corner nav placement unchanged; hero untouched; Uploadcare not reintroduced.

---

When all items pass, Phase 18 is complete. Proceed to **Phase 19 — Shop Public Polish**.
