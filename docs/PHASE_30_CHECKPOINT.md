# Phase 30 stability checkpoint

**Scope:** Phase 30A–30J — Admin consolidation, hero editor, uploader, audits, Supabase inventory.

## Before commit (done when this was created)

- [x] `npm run build` passes
- [x] `npm run audit:admin` passes

## Before push to production

1. **Manual smoke test (local or preview)**
   - Admin: `/admin`, `/admin/media`, `/admin/events`, `/admin/shop`, `/admin/settings`
   - Public: `/`, `/events`, `/media`, `/shop`, `/booking`
   - No hydration errors, no console crashes, upload works, hero save persists, no horizontal scroll in admin

2. **Deploy flow**
   - Push to GitHub → Deploy preview → Test preview URL → Then promote to production.
   - Do not hot-swap production until preview is verified.

## Supabase cleanup (separate step)

- Do **not** run Section 3 (EXECUTION CLEANUP) of `019_phase30i_cleanup_audit.sql` until:
  - Section 1 + 2 have been run and results reviewed
  - You have confirmed nothing critical is being dropped
- Schema cleanup = separate commit after review.
