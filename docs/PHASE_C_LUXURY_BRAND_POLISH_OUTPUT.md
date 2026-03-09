# Phase C — Luxury Brand Polish — Output

## 1. Typography system summary

- **Scale (single source of truth):**
  - **Hero Title:** `--text-hero-title` / `.type-hero-title` — `clamp(2.5rem, 5vw, 4rem)`, display font. Used for full-screen hero headlines.
  - **Section Title:** `--text-h2` / `.type-h2` — Section H2s.
  - **Subheading:** `--text-h3` / `.type-h3` — Card titles, H3s.
  - **Body:** `--text-body` / `.type-body` — Paragraphs.
  - **Caption:** `--text-caption` / `.type-caption` and `--text-small` / `.type-small` — Labels, metadata.

- **Spacing rhythm:** Section title → content: `mb-8 md:mb-10` (Section header). Section vertical rhythm: `py-12 md:py-16` (Section component).

- **Documentation:** `docs/TYPOGRAPHY_SYSTEM.md` — maps roles to tokens/classes and spacing.

- **CSS changes:** `app/globals.css` — added `--text-hero-title`, `--text-caption`, `.type-hero-title`, `.type-caption`. UnifiedHero hero headline now uses `.type-hero-title` and `.hero-text-shadow`.

---

## 2. Grid adoption changes

- **Shop:** Product list uses `<Grid cols={3}>` with `className="gap-8 md:gap-10"` (slightly larger than default for premium feel). Replaces raw `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12`.
- **Media — Galleries:** Uses `<Grid cols={4}>` with default gap `gap-6 md:gap-8`. Replaces raw grid classes.
- **Media — Videos:** Uses `<Grid cols={3}>` with default gap. Replaces raw grid.
- **Section rhythm:** No change; `Section` already uses `py-12 md:py-16` and header `mb-8 md:mb-10`. Vertical rhythm is consistent.

---

## 3. Hero simplification implementation

- **Single hero surface:** Home page now uses one hero component only: **UnifiedHero**.
- **Data source:** New helper `lib/content/heroSingleSource.ts` — `getHeroSingleSource(hero)` returns one `{ mediaUrl, mediaType }` by preferring first **video** from `hero_slots`, then first **image**, then legacy `mediaFinalUrl` / `media_type`.
- **Home page (`app/page.tsx`):**
  - Removed: `HeroCarousel`, `HeroCarouselV2`, `HeroVideoCarouselPremium`, `getHeroCarouselSlides`.
  - Single branch: `getHeroSingleSource(heroSection)` → `<UnifiedHero mediaUrl={…} mediaType={…} overlayOpacity={…} heightPreset="full" showScrollCue>{heroContent}</UnifiedHero>`.
  - Same `heroContent`: label, logo/DivineTimingIntro, HeroContent (primary + secondary CTA). No dev `console.log`s.
- **Result:** One hero component, video OR image, strong centered typography, primary + secondary CTA, reliable loading (UnifiedHero + MediaAssetRenderer + HeroEclipseFallback). Legacy carousel branches removed from home.

---

## 4. Shop UI improvements

- **Product grid:** Uses `Grid` (see §2); stagger animation retained via motion wrapper.
- **Product cards:**
  - Card: `rounded-xl`, consistent `aspect-square` image in `rounded-xl` container with `bg-[var(--bg)]`; premium hover: `hover:-translate-y-1`, `hover:shadow-[var(--shadow-card-hover)]`, `hover:border-[var(--accent)]/45`; transitions use `var(--motion-standard)` and `var(--ease-standard)`.
  - Image: hover `scale-[1.02]` and `brightness-[1.04]` (300ms).
  - Typography: name `type-h3`, price `type-body` + `font-semibold`, clearer spacing (`mb-2` after title, `mb-5` before CTAs).
  - CTAs: Add to Cart / View Options use `btn-lift` and standard transition for consistent micro-interaction.

---

## 5. Interaction improvements

- **Buttons:** Shop product CTAs use `btn-lift` (existing utility: hover `translateY(-2px)`, 200ms ease) and `duration-[var(--motion-standard)] ease-[var(--ease-standard)]`.
- **Cards:** Product cards use hover lift (`-translate-y-1`), shadow and border transition; image scale/brightness on hover. Media cards already had hover states; Grid adoption keeps behavior.
- **Links:** Nav already uses `.nav-link-underline` (gold underline, center grow, 300ms). No change.
- **Section reveal:** Existing `Reveal` component (250ms, 8px Y) remains in use on events, EPK, ListenNow, StatsRow, etc. No new heavy use; animations stay subtle.

---

## 6. Visual consistency adjustments

- **Section alignment:** Container + Section unchanged; 1200px rail and `py-12 md:py-16` keep alignment and rhythm.
- **Spacing rhythm:** Section padding and header margins standardized via Section; product grid uses `Grid` + consistent gap.
- **Card proportions:** Product cards use fixed `aspect-square` for images and `rounded-xl`; gallery/video cards keep existing aspect ratios and radii.
- **Nav / hero:** No structural change; hero is single full-width surface with centered content; nav balance unchanged.
- **Hero visual weight:** Hero headline uses `.type-hero-title` for consistent scale and `.hero-text-shadow` for readability.

---

## 7. Files changed

| File | Change |
|------|--------|
| `app/globals.css` | Added `--text-hero-title`, `--text-caption`; `.type-hero-title`, `.type-caption`. |
| `docs/TYPOGRAPHY_SYSTEM.md` | **New** — Typography scale and spacing rhythm. |
| `lib/content/heroSingleSource.ts` | **New** — `getHeroSingleSource()` for single hero media. |
| `app/page.tsx` | Hero: only UnifiedHero; removed carousel imports and branches; use `getHeroSingleSource`. |
| `components/hero/UnifiedHero.tsx` | Hero headline uses `.type-hero-title` and `.hero-text-shadow`. |
| `components/shop/ShopPageClient.tsx` | Grid adoption; ProductCard premium styling (rounded-xl, hover, price/CTA spacing, btn-lift, motion tokens). |
| `components/media/MediaPageClient.tsx` | Grid adoption for galleries (cols=4) and videos (cols=3). |
| `docs/PHASE_C_LUXURY_BRAND_POLISH_OUTPUT.md` | **New** — This output. |

**Not changed (legacy carousel components):** `HeroCarousel`, `HeroCarouselV2`, `HeroVideoCarouselPremium` remain in codebase for possible reuse on other pages or rollback; they are no longer used on the home page.
