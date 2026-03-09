# Phase 14 — Production Readiness & Security (Final Hardening)

## 1. Files changed

| File | Change |
|------|--------|
| `lib/env.ts` | **New.** Server-only env getters and `ENV_ERROR_MESSAGES`. |
| `lib/apiResponses.ts` | **New.** `apiSuccess(data)`, `apiError(message, status)` for standardized API shape. |
| `lib/supabase/service.ts` | Uses `lib/env` getters; throws safe message when env missing. |
| `lib/admin/auth.ts` | Returns `{ ok: false, error }` JSON for 401/403/503; no raw service-key message. |
| `app/api/checkout/route.ts` | Uses `getStripeSecretKey()`, `ENV_ERROR_MESSAGES`, `apiSuccess`/`apiError`; no Stripe instantiation when key missing; no raw error to client; dev-only log. |
| `app/api/webhooks/stripe/route.ts` | Guard when Stripe keys missing (503); sanitized error response; dev-only log on signature failure. |
| `app/api/admin/hero/upload/route.ts` | Uses `apiError()` for all error paths; no raw Supabase `uploadError.message`; dev-only logs. |
| `app/api/admin/hero/purge-legacy/route.ts` | Uses `apiError`/`apiSuccess`; no raw `error.message`; dev-only logs. |
| `components/shop/CartSlideOut.tsx` | Checkout success reads `data.ok && data.data?.url`; removed `console.error` on catch. |
| `app/cart/page.tsx` | Checkout success reads `data?.ok && data?.data?.url`. |
| `components/shop/ProductDetailClient.tsx` | Checkout success reads `data.ok && data.data?.url`; removed `console.error` on catch. |
| `lib/content/server.ts` | Removed `console.warn` in `getEventBySlug`. |
| `docs/SECURITY_CHECKLIST.md` | **New.** Storage, RLS, admin auth, file enforcement, API hygiene, env. |
| `docs/LAUNCH_CHECKLIST.md` | Phase 14 smoke section; known limitations (Stripe optional, lint). |
| `docs/DEPLOYMENT_NOTES.md` | **New.** Required env, migrations list, storage expectations, post-deploy smoke, rollback. |

---

## 2. What changed (by section)

### 14.1 Environment validation
- **`lib/env.ts`** (server-only): Safe getters for `getSupabaseUrl()`, `getSupabaseAnonKey()`, `getSupabaseServiceRoleKey()`, `getStripeSecretKey()`, `getSiteUrl()` (with fallback), `isStripeConfigured()`. Central `ENV_ERROR_MESSAGES` for user-facing strings.
- **Checkout:** Missing `STRIPE_SECRET_KEY` → 503 with `ENV_ERROR_MESSAGES.checkoutUnavailable`; no crash.
- **Optional `NEXT_PUBLIC_SITE_URL`:** `lib/site.ts` (unchanged) already falls back to VERCEL_URL or default; metadata remains valid.
- **Secrets:** No server-only env referenced from client components; `lib/env.ts` is `server-only`.

### 14.2 Supabase Storage + RLS
- **`docs/SECURITY_CHECKLIST.md`** added: Storage buckets (public read/write), RLS enabled, service role only in server code, admin upload routes require `requireAdmin()` before handling uploads, file size/type enforcement references.
- **Upload routes:** `hero/upload`, `hero-slot/upload` already call `requireAdmin()` first; errors now use `apiError()` (no raw Supabase message).

### 14.3 Admin route protection
- **Verified:** `app/admin/layout.tsx` does server-side redirect to `/login` or `/` when no user or user not allowlisted/in `admin_users`. No client-only gating.
- **API:** All `app/api/admin/*` routes use `requireAdmin()` and return 401/403 JSON. No gaps found; no code change beyond response shape (ok/error).

### 14.4 API response hygiene
- **Standard shape:** Success `{ ok: true, data }`, failure `{ ok: false, error: "Human readable message" }` via `lib/apiResponses.ts`.
- **Checkout:** Returns `apiSuccess({ url })` or `apiError(...)`; clients updated to read `data.ok && data.data?.url`.
- **Admin auth:** 401/403/503 return `{ ok: false, error }`.
- **Hero upload / purge-legacy:** All error paths use `apiError()`; no Stripe/Supabase raw `error.message` to client. Catch blocks log only in development.

### 14.5 Logging discipline
- **Removed:** `console.warn` in `lib/content/server.ts` (getEventBySlug).
- **Guarded:** Checkout, hero upload, hero purge-legacy, Stripe webhook: `console.error` / `console.warn` only when `process.env.NODE_ENV === 'development'`; messages do not include secrets or stack.

### 14.6 Smoke test + launch checklist
- **`docs/LAUNCH_CHECKLIST.md`:** New “Phase 14 — Production readiness smoke” section: public routes, admin routes (auth required), hero, upload, checkout (friendly error when Stripe missing; works when configured), mobile (no horizontal scroll).
- **Known limitations:** Explicit note that Stripe is optional; lint may have warnings; build must pass.

### 14.7 Deployment notes
- **`docs/DEPLOYMENT_NOTES.md`:** Required env vars, Supabase migrations list (001–028 and key ones called out), storage bucket expectations, post-deploy smoke tests, rollback (revert commit / redeploy previous).

---

## 3. Acceptance checklist

- [x] Missing `STRIPE_SECRET_KEY` does not crash build or runtime; checkout returns 503 with friendly error.
- [x] Missing optional `NEXT_PUBLIC_SITE_URL` does not break metadata (fallback used).
- [x] No secret env var referenced from any client component.
- [x] All admin upload routes require admin auth; reject with 401/403 when unauthorized.
- [x] `docs/SECURITY_CHECKLIST.md` includes storage, RLS, admin auth, and where to verify in Supabase.
- [x] Unauthenticated user cannot load any `/admin` route content (server redirect).
- [x] Admin API routes enforce auth.
- [x] No route returns raw `error.message` or stack to clients; standardized `{ ok, data/error }` where applied.
- [x] Debug/noisy console logs removed or limited to development; errors never log secrets.
- [x] Launch checklist updated with Phase 14 smoke and known limitations.
- [x] Deployment notes document env, migrations, storage, smoke tests, rollback.
- [x] Build passes.

---

## 4. Risks / follow-ups

- **Admin allowlist:** `app/admin/layout.tsx` still uses a hardcoded allowlist email plus `admin_users` table; consider moving to `ADMIN_EMAILS` env for consistency with API (optional, not required for Phase 14).
- **Other API routes:** Only checkout, webhook, hero upload, hero purge-legacy, and admin auth were explicitly standardized to `apiSuccess`/`apiError`. Other admin or public API routes can be migrated to the same shape in a follow-up.
- **Stripe webhook:** Returns 503 when keys are missing; Stripe will retry. Ensure env is set before going live so webhooks succeed.

---

*Phase 7–13 behavior and corner navigation unchanged. No visual changes except where required for security or stability.*
