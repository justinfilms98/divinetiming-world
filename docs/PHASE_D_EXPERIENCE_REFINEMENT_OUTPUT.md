# Phase D — Experience Refinement — Output

## 1. Hero refinements

- **Video load timing:** Hero video uses `poster` when `posterUrl` is provided. When poster is set, `preload="metadata"` is used so the first frame appears immediately from the poster and full video loads in the background (faster perceived LCP).
- **Poster fallback:** `MediaAssetRenderer` accepts optional `poster` prop. `getHeroSingleSource()` returns `posterUrl` from slot `resolved_poster_url`. Home passes `posterUrl` into `UnifiedHero`, which passes it to `MediaAssetRenderer`.
- **Overlay gradient balance:** Replaced two overlapping overlays with a single balanced treatment: (1) linear bottom vignette `from-transparent via-transparent to-black/50` at opacity × 1.1; (2) radial `ellipse_80%_70%_at_50%_40%` with transparent center and dark edges. Text remains readable without feeling too dark.
- **CTA spacing and hierarchy:** `HeroContent` CTA block margin increased from `mt-5 md:mt-6` to `mt-6 md:mt-8` for clearer separation from logo/headline.
- **Mobile hero height:** Full hero uses `min-h-screen min-h-[100dvh]` so mobile browsers (e.g. Safari) use dynamic viewport height and avoid toolbar-induced layout jump.

**Files:** `components/ui/MediaAssetRenderer.tsx`, `components/hero/UnifiedHero.tsx`, `app/page.tsx`, `components/home/HeroContent.tsx`, `lib/content/heroSingleSource.ts` (already had `posterUrl`).

---

## 2. Shop detail improvements

- **Container alignment:** Product page uses `Section` + `Container` (max-w 1200px, px-5 md:px-8) so alignment matches the rest of the site.
- **Image gallery layout:** New `ProductImageGallery` client component: main image (aspect-square, rounded-xl) + optional thumbnail strip (4 columns) when multiple images. Thumbnails are selectable; main image updates. Images sorted by `display_order`.
- **Product description typography:** Description uses `type-body prose-readability leading-relaxed`; price uses `type-h3 font-semibold` for clear hierarchy.
- **Add-to-cart emphasis:** Add to Cart is the primary CTA: accent background, `font-semibold`, `min-h-[52px]`, `btn-lift`, `shadow-[var(--shadow-button)]`. Buy Now is secondary (outline style). Both use `duration-[var(--motion-standard)]` and `ease-[var(--ease-standard)]`.
- **Mobile layout:** Grid remains single column on mobile; image gallery stacks above details; thumbnails in a 4-column grid; touch targets and spacing preserved.

**Files:** `app/shop/[slug]/page.tsx`, `components/shop/ProductDetailClient.tsx`, `components/shop/ProductImageGallery.tsx` (new).

---

## 3. Media layout improvements

- **Gallery card hierarchy:** Gallery cards use semantic `<h3>` for name with `type-h3 tracking-tight`; description uses `type-small`; item count uses `type-caption`. Rounded to `rounded-xl`; transitions use `var(--motion-standard)` and `var(--ease-standard)`.
- **Video presentation:** Video cards use `rounded-xl`, same transition tokens, and consistent hover (border/shadow). Title remains `type-small font-semibold`.
- **Gallery detail page layout:** `GalleryDetailClient`: back link uses `nav-link-underline` and focus ring; title uses `type-h1` and `text-[var(--text)]`; description uses `text-[var(--text-muted)] type-body prose-readability max-w-[60ch] leading-relaxed`; empty state uses `type-body`. Feels like an archive, not a blog.
- **Gallery grid:** `GalleryGrid` uses shared `Grid` component with `cols={4}` for consistent column and gap with the rest of the site.

**Files:** `components/media/MediaPageClient.tsx`, `components/media/GalleryDetailClient.tsx`, `components/media/GalleryGrid.tsx`.

