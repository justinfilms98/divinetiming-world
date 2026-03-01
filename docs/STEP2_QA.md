# Step 2 QA – Logo + Media Uploads

Post–Step 2 hardening: verification results, URL mapping audit, and fixes applied.

## Final alignment (before Step 3)

**1. Confirm live production URL**

- [ ] Hero logo: upload → save → hard refresh home → logo displays; remove → text returns.
- [ ] Event image: thumbnail on `/events` and `/events/[slug]`.
- [ ] Media: multi-upload to gallery → cover + thumbnails on `/media` and `/media/galleries/[slug]`.
- [ ] Shop: product images on `/shop` and `/shop/[slug]`.
- [ ] No console errors (404, CORS, mixed-content) on the above pages.

**2. Confirm `npm run assert:hero-logo` in CI**

- Run locally: `npm run assert:hero-logo` (already passes).
- Add to CI: in your GitHub Actions (or other CI) workflow, add a step that runs `npm run assert:hero-logo` so it runs on every PR/main. If you don’t have a workflow yet, add one that runs `npm run build` and `npm run assert:hero-logo` on push/PR.

Once both are confirmed, Step 2 is locked. Do not start Step 3 until the Step 3 architecture is approved.

---

## Production verification (run after deploy)

After deploying to Vercel (preview or production), run these checks and record results:

| Check | URL(s) | Result |
|-------|--------|--------|
| Hero logo | `/` (home) | Upload PNG in Admin → Hero Editor → Home → Save; hard refresh home → logo displays. Remove logo → text title returns. |
| Events | `/events`, `/events/[slug]` | Upload event thumbnail in Admin → Events; confirm image on list and detail. |
| Media | `/media`, `/media/galleries/[slug]` | Multi-upload to gallery; confirm cover + thumbnails on public Media. |
| Shop | `/shop`, `/shop/[slug]` | Create/edit product with images; confirm thumbnails on shop list and product detail. |

Note the exact base URL tested (e.g. `https://divine-timing.vercel.app` or preview URL) and any console errors (404, CORS, mixed-content). All stored image URLs should be `https`.

---

## 1. Database + API verification

- **hero_sections.hero_logo_url**: Column added via migration `021_hero_logo_url.sql`. `getHeroSection()` uses `select('*')` so the field is returned; no GET route for hero (content is read server-side via `getHeroSection`).
- **POST /api/admin/hero**: Accepts both flat and nested payloads; `hero_logo_url` and `heroLogoUrl` are mapped to `hero_logo_url`. Server-side validation added: `hero_logo_url` must be `null` or a non-empty string matching `https?://...`; otherwise 400 with message `hero_logo_url must be null or a valid http(s) URL`.

## 2. Hero logo E2E + fixes

- **Data flow**: `getHeroSection('home')` → `app/page.tsx` → `heroSection?.hero_logo_url` → conditionally `<HeroLogo url={...} />` or `<DivineTimingIntro />`. Field name is `hero_logo_url` (snake_case) everywhere.
- **Fallback**: If the logo image fails to load, `HeroLogo` now accepts an optional `fallback` (e.g. `<DivineTimingIntro />`). On `onError` it renders the fallback so we never show a broken image.

## 3. UniversalUploader hardening

- **Missing key**: When `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY` is missing, the uploader shows a clear message and does not render the file input (no half-fail).
- **Validation**: With `acceptOverride`, MIME is validated before upload; oversized files show a friendly max-size error.
- **Progress**: Per-file progress is shown for multi-upload; `onUploadingChange(true/false)` notifies the parent.
- **Save during upload**: Hero Editor disables the Save button and shows “Uploading…” while any upload is in progress (`uploadInProgress` state).
- **Return shape**: `uploadOne` returns `{ url, uuid, filename, mimeType, size }`; editors store the `url` (e.g. `hero_logo_url`, `thumbnail_url`, `image_url`).

## 4. Events / Media / Shop URL mapping audit

| Area   | DB / store                    | Public read                          | Result |
|--------|-------------------------------|--------------------------------------|--------|
| Events | `events.thumbnail_url` (+ optional `external_thumbnail_asset_id`) | `EventCard` / event detail use `event.thumbnail_url` | Single URL stored and read; no mismatch. |
| Media  | `galleries.cover_image_url`; `gallery_media.url`, `thumbnail_url`; `external_media_assets.preview_url` | Gallery grid/detail use `cover_image_url` and `item.url` / `thumbnail_url` | URLs stored and read consistently. |
| Shop   | `product_images.image_url`    | `ShopPageClient`, `ProductDetailClient`, checkout use `product_images[].image_url` | Array of URLs; admin saves `url` from upload → `image_url`. No mismatch. |

**Conclusion**: No “media unavailable” root cause from URL/schema mismatch. All flows store a CDN (or public) URL and the public pages read that same field. If “media unavailable” appears, it is from a 404 (missing or deleted asset) or CORS; ensure Uploadcare URLs are valid and env is set.

## 5. Premium UI polish (applied)

- Hero Editor: Save button disabled and shows “Uploading…” while upload in progress; `aria-busy` and `title` reflect state.
- Uploader: Clear “Uploads disabled” copy and reference to docs/MEDIA_STORAGE.md when key is missing.
- Logo block: Thumbnail preview, Replace/Remove actions; consistent spacing and destructive style for Remove.

## 6. Responsive check (cart + nav)

- Cart: `fixed bottom-20 right-6` (mobile), `md:bottom-6 md:right-6` (desktop). Booking link: `bottom-6 right-20` so it does not overlap the cart.
- No overlap at 320, 375, 414, 768, 1024, 1440 if layout is unchanged; Step 2 did not alter nav/cart positions.

---

## QA checklist (run before release)

Use the **Step 2 QA** items in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md):

1. Hero logo: upload → save → refresh admin → refresh home → remove → text returns; broken URL falls back to text.
2. Events: upload event image → save → check public Events list and detail.
3. Media: upload multiple → verify admin list and public Media page.
4. Shop: product with multiple images → verify admin and public shop/product pages.

No “media unavailable” after upload unless the asset was deleted or the URL is invalid.
