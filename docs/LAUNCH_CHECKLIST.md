

# Launch checklist — Divine Timing

Use this before and after going live to ensure a confident launch.

---

## Environment variables (required)

Set these in your hosting provider (Vercel, etc.) and locally for production builds.


| Variable                        | Required      | Notes                                                                                                                 |
| ------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes           | Supabase project URL                                                                                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes           | Supabase anon/public key                                                                                              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes           | For server-side admin and uploads (keep secret)                                                                       |
| `STRIPE_SECRET_KEY`             | Shop/checkout | Must start with `sk_` (live or test). Without it, checkout returns a user-friendly “temporarily unavailable” message. |
| `STRIPE_WEBHOOK_SECRET`         | Shop/checkout | For Stripe webhooks (e.g. payment completion).                                                                        |
| `NEXT_PUBLIC_SITE_URL`          | Optional      | Full site URL for OG/canonical (e.g. `https://divinetiming.world`). If unset, Vercel URL or default is used.          |


---

## Pre-launch steps

1. **Run overflow audit (dev)**
  With the app running locally, open each URL with `?debugOverflow=1` and confirm no red outlines or console warnings:
  - `/` — Home  
  - `/events` — Events list  
  - `/events/[any-slug]` — Event detail  
  - `/media` — Media hub  
  - `/media/galleries/[any-slug]` — Gallery  
  - `/booking` — Booking  
  - `/shop` — Shop  
  - `/admin` — Dashboard  
  - `/admin/collections` — Collections  
  - `/admin/media` — Media library  
  - `/admin/videos` — Videos  
  - `/admin/shop` — Shop admin
2. **SEO / social**
  - Add `/public/opengraph.png` (1200×630 px) for social previews. Root layout references `/opengraph.png`; without it, crawlers may use a fallback or no image.
  - View source on key pages and confirm: unique `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:image`, and Twitter card tags.
  - Confirm `metadataBase` is correct (or set `NEXT_PUBLIC_SITE_URL`).
3. **Forms and workflows**
  - **Events**: Create an event in admin (title, slug, date, thumbnail, optional ticket URL). Confirm it appears on `/events` with thumbnail and that the detail page and ticket CTA work.
  - **Media**: Create a collection, set cover via “Set as cover,” add photos. Confirm `/media` shows the cover and gallery link, and `/media/galleries/[slug]` shows photos and viewer modal.
  - **Videos**: Add a YouTube URL in admin. Confirm stored ID and thumbnail on public Media (Videos tab); open modal and confirm iframe loads only when open.
  - **Booking**: Edit story blocks, reorder, Save All, optionally Reset to defaults. Confirm public booking page updates; tap “Book Now” and confirm form is visible below the header (no overlap).
  - **Shop**: With Stripe **not** configured, confirm admin shows “Stripe not connected” banner and that checkout (cart or product page) shows “Checkout is temporarily unavailable…” (no raw errors). With Stripe configured, run a test checkout.
  - **Hero carousel (Phase 9.2)**  
    1. Admin → Hero Editor → pick a page (e.g. Home). Slot 1: Upload image (file), Save All. Refresh `/` and confirm slot image appears and carousel rotates (7s) with flare.  
    2. Slot 2: Upload video + optional poster, Save All. Refresh home; confirm video and poster show; no horizontal overflow on narrow width.  
    3. Run “Purge legacy Uploadcare hero URLs” (confirm modal, then Purge). Confirm no errors; refresh home and confirm hero still renders from slots (no old Uploadcare URLs used).
4. **Performance**
  - Confirm `/media` uses the optimized hub query (no N+1).
  - Confirm hero video doesn’t block or stall on slow mobile.
  - Check that initial load of `/events` and `/media` doesn’t spike unnecessary network requests.
5. **Favicon / PWA (optional)**
  - Ensure favicon is set (e.g. in `app/` or `public/`). Add `manifest.json` or icons if you want installable PWA.

---

## Phase 14 — Production readiness smoke (pre-launch)

Run these in addition to the steps above.

1. **Public routes (no auth)**
   - `/` — Home (hero, no overflow).
   - `/events` — Events list.
   - `/events/[slug]` — One event detail (two-column, ticket CTA).
   - `/media` — Media hub (Collections / Videos).
   - `/media/galleries/[slug]` — One gallery + lightbox.
   - `/booking` — Booking (form, story blocks).
   - `/shop` — Shop grid.
   - `/epk` — EPK.
   - `/presskit` — Press kit.

