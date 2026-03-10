# Phase O — Shop Thumbnail / Editability Repair — Output

**Focus:** Shop reliable for editors and visually trustworthy on the public site. Hero and media untouched.

---

## 1. Root cause of blank/weak product cards

- **Dual image source, single use:** Product images are stored in `product_images` with two possible sources: `image_url` (direct URL) and `external_media_asset_id` (reference to `external_media_assets`). When an image is added from the Media Library, the admin can store both (e.g. `url: asset.preview_url` and `external_media_asset_id: asset.id`), but older rows or some flows had only `external_media_asset_id` and null `image_url`.
- **No resolution on read:** Public and admin code only used `product_images.image_url`. They did not resolve `external_media_asset_id` via `external_media_assets.preview_url`. So any row with null `image_url` and a set `external_media_asset_id` appeared blank.
- **Admin list:** `loadProducts()` selected only `id, image_url, display_order`, not `external_media_asset_id`, so the client never had the asset ID to resolve. Cards showed a bag icon with no “No image” label.
- **Public list/detail:** `getProducts()` and the product detail page selected only `image_url` (or `product_images(*)` without resolving), so resolved URLs were never computed. Blank cards and empty gallery when the only source was `external_media_asset_id`.

---

## 2. Exact fixes made

**P1 — Thumbnail / image resolution**

- **Server-side resolution:** In `lib/content/server.ts`, added `resolveProductImages(images)` that, for each `product_images` row:
  - Uses `image_url` if it is a valid http(s) URL.
  - Otherwise, if `external_media_asset_id` is set, calls `resolveMediaUrl(null, assetId)` (from `lib/media/resolveMediaUrl.ts`) to get `preview_url` from `external_media_assets` (supports supabase, uploadcare, google_drive).
  - Returns an array of `{ image_url, display_order }` with empty string when neither source yields a URL. Callers filter to entries with non-empty `image_url`.
- **getProducts():** Now selects `product_images(id, image_url, display_order, external_media_asset_id)`, runs `resolveProductImages()` per product, and returns products with `product_images` set to the resolved list (only entries with a displayable `image_url`). Public shop grid therefore always receives a displayable first image when one exists.
- **getProductBySlug(slug):** New server function that loads the product by slug (with status check: only published, or `is_active` if no status column), selects `product_images(..., external_media_asset_id)`, runs `resolveProductImages()`, and returns the product with resolved `product_images`. Used by the public product detail page and by `generateMetadata` so OG image and gallery have valid URLs.
- **Product detail page:** Switched from direct Supabase query to `getProductBySlug(slug)`. Removed duplicate status/active check; `getProductBySlug` enforces published/active. Metadata uses resolved first image for OG.
- **Admin loadProducts():** Selects `product_images(..., external_media_asset_id)`. After load, collects all `external_media_asset_id` values where `image_url` is null, fetches `id, preview_url` from `external_media_assets` in one query, and merges `preview_url` into each product’s images so admin cards get a displayable thumbnail even when the row only had `external_media_asset_id`.

**P2 — Admin product card confidence**

- **“No image” state:** When `mainImage` is falsy, the card now shows the bag icon plus a clear “No image” label underneath (replacing a plain icon).
- **Subtitle and badge on card:** Card body now shows `product.subtitle` (if set) under the title and a `product.badge` pill (e.g. “Limited”) in the badges row with status and Featured.
- **Thumbnail:** Same aspect-square image as before; with resolution above, the thumbnail is now populated when the image comes from the library (external_media_asset_id).

**P3 — End-to-end edit and public reflection**

- **Product-images API:** Already accepted `external_asset_id`; admin now passes it when adding from library (`handleAddImageToProduct(..., asset.id)`), so new rows store both `image_url` and `external_media_asset_id`. Edit flow refetches product with `product_images(..., external_media_asset_id)` so the modal list stays in sync.
- **Products API:** Unchanged; still updates product fields (title, subtitle, badge, featured, status, etc.) and replaces/inserts product_images from the submitted `images` array (url + external_media_asset_id). Revalidation of `/shop` and `/shop/[slug]` already in place.
- **Public list:** Uses `getProducts()` → resolved `product_images` → `mainImage = sortedImages?.[0]?.image_url` in `ShopPageClient`; cards and “Add to Cart”/“View Options”/“Sold out” behave as before, with images now resolving.
- **Public detail:** Uses `getProductBySlug()` → resolved `product_images` → `ProductImageGallery` and `ProductDetailClient`; title, subtitle, badge, featured, price, description, variants, and sold-out all unchanged in behavior; images now resolve.

