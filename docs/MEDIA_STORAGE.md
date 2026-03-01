# Media Storage – Stability & Verification

This doc ensures the storage layer is reliable before adding logo upload, WYSIWYG, and other features. **Primary storage for admin uploads is Uploadcare.** Supabase Storage is optional (e.g. legacy or future use); if used, it must be configured correctly.

---

## 1. Uploadcare (primary)

Admin uploads (hero, media library, galleries, shop, events) go through **Uploadcare** via `UniversalUploader` and are stored as CDN URLs in `external_media_assets`.

### Required

- **Env:** `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY` in `.env.local` (and in production). Without it, the uploader shows a message and uploads are disabled.
- **CDN domains:** The app expects URLs from `ucarecdn.com` or `ucarecdn.net`. Next.js `images.remotePatterns` in `next.config.ts` already allows these for `<Image>`.
- **Optional:** `NEXT_PUBLIC_UPLOAD_MAX_BYTES` (bytes) to cap file size; default 100MB. Match your Uploadcare plan limits.

### Quotas & subscription

- In [Uploadcare Dashboard](https://app.uploadcare.com/) → check **Usage / Plan** so you don’t hit quota (storage and traffic).
- If files disappear or uploads fail, verify subscription and that files exist in the Uploadcare project.

### CORS

- **Not required for the app.** Uploads go from the browser to Uploadcare’s API; the site only stores and displays CDN URLs. No CORS configuration needed in this repo for Uploadcare.

### Verification

1. **Upload:** Admin → Settings (or Media/Shop/Events) → use the file picker → choose an image → confirm it uploads and a CDN URL appears.
2. **Display:** Open the CDN URL in a new tab; image should load (no 404, no CORS error).
3. **Console:** No CORS or 404 errors when loading hero/media/shop images on the public site.

---

## 2. Supabase Storage (optional)

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

If you **only** use Uploadcare and don’t reference Supabase Storage URLs in the app, you can skip CORS for now.

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
- **General:** Stay within `NEXT_PUBLIC_UPLOAD_MAX_BYTES` and Uploadcare plan limits. If the uploader shows “Upload failed — try again”, check env and network; see docs for `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY`.

---

## 4. Quick checklist before new upload features

- [ ] `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY` set in env (dev and prod).
- [ ] Test upload in Admin (Settings hero or Media library); no console errors.
- [ ] One hero or media asset loads on the site (no 404/CORS).
- [ ] Uploadcare dashboard: subscription and quotas OK.
- [ ] If using Supabase `media` bucket: bucket is public, RLS allows public read and authenticated write; CORS allows your app origins.

---

## 5. Hero logo upload (Step 2)

- **Storage:** `hero_sections.hero_logo_url` (TEXT) stores the Uploadcare CDN URL. When set for the home hero, the front end shows the logo image instead of the text headline.
- **Admin:** Admin → Dashboard → Hero Editor → select “Home” → “Logo (PNG)” section: upload (PNG/SVG, max 2MB), preview, replace, or remove. Save to persist.
- **Shared upload helper:** All admin uploads use `lib/uploadcare.ts` (`uploadOne`, `getUploadcarePublicKey`) so behavior is consistent; the UI uses `UniversalUploader` with progress and optional `acceptOverride` / `maxSizeBytes`.