2. **Admin routes (auth required)**
   - Log out (or use incognito). Open `/admin` → must redirect to `/login` or `/`, not show dashboard.
   - Log in. Then: `/admin`, `/admin/hero`, `/admin/events`, `/admin/booking`, `/admin/media`, `/admin/shop` — all load; Save/upload works.

3. **Hero**
   - Rotate through 2 carousel transitions; confirm no overflow (optional: `?debugOverflow=1` on `/`).

4. **Upload**
   - Hero: image slot upload works; video + poster works.
   - Purge legacy: run once; idempotent; no errors.

5. **Checkout**
   - With Stripe **missing**: checkout returns friendly “temporarily unavailable” (503); no stack or raw error.
   - With Stripe **configured**: create session and redirect to Stripe (test or live).

6. **Mobile**
   - Key pages: no horizontal scroll (Home, Events, Media, Shop, Booking).

---

## Post-launch smoke tests

Within 24 hours of launch, verify:

- Home, Events, Media, Booking, Shop load and render.
- No horizontal scroll on mobile (e.g. iPhone width).
- Key links: nav, footer, “Book Now,” “View site” from admin.
- One event detail and one gallery open correctly.
- If Stripe is live: one test payment and confirmation (then refund if needed).
- Admin login and at least one save (e.g. hero or booking story block) still work.

---

## Phase 21 — QA verification (pre–Phase 22)

- **Regression suite:** Formal checklist in `docs/PHASE21_QA_REGRESSION_SUITE.md` (public nav, home hero, booking, events, media, shop, admin, metadata, empty states).
- **Verified:** Public and admin routes audited; empty states and fallbacks in place; admin collections “View on site” only when gallery has slug; no new Uploadcare in UI flows.
- **Hero stutter (Phase 35):** Any hero transition stutter (e.g. slot 2) is **deferred** to Phase 35. Do not treat as a launch blocker. See `docs/PHASE35_HERO_STUTTER_BACKLOG.md`.

---

## Known limitations / future enhancements

- **Hero carousel**: 3-slot carousel per page (Phase 9.1/9.2). Each slot: image (upload or library), video (upload + optional poster), or YouTube/Vimeo embed. Upload path: `hero/{page_slug}/slot-{1|2|3}/{timestamp}-{filename}`. Purge legacy clears old Uploadcare/single-hero URL fields. **Hero transition stutter** (if present) is tracked in Phase 35 backlog; not a launch blocker.
- **OG image**: Default social image is `/opengraph.png`. For dynamic OG (e.g. per-event image), consider an OG image API route later.
- **Checkout**: Without Stripe keys, checkout is disabled and users see a friendly message; products and cart still work. Stripe is optional for running the site; shop and cart work without it.
- **Admin**: One allowlisted email (`divinetiming.world@gmail.com`) plus `admin_users` table; multi-user/roles can be added later.
- **Analytics**: Optional `api/analytics/track`; integrate with your preferred analytics provider.
- **Lint**: Some ESLint or TypeScript warnings may remain; build must pass. Fix unrelated lint only when explicitly requested.

---

## Pages to verify and “good” looks like


| Page                      | Good looks like                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/`                       | Hero, CTAs, no horizontal scroll; Listen/Booking links work.                                         |
| `/events`                 | List with thumbnails; cards link to detail.                                                          |
| `/events/[slug]`          | Hero with event image; date, location, description; “Get Tickets” if `ticket_url` set.               |
| `/media`                  | Tabs (Collections / Videos); gallery covers and video thumbnails; modals open on click.              |
| `/media/galleries/[slug]` | Gallery title, description, photo grid; viewer modal works.                                          |
| `/booking`                | Hero, story blocks (readable width), “Book Now” scrolls to form; form submits to configured contact. |
| `/shop`                   | Product grid with images and prices; add to cart and checkout (or friendly message if Stripe off).   |
| `/shop/[slug]`            | Product detail, variant select if applicable, checkout CTA.                                          |
| `/admin/`*                | Login required; sidebar, cards, Save All / per-section save; no overflow.                            |


---

*Last updated: Phase 21 — QA + Regression Suite; Phase 35 hero stutter deferred.*