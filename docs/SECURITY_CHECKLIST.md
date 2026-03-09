# Security Checklist — Divine Timing (Phase 14)

Use this to verify Supabase Storage, RLS, and admin guardrails before and after deploy.

---

## 1. Storage buckets

| Check | Where to verify |
|-------|------------------|
| **Public read only where intended** | Supabase Dashboard → Storage → bucket `media`. If hero/images are public read for the site, ensure "Public bucket" is on for read; **never** enable public write. |
| **Public write disabled** | Every bucket must have "Public write" **off**. Uploads go through server routes only (admin auth required). |
| **Admin-only write** | Writes to `media` (hero, hero_slots, gallery, etc.) happen only from API routes that call `requireAdmin()` before accepting multipart or executing upload. |

**Code guardrails:**  
- `app/api/admin/hero/upload/route.ts` — `requireAdmin()` at top; rejects with 401/403 when unauthenticated or unauthorized.  
- `app/api/admin/hero-slot/upload/route.ts` — same.  
- Any other upload route under `app/api/admin/*` must call `requireAdmin()` and return 401/403 JSON before handling file upload.

---

## 2. RLS (Row Level Security)

| Check | Where to verify |
|-------|------------------|
| **RLS enabled on sensitive tables** | Supabase Dashboard → Table Editor → each table → RLS "Enabled". Typical: `hero_sections`, `events`, `galleries`, `gallery_media`, `products`, `product_variants`, `orders`, `admin_users`, `page_settings`, `site_settings`, etc. |
| **Policies match intent** | Public read for content tables if the site is public; no public insert/update/delete. Service role (used only in server code after auth) bypasses RLS — so admin routes must enforce auth before calling service client. |
| **Service role key usage** | Only in server code: `lib/supabase/service.ts`, `lib/supabaseAdmin.ts`, and API routes that first call `requireAdmin()`. Never in client components or `NEXT_PUBLIC_*` env. |

---

## 3. Admin auth

| Check | Where to verify |
|-------|------------------|
| **All /admin pages gated** | `app/admin/layout.tsx` — server-side: `createClient()` (Supabase auth), then redirect to `/login` if no user, redirect to `/` if user not in allowlist or not in `admin_users`. No client-only hide; unauthenticated users never see admin content. |
| **All /api/admin/* protected** | Each route handler calls `requireAdmin()` first; returns 401 (Unauthorized) or 403 (Forbidden) JSON on failure. No admin data returned without auth. |
| **Upload routes** | `requireAdmin()` before parsing `formData` or body; reject with 401/403 when auth fails. |

---

## 4. File size / type enforcement

| Check | Where to verify |
|-------|------------------|
| **Hero upload** | `lib/storageUpload.ts` + `app/api/admin/hero/upload/route.ts`: type allowlist (e.g. image/png, jpeg, webp), max size (e.g. 10MB). API re-validates and returns 400 when invalid. |
| **Hero slot upload** | `app/api/admin/hero-slot/upload/route.ts`: image/video/poster types and max sizes enforced; 400 on invalid input. |

---

## 5. API response hygiene

- No raw `error.message` from Stripe or Supabase returned to the client.  
- Use `lib/apiResponses.ts`: `apiSuccess(data)`, `apiError(message, status)`.  
- Errors log minimal info in development only; never log secrets.

---

## 6. Environment variables

- **Server-only (never in client):** `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ADMIN_EMAILS`, `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON`.  
- **Public (safe for client):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.  
- Use `lib/env.ts` getters in server code; never reference server-only env in client components.

---

*Last updated: Phase 14 — Production Readiness & Security.*
