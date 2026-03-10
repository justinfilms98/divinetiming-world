# Phase G–L — Platform Recovery Pass — Output

Operational and layout blockers addressed. No new architecture; minimal correct changes.

---

## 1. Root cause of hero admin JSON error

**Symptom:** “Unexpected token 'R' ... is not valid JSON”

**Cause:** The client always called `response.json()` on admin API responses. When the server returned a non-JSON response (e.g. HTML error page, redirect body, or proxy response starting with a character like “R”), `JSON.parse` threw. The “R” often comes from the start of an HTML document or a short text body.

**Contributing factors:**  
- Auth or server errors can return HTML or plain text.  
- No check for `Content-Type: application/json` or safe parse before `res.json()`.

**Fix:** Parse safely on the client: read `res.text()`, then `JSON.parse(text)` in try/catch. On parse failure, show a clear message (e.g. “Save failed. The server returned an unexpected response — check your connection or try again.”) instead of the raw JSON parse error. All hero-related fetches (hero-slot upload, hero save, hero purge-legacy) now use a shared `parseJsonResponse()` helper in `DashboardHeroEditor.tsx`.

---

## 2. Root cause of media RLS/upload failure

**Symptom:** “new row violates row-level security policy”

**Cause:** Media Library upload was done **client-side** via `uploadToSupabase()` (browser Supabase client with the user’s session). The insert into `storage.objects` was therefore subject to storage RLS. If the “media” bucket policies were not applied (e.g. migrations that touch `storage.objects` are often run via Supabase CLI, not SQL Editor), or the session was not considered authenticated for storage, the insert failed with that RLS error.

**Fix:** Move the actual **upload** to the server so storage is written with the **service role**, which bypasses RLS. A new route `POST /api/admin/media/upload` accepts a multipart file, uses `supabaseAdmin()` to upload to the `media` bucket under `library/`, and returns `{ storage_path, public_url, name, mimeType, size }`. The client then continues to call `POST /api/admin/media/register` with that payload as before. Flow is now: **client → server upload (service role) → client → server register (service role)**. No client-side storage insert, so no storage RLS on the client path.

---

## 3. Exact fixes made

| Area | Fix |
|------|-----|
| **Hero admin save/upload** | Added `parseJsonResponse(res, fallbackMessage)` in `DashboardHeroEditor.tsx`. All fetches to `/api/admin/hero-slot/upload`, `/api/admin/hero`, and `/api/admin/hero/purge-legacy` use it. On parse error, user sees a friendly message instead of “Unexpected token …”. |
| **Hero API routes** | No change. They already return `NextResponse.json(...)` on success and failure. |
| **Media upload** | New `app/api/admin/media/upload/route.ts`: requireAdmin, read FormData file, upload via `supabaseAdmin().storage.from('media').upload()`, return JSON. |
| **Media uploader** | `UniversalUploader` no longer uses `uploadToSupabase()` (client upload). It now POSTs the file to `/api/admin/media/upload`, then sends the returned `storage_path`/`public_url` (and metadata) to `/api/admin/media/register`. Register response is also parsed safely (text + JSON.parse in try/catch). |
| **Homepage social cluster** | Removed `SocialDock` from `PublicLayout`. Social links remain in the **Footer** (centered) and in the **CornerNav** mobile drawer. No duplicate bottom-right cluster. |
| **Booking hero** | `heightPreset` changed from `"tall"` to `"standard"` so the hero does not dominate the page. |
| **Layout** | Footer and public content already use `max-w-[1200px] mx-auto` / Container. Admin uses `AdminShell` with `max-w-[1280px] mx-auto` for main content. No structural layout change in this pass; “lean left” may be from viewport or sidebar and can be re-checked in browser. |

---

## 4. Layout shell fixes made

