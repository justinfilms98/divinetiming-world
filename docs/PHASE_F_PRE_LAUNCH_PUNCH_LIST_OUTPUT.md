# Phase F — Pre-Launch Punch List — Output

Fixes applied during manual QA. Smallest correct change; no new architecture; charter preserved.

---

## 1. Public UI issues

| Issue | Fix | File |
|-------|-----|------|
| None identified | — | — |

No public UI bugs were found in this pass. If you see layout, contrast, or empty-state issues on specific pages, they can be added as follow-up fixes.

---

## 2. Mobile issues

| Issue | Fix | File |
|-------|-----|------|
| None identified | — | — |

No mobile-specific code changes in this pass. Touch targets and responsive gaps were addressed in Phase D/E. Manual device QA remains recommended.

---

## 3. Admin UX issues

| Issue | Fix | File |
|-------|-----|------|
| None identified | — | — |

No admin UX changes in this pass. Success/error feedback (e.g. toasts) remains a possible follow-up.

---

## 4. Content/publishing issues

| Issue | Fix | File |
|-------|-----|------|
| **Draft galleries visible on Media page** | `getGalleriesForHub()` used an explicit select that omitted `status`, so the existing “only published” filter never ran. Switched to `select('*')` so `status` is included when the column exists and draft/archived galleries are hidden. | `lib/content/server.ts` |
| **Draft product viewable by direct slug** | Product detail page only filtered by `is_active`. After migration 031, draft/archived products should 404. Added a post-fetch check: when the row has a `status` field, require `status === 'published'` or call `notFound()`. Keeps pre-migration behavior (no status column) unchanged. | `app/shop/[slug]/page.tsx` |

---

## 5. Bugs/regressions

| Issue | Fix | File |
|-------|-----|------|
| None beyond the publishing fixes above | — | — |

No other bugs or regressions were identified in this pass.

---

## Issues fixed (summary)

1. **Galleries:** Media hub list now correctly hides draft/archived galleries by including `status` in the gallery select and using the existing status filter.
2. **Product detail:** Direct access to a draft/archived product by slug now returns 404 when the `status` column exists; behavior unchanged when the column is not present.

---

## Files changed

| File | Change |
|------|--------|
| `lib/content/server.ts` | `getGalleriesForHub()`: use `select('*')` so `status` is returned and the published filter applies. |
| `app/shop/[slug]/page.tsx` | After loading product by slug and `is_active`, require `status === 'published'` when `status` is present; otherwise `notFound()`. |
| `docs/PHASE_F_PRE_LAUNCH_PUNCH_LIST_OUTPUT.md` | **New** — this document. |

---

## Still blocking launch

1. **Migration 033 (products):** If you only ran `ALTER TABLE public.products ADD COLUMN subtitle text;` in the SQL editor, the `badge` column may be missing. Run the full `033_products_subtitle_badge.sql` migration (adds both `subtitle` and `badge` with `ADD COLUMN IF NOT EXISTS`) so admin and public product subtitle/badge work as intended.
2. **Migration 031 (content status):** Required for the product detail and gallery list publishing behavior above. Ensure `031_content_publish_states.sql` has been applied so `status` exists on events, products, galleries, and videos.
3. **Manual QA:** Recommended final pass on real devices for mobile layout, CTAs, and key flows (shop, media, booking, press kit).

Nothing else is currently blocked in code; remaining risk is environment (migrations, content state) and device-level QA.
