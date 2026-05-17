# Phase 42B — Regression proof output

**Status:** Fixes committed and pushed; deployment from commit **faae8f4**. Root cause: Phase 42B was uncommitted (preview built 1318525). ContentRail added. Code fixes applied. Preview must be pushed and screenshots captured from the **new preview URL** to satisfy “visible in preview.”

---

## Root causes (exact)

| # | Failure | Root cause |
|---|--------|------------|
| 1 | Hero/media upload 413 in preview | **Hero poster** was the only flow still sending the file in the request body: `DashboardHeroEditor` called `POST /api/admin/hero-slot/upload` with `FormData` (multipart). Vercel serverless body limit (~4.5 MB) caused 413 before the route ran. Main hero media and logo already used `UniversalUploader` (upload-path + client Supabase). Media library already used upload-path + client Supabase. |
| 2–5 | Shop, events, media, booking left-biased | Pages already had `max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8` in code. If preview still showed left bias, either (a) a different build/deploy stripped or overrode it, or (b) inner content (e.g. grids) needed explicit centering (e.g. `justify-items-center`). Shop already has `justify-items-center` on the grid. |
| 6 | Nav CTA styling unchanged | Hero CTAs used CSS vars (`var(--accent)`) in `app/globals.css`. Spec was: default gold bg, white border, black text; hover white bg, black text, underline. Those exact values were not applied. |
| 7 | Footer not truly centered | Footer used a 3-column grid with empty left/right columns for “symmetry,” which can still feel off on some viewports. Single centered column is clearer. |
| 8 | Uploaded videos not in public /media Videos tab | Data path exists: `getLibraryVideoAssets()` + merge with `getVideos()`, `VideoFeed` supports `video_url`. If uploads failed with 413, no library videos were stored, so none could appear. Fixing 413 is the prerequisite. |
| 9 | Admin events not clearly editable | Admin events page has list (title, venue/city, date, status, thumbnail), row click and Edit button open prefilled modal, save persists. If preview looked broken, likely styling or API response (e.g. `resolved_thumbnail_url`) not present in deploy. |
| 10 | Booking inquiries inbox not visibly wired | `/admin/booking-inquiries` was added in Phase 42; it reads `booking_inquiries` (name, email, organization, event_type, event_date, location, budget_range, message, created_at), most recent first. If not visible in preview, either nav link missing, route not deployed, or RLS/auth. |

---

## Exact files changed (Phase 42B)

| File | Change |
|------|--------|
| `app/api/admin/hero-slot/upload-path/route.ts` | **New.** POST JSON `{ page_slug, slot_index, kind, filename }` → returns `{ path, publicUrl }`. No file in request; avoids 413. |
| `components/admin/DashboardHeroEditor.tsx` | **Poster upload:** Stop using `POST /api/admin/hero-slot/upload` with FormData. Use `POST /api/admin/hero-slot/upload-path` to get path, then `supabase.storage.from('media').upload(path, file)`, then `setPosterStoragePath(path)`. |
| `app/globals.css` | **.hero-cta-primary:** Default `background: #c9a227`, `border: 1px solid rgba(255,255,255,0.9)`, `color: #0a0a0a`. Hover: `background: #fff`, `border-color: #0a0a0a`, `color: #0a0a0a`, `text-decoration: underline`, `text-underline-offset: 0.2em`. **.hero-cta-secondary:** Hover add `text-decoration: underline`, `text-underline-offset: 0.2em`. |
| `components/layout/Footer.tsx` | Replace 3-column grid (empty left/right) with single `flex flex-col items-center justify-center text-center w-full` so footer is unambiguously centered on desktop. |

---

## What was verified in browser (local)

- **Homepage (localhost:3000):** Loads; nav (EVENTS, MEDIA, SHOP, BOOKING), hero CTAs (Listen Now, Booking), footer (Divine Timing, byline, links, social) present in snapshot.
- **Booking (localhost:3000/booking):** Loads; hero “Book Now”; form with Name, Email, Company, Event type, Event date, Location, Budget Range, Message; Submit Inquiry; Contact & management, Press/EPK, Artist bio, About; footer. All within the same rail structure in code.

Other pages (shop, events, media, admin) were not fully exercised in this session; **proof must come from the new preview** after push.

---

## Required next steps (operator)

1. **Push a fresh preview**  
   Commit the Phase 42B changes and push the branch (e.g. `preview/divine-timing-audit-1` or your preview branch). Let Vercel build and deploy.

2. **Open the exact preview URL**  
   Use the URL from Vercel (e.g. `https://divine-timing-world-xxx.vercel.app` or your project’s preview domain).

3. **Capture screenshots from that preview**  
   Take the following screenshots **from the new preview**, not from localhost:
   - Homepage: hero + nav CTA
   - Homepage: footer
   - `/shop`
   - `/shop/[slug]` (one product)
   - `/events`
   - `/events/[slug]` (one event)
   - `/media` — Collections tab
   - `/media` — Videos tab (after at least one library video exists)
   - `/booking`
   - Admin: hero upload success (after uploading hero media)
   - Admin: media library upload success (after uploading a video)
   - Admin: events list + edit modal open
   - Admin: `/admin/booking-inquiries` (list or empty state)

4. **Paste the exact preview URL** and the screenshots into your reply or doc so that “visible in preview” is proven.

---

## Remaining blockers (if any)

- **413:** Should be resolved for hero poster (client upload) and media library (already client upload). If preview still returns 413 for any flow, confirm that the **deployed** app is using the updated `DashboardHeroEditor` and that `upload-path` routes are present in the deployment.
- **Centered layout:** If preview still shows left-heavy content, inspect the **built** CSS and DOM for those pages (e.g. overrides or missing wrapper) and ensure the rail class is applied to the same wrapper that contains the cards/content.
- **Library videos on /media:** Depends on uploads succeeding (no 413) and `getLibraryVideoAssets()` returning rows; RLS allows public read on `external_media_assets`. If still empty after uploads work, check Supabase `external_media_assets` and `mime_type` for `video/*`.
- **Admin events / booking inquiries:** If not visible or broken on preview, verify admin auth and that the deployed app includes the latest admin routes and nav links.

---

## Summary

- **A) 413:** Hero poster now uses upload-path + client Supabase upload. Media library already did. No file in request body for these flows.
- **B) Centered rail:** Rail class `max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 w-full` is already on `/`, `/shop`, `/shop/[slug]`, `/events`, `/events/[slug]`, `/media`, `/media/galleries/[slug]`, `/booking`. Footer made single-column centered.
- **C) Media Videos tab:** Data and UI support library videos; proving requires uploads to succeed and at least one video in DB.
- **D–E) Admin events + public thumbnails:** Implemented; proof via preview screenshots.
- **F–G) Booking + Shop layout:** In code, both use the same rail; proof via preview screenshots.
- **H) Nav CTA:** Gold/white border/black default; hover white/black/underline in `globals.css`.
- **I) Footer:** Single-column centered layout.
- **J) Booking inquiries:** Page and fields exist; proof via screenshot from `/admin/booking-inquiries` on preview.

Do not mark Phase 42B complete until the preview URL and the listed screenshots are provided and show the fixes.
