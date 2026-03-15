# Phase 36 — Preview Smoke Test Fixes + Desktop Composition Pass — Output

Fixes real issues from preview smoke testing and improves desktop composition without redesign. No refactors of working systems; minimal, durable changes.

---

## 1. Issues confirmed from preview

- **Admin media upload:** "Upload failed" in `/admin/media` with no actionable message. Reads (library list) work; upload or register step fails in preview—often due to missing `SUPABASE_SERVICE_ROLE_KEY` or storage bucket/body limits in serverless.
- **Admin shop product create:** Creating a product shows "Operation failed" toast but the product appears after refresh—backend succeeds, client treats response as failure (e.g. non-JSON or 500 on duplicate/second request).
- **Desktop composition:** Pages felt left-heavy with large unused whitespace; list and detail content needed a consistent centered rail.
- **Booking:** Inquiry section needed clearer separation from hero and spacing.
- **Admin feedback:** Generic "Operation failed" and "Upload failed" messages; register and products API did not surface clear errors.

---

## 2. Media upload fix

**Upload route (`app/api/admin/media/upload/route.ts`):**

- Check for `SUPABASE_SERVICE_ROLE_KEY` before using it; if missing, return **503** with message:  
  `Server misconfiguration: storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the environment.`
- On storage error: return Supabase `error.message`; if message mentions "Bucket", return a short note that the `media` bucket may not exist or be accessible in the Supabase dashboard.
- In `catch`: log error; return a safe message (e.g. suggest file too large for environment if message hints at body/fetch/payload); avoid exposing long stack traces.

**Client (`components/admin/uploader/UniversalUploader.tsx`):**

- Show server `error` when present; for 503, show the storage-not-configured message so operators know to set the env var.

**Register route (`app/api/admin/media/register/route.ts`):**

- On update/insert failure, return `error.message` (or short fallback) instead of generic "Operation failed." so client can show a clear message.
- In catch, return a short safe message (or "Failed to register files. Check server logs.") instead of "Operation failed."

**Result:** Upload either succeeds and the asset appears in the library, or fails with a clear, actionable error (missing key, bucket, or body size). No change to storage structure or read logic.

---

## 3. Shop create error fix

**API (`app/api/admin/products/route.ts`):**

- On **create**, return the full inserted row: `.select()` instead of `.select('id')`, so the client receives a complete `product` object.
- On insert error: if Postgres code is `23505` or message indicates unique/duplicate, return **409** with:  
  `A product with this URL (slug) already exists. Use a different URL or edit the existing product.`  
  Otherwise return the real `error.message` (or "Operation failed.") with 500.

**Client (`app/admin/shop/page.tsx`):**

- Add **saving** state; disable submit button while `saving` (and keep existing `uploadInProgress` disable).
- Wrap submit in **try/finally**; set `saving = true` at start, `saving = false` in `finally`.
- Parse response with `res.json().catch(() => ({}))` so non-JSON (e.g. HTML error page) does not throw; then if `!res.ok`, show `data?.error` or `res.statusText` or "Request failed".
- Show "Saving…" on the submit button when `saving`.

**Result:** Successful create shows success feedback and no false failure. Real failures (including duplicate slug) show a clear message. Double submit is mitigated by the saving guard.

---

## 4. Desktop composition improvements

- **Container:** Kept as-is (`max-w-[1200px] mx-auto`). No full-width layout change.
- **List pages:** Wrapped main content in an inner **max-w-[1000px] mx-auto w-full** so content is centered and balanced on desktop:
  - **Shop:** `ShopPageClient` — intro + grid (or empty state) inside `max-w-[1000px] mx-auto`.
  - **Events:** Intro + `EventsListClient` inside `max-w-[1000px] mx-auto`.
  - **Media:** Intro + `MediaPageClient` inside `max-w-[1000px] mx-auto`.
- **Detail pages:** Same inner rail for a consistent destination feel:
  - **Shop detail:** Back link + product grid inside `max-w-[1000px] mx-auto`.
  - **Events detail:** Back link + article/sidebar grid inside `max-w-[1000px] mx-auto`.
  - **Gallery detail:** `GalleryDetailClient` inside `max-w-[1000px] mx-auto`.
- **Booking:** Added `mt-2 md:mt-4` to the inquiry section so hero → inquiry spacing is clearer; existing `max-w-[1000px] mx-auto` for the form grid kept.
- **Presskit / Home:** Already use Container and/or centered panels; no change.

Mobile responsiveness preserved; no UI redesign.

---

## 5. List page improvements

- **Shop:** Centered content block (max-w-[1000px]), intro and grid unchanged; storefront feels more focused.
- **Events:** Centered block, same intro and list hierarchy; stronger event-list anchor.
- **Media:** Centered block, same tabs and grids; media hub feels more composed.

