# Divine Timing — visual quality audit (2026-10-26)

A refinement pass, not a redesign. Nothing has been changed yet; fixes start once the batches below are approved.

## How this was measured

- Production (`divinetiming.world`) was captured with headless Edge, using phone emulation (touch, mobile user agent).
- Sizes: 360, 390, 430, 844×390 (phone landscape), 768, 1024 and 1440.
- 21 routes were checked, including Shop both empty and with the demo product, and a 404 page.
- Screenshots and `metrics.json` are in `C:\Users\justi\dt-visual\before` (and `before-shop`).
- Measured on every page:
  - sideways overflow;
  - header image crop (rendered shape vs. original photo shape);
  - gap between the header and the first content, and the largest blank band;
  - H1 size and font;
  - tap targets under 44px;
  - inputs under 16px, which make iOS zoom.

This is emulation only. Final sign-off still needs a real iPhone (Safari) and a real Android phone (Chrome).

## Results that are already good

- No page scrolls sideways at any size.
- No form field triggers iOS zoom on focus.
- The mobile menu has a 44px button, a focus trap, and links about 52px tall.
- The homepage hero, collections hub, event detail and journey headers are well composed on desktop.

## Findings

**P0** = visibly broken or looks unfinished. **P1** = clear quality gap. **P2** = polish.

| # | Route(s) | Issue (measured) | Root cause | Files | Correction | Pri | Mobile impact |
|---|---|---|---|---|---|---|---|
| 1 | `/shop`, `/media`, `/contact`, `/events` | Header is a fixed 200px strip. At 1440 it's 7.2:1 and crops the photo **79–90%** (Shop shows hands, Media shows eyes). Phones are 160px tall and crop 40–70% | `compact` preset `aspect-[3/1] max-h-[200px]` | `components/hero/UnifiedHero.tsx` | Replace with a responsive page-header preset: about 4:5 to 1:1 on phones, `clamp(420px, 58svh, 640px)` on desktop | P0 | High |
| 2 | `/collections`, `/events/[slug]`, `/journey`, `/about`, `/cart` | `standard` / `tall` presets are 16:9 with no cap. At 1440 they're 810px, taller than a laptop screen. Portrait sources are cropped about 63% | `aspect-[16/9]` with only a `min-h` | `UnifiedHero.tsx` | Cap at about `78svh`; use a portrait-friendly shape on phones | P1 | Medium |
| 3 | All heroes | Image is always centred; no focal point, no separate mobile crop or mobile image | Raw `<img>` with no `object-position`; no data fields | `components/ui/MediaAssetRenderer.tsx`, `hero_sections`, `DashboardHeroEditor.tsx` | Add desktop and mobile focal points plus an optional mobile image, with a tap-to-set focal picker and phone/desktop preview in admin | P0 | High |
| 4 | `/about`, `/cart` | 600–810px **empty black hero** when no image is set. About has no admin setting for its hero | Hero renders without media; `PAGE_KEYS` lacks `about` | `app/about/page.tsx`, `app/cart/page.tsx`, `DashboardHeroEditor.tsx` | No image means a short title band instead. Cart drops the hero. Add About and Journey to the hero editor | P0 | High |
| 5 | `/privacy`, `/terms`, `/refund`, `/shipping`, any bad URL | **Default unbranded Next.js 404** (white "404" on sand, system font). Every footer legal link lands there because policies are drafts pending the business address | No `app/not-found.tsx`; legal pages call `notFound()` while unpublished | `app/not-found.tsx` (new), `components/legal/LegalPageView.tsx` / legal routes | Branded 404 page. Legal routes show a branded "being finalised, contact us" state, and no policy text is published | P0 | High |
| 6 | `/shop`, `/media` | About **310px of stacked spacers** before content: empty `mt-20`, divider, `Section` padding, a lone spiral, then a repeated tagline. Empty Shop adds 128px above and below its message | Stacked wrappers; `cn()` doesn't resolve conflicting padding classes | `app/shop/page.tsx`, `app/media/page.tsx`, `MediaPageClient.tsx`, `components/ui/Section.tsx`, `lib/ui/cn.ts` | One shared spacing rhythm right after the header; remove duplicate intro text and spacers | P0 | High |
| 7 | `/contact` | 96px padding, then a second header block ("Three ways to connect"), then 220px-minimum cards | Page-level padding plus a duplicate heading | `app/contact/page.tsx` | Tighter rhythm; merge the duplicate heading; cards sized to their content | P1 | Medium |
| 8 | `/collections/[slug]` | **Portrait photos cropped to landscape**: frames 01 and 02 cut the artists at the neck | Frames forced to `aspect-[16/10] object-cover`; no width/height stored | `components/collections/CollectionStory.tsx`, `lib/content/server.ts`, uploader | Use each photo's real shape. Portraits get a narrower centred column or pair up side by side on wider screens. Never crop gallery frames; covers crop only with a focal point | P0 | High |
| 9 | `/collections`, `/media` cards | Covers forced to 4:3 or 16:9 with no focal point | `StoryCard.tsx` `object-cover` | `StoryCard.tsx` | Focal point per cover | P1 | Medium |
| 10 | `/`, `/media`, `/shop` empty states | Empty states are padded 128px top and bottom, and copy varies by page | Each page builds its own | `ShopPageClient.tsx`, `MediaPageClient.tsx`, `CollectionsHub.tsx`, `JourneyScroll.tsx`, events page | One shared `EmptyState`: compact, spiral mark, one line of copy, optional button. No invented content | P1 | Medium |
| 11 | `/` | No H1 on the homepage | Logo image used as the title | `app/page.tsx` / `UnifiedHero.tsx` | Add a screen-reader-only H1 ("DIVINE:TIMING") | P1 | — |
| 12 | Site-wide | Two title sizes: hero titles 40–64px, others 36–48px. Two eyebrow styles; ad hoc letter-spacing; raw sizes on `/label` and `/cart` | No shared page-title component | `globals.css` type classes, pages listed in the code audit | One `PageTitle` / `Eyebrow` scale | P2 | Low |
| 13 | Footer | Text links about 20px tall (13 links under 44px on phones) | `text-sm space-y-2` | `components/layout/Footer.tsx` | 44px-tall link rows on phones; solid background instead of translucent | P1 | High |
| 14 | `/shop` (with product, phone) | Floating cart button sits on top of the product photo | Fixed bottom-right button with no clearance | `components/shop/*` cart button | Move it or give it clearance on phones | P2 | Medium |
| 15 | `/music` | No cover art, so a placeholder disc icon fills a large square | Content not uploaded yet | — | Owner uploads the HANUMANTUM cover; layout is fine | P2 (content) | — |
| 16 | `/` (phone) | Neon "DIVINE:TIMING" sign in the video sits directly above the overlay wordmark, so the brand shows twice | Composition | — | Owner decision: keep, shrink, or hide the overlay logo for that slide | P2 (owner) | Medium |
| 17 | Admin | 56px icon-only rail on phones, about 20–28px tap targets, hover-only actions, `alert()`/`confirm()` popups | Desktop-first shell | `components/admin/AdminShell.tsx`, `AdminNav.tsx`, section pages | Mobile shell and shared sheets/badges (roadmap D0) | P1 | High |

