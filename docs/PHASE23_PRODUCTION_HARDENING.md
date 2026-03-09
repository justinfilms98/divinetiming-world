# Phase 23 — Production Hardening & Security Audit

## Scope

Security, stability, and deployment readiness only. No visual redesigns, no hero/Phase 35 work, no CornerNav changes, no Uploadcare reintroduction.

## 1. Environment variable audit

### Summary

- **Server-only (never in client bundles):** `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON`, `VERCEL_URL` (used in server-only code).
- **Client-safe (NEXT_PUBLIC_):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_UPLOAD_MAX_BYTES`. Used in browser/client components and/or server.
- **Guards:** `lib/env.ts` is `server-only` and provides safe getters; server code should use it for required env. Client code only references `NEXT_PUBLIC_*`.

### Usage verified

| Location | Variable(s) | Safe? |
|----------|-------------|------|
| `lib/supabase/client.ts` | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes (client) |
| `lib/supabase/middleware.ts` | NEXT_PUBLIC_* | Yes |
| `lib/supabase/server.ts` | NEXT_PUBLIC_* (anon) | Yes (server session) |
| `lib/supabase/service.ts` | NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Yes (server-only) |
| `lib/supabaseAdmin.ts` | NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Yes (server-only) |
| `lib/admin/auth.ts` | ADMIN_EMAILS | Yes (server-only) |
| `app/api/webhooks/stripe/route.ts` | STRIPE_WEBHOOK_SECRET | Yes (server) |
| `lib/integrations/googleDrive.ts` | GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON | Yes (server) |
| `components/admin/UniversalUploader.tsx` | NEXT_PUBLIC_UPLOAD_MAX_BYTES | Yes (client override) |
| `lib/site.ts` | NEXT_PUBLIC_SITE_URL, VERCEL_URL | Yes (server metadata) |

No server secrets are referenced in client bundles.

## 2. API route security audit

### Admin routes

- All routes under `/app/api/admin/*` use `requireAdmin()` at the start of each handler. On failure they return 401 (Unauthorized) or 403 (Forbidden) or 503 (service unavailable) with safe messages only.

### Error message sanitization

- **Before:** Several admin and integration routes returned `error.message` or `err.message` in JSON responses, which could leak internal/database details.
- **After:** All 500 responses from admin and Google Drive API routes now return generic messages: `"Operation failed."`, `"Upload failed."`, or `"Check failed"` (health). Real errors are logged server-side only (e.g. `console.error`).
- **Files updated:**  
  `about-content`, `page-settings`, `gallery-media`, `galleries`, `site-settings`, `videos`, `media/register`, `hero/route`, `hero-slot/upload`, `events`, `media-library`, `product-images`, `products`, `booking-content`; `integrations/google-drive/assets`, `integrations/google-drive/health`.

### Status codes

- 400 for validation/bad request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 410 for deprecated Uploadcare endpoint, 500/503 for server errors. No sensitive hints in response bodies.

## 3. Admin route protection

- **Pages:** `app/admin/layout.tsx` runs server-side and redirects to `/login` if no user, and to `/` if user is not in allowlist (hardcoded email + `admin_users` table). All `/admin` and `/admin/*` pages are wrapped by this layout.
- **API:** Every handler under `/app/api/admin/*` calls `requireAdmin()` and returns the error response if auth fails. No admin API is callable without a valid session and admin identity (ADMIN_EMAILS or `admin_users` table).
- **Revalidate:** `POST /api/revalidate` checks session and `admin_users` table (not requireAdmin); same effective protection for revalidation.
- **Google Drive integration:** `/api/integrations/google-drive/*` use session + `admin_users` check (admin-only).

## 4. Supabase access sanity

- **Public/anon client** (`lib/supabase/client.ts`): Used in browser and in admin client components (e.g. MediaLibraryPicker, DashboardHeroEditor). Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. RLS applies.
- **Server session client** (`lib/supabase/server.ts`): Used in server components and API routes that need the current user session (e.g. admin layout, checkout, booking).
- **Service role** (`lib/supabase/service.ts` via `getServiceClient()`, and `lib/supabaseAdmin.ts` via `supabaseAdmin()`): Used only in server code (API routes after `requireAdmin()`, hero uploads). Never exposed to client. Storage bucket `media` is public for reads; writes go through authenticated admin APIs.

No schema changes in this phase. Database access patterns are unchanged except for response sanitization.

## 5. Storage reliability check

- **Upload path:** Client uploads to Supabase Storage bucket `media` via `lib/supabaseStorage.ts` (anon client with RLS/policy). Then `POST /api/admin/media/register` (provider `supabase`) creates/updates rows in `external_media_assets`. Resolvers (e.g. `resolveMediaUrl`, `resolveHeroMediaUrl`) use storage path or public URL; display uses `supabasePublicObjectUrl` for Supabase paths.
- **No Uploadcare upload paths:** New uploads use Supabase only. `POST /api/assets/external` returns 410 with a message that Uploadcare is no longer used. Legacy support exists only in resolver/display for existing `provider === 'uploadcare'` rows and in admin “legacy” toggle.

## 6. Error handling

- **Media uploads:** Admin hero-slot and hero upload routes use try/catch; 500 responses return "Upload failed." or "Operation failed."; errors logged server-side.
- **Event/product/hero/booking admin:** try/catch in place; user-facing errors sanitized as above.
- **Checkout:** Uses `ENV_ERROR_MESSAGES.checkoutUnavailable` for user-facing response; raw error only in dev `console.error`.
- No overengineering; existing structure kept.

## 7. Dependency safety

- **package.json audited:** No Uploadcare (or similar) packages. Dependencies in use: Next.js, React, Supabase, Stripe, Framer Motion, Tiptap, googleapis, sanitize-html, etc. No clearly unused packages removed in this phase to avoid risk; no new libraries introduced.

## 8. Production readiness notes

### Environment requirements

- **Required for production:**  
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS` (or populated `admin_users` table).
- **Required for checkout:** `STRIPE_SECRET_KEY`; for webhooks: `STRIPE_WEBHOOK_SECRET`.
- **Optional:** `NEXT_PUBLIC_SITE_URL`, `VERCEL_URL` (for canonical URL); `NEXT_PUBLIC_UPLOAD_MAX_BYTES` (client upload limit); `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` (Drive integration).

### Admin protection notes

- Admin UI is protected by `app/admin/layout.tsx` (session + allowlist + `admin_users`). Admin API is protected by `requireAdmin()` (session + ADMIN_EMAILS or `admin_users`). Ensure `ADMIN_EMAILS` and/or `admin_users` are correctly set in production.

### Storage verification

- New media uploads: Supabase Storage bucket `media` → register API → `external_media_assets` with `provider: 'supabase'`. No active Uploadcare flows.

### Known limitations

- Admin layout allowlist uses a hardcoded email plus `admin_users`; API uses `ADMIN_EMAILS` env plus `admin_users`. If ADMIN_EMAILS contains more emails than the layout allowlist, those users can use the API but not the admin UI (documented for consistency in future).
- `supabaseAdmin()` does not validate env before use; missing service role key can cause runtime errors. `getServiceClient()` in `lib/supabase/service.ts` validates and throws a safe message.

## Files changed (Phase 23)

| Area | Files |
|------|--------|
| Env | `lib/env.ts` (added `operationFailed` message) |
| API error sanitization | `app/api/admin/about-content/route.ts`, `page-settings/route.ts`, `gallery-media/route.ts`, `galleries/route.ts`, `site-settings/route.ts`, `videos/route.ts`, `media/register/route.ts`, `hero/route.ts`, `hero-slot/upload/route.ts`, `events/route.ts`, `media-library/route.ts`, `product-images/route.ts`, `products/route.ts`, `booking-content/route.ts`; `app/api/integrations/google-drive/assets/route.ts`, `health/route.ts` |
| Docs | `docs/PHASE23_PRODUCTION_HARDENING.md` (this file) |

## Acceptance checklist

- [x] Environment variables safe (server-only vs NEXT_PUBLIC_ verified)
- [x] Server/client boundary respected
- [x] Admin routes protected (layout + requireAdmin)
- [x] API errors sanitized (no error.message to client)
- [x] Supabase access verified (anon vs service, server-only for service)
- [x] Uploads confirmed Supabase-only; register API accepts only `supabase` provider
- [x] No active Uploadcare flows (legacy resolver/display only)
- [x] Dependency audit completed (no Uploadcare deps; no removals)
- [x] Documentation created
- [x] `npm run build` passes

## Next phase

**Phase 24 — Motion Discipline & Animation Consistency.**
