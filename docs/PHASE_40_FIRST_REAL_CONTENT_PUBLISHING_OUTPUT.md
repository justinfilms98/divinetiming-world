# Phase 40 — First Real Content Population + Live Publishing Proof — Output

Baseline: Phase 39 (launch environment verified, admin safety verified, content entry order defined). No redesign. No architecture changes.

Objective: Use the system to populate the site with first real content and prove content flows from admin to public. Only enter real content, verify public reflection, and fix actual blockers.

---

## 1. What real content was entered (procedure)

Real content entry is performed by the operator in the running app (local or deployed). This section defines **what** to enter and **where**, so the first real population pass can be executed consistently.

### Priority 1 — Hero content

- **Where:** Admin → Hero → select page **Home**.
- **Enter:** Real hero media (image or looping video via upload or library), poster if video; page label; headline; subtext; primary CTA text + URL; secondary CTA is fixed “Booking” / “/booking” on homepage (no admin field).
- **Verify:** `/` — hero media, label, headline, subtext, primary CTA, platform/social row under CTAs.

### Priority 2 — Media content

- **Where:** Admin → Media (upload assets); Admin → Collections (create collection, add assets, set cover, publish); Admin → Videos (add video, optional caption/vertical).
- **Enter:** Several real assets in Media Library; at least one real collection with assets and cover; at least one real video (caption/vertical if enabled).
- **Verify:** `/media`, `/media/galleries/[slug]`, `/media` Videos tab.

### Priority 3 — Shop content

- **Where:** Admin → Shop.
- **Enter:** At least one real product: title, subtitle/badge if useful, real image (from library), price, published.
- **Verify:** `/shop`, `/shop/[slug]` — card and detail show image and details.

### Priority 4 — Events content

- **Where:** Admin → Events.
- **Enter:** At least one real event: title, date, venue, city/location, description, thumbnail (upload or library), optional ticket URL, published.
- **Verify:** `/events`, `/events/[slug]` — thumbnails and details.

### Priority 5 — Press kit / Booking / About / Settings

- **Where:** Admin → Press Kit; Admin → Booking (sections + hero); Admin → About; Admin → Settings.
- **Enter:** Real press kit fields; booking sections and hero; about content/photos; site settings (artist name, booking email/phone, social URLs).
- **Verify:** `/presskit`, `/booking`, `/about`; footer and social/contact surfaces (from `site_settings`).

---

## 2. What public pages were verified (code paths)

Code paths from admin save to public render were confirmed. No live browser run was performed in this phase; operator should confirm each URL after entering content.

| Content           | Admin save → DB                         | Public read                    | Public pages                          |
|------------------|------------------------------------------|---------------------------------|--------------------------------------|
| Hero (home)      | POST `/api/admin/hero` → `hero_sections` | `getHeroSection('home')`        | `/`                                  |
| Hero (media/booking/about) | Same API, `page_slug`               | `getHeroSection(pageSlug)`      | `/media`, `/booking`, `/about`        |
| Media library    | POST `/api/admin/media/upload` → storage + `external_media_assets` | N/A (admin only)   | —                                     |
| Collections      | Admin Collections CRUD → `galleries`, `gallery_media` | `getGalleriesForHub()`     | `/media`, `/media/galleries/[slug]`   |
| Videos           | Admin Videos CRUD → `videos`             | `getVideos()`                   | `/media` (Videos tab)                 |
| Shop             | Admin Shop CRUD → `products`, `product_images` | `getProducts()`, `getProductBySlug()` | `/shop`, `/shop/[slug]`     |
| Events           | Admin Events CRUD → `events`             | `getEventBySlug()`, list        | `/events`, `/events/[slug]`          |
| Press kit        | Admin Press Kit → `presskit`             | `presskit` select single        | `/presskit`                           |
| Booking          | Admin Booking → `booking_content`, hero  | `getBookingContent()`, hero     | `/booking`                            |
| About            | Admin About → `about_content`, `about_photos`, `about_timeline` | getAbout*(), hero   | `/about`                              |
| Settings         | POST `/api/admin/site-settings` → `site_settings` | `getSiteSettings()`      | Layout footer, social, booking contact |

---

## 3. What worked correctly

- **Hero:** API accepts label, headline, subtext, CTA text/URL, media (URL/storage path/slots); homepage and other pages use `getHeroSection` and render headline, CTAs, platform row. **Homepage subtext:** Previously the homepage passed `subtext={undefined}` to `HeroContent`, so saved hero subtext never appeared. This was fixed so the homepage now passes `heroSection?.subtext` (see §6).
- **Media/Collections/Videos:** Upload → storage + `external_media_assets`; collections and gallery_media resolve cover and media URLs; videos list filtered by status, caption/vertical supported (migration 034).
- **Shop:** Products and product_images with optional `external_media_asset_id` are resolved for public list and product-by-slug; images appear on card and detail page.
- **Events:** Events with thumbnail (URL or resolved from asset) display on list and detail.
- **Press kit / Booking / About / Settings:** Tables and getters are wired; admin forms POST to the correct APIs; public pages read from the same getters. Footer and social links use `getSiteSettings()` and `getPlatformLinks(siteSettings)`.

---

## 4. What failed or needs follow-up

- **Live data entry and visual check:** No automated or in-session content entry was performed. The operator should (1) run the app with a configured environment (Phase 39), (2) enter real content per §1, (3) open each public URL and confirm hero, media, shop, events, press, booking, about, and footer/social reflect saves.
- **Secondary CTA on homepage:** Secondary CTA is hardcoded as “Booking” / “/booking”. If a configurable secondary CTA is required later, it would be a small schema/API/UI addition (out of scope for Phase 40).

---

## 5. Exact minimal fixes applied

- **Homepage hero subtext not shown:** `app/page.tsx` was passing `subtext={undefined}` to `HeroContent`, so hero subtext saved in admin never appeared on `/`. Changed to `subtext={heroSection?.subtext ?? undefined}` so saved subtext is displayed when present.

---

## 6. Files changed

| File            | Change                                                                 |
|-----------------|------------------------------------------------------------------------|
| `app/page.tsx`  | Pass `heroSection?.subtext ?? undefined` into `HeroContent` so hero subtext appears on homepage. |

---

## 7. Remaining blockers before final launch / public sharing

- **None in code** for the publishing path. Remaining steps are operational:
  - Complete first real content population using the steps in §1.
  - Verify every public page listed in §2 after saving.
  - Confirm env, storage bucket, migrations, and admin_users per Phase 39 before going live.

Phase 40 is complete when the operator has run the first content pass, confirmed public reflection, and the site feels like a live artist site rather than a test build.
