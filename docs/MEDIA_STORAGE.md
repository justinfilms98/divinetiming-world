# Media Storage – Stability & Verification

This doc ensures the storage layer is reliable. **Primary storage for admin uploads is Supabase Storage** (bucket `media`). Legacy rows may reference Uploadcare CDN URLs; those are resolved for display but no new uploads use Uploadcare.

---

## 1. Supabase Storage (primary for new uploads)

Admin uploads (media library, hero slot uploads, etc.) use **Supabase Storage**. `UniversalUploader` uploads to the `media` bucket via `lib/supabaseStorage.ts` and registers assets with `POST /api/admin/media/register` (provider `supabase`).

### Required

- **Env:** `NEXT_PUBLIC_SUPABASE_URL` and Supabase anon (or service) key so the client can upload to the `media` bucket.
- **Bucket:** `media` must exist and be **public** for read; RLS/policies must allow authenticated uploads.
- **Optional:** `NEXT_PUBLIC_UPLOAD_MAX_BYTES` (bytes) to cap file size; default 100MB.

### Verification

1. **Upload:** Admin → Media → upload an image; confirm it appears in the library and row has `provider: 'supabase'`.
2. **Display:** Asset preview/URL loads (Supabase public URL).
3. **Console:** No CORS or 404 errors when loading media on the public site.

---

## 2. Supabase Storage (bucket setup)

If you use the **Supabase `media` bucket** (e.g. server-side uploads or a future feature), ensure it is usable and not broken.

### Bucket setup

- **Name:** `media`
- **Public:** ON (so public read works without signed URLs).
- **File size limit:** e.g. 50MB (`52428800`) or match your needs.
- Create via Dashboard: **Storage → New bucket**, or run `supabase/migrations/003_storage_buckets.sql` (see [STORAGE_SETUP.md](../STORAGE_SETUP.md)).

### RLS policies

Policies must allow:

- **INSERT/UPDATE/DELETE** for `authenticated` on `bucket_id = 'media'`.
- **SELECT** for `public` on `bucket_id = 'media'`.

Use one set of policies; avoid duplicate or conflicting policy names. Migrations `003`, `006`, and `007` define policies; apply one set (e.g. `007_create_storage_policies.sql`) and drop duplicates if you’ve run multiple.

### CORS (if the app serves Supabase Storage URLs)

If the front end or Next.js loads files from Supabase Storage (e.g. `https://<project>.supabase.co/storage/v1/object/public/media/...`):

1. Supabase Dashboard → **Storage** → **Configuration** (or project **Settings** if CORS is there).
2. Add **allowed origins** for:
   - Production: `https://yourdomain.com`
   - Preview: `https://*.vercel.app` or your preview URL
   - Local: `http://localhost:3000`
3. Typical CORS headers to allow: `Origin`, `Content-Type`, `Authorization`; methods: `GET`, `HEAD` (and `PUT`/`POST` if uploading from browser).

If you don’t load Supabase Storage URLs from the app, you can skip CORS for now.

### Verification (when using Supabase Storage)

1. Upload a file to the `media` bucket (Dashboard or app).
2. Open the public URL in the browser; the file should load (no 404, no CORS error).
3. If you see CORS errors, fix allowed origins in Supabase Storage configuration.

---

## 3. Recommended file formats and sizes

- **Hero logo (home page title):** PNG or SVG only; max 2MB. Recommended: 1200px wide (min 600px), transparent background. Upload in Admin → Heroes (Hero Editor) when the Home tab is selected.
- **Hero background images/videos:** Compress before upload; prefer WebP for images; keep videos under plan limits.
- **Gallery/product images:** PNG, JPG, WebP; recommend max 2000–3000px long side, &lt; 10MB per file for fast loading.
- **Videos:** MP4 and other supported formats; keep under 2GB or your Uploadcare plan limit.
- **General:** Stay within `NEXT_PUBLIC_UPLOAD_MAX_BYTES`. If the uploader shows “Upload failed — try again”, check Supabase env and bucket permissions.

---

## 4. Quick checklist before new upload features

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (and keys) set in env (dev and prod).
- [ ] Test upload in Admin (Media library or hero slot); no console errors.
- [ ] One hero or media asset loads on the site (no 404/CORS).
- [ ] Supabase `media` bucket is public; RLS allows public read and authenticated write; CORS allows your app origins.

---

## 5. Hero logo upload (Step 2)

- **Storage:** `hero_sections.hero_logo_url` (TEXT) or storage path stores the logo URL. When set for the home hero, the front end shows the logo image instead of the text headline.
- **Admin:** Admin → Dashboard → Hero Editor → select “Home” → “Logo (PNG)” section: upload (PNG/SVG, max 2MB), preview, replace, or remove. Save to persist.
- **Uploads:** Media and hero uploads use Supabase Storage and `UniversalUploader` with progress and optional `acceptOverride` / `maxSizeBytes`.