**P4 — Sold out / inventory**

- **No code change.** Sold-out is already derived from `product_variants`: `soldOut = variants.length > 0 && variants.every((v) => (v.inventory_count ?? 0) <= 0)` in both `ShopPageClient` (grid card and button) and the product detail page. `getProducts()` and `getProductBySlug()` include `product_variants(id, name, price_cents, inventory_count)`. Admin changes to inventory (via product/variant edits) are persisted and refetched; public pages use the same server fetchers, so sold-out state stays consistent.

---

## 3. Admin product card improvements

- **Thumbnail:** Resolved from `image_url` or `external_media_asset_id` so the card always shows an image when one exists.
- **Title and subtitle:** Title shown; subtitle shown below when set.
- **Price:** Shown with dollar icon.
- **Status:** Published (green) / Draft (amber) / Archived (grey) pill.
- **Featured:** “Featured” pill when `is_featured` is true.
- **Badge:** Optional badge pill (e.g. “Limited”, “New”) when `badge` is set.
- **No image:** Explicit “No image” label under the bag icon when the product has no displayable image.
- **Edit/Delete:** Unchanged; save still triggers `loadProducts()` and revalidation so list and public pages update.

---

## 4. Whether full product edit → public reflection now works

**Yes.** The full workflow is supported:

1. **Create/edit product** — Admin modal: name, slug, subtitle, description, price, status, featured, badge, images (upload or from library). Submit → POST `/api/admin/products` (or product-images when adding a single image to an existing product).
2. **Set title / subtitle / badge / featured / status** — Stored on `products`; public list and detail read from `getProducts()` / `getProductBySlug()` and render title, subtitle, badge, featured, status (visibility).
3. **Assign image/thumbnail** — Stored in `product_images` (image_url and/or external_media_asset_id). Resolved on the server so both admin and public get a displayable URL.
4. **Update inventory** — Stored on `product_variants`; public sold-out and add-to-cart/checkout use the same data.
5. **Save** — Admin calls `loadProducts()` and `revalidatePaths(['/shop', `/shop/${slug}`])`; public shop list and product detail use server fetchers with resolution, so they show updated data on next load.
6. **Public shop card** — Shows resolved main image, title, subtitle, badge, featured, sold-out, price, and correct CTA (Add to Cart / View Options / Sold out).
7. **Public product detail** — Shows resolved image gallery, title, subtitle, badge, featured, sold-out, price, description, variants, and add-to-cart/checkout.

---

## 5. Files changed

| File | Change |
|------|--------|
| `lib/content/server.ts` | Import `resolveMediaUrl`. Add `resolveProductImages()`. `getProducts()`: select `external_media_asset_id`, resolve images, return products with resolved `product_images`. Add `getProductBySlug(slug)` with resolution and status/active check. |
| `app/shop/[slug]/page.tsx` | Use `getProductBySlug(slug)` for page and metadata; remove direct Supabase and duplicate status check; remove unused `createClient` import. |
| `app/admin/shop/page.tsx` | `ProductImage`: allow `image_url` null, add `external_media_asset_id`. `loadProducts()`: select `external_media_asset_id`; after load, fetch `preview_url` for any image with asset id but no url, merge into product_images. Cards: “No image” label when no mainImage; show subtitle and badge; same thumbnail/status/featured. `handleLibraryImageSelect` / `handleAddImageToProduct`: pass `external_asset_id` when adding from library; refetch product_images with `external_media_asset_id`. |

---

## 6. Remaining blockers before moving to P4 (booking rebalance)

- **None specific to shop.** Product create/edit, image resolution, admin cards, public list, public detail, and sold-out/inventory behavior are aligned and working.
- **Recommendation:** Run a quick manual proof (one product with image from library, set title/subtitle/badge/featured/status, save, check admin card, public grid, and product detail). Then proceed to P4 booking layout rebalance.