Admin screenshots need a signed-in browser session. They'll be taken during the admin batch.

## Proposed batches (each on a preview deploy, with before/after at 390 / 768 / 1440)

| Batch | Scope (findings) | Data changes | Effort |
|---|---|---|---|
| **V1: shared page system** | 1, 2, 4, 5, 6, 7, 10, 11, 13 | None (code only) | 1–1.5 days |
| **V2: art direction + focal points** | 3, 9; hero editor gets About and Journey | Migration: focal-point and optional mobile-image columns on `hero_sections` and gallery covers. Additive only; existing images untouched | 1.5–2 days |
| **V3: portrait-safe collections** | 8 | Capture width/height on upload, and backfill dimensions for existing images (metadata only; no media changed) | 1.5–2 days |
| **V4: admin visual refinement** | 17, plus media-row contrast, upload controls, status badges | None | Overlaps dashboard D0 (3–4 days) |
| **V5: polish** | 12, 14 | None | 0.5 day |

## V1 results (branch `feat/visual-v1`, local production build, same capture tool)

| Measure | Before | After |
|---|---|---|
| Shop header crop, phone / desktop | 70% / 90% | 42% / 75% (faces visible) |
| Media header crop, phone / desktop | 38% / 79% | 17% / 47% |
| Contact header crop, phone / desktop | 46% / 82% | 5% / 54% |
| Events header crop, phone | 44% | 8% |
| Gap below header, Shop / Media (phone) | 270px | 40px |
| Contact page height, phone | 3,328px | 2,940px |
| About / Cart empty black hero | 600–810px | Short title band |
| Legal pages and 404 | Default unbranded 404 | Branded holding page / branded 404 (noindex) |
| Undersized tap targets, phone (typical page) | 13 | 6 |
| Homepage H1 | Missing | Present (screen-reader) |
| Sideways overflow / iOS zoom inputs | 0 / 0 | 0 / 0 |

Also in V1:
- A single product is centred.
- Contact cards are compact rows on phones.
- The homepage overlay logo is smaller on phones (owner choice).
- The footer has a solid background.
- Cart quantity buttons are 44px.

Collections hub and event detail still crop portrait covers on tablet and desktop. That's addressed by focal points in V2.

Order: V1, then V3, then V2, then V4, then V5. V1 fixes the most visible problems without touching data. V3 fixes the artists being cropped.
