# Admin & Upload Fixes - Implementation Summary

## What Was Fixed

### 1. **Root Cause: Client-Side RLS Violations**
All admin CREATE/UPDATE/DELETE operations now go through server API routes using the Supabase **SERVICE ROLE**, bypassing RLS. The browser no longer writes directly to protected tables or Storage.

### 2. **API Routes Created** (all use `requireAdmin` + service role)
- `POST /api/admin/hero` – Homepage hero & page heroes
- `POST /api/admin/page-settings` – SEO + hero per page
- `POST /api/admin/site-settings` – Site settings, branding, hero (syncs to hero_sections for home)
- `POST,PATCH,DELETE /api/admin/galleries` – Galleries (with cover upload via Uploadcare)
- `POST,PATCH,DELETE /api/admin/gallery-media` – Gallery media items
- `DELETE /api/admin/media-library` – Remove assets from library (POST = existing `/api/assets/external`)
- `POST,DELETE /api/admin/products` – Products
- `POST,DELETE /api/admin/product-images` – Product images
- `POST,DELETE /api/admin/videos` – YouTube videos
- `POST,PATCH,DELETE /api/admin/events` – Events (create, update, reorder, delete)

### 3. **Settings Page: Supabase Storage → Uploadcare**
- Hero media upload now uses **UniversalUploader** (Uploadcare)
- Removed direct Supabase Storage upload and bucket permission issues
- Settings save goes through `/api/admin/site-settings`

### 4. **Media Admin**
- **Library** – UniversalUploader → `/api/assets/external` → `external_media_assets`
- **Galleries** – Cover image: UniversalUploader (no more URL-only)
- **Add media to gallery** – UniversalUploader → `/api/admin/gallery-media`
- **Add by URL** – Uses `/api/admin/gallery-media`
- All deletes and reorders use API routes

### 5. **Shop Admin**
- Product create/edit uses `/api/admin/products`
- Product images use **UniversalUploader** → `/api/assets/external` → store references in product_images
- Image delete uses `/api/admin/product-images`

### 6. **Homepage & Page Settings**
- Hero save uses `/api/admin/hero` (no direct `hero_sections` writes)
- Page settings save uses `/api/admin/page-settings`

### 7. **Live Site Routes**
- `/media/galleries/[slug]` – Gallery detail page (was 404)
- `/shop/[slug]` – Product detail (already existed)
- Media page uses **EventsHero** (same hero/top border as events)

### 8. **Navigation**
- Gallery cards link to `/media/galleries/[slug]` instead of client-side modal
- Shop product cards already link to `/shop/[slug]`

---

## Pasteable Cursor Prompt (for future sessions)

```
Fix admin uploads and RLS on divinetiming.world. All admin writes must use server API routes (SERVICE ROLE), never client Supabase.

DONE:
- /api/admin/* routes for hero, page-settings, site-settings, galleries, gallery-media, media-library, products, product-images, videos, events
- Settings hero: UniversalUploader (Uploadcare) instead of Supabase Storage
- Media admin: UniversalUploader for library, gallery cover, add gallery media
- Shop admin: UniversalUploader for product images
- /media/galleries/[slug] route
- Media page: EventsHero (same top border as events)
- Gallery cards link to /media/galleries/[slug]

VERIFY:
1. Homepage hero upload → Save → homepage updates
2. Media library upload → appears in library
3. Gallery cover upload works
4. Gallery add media works (no RLS)
5. Event thumbnail upload (via events admin)
6. Product image upload works
7. /shop/[slug] loads (no 404)
8. Cart visible on shop pages
```

---

## Env Required

- Supabase env (e.g. `NEXT_PUBLIC_SUPABASE_URL`) – for UniversalUploader and media storage
- `SUPABASE_SERVICE_ROLE_KEY` – for admin API routes
- `ADMIN_EMAILS` (optional) – comma-separated admin emails, or use `admin_users` table