---

## 4. Navigation flow adjustments

- **Nav hover states:** Desktop nav links in `Header` use `relative nav-link-underline` so the gold underline animation (grow from center, 300ms) appears on hover. Transition `duration-200` kept for color.
- **Page/section transitions:** No full-page transition layer added; section-level `Reveal` and motion variants remain. Back links (Shop detail, Gallery detail) use `nav-link-underline` and `transition-colors duration-200` for consistency.

**Files:** `components/layout/Header.tsx`, `app/shop/[slug]/page.tsx`, `components/media/GalleryDetailClient.tsx`.

---

## 5. Performance improvements

- **Hero media loading:** Hero video shows poster immediately when `posterUrl` is set; `preload="metadata"` when poster is present reduces initial byte load while keeping LCP fast. Hero image/video already use `priority={true}` and `sizes="100vw"` for full hero.
- **Image sizes:** Shop detail main image uses `sizes="(max-width: 768px) 100vw, 50vw"`; ProductImageGallery thumbnails use `sizes="(max-width: 768px) 25vw, 12vw"`. Gallery and video grids already use appropriate `sizes` for their breakpoints.
- **Video optimization:** Hero video with poster avoids loading full video before first paint; poster image is the LCP candidate when applicable.
- **Grid rendering:** Hero uses fixed height (`min-h-screen min-h-[100dvh]`) to avoid CLS. Product and media grids use `Grid` with consistent aspect ratios (product cards aspect-square, gallery aspect-[4/5], video aspect-video) so layout is stable.

---

## 6. Visual balance

- **Section spacing:** Shop detail uses `Section` (py-12 md:py-16) and `Container`; gallery detail already in `Container`; spacing rhythm consistent.
- **Grid proportions:** Product grid (Grid cols=3), media galleries (cols=4), videos (cols=3), gallery detail grid (Grid cols=4) keep consistent gaps via `Grid`.
- **Card density:** Product cards, gallery cards, and video cards use `rounded-xl`, consistent borders and shadows, and shared motion tokens so density and feel are even.
- **Hero weight vs content:** Hero uses `type-hero-title` and balanced overlay; CTA block has clearer spacing; content below hero unchanged.

---

## 7. Files changed

| File | Change |
|------|--------|
| `components/ui/MediaAssetRenderer.tsx` | Added `poster` prop; hero video uses `poster` and `preload="metadata"` when poster set. |
| `components/hero/UnifiedHero.tsx` | Added `posterUrl`; pass to MediaAssetRenderer; overlay gradient refined; full height `min-h-[100dvh]`. |
| `app/page.tsx` | Pass `posterUrl` from `getHeroSingleSource` to UnifiedHero. |
| `components/home/HeroContent.tsx` | CTA block margin `mt-6 md:mt-8`. |
| `lib/content/heroSingleSource.ts` | No code change (already returns posterUrl). |
| `app/shop/[slug]/page.tsx` | Container + Section; ProductImageGallery; back link nav-link-underline; typography tweaks. |
| `components/shop/ProductDetailClient.tsx` | Add to Cart primary (accent bg, btn-lift); Buy Now secondary; motion tokens. |
| `components/shop/ProductImageGallery.tsx` | **New** — main image + thumbnail strip, sorted by display_order. |
| `components/layout/Header.tsx` | Desktop nav links: `relative nav-link-underline`. |
| `components/media/GalleryDetailClient.tsx` | Back link nav-link-underline; h1/text use var(--text), var(--text-muted); type-body, prose. |
| `components/media/GalleryGrid.tsx` | Use `Grid cols={4}`; removed unused viewerItems. |
| `components/media/MediaPageClient.tsx` | Gallery card: rounded-xl, type-h3/caption, motion tokens; video card: rounded-xl, motion tokens. |
| `docs/PHASE_D_EXPERIENCE_REFINEMENT_OUTPUT.md` | **New** — this output. |