- **Public:** Existing `PublicPageShell` and `Container` (max-w 1200px, mx-auto) remain the canonical public shell. Footer uses `max-w-[1200px] mx-auto px-5 md:px-8`. No change.
- **Admin:** `AdminShell` already wraps admin pages with `max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8` for the main content area. No change.
- **Booking:** Two-column grid lives inside `Section` + `Container`; it is already centered. Hero height reduced via `heightPreset="standard"` (see §6).

No new canonical shell component was added; existing shells were confirmed and left as-is.

---

## 5. Homepage cleanup changes

- **Removed:** `SocialDock` (fixed bottom-right social icon cluster). It was rendered in `PublicLayout` for all public pages; it is now removed from the layout and its import deleted.
- **Kept:** Footer with centered nav links and social links. CornerNav (four-corner nav) unchanged. Mobile drawer still includes “Listen” social links.
- **Result:** Single focal area for primary CTAs; social is in footer and mobile menu only, no duplicate cluster.

---

## 6. Booking page height/layout changes

- **Hero height:** `UnifiedHero` on the booking page now uses `heightPreset="standard"` instead of `"tall"`. Standard uses a 16:9-style aspect with a lower min-height, so the hero no longer dominates the page.
- **Hero-to-form:** Existing `SignatureDivider` and section structure between hero and “Booking inquiries” section kept. No structural change.
- **Two-column:** Form (left) and aside (contact, EPK, bio, etc.) remain in a `Container` with `grid grid-cols-1 lg:grid-cols-12` and `lg:col-span-7` / `lg:col-span-5`. Container provides centering; no change.

---

## 7. Shop/events editability fixes

- **Verification:** Admin edit flows for Events and Shop (including thumbnails and public reflection) were not changed in this pass. Product list and detail use `product_images[].image_url` from `getProducts()` and the product detail query; if image data is stored but comes from `external_media_asset_id`, resolving that to a display URL may require a separate resolution step in the content layer (not done here).
- **Admin feedback:** Hero save/upload now shows friendly errors when the response is not JSON; no new toasts or inline success UI were added.

No code changes were made under “Shop/Events editability” or “admin visual confidence” in this phase.

---

## 8. Files changed

| File | Change |
|------|--------|
| `components/admin/DashboardHeroEditor.tsx` | Added `parseJsonResponse()`; hero-slot upload, hero save, and purge-legacy fetches use it. |
| `app/api/admin/media/upload/route.ts` | **New** — server-side media upload (service role) to `media` bucket, returns JSON. |
| `components/admin/uploader/UniversalUploader.tsx` | Switched to `POST /api/admin/media/upload` instead of `uploadToSupabase()`; safe JSON parse for register response. |
| `components/layout/PublicLayout.tsx` | Removed `SocialDock` and its import. |
| `app/booking/page.tsx` | `UnifiedHero` `heightPreset` changed from `"tall"` to `"standard"`. |
| `docs/PHASE_G_L_PLATFORM_RECOVERY_OUTPUT.md` | **New** — this document. |

**Unchanged (by design):**  
- Hero and hero-slot API route handlers (already return JSON).  
- `lib/supabaseStorage.ts` (client upload) — still available for any other use; Media Library now uses server upload only.  
- Layout components (PublicPageShell, Container, AdminShell, Footer).  
- Shop/events admin pages and product card rendering.

---

## 9. Remaining blockers before final content population

1. **Storage bucket “media”:** Must exist and be readable (e.g. public read for public URLs). Server upload writes to `library/{timestamp}-{name}.{ext}`. No RLS change is required for the upload path when using the new server upload route.
2. **Admin auth:** Ensure `requireAdmin()` and admin allowlist/table are correct so hero and media upload/register routes succeed.
3. **Optional:** If product or event cards still render blank when “image data exists,” confirm whether images are stored only in `external_media_assets` and add resolution from that table to a display URL in the content layer.
4. **Optional:** Add explicit success toasts or inline “Saved” feedback for hero and media flows for admin confidence.

Nothing else is currently blocked in code for label-ready use; remaining risk is environment (bucket, auth) and any product/event image resolution if needed.
