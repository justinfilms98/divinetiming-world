# Phase 17.B — Critical Regression Fixes

## Summary

Stabilization phase after Phase 17.A. Fixes critical regressions and removes Uploadcare so the site is consistent and ready for Phase 18.

---

## Problems found and fixes

### 1. Uploadcare fully removed

**Problem:** New uploads and code still referenced Uploadcare (env, packages, register API).

**Fix:**
- New uploads use **Supabase Storage** (bucket `media`, path `library/...`). Client uploads via `lib/supabaseStorage.ts` → `uploadToSupabase()`.
- **UniversalUploader** now uses `uploadToSupabase` and POSTs to `/api/admin/media/register` with `{ provider: 'supabase', files: [{ storage_path, public_url, name, mimeType, size }] }`.
- **Register API** accepts only `provider: 'supabase'` and writes `file_id` = storage path, `preview_url` = public URL.
- **Migration 029** adds `supabase` to `external_media_assets.provider` check.
- **Removed:** `lib/uploadcare.ts`, `@uploadcare/upload-client`, `@uploadcare/file-uploader` from package.json.
- **Deprecated:** `POST /api/assets/external` returns 410 with message to use Supabase + register.
- Legacy rows with `provider = 'uploadcare'` remain in DB and are still resolved by `resolveMediaUrl`; admin “legacy” toggle still shows them. No new Uploadcare uploads.

**Acceptance:** No Uploadcare imports/URLs/env; build succeeds; uploads work via Supabase.

---

### 2. Hero video rotation (all 3 slots)

**Problem:** Only slot 1 appeared to play; rotation could reset on every slide due to effect deps.

**Fix:** In **HeroCarouselV2**:
- Interval effect no longer depends on `activeIndex`, so the 8s timer is stable and advances through all slots.
- `INTERVAL_MS` set to 8000ms.
- Rotation continues indefinitely when `slots.length > 1` and reduced-motion is off.

**Acceptance:** With 3 uploaded videos, hero cycles through all 3 and loops; no console errors.

---

### 3. Booking page title overlapping header

**Problem:** Booking hero/title sat under the fixed header.

**Fix:** Wrapped **UnifiedHero** on the booking page in a div with `pt-28 md:pt-32` so content clears the header.

**Acceptance:** Title fully visible; header nav not overlapped on mobile and desktop.

---

### 4. Media page collections not clickable

**Problem:** Collection cards were reported not openable.

**Fix:** In **MediaPageClient**, the gallery **Link** now has `cursor-pointer` when `hasMedia` is true. Route was already correct: `href={/media/galleries/${gallery.slug}}` with existing route `app/media/galleries/[slug]/page.tsx`.

**Acceptance:** Clicking a collection with media opens the collection page; hover state visible.

---

### 5. Event hero card too large

**Problem:** Event detail hero dominated the page.

**Fix:** Wrapped **UnifiedHero** on the event detail page in a container: `max-w-5xl mx-auto w-full max-h-[480px] overflow-hidden rounded-b-2xl`. Media inside already uses `object-cover` (MediaAssetRenderer default).

**Acceptance:** Event hero visually balanced and consistent with site scale.

---

## Files modified

| File | Change |
|------|--------|
| `supabase/migrations/029_external_media_supabase_provider.sql` | Add `supabase` to provider check. |
| `lib/supabaseStorage.ts` | **New:** client upload to Supabase `media` bucket. |
| `lib/uploadcare.ts` | **Removed.** |
| `app/api/admin/media/register/route.ts` | Accept only `provider: 'supabase'` and `storage_path`/`public_url` payload. |
| `app/api/assets/external/route.ts` | POST returns 410; deprecation message. |
| `components/admin/uploader/UniversalUploader.tsx` | Use `uploadToSupabase`, register with `provider: 'supabase'`; remove Uploadcare key check. |
| `components/hero/HeroCarouselV2.tsx` | Interval 8000ms; remove `activeIndex` from interval effect deps. |
| `app/booking/page.tsx` | Hero wrapper with `pt-28 md:pt-32`. |
| `components/media/MediaPageClient.tsx` | `cursor-pointer` on gallery Link when `hasMedia`. |
| `app/events/[slug]/page.tsx` | Hero wrapper `max-w-5xl mx-auto max-h-[480px] overflow-hidden`. |
| `package.json` | Removed `@uploadcare/file-uploader`, `@uploadcare/upload-client`. |
| `lib/dev/qa.ts` | Env check: remove Uploadcare key, add NEXT_PUBLIC_SUPABASE_URL. |
| `docs/PHASE17B_REGRESSION_FIXES.md` | This document. |

---

## Verification steps

1. **Uploadcare removed**
   - Search codebase for `uploadcare`, `ucare` (excluding legacy docs/comments and resolver for existing DB rows). No active upload or env usage.
   - Run `npm run build` — succeeds.
   - In admin, upload an image to Media library — upload goes to Supabase; new row has `provider: 'supabase'`.

2. **Hero rotation**
   - Homepage with 3 hero videos: confirm carousel advances every ~8s through all 3 and loops. No console errors.

3. **Booking title**
   - Open `/booking`. Confirm “Booking” title and hero content sit below the header (no overlap). Check mobile and desktop.

4. **Media collections**
   - Open `/media`, Collections tab. Click a collection that has media. Confirm navigation to `/media/galleries/[slug]` and page loads. Hover shows pointer.

5. **Event hero size**
   - Open any event detail page. Confirm hero is constrained (max width, max height), not full viewport.

6. **Build and dev**
   - `npm run build` passes.
   - `npm run dev` — no console errors on homepage, booking, media, event detail.

---

## QA checklist (all must pass)

- [ ] No Uploadcare imports or new Uploadcare URLs in code paths.
- [ ] No Uploadcare env vars required for uploads.
- [ ] Hero rotates through all 3 video slots and loops.
- [ ] Booking title does not overlap header.
- [ ] Media collection cards open collection page when clicked.
- [ ] Event hero is constrained (max-w-5xl, max-h-[480px]).
- [ ] `npm run build` passes.
- [ ] No console errors in dev for the above pages.

---

## Completion

When all items pass, Phase 17.B is complete and the project is ready to continue to Phase 18 (e.g. performance and media optimization).
