# Phase 39 — Launch Environment Setup + Content Entry Preparation — Output

Baseline: Phase 38 (release candidate approved for launch-content entry). This phase does not change public layout or add features. It verifies environment and admin safety and defines content entry order.

---

## 1. Environment verification

### Supabase (required for app and admin)

| Variable | Used in | Purpose |
|----------|---------|--------|
| **NEXT_PUBLIC_SUPABASE_URL** | Server + client Supabase clients, storage URLs | Supabase project URL. Required. |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | Server + client auth and RLS | Anon key for browser and server auth. Required. |
| **SUPABASE_SERVICE_ROLE_KEY** | Admin API routes, media upload, requireAdmin() service client | Bypasses RLS for admin writes and storage upload. Required for admin media upload and for requireAdmin() (getServiceClient). |

If `SUPABASE_SERVICE_ROLE_KEY` is missing or empty, media upload returns **503** with a clear message (Phase 36). Other admin API routes use the same key via `requireAdmin()`; if missing, they return 503.

### Storage

- **Bucket name:** `media` (hardcoded in `app/api/admin/media/upload/route.ts` as `BUCKET = 'media'`).
- **Requirements:**
  - Bucket must exist in the Supabase project (create in Dashboard → Storage if needed).
  - Upload uses the **service role** client, so bucket RLS/policies must allow service-role uploads (or bucket is configured so service role can write).
  - Public read: app builds public URLs via `NEXT_PUBLIC_SUPABASE_URL` + `/storage/v1/object/public/media/...`. So the bucket (or objects) must be **public** for those URLs to work on the site. Configure in Supabase Storage (e.g. public bucket or policy allowing public read).

If the bucket is missing or not writable, the upload API returns an error message (Phase 36); if the bucket name is wrong, the error will indicate a bucket/access issue.

### Database

- **Migration 034** (`034_videos_caption_vertical.sql`): Adds `videos.caption` (TEXT) and `videos.is_vertical` (BOOLEAN DEFAULT false). **Apply before relying on caption/vertical.** The app tolerates missing columns (Phase 36/RC): reads use `select('*')` and fallbacks; API retries without caption/is_vertical on column-missing error.
- **admin_users:** Admin layout (`app/admin/layout.tsx`) requires:
  1. User is logged in.
  2. User email equals **ALLOWLIST_EMAIL** (hardcoded `divinetiming.world@gmail.com`).
  3. A row exists in **admin_users** with `email = user.email` (lowercased).

So for admin access: the logged-in user’s email must be in **admin_users** and must be the allowlisted email (or the layout allowlist must be updated). API routes use `requireAdmin()` which allows admin if **ADMIN_EMAILS** env (comma-separated) contains the email **or** if **admin_users** has a row for that email.

- **Tables the app expects (from code):**  
  `page_settings`, `hero_sections`, `events`, `galleries`, `gallery_media`, `media_carousel_slides`, `products`, `product_images`, `booking_content`, `about_content`, `about_photos`, `about_timeline`, `videos`, `site_settings`, `external_media_assets`, `presskit`, `admin_users`, `booking_inquiries` (if used). Created by migrations (001, 009, 011, 012, 017, 031, etc.). Run all migrations in order so schema and RLS match the app.

### Optional / feature-specific

- **ADMIN_EMAILS:** Optional. Comma-separated list of admin emails. If set, API routes allow these emails without checking **admin_users**. If not set, **admin_users** is used.
- **NEXT_PUBLIC_UPLOAD_MAX_BYTES:** Optional. Max upload size in bytes; default 100MB.
- **STRIPE_SECRET_KEY** / **STRIPE_WEBHOOK_SECRET:** Required only for checkout; shop and product create work without them (admin shows “Stripe not connected”).
- **NEXT_PUBLIC_SITE_URL:** Optional; used for canonical/OG URLs; falls back to VERCEL_URL or default.

### Missing dependency checklist

- [ ] **NEXT_PUBLIC_SUPABASE_URL** set in deployment and local `.env`.
- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY** set.
- [ ] **SUPABASE_SERVICE_ROLE_KEY** set (required for admin upload and API admin routes).
- [ ] **media** bucket exists in Supabase Storage and is writable by service role; public read if media is served via public URLs.
- [ ] Migration **034** applied if you use video caption/vertical.
- [ ] **admin_users** contains the admin email; layout allowlist (`divinetiming.world@gmail.com`) matches the email you use to log in, or layout is updated to your admin email(s).
- [ ] All migrations applied so tables and RLS exist and match the app.

---

## 2. Admin safety verification

Verified from current code (no code changes in this phase).

