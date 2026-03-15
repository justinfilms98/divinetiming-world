# Release Candidate Verification — Output Summary

Mode: verify, patch, stabilize. No broad redesign. No new phases unless a real issue was found.

Baseline: hero single-surface, media library + collections, shop thumbnail/editability, booking rebuild, footer rebuild, public empty-state hardening, event thumbnail client/API trim, videos runtime fallback when migration 034 is missing.

---

## 1. Real risks found

### P1 — Video `display_order` schema risk
- **Finding:** `videos.display_order` is defined in **001_initial_schema.sql** (videos table creation), not in a later migration. Index `idx_videos_order` is created there. So in any environment that ran the initial schema, `display_order` exists.
- **Conclusion:** No schema risk for `display_order` in normal deployments. No hardening added (unlike caption/is_vertical from 034). If an environment was created from a custom schema that omitted it, that would be an environmental issue, not something to guess at in code.

### P2 — Event thumbnail final runtime
- **Finding:** End-to-end flow re-audited:
  - Admin upload: sets hidden `thumbnail_url` + optional `external_thumbnail_asset_id`; form submit trims both (client) and API trims and coerces empty to null.
  - Admin library: sets `thumbnail_url` = asset `preview_url`, `external_thumbnail_asset_id` = asset id; same submit path.
  - Save: API POST writes `thumbnail_url` and `external_thumbnail_asset_id` to DB.
  - Reopen: Admin GET returns full event row; list includes these; modal uses them for `defaultValue` and for preview; `resolved_thumbnail_url` is attached by `withResolvedThumbnails`.
  - Public list/detail: `getEvents` / `getEventBySlug` attach `resolved_thumbnail_url` via `resolveEventThumbnailUrl` (storage path → thumbnail_url → external_thumbnail_asset_id); components use `resolved_thumbnail_url ?? thumbnail_url`.
- **Conclusion:** Logic is already correct. No code change; no churn.

### P3 — Release candidate smoke safety
- **Finding:** Admin collections page loads galleries with an **explicit select** including `status` and `external_cover_asset_id`. Those columns were added in later migrations (031 for status, 013/014 for external_cover_asset_id). In an environment where those migrations were not applied, the query would fail and the page could break.
- **Other routes checked:** Home, events, event detail, media, gallery detail, shop, shop detail, booking, presskit use server content layer with `select('*')` or minimal selects; null/status checks use safe fallbacks. Admin dashboard uses `select('id', { count: 'exact', head: true })` only. Admin media, shop, events, videos either use `select('*')` (videos after prior hardening) or select from tables whose columns are in the initial/long-standing schema. Only admin/collections had a clear “explicit column list that might not exist in all envs” risk.
- **Conclusion:** One real risk — admin/collections load. Patched.

---

## 2. Exact fixes made

### Admin collections load (P3)
- **File:** `app/admin/collections/page.tsx`
- **Change:** Replaced explicit `.select('id, name, slug, description, cover_image_url, external_cover_asset_id, display_order, status, gallery_media(id)')` with `.select('*, gallery_media(id)')`. On error, set galleries to `[]`. Map each row to `GalleryRow` with safe fallbacks: `status: (r.status ...) ?? 'published'`, `display_order: (r.display_order ...) ?? 0`, `external_cover_asset_id: (r.external_cover_asset_id ...) ?? null`, and equivalent for other fields. Ensures the page does not break when `status` or `external_cover_asset_id` are missing (e.g. migrations 031 or 013/014 not applied).

No other code changes. No changes for P1 (display_order confirmed in 001) or P2 (event thumbnail flow correct).

---

## 3. Files changed

| File | Change |
|------|--------|
| `app/admin/collections/page.tsx` | Load galleries with `select('*, gallery_media(id)')`, error handling, and normalized row mapping with fallbacks for status, display_order, external_cover_asset_id. |

---

## 4. Remaining blockers before preview deploy

- **Environment:** Ensure all migrations (001 through 034) are applied in the preview environment so caption/is_vertical and status columns exist where expected. If 034 is skipped, videos still work (fallbacks in place); if 031/013/014 are skipped, admin/collections now tolerates missing columns.
- **Event thumbnails:** If thumbnails still don’t appear in production, verify DB has `thumbnail_url` and/or `external_thumbnail_asset_id` after save and that `external_media_assets` is readable (RLS) for the API client.
- **No code blockers** identified in this pass; remaining items are environment and data checks.

---

## 5. Exact smoke-test checklist for release candidate verification

Run in order; confirm no crashes, no blank content where data exists, and no console/network errors.

**Public**
- [ ] **/** — Home loads; hero, platform row, footer present.
- [ ] **/events** — List loads; intro and event cards or empty state.
- [ ] **/events/[slug]** — One known event slug loads; thumbnail (if set), title, date, details.
- [ ] **/media** — Tabs: Collections and Videos; collections grid or empty state; Videos tab shows feed or empty state.
- [ ] **/media/galleries/[slug]** — One known gallery slug loads; images and captions or empty.
- [ ] **/shop** — Product grid or empty state; cards show image or placeholder.
- [ ] **/shop/[slug]** — One known product slug loads; gallery, price, CTA.
- [ ] **/booking** — Hero, story sections (if any), form, aside cards; submit (or validation) works.
- [ ] **/presskit** — Page loads; content or placeholders.

**Admin (authenticated)**
- [ ] **/admin** — Dashboard loads; counts for events, products, videos, galleries, library.
- [ ] **/admin/media** — Library list loads; upload or empty.
- [ ] **/admin/collections** — Galleries list loads; create/edit or empty state.
- [ ] **/admin/shop** — Products list; create/edit modal; image states clear.
- [ ] **/admin/events** — Events list; create/edit; set thumbnail (upload + library), save, reopen; thumbnail persists.
- [ ] **/admin/videos** — Videos list; add video (title + YouTube ID); caption/vertical optional.

**Event thumbnail (E2E)**
- [ ] Admin: Edit event → set thumbnail (upload or library) → Save → close → reopen same event; thumbnail still shown.
- [ ] Public: Same event shows that thumbnail on /events and on /events/[slug].

**Videos (migration 034 optional)**
- [ ] With 034: Add video with caption and “Vertical”; appears on /media Videos tab with caption and 9:16.
- [ ] Without 034 (if possible): /media and /admin/videos still load; no crash; videos show with defaults.

After all checks, do one full pass: home → shop → events → media → booking → presskit → footer links. No header overlap, no broken layout, no new errors in console or network.
