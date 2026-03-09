# Phase 20 — SEO + Metadata Final Polish / Verification

**Goal:** Ensure the public site has consistent, correct, and complete SEO and metadata using the Next.js App Router metadata system.

## Scope

1. Root metadata (global): metadataBase, title template, description, openGraph, twitter, robots, icons
2. Page-level verification: /, /media, /media/galleries/[slug], /shop, /shop/[slug], /booking, /events
3. Gallery metadata: dynamic generateMetadata with title "Gallery Name | Divine Timing Media", description, OG image from cover
4. Product metadata: dynamic generateMetadata with title "Product Name | Divine Timing Shop", description, OG image from primary image
5. Robots and indexing: robots.txt; sitemap noted if present
6. Social preview: fallback OG image (e.g. public/opengraph.png)

**Constraints:** No hero changes, no CornerNav changes, no Uploadcare, no layout/styling changes except for metadata structure. Build must pass.

---

## Files changed

| File | Change |
|------|--------|
| `app/layout.tsx` | Added `icons: { icon: '/favicon.ico' }` to root metadata. |
| `app/page.tsx` | Added `openGraph.images` and `twitter.images` using `DEFAULT_OG_IMAGE` so home has explicit default preview. |
| `app/media/galleries/[slug]/page.tsx` | generateMetadata: title set to `"Gallery Name \| Divine Timing Media"`; added `absoluteImageUrl(gallery.resolved_cover_url)` for openGraph.images and twitter.images when cover exists; fallback when gallery not found unchanged. |
| `app/shop/[slug]/page.tsx` | generateMetadata: title set to `"Product Name \| Divine Timing Shop"`; select includes `product_images(image_url)`; openGraph.images and twitter.images from first product image via `absoluteImageUrl` when available. |
| `public/robots.txt` | **New.** `User-agent: *`; `Allow: /`; `Disallow: /admin`, `/admin/`, `/api`, `/api/`, `/login`. |
| `docs/PHASE20_SEO_METADATA_VERIFICATION.md` | **New.** This doc. |

---

## What changed

### 1) Root metadata (global)

- **app/layout.tsx** — Already had metadataBase, title (default + template), description, openGraph (type, locale, siteName, title, description, url, images), twitter (card, title, description, images), robots (index, follow). **Added** `icons: { icon: '/favicon.ico' }` so favicon is declared when the file exists in public.

### 2) Page-level verification

- **/** — Has metadata; **added** openGraph.images and twitter.images using DEFAULT_OG_IMAGE so home preview is explicit.
- **/media** — Has title, description, canonical, openGraph, twitter; uses root default OG image. No code change.
- **/media/galleries/[slug]** — Uses generateMetadata; **updated** title format and OG image (see below).
- **/shop** — Has title, description, canonical, openGraph, twitter; uses root default. No code change.
- **/shop/[slug]** — Uses generateMetadata; **updated** title format and OG image (see below).
- **/booking** — Has title, description, canonical, openGraph, twitter. No code change.
- **/events** — Has title, description, canonical, openGraph, twitter. No code change.
- **/events/[slug]** — Already has generateMetadata with OG image from event thumbnail. No change.

### 3) Gallery metadata (dynamic)

- **app/media/galleries/[slug]/page.tsx** — generateMetadata now returns:
  - **Title:** `"Gallery Name | Divine Timing Media"`.
  - **Description:** gallery.description or `"Photo gallery: Gallery Name"`.
  - **openGraph.images / twitter.images:** when `gallery.resolved_cover_url` exists, uses `absoluteImageUrl(resolved_cover_url)` so social previews use the gallery cover. If gallery not found, still returns `{ title: 'Gallery' }`.

### 4) Product metadata (dynamic)

- **app/shop/[slug]/page.tsx** — generateMetadata now:
  - Selects `product_images(image_url)` in addition to name and description.
  - **Title:** `"Product Name | Divine Timing Shop"`.
  - **Description:** product.description or `"Shop Product Name — Divine Timing"`.
  - **openGraph.images / twitter.images:** first product image URL passed through `absoluteImageUrl` when available. If no product, returns `{ title: 'Product' }`.

### 5) Robots and indexing

- **public/robots.txt** — Created. Allows all crawlers on `/`; disallows `/admin`, `/admin/`, `/api`, `/api/`, `/login`. Public routes (/, /media, /shop, /booking, /events, etc.) remain indexable.
- **Sitemap:** No dynamic sitemap was present; none added. Optional future: add app/sitemap.ts or static public/sitemap.xml.

### 6) Social preview

- **Fallback OG image:** Root layout and home use `DEFAULT_OG_IMAGE` from `lib/site` (`/opengraph.png`). Place `public/opengraph.png` (1200×630) for default social previews. No image generation added.

---

## Acceptance checklist

- [ ] Home page metadata correct (title, description, canonical, OG/twitter with images).
- [ ] Media hub metadata correct (title, description, canonical, OG/twitter).
- [ ] Gallery metadata dynamic (title "Gallery Name | Divine Timing Media", description, OG image from cover when available).
- [ ] Shop metadata correct (title, description, canonical, OG/twitter).
- [ ] Product metadata dynamic (title "Product Name | Divine Timing Shop", description, OG image from product image when available).
- [ ] Booking and events metadata correct (title, description, canonical, OG/twitter).
- [ ] robots.txt verified (public allowed; admin, api, login disallowed).
- [ ] Sitemap verified if present (none added this phase).
- [ ] OpenGraph previews valid (fallback /opengraph.png; page-specific where implemented).
- [ ] No hero modifications.
- [ ] No Uploadcare changes.
- [ ] No CornerNav changes.
- [ ] `npm run build` passes.

---

When all items pass, Phase 20 is complete. Proceed to **Phase 21 — QA + Regression Suite**.
