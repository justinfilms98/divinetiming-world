# Divine Timing — Phase 0 audit baseline (2026-10-26)

Read-only audit against `DIVINE_TIMING_CURSOR_AUDIT_2026-10-26.md`. No code, data, DNS or deployment was changed.

## Baseline

| Item | Value |
|---|---|
| Branch / commit | `main` @ `480293c` (clean, in sync with `origin/main`) |
| Stack | Next.js 16 App Router, React 19, Supabase (Postgres 17, Auth, Storage bucket `media`), Vercel, Stripe (not live) |
| Supabase project | `lokewuvbrrvmlgdwivoa` (us-west-2) |
| Typecheck | `tsc --noEmit` passes |
| Tests | `vitest run` 41/41 pass (5 files) |
| Lint | `eslint .` 43 errors, 71 warnings (pre-existing; not triaged) |
| Accounts | 1 auth user, 1 `admin_users` row, 0 orders |

Not yet measured: slow-3G/4G LCP, CLS, bytes and time to first video frame on real iOS Safari / Android Chrome. These still need a device session.

## Findings, by priority

### P0-SEC — Database is world-writable (not in the original brief; must go first)

Verified against live `pg_policies`. RLS is enabled, but legacy policies `FOR ALL USING (true)` with role `public` (which includes anonymous) sit on:
`admin_users`, `orders`, `order_items`, `events`, `products`, `galleries`, `gallery_media`, `videos`, `hero_sections`, `site_settings` (plus `page_settings`, `media_carousel_slides`, about tables, `booking_content`, `event_media`, `product_variants` per migrations 015/035/051).

That means anyone holding the public anon key (it ships in the browser bundle) can:
- Insert into `admin_users`. `lib/admin/auth.ts` `requireAdmin()` trusts that table, so a self-registered account gains service-role access to every `/api/admin/*` route. The `/admin` pages themselves are additionally gated by a hard-coded email in `app/admin/layout.tsx`, but the API is not.
- Read and edit orders (shipping names and addresses once the shop goes live). Today there are 0 orders.
- Read drafts, and edit or delete events, products, collections, videos, hero and site settings.
- Call `decrement_inventory` / `decrement_product_inventory` (granted to anon in `051`).

There's no sign of abuse so far (only one user and one admin row). Admin writes already go through server routes with the service role, and browser code only reads, so tightening is low-risk.

**Status (2026-10-26): fixed in the live database** by migrations `054_rls_lockdown`, `055_storage_lockdown` and `056_storage_drop_email_policies`. Each has a `.down.sql` that restores the exact previous policies.

Verified as an anonymous user via REST:
- Inserting into `admin_users` or `events` returns 401.
- `orders` and `admin_users` read back empty.
- The `decrement_inventory` RPC returns 401.
- Storage upload returns 403.
- No probe changed any data.

Verified by simulated session: the admin passes `is_admin()` and can upload to storage; a non-admin signed-in user sees no admin rows or inbox data. All 11 public pages return 200.

Code on branch `fix/rls-lockdown` moves the Stripe webhook and the checkout Stripe-ID writes to the service client. **That branch must merge before Stripe goes live**: the webhook on `main` still uses the anon client and can no longer write orders.

Remaining owner actions:
- Enable leaked-password protection (Supabase → Auth).
- Confirm email sign-up is disabled if only invited admins should have accounts.

### P1 — Publication controls (brief Phase 1)

- Status columns exist (`draft/published/archived`) on galleries, videos, events, products, releases and journey. There is no `is_hidden` and no scheduled publish (except press releases).
- **New events, products and videos default to Published**, both in the DB defaults (`031`) and in the admin forms (`admin/events/page.tsx:145`, `admin/shop/page.tsx:218`, `api/admin/videos/route.ts:40,100`).
- App queries filter correctly (`lib/content/server.ts`). Leaks are only via REST (see P0-SEC) and `/music/[slug]`, which serves future-dated releases by direct URL.
- Hero has no status; only per-slot `enabled`.
- Every delete is a hard delete. There's no revision history, `admin_users.role` is never read, and the audit log is only written by the inbox and YouTube routes.
- **Placeholder content currently published:** galleries `test` and `test-test`, 7 events titled `test…` (incl. 2027-01-01), product `test` ($7.00). Not modified, pending owner decision.

### P1 — Hero videos leak into the Videos tab (brief Phase 1)

Root cause: `app/api/admin/media/register/route.ts:84` hard-codes `usage_type: 'public'` for every upload, including hero and collection uploads. Then `lib/media/publicLibraryVideos.ts:12-30` lists every public, non-archived video on `/media`. Nine such videos are live. Carousel hero slots (`hero_slots` JSON) store raw URLs without an asset ID, so placements can't be traced.

### P1 — Portrait photos cropped (brief Phase 2)

Root cause: `components/collections/CollectionStory.tsx:118,128` renders every frame in a fixed `aspect-[16/10]` box with `object-cover`. Contributing cause: `UniversalUploader.tsx` never sends width and height to the register route, so all 20 library assets have null dimensions and `orientation='unknown'`. EXIF and duration aren't captured. Lightbox is fine (`object-contain`). Covers (`StoryCard.tsx`) force 4:3 or 16:9 with no focal point.

### P1 — Upload UX (brief Phase 3)

Multi-file and drag-drop already work, and media is compressed in the browser (images up to 1920px; ffmpeg.wasm for video). Gaps:
- One combined progress bar.
- The first failure aborts the whole batch, and there's no retry.
- Collections reorder with up/down buttons only.
- No focal point, no per-file status, no "where used" check before delete.
- The Videos admin accepts YouTube URLs only.
- ffmpeg.wasm loads from unpkg on the editor's device (heavy on phones).