| Check | Status | Notes |
|-------|--------|--------|
| **Required fields** | Confirmed | Events: date, title, venue required on form. Shop: name required (slug derived). Videos: title and YouTube URL/ID required; toast if missing. Collections: name required for create. |
| **Duplicate slug** | Confirmed | Products: API returns **409** and message “A product with this URL (slug) already exists…” (Phase 36). Events: API checks slug collision and returns 409. |
| **Upload failures** | Confirmed | Media upload returns clear errors: missing file, size limit, 503 if service role key missing, storage error message or bucket hint (Phase 36). Register returns error.message or short fallback. Client shows server message. |
| **Edit modals preserve data** | Confirmed | Shop/Events/Collections/Videos: edit opens with entity data; form uses defaultValue or controlled state initialized from selected entity. No overwrite until Save. |
| **Cancel never mutates** | Confirmed | Shop, Events, Collections, Videos: Cancel/close only call `closeModal()` or `closeEdit()` which set state (modal closed, editing cleared). No fetch or POST on cancel. Backdrop click also closes without saving. |

Conclusion: Admin forms and modals behave safely for launch content entry; no redesign applied.

---

## 3. Content entry order

Recommended order to minimize dependency issues and broken references:

| Order | Step | Why |
|-------|------|-----|
| 1 | **Upload media assets** | Library must exist before you assign images to collections, products, events, or hero. |
| 2 | **Create media collections** | Assign library assets to galleries; add media to each collection. Publish when ready. |
| 3 | **Add videos** | Videos tab is independent; add YouTube videos and optional caption/vertical. Publish when ready. |
| 4 | **Create shop products** | Assign library images to products; set name, price, slug. Publish when ready. |
| 5 | **Create events** | Set thumbnail from upload or library; set date, venue, title. Publish when ready. |
| 6 | **Configure hero** | Home (and page-specific heroes) can use library or URLs; set after media is available if using uploads. |
| 7 | **Configure press kit** | Press kit content is standalone; can be done anytime. |
| 8 | **Configure booking** | Booking content, about snippet, contact; can reference site settings. |
| 9 | **Configure about page** | About content and photos; can use library assets. |
| 10 | **Configure site settings** | Artist name, booking email/phone, social links; used across footer and booking. |

Rationale: Media first so every other area (collections, products, events, hero, about) can reference library or uploads. Then collections and videos (media hub). Then shop and events (depend on media for images/thumbnails). Then hero and global/settings so they can point at existing content. Press kit and booking are mostly standalone and can be ordered after or in parallel once media exists.

---

## 4. First content test (simulation)

Run this pass once to confirm each content type and public visibility. All steps assume you are logged in as admin and env/storage/DB are set.

| Step | Action | Where to check |
|------|--------|----------------|
| 1 | Upload **3 media assets** (e.g. 2 images, 1 video or 3 images) in Admin → Media. | Admin → Media: all 3 appear in the library. |
| 2 | Create **1 collection** in Admin → Collections; add at least one of the uploaded assets to it; set status Published. | Admin: collection shows; media count correct. Public **/media**: Collections tab shows the collection; click through to gallery detail. |
| 3 | Add **1 video** in Admin → Videos (title + YouTube URL; optional caption/vertical); leave Published. | Admin: video in list. Public **/media** → Videos tab: video appears in feed; prev/next if only one is fine. |
| 4 | Create **1 product** in Admin → Shop (name, price, optional image from library); set status Published. | Admin: product in list; image shows if assigned. Public **/shop**: product card appears; click to detail; image and CTA present. |
| 5 | Create **1 event** in Admin → Events (date, title, venue); set thumbnail from upload or library; set status Published. | Admin: event in list; thumbnail shows after save and on reopen. Public **/events**: event card shows thumbnail; click to event detail; thumbnail in hero or detail area. |

**Expected outcome:** No errors during create; each item appears in admin and on the corresponding public page. If any step fails, note the exact error (e.g. upload 503, duplicate slug 409, or missing table) and fix env/migrations/admin_users as needed.

---

## 5. Setup tasks still required (operator checklist)

Before treating the project as ready for full launch content:

- [ ] **Env in deployment:** Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in Vercel (or host) env. Optionally `ADMIN_EMAILS` or rely on **admin_users**.
- [ ] **Supabase Storage:** Ensure bucket **media** exists; allow service-role uploads; set public read if you use public object URLs for viewer.
- [ ] **Migrations:** Run all migrations (including 034 if using video caption/vertical) in the target Supabase project.
- [ ] **Admin access:** Insert the admin email into **admin_users**; use the same email as in the layout allowlist (`divinetiming.world@gmail.com`) or update the allowlist in `app/admin/layout.tsx` to match.
- [ ] **First content test:** Complete the 5-step first content test above and confirm each type appears correctly on public pages.
- [ ] **Stripe (optional):** If you need checkout, set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` and configure the webhook.

No code changes were made in Phase 39. Public layout and architecture are unchanged.
