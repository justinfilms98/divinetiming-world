# Deployment Notes — Divine Timing

Use this for go-live and rollback. Phase 14 — Production Readiness.

---

## Required environment variables

Set these in your hosting provider (e.g. Vercel) and in local `.env.local` for production builds.

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only; admin and uploads. Never expose to client. |
| `STRIPE_SECRET_KEY` | Shop | Must start with `sk_`. Without it, checkout returns 503 with friendly message. |
| `STRIPE_WEBHOOK_SECRET` | Shop | For Stripe webhooks (e.g. payment completion). |
| `NEXT_PUBLIC_SITE_URL` | Optional | Full site URL (e.g. `https://divinetiming.world`). Fallback: VERCEL_URL or default. |
| `ADMIN_EMAILS` | Optional | Comma-separated emails for admin (used in API); allowlist in `app/admin/layout.tsx` can be separate. |

Validation: server code uses `lib/env.ts` getters. Missing critical env causes 503 or redirect, not crash. No secret env is referenced from client components.

---

## Supabase migrations

Apply migrations in order (e.g. via Supabase Dashboard → SQL Editor or CLI). Key ones for current stack:

- **001** — Initial schema (tables, RLS baseline).
- **003** — Storage buckets.
- **005**, **006**, **007**, **026** — Storage/media policies.
- **009** — Phase 1 content (hero_sections, events, galleries, etc.).
- **011** — Phase 3/4 schema.
- **015** — Admin RLS (authenticated access where needed).
- **024** — Public media bucket / booking story.
- **026** — Hero carousel + storage media policies.
- **027** — Hero carousel Phase 9.1 (hero_slots).
- **028** — Hero label text.

Ensure all migrations up to **028** (and any later ones in `supabase/migrations/`) are applied before deploy. Run `supabase db push` or apply manually in order.

---

## Storage bucket expectations

- **Bucket `media`**: Hero images/logos, hero slot images/videos/posters, gallery media. Public read if the site serves them directly; **public write must be disabled**. Writes only via server routes after `requireAdmin()`.
- See **docs/SECURITY_CHECKLIST.md** for exact checks (RLS, policies, admin-only writes).

---

## Post-deploy smoke tests

1. **Public**: Open `/`, `/events`, `/media`, `/booking`, `/shop` — all render; no horizontal scroll on mobile.
2. **Admin**: Open `/admin` unauthenticated → redirect to login or home. Log in → dashboard and at least one save (e.g. hero or booking) works.
3. **Checkout**: With Stripe missing, checkout returns friendly 503. With Stripe set, one test session (then refund if needed).
4. **Hero**: One carousel transition; no overflow.

Full list: **docs/LAUNCH_CHECKLIST.md** (Phase 14 section + post-launch smoke).

---

## Rollback

- **Revert commit** and redeploy previous release (e.g. Vercel: Deployments → previous → Promote to Production).
- If DB or storage was changed, roll back migrations or restore from backup only if necessary; app rollback first is usually enough.
- After rollback, re-run smoke tests on the reverted build.

---

*Last updated: Phase 14.*