Hero sections and grid/card systems unchanged.

---

## 6. Detail page improvements

- **Shop [slug]:** Centered rail; back link, gallery, title, metadata, description, and CTA block unchanged; clearer narrative and hierarchy.
- **Events [slug]:** Centered rail; back link, image, description, and sticky sidebar unchanged; destination feel improved.
- **Media galleries [slug]:** Centered rail; gallery title, description, and media grid unchanged.

All data logic and hierarchy (title → media → metadata → content) preserved; only layout composition and spacing adjusted.

---

## 7. Booking composition updates

- Slight increase in space between story and inquiry: **mt-2 md:mt-4** on the inquiry section.
- Form + aside already in a centered `max-w-[1000px]` grid; no section removal or structural change.

---

## 8. Admin reliability improvements

- **Media upload:** Clear errors (missing key, bucket, body size); client shows server message and 503 message when applicable.
- **Media register:** Update/insert and catch return `error.message` or short fallback instead of "Operation failed."
- **Shop products:** Create returns full product and duplicate slug returns 409 with clear text; client uses safe JSON parse and saving guard to avoid false failure and double submit.
- Submit button states: shop modal shows "Saving…" when `saving` and stays disabled during save.

No admin UI redesign; only feedback and error handling.

---

## 9. Files changed

| File | Change |
|------|--------|
| `app/api/admin/media/upload/route.ts` | Env check for service role key (503); clearer storage and catch error messages. |
| `components/admin/uploader/UniversalUploader.tsx` | Show server error and 503-specific message. |
| `app/api/admin/media/register/route.ts` | Return error.message (or short fallback) on update/insert/catch. |
| `app/api/admin/products/route.ts` | Create returns full product; duplicate slug → 409 + message. |
| `app/admin/shop/page.tsx` | Saving state; try/finally; safe res.json(); disabled submit; "Saving…" label. |
| `components/shop/ShopPageClient.tsx` | Inner wrapper max-w-[1000px] mx-auto for intro + grid. |
| `app/events/page.tsx` | Inner wrapper max-w-[1000px] mx-auto for intro + EventsListClient. |
| `app/media/page.tsx` | Inner wrapper max-w-[1000px] mx-auto for intro + MediaPageClient. |
| `app/booking/page.tsx` | mt-2 md:mt-4 on inquiry section. |
| `app/shop/[slug]/page.tsx` | Inner wrapper max-w-[1000px] mx-auto for main content. |
| `app/events/[slug]/page.tsx` | Inner wrapper max-w-[1000px] mx-auto for main content. |
| `app/media/galleries/[slug]/page.tsx` | Inner wrapper max-w-[1000px] mx-auto for GalleryDetailClient. |

---

## 10. Remaining blockers

- **Preview media upload:** If upload still fails after these changes, confirm in the preview environment:  
  - `SUPABASE_SERVICE_ROLE_KEY` is set and has access to the `media` bucket.  
  - The `media` bucket exists and is public (or policy allows service role).  
  - Request body size limits (e.g. Vercel 4.5MB) are not exceeded; use smaller files or configure body size if needed.
- **Duplicate product create:** If the same slug is submitted twice (e.g. two tabs), the second request correctly returns 409 and the new message; no duplicate insert.
- No other blockers identified for this phase.

---

## 11. Manual QA checklist

**Admin media**
- [ ] `/admin/media`: Upload a small image. Either it appears in the library or a clear error is shown (e.g. storage not configured, bucket missing, file too large).
- [ ] If upload fails, message is actionable (env var, bucket, or size), not only "Upload failed".

**Admin shop**
- [ ] Create a new product (name, price, optional slug). Submit once. Success toast and product in list; no "Operation failed".
- [ ] Submit button shows "Saving…" while request is in flight and is disabled during save.
- [ ] Create again with the same slug (or trigger duplicate). Error message indicates slug already exists (409), not generic "Operation failed".
- [ ] Edit existing product and save. Success feedback; no false failure.

**Desktop composition**
- [ ] `/shop`, `/events`, `/media`: On desktop, content block is centered with balanced whitespace; no heavy left bias.
- [ ] `/shop/[slug]`, `/events/[slug]`, `/media/galleries/[slug]`: Detail content centered; destination feel.
- [ ] `/booking`: Inquiry section has clear separation from hero; form + aside centered.
- [ ] Mobile: List and detail pages still responsive; no regressions.

**Admin reliability**
- [ ] Media register: On failure (e.g. invalid payload), error message is specific where possible.
- [ ] Shop create: Success and failure paths both show correct toasts; no false "Operation failed" on success.

**Regression**
- [ ] Home, presskit, footer, header: Unchanged behavior and layout.
- [ ] Existing media library read, product list, event list, and booking form behavior unchanged.