### P0 — Endless "Buffering video" (brief Phase 4)

`components/ui/MediaAssetRenderer.tsx`:
- `buffering` starts true and is set again on every `waiting` event (32, 81-83).
- The only timer (1200 ms) runs before first play. After a mid-play stall, the spinner can show forever, and the poster stays hidden once `playing` is true (196).
- `stalled` and `suspend` aren't handled, and `saveData` / slow `effectiveType` aren't checked.
- Reduced motion doesn't stop the download.

Bandwidth:
- `preload="auto"`. On desktop, all up to 3 carousel videos mount and download at once (`UnifiedHero.tsx`).
- `app/page.tsx:138-140` adds a `<link rel=preload as=fetch crossorigin>` that the `<video>` can't reuse, which likely causes a double download.
- Duplicate `<source>` tags.
- Embed slots have no poster.
- Hero images are raw `<img>`, so no responsive sizes or modern formats.

### P0 — `.vercel.app` in canonical, OG and sitemap (brief Phase 5)

Live HTML on divinetiming.world has `canonical`, `og:url`, `og:image` and all sitemap `<loc>` set to `https://divinetiming-world-f4tb6rgbz-divine-timings-projects.vercel.app`. Search engines are being told the canonical site is a deployment URL.

Root cause: `lib/site.ts:11-17` falls back to `VERCEL_URL` (the per-deployment host) because `NEXT_PUBLIC_SITE_URL` isn't set in Vercel Production.

Also:
- `/opengraph.png` returns 404 (referenced site-wide; the file doesn't exist).
- `favicon.ico` is the default Next.js icon (25,931 bytes), with no apple-touch icon or manifest.
- `www.divinetiming.world` serves 200 instead of redirecting to the apex.
- Stripe `success_url` / `cancel_url` use the request origin (`app/api/checkout/route.ts:117-118`).
- `public/robots.txt` conflicts with `app/robots.ts`.

## Proposed order (each a small PR with a preview deploy)

| # | Scope | Main files | Needs owner decision? |
|---|---|---|---|
| 0 | **Security lockdown**: drop `USING (true)` write policies; anon/auth read published rows only; `admin_users` self-read only; revoke anon `decrement_*`; `requireAdmin` matches the layout gate | new migration `054_rls_lockdown.sql` + `.down.sql`, `lib/admin/auth.ts`, `app/admin/page.tsx` (counts via API) | No (backup/PITR confirmed first) |
| 1 | **Canonical domain**: prefer `NEXT_PUBLIC_SITE_URL` then `VERCEL_PROJECT_PRODUCTION_URL` then apex; www to apex redirect; Stripe URLs from `BASE_URL`; remove `public/robots.txt` | `lib/site.ts`, `lib/env.ts`, `next.config.ts`, `app/api/checkout/route.ts`; Vercel env `NEXT_PUBLIC_SITE_URL` | Confirm apex vs www |
| 2 | **Hero resilience**: stall watchdog (about 8s, then poster plus tap-to-play), bounded retry, keep poster visible while buffering, saveData / slow-network to poster only, mount active slide only, `preload="metadata"`, drop fetch preload and duplicate sources | `MediaAssetRenderer.tsx`, `UnifiedHero.tsx`, `app/page.tsx` | No |
| 3 | **Media separation**: `usage_type` per placement from the uploader; backfill hero-referenced assets to `hero`; Videos tab = explicit opt-in only; asset IDs in hero slots | `UniversalUploader.tsx`, `register/route.ts`, `DashboardHeroEditor.tsx`, `admin/collections/page.tsx`, `publicLibraryVideos.ts`, migration | Confirm "explicit placements only" |
| 4 | **Portrait layout**: capture width/height (and duration) at upload; backfill existing 20 assets; frames sized from real aspect ratio; portraits paired or column-capped; focal point for covers | `UniversalUploader.tsx`, `register/route.ts`, `lib/content/server.ts`, `CollectionStory.tsx`, `StoryCard.tsx`, migration | Layout: uncropped story sequence vs masonry |
| 5 | **Publication defaults**: new items default to Draft; Hide/Unhide; publish confirmation; soft-archive instead of hard delete; future-dated release gate | admin events/shop/videos pages + APIs, `getReleaseBySlug`, migration | Meaning of "Hide" (recommend: also blocks direct URL) |
| 6 | **Upload UX**: per-file progress/retry/continue-on-error, drag reorder, where-used before delete, help panel | `UniversalUploader.tsx`, `admin/collections`, `admin/media` | Team roles |
| 7 | **Brand assets**: favicon, apple-icon, manifest, OG image | `app/icon.png`, `app/apple-icon.png`, `app/manifest.ts`, `app/opengraph-image.*`, `app/layout.tsx` | Approved square logo + OG art |

## Owner decisions (for Lex and Laurance)

1. Hide the published test collections, events and product now, or keep them as private test content? (Recommend: set to draft, not delete.)
2. Collection detail: show full uncropped images (recommended) vs masonry vs justified rows; covers may crop with a focal point.
3. "Hide" means inaccessible by direct URL too (recommended).
4. Videos tab shows only videos explicitly placed there (recommended).
5. Primary host: `divinetiming.world` apex (recommended), with www redirecting to it.
6. Square logo or favicon and a 1200×630 share image.
7. Team roles: who uploads, who publishes.
