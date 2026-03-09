# Phase 21 — QA + Regression Suite

**Goal:** Stabilization and verification. Create a formal regression checklist, verify critical flows, fix small blockers. No hero stutter work (Phase 35 deferred), no CornerNav changes, no Uploadcare reintroduction, no visual redesign unless a regression fix requires it.

---

## 1. Public navigation

| Route | Action | Expected result |
|-------|--------|-----------------|
| `/` | Load page | Home renders; hero, CTAs, no horizontal scroll. |
| `/` | Click Listen / Booking in hero | Correct external or internal navigation. |
| `/` | Open corner nav, click Events / Media / Shop / Booking | Navigate to respective public route. |
| `/events` | Load | Events list; hero; Upcoming/Past tabs if past exist. |
| `/events` | Click an event card | Event detail page loads. |
| `/media` | Load | Media hub; Collections / Videos tabs. |
| `/media` | Click a collection card (with slug) | Gallery detail loads. |
| `/media/galleries/[slug]` | Load valid slug | Gallery title, description, grid; Back to Media works. |
| `/media/galleries/[slug]` | Load invalid slug | 404. |
| `/shop` | Load | Shop grid or “No products yet.” |
| `/shop` | Click a product | Product detail loads. |
| `/shop/[slug]` | Load valid slug | Product detail; Back to Shop; Add to Cart / Buy Now. |
| `/shop/[slug]` | Load invalid slug | 404. |
| `/booking` | Load | Booking hero, story blocks, form; Book Now scrolls to form. |
| `/booking` | Click View EPK / Press Photos | Navigate to /epk, /media. |

---

## 2. Home hero

| Route | Action | Expected result |
|-------|--------|-----------------|
| `/` | Load | Hero shows (image/video/carousel per config); no layout overflow. |
| `/` | Optional: `?debugOverflow=1` (dev) | No red overflow outlines. |
| `/` | Hero with no label/subtitle/CTA | Renders without crash; optional fields omitted. |

**Note:** Hero transition stutter (e.g. slot 2) is **deferred to Phase 35**. Do not reopen hero carousel code for stutter in this phase.

---

## 3. Booking flow

| Route | Action | Expected result |
|-------|--------|-----------------|
| `/booking` | Scroll to form | Form visible; no header overlap (pt-28 md:pt-32 on wrapper). |
| `/booking` | Submit with valid contact (email/phone optional per config) | Submit succeeds or shows validation; no crash on missing optional fields. |
| `/booking` | Reorder story blocks in admin, Save | Public booking page reflects order. |

---

## 4. Events list / detail

| Route | Action | Expected result |
|-------|--------|-----------------|
| `/events` | Load with zero events | “No upcoming events. Check back soon.” or “No past events.” (no crash). |
| `/events` | Load with events | Cards with thumbnails or placeholder; link to detail. |
| `/events/[slug]` | Load event with no thumbnail | Hero uses fallback or events hero; no crash. |
| `/events/[slug]` | Click Get Tickets (if ticket_url set) | External ticket URL opens. |
| `/events/[slug]` | Copy link | Share URL copies to clipboard. |

---

## 5. Media hub / gallery

| Route | Action | Expected result |
|-------|--------|-----------------|
| `/media` | Load with zero collections | “Media collections coming soon.” (no crash). |
| `/media` | Load with zero videos | “Videos coming soon.” on Videos tab. |
| `/media` | Click collection with slug | Navigate to gallery. |
| `/media` | Click collection without slug | Card shows; no link (no href="#"). |
| `/media/galleries/[slug]` | Load gallery with zero media | “No media in this collection yet.” (no crash). |
| `/media/galleries/[slug]` | Click an image | Viewer modal opens. |
| `/media/galleries/[slug]` | Back to Media | Returns to /media. |

---

## 6. Shop list / detail

| Route | Action | Expected result |
|-------|--------|-----------------|
| `/shop` | Load with zero products | “No products yet.” (no crash). |
| `/shop` | Load with products | Cards with image or placeholder; click to detail. |
| `/shop/[slug]` | Load product with no image | “No image” placeholder; no crash. |
| `/shop/[slug]` | Add to Cart / Buy Now | Cart updates or checkout flow (or friendly message if Stripe off). |
| `/shop/[slug]` | Back to Shop | Returns to /shop. |

---

## 7. Admin hero

| Route | Action | Expected result |
|-------|--------|-----------------|
| `/admin/hero` | Load (auth) | Hero editor; page select; slot 1/2/3 upload and Save. |
| `/admin/hero` | Save All | No error; public hero reflects after refresh. |
| `/admin/hero` | Purge legacy | Confirm modal; purge runs; no error. |

---

## 8. Admin events

| Route | Action | Expected result |
|-------|--------|-----------------|
| `/admin/events` | Load (auth) | Events list; create/edit/delete. |
| `/admin/events` | Save event (slug, thumbnail) | Event appears on public /events and detail. |
| `/admin/events` | Links to public event | View on site uses correct slug. |

---

## 9. Admin media

| Route | Action | Expected result |
|-------|--------|-----------------|
| `/admin/media` | Load (auth) | Media library; upload; picker. |
| `/admin/media` | Include legacy (uploadcare) toggle | Optional; only affects listing; no new Uploadcare flows. |
| `/admin/media` | Register asset (Supabase) | POST /api/admin/media/register with provider supabase. |

---

## 10. Admin booking / shop

| Route | Action | Expected result |
|-------|--------|-----------------|
| `/admin/booking` | Load (auth) | Booking content; story blocks; Save. |
| `/admin/shop` | Load (auth) | Products; save; Stripe banner if not configured. |
| `/admin/shop` | Save product | Product appears on public /shop. |

---

## 11. Metadata / SEO sanity

| Check | Expected result |
|-------|-----------------|
| Root layout | metadataBase, title template, description, openGraph, twitter, robots, icons. |
| Home, Media, Shop, Booking, Events | Unique title, description, canonical, OG/twitter. |
| Gallery [slug] | generateMetadata; title “Gallery Name \| Divine Timing Media”; OG image from cover when present. |
| Product [slug] | generateMetadata; title “Product Name \| Divine Timing Shop”; OG image from product when present. |
| robots.txt | Allow /; Disallow /admin, /api, /login. |
| Fallback OG | /opengraph.png (or DEFAULT_OG_IMAGE) used where no page-specific image. |

---

## 12. Known exclusions / deferred issues

- **Phase 35 — Hero stutter:** Any hero transition stutter (e.g. slot 2) remains **deferred**. Do not reopen `HeroVideoCarouselPremium` or hero rotation logic for stutter in this phase. See `docs/PHASE35_HERO_STUTTER_BACKLOG.md`.
- **CornerNav:** No structure or placement changes in Phase 21.
- **Uploadcare:** No reintroduction; active flows use Supabase only. Legacy references in admin/media and resolveMediaUrl are for existing data only.
- **Visual redesign:** None unless required to fix a regression (e.g. broken overlap).

---

## Phase 21 verification summary

- **Public routes audited:** /, /booking, /events, /events/[slug], /media, /media/galleries/[slug], /shop, /shop/[slug] — no broken hrefs, invalid Link wrappers, or missing fallbacks identified beyond fixes below.
- **Admin routes audited:** /admin, /admin/hero, /admin/events, /admin/media, /admin/booking, /admin/shop — save wiring, picker logic, empty states verified; one fix: admin collections “View on site” only when gallery has slug.
- **Empty states:** Media hub (zero collections/videos), gallery (zero media), events (zero events), shop (zero products), product (no image), booking (optional fields) all fail gracefully.
- **Links:** No `href="#"` in user-facing navigation; no hardcoded localhost; no new Uploadcare in UI flows.
- **Launch checklist:** Updated with Phase 21 verification and Phase 35 deferred note.

---

## Files changed

| File | Change |
|------|--------|
| `docs/PHASE21_QA_REGRESSION_SUITE.md` | **New.** Formal QA checklist (Route / Action / Expected) for public nav, home hero, booking, events, media, shop, admin hero/events/media/booking/shop, metadata, known exclusions; verification summary. |
| `app/admin/collections/page.tsx` | “View on site” link only when `g.slug` is present; otherwise show “No slug” (avoids `/media/galleries/undefined`). |
| `docs/LAUNCH_CHECKLIST.md` | Added Phase 21 verification section; Phase 35 hero stutter explicitly deferred; hero carousel note references Phase 35 backlog. |

---

## What changed

- **QA doc:** Single source of regression checks for public and admin flows, metadata, and empty states. Hero stutter called out as Phase 35 deferred.
- **Admin collections:** Gallery rows without a slug no longer get a “View on site” link to an invalid URL; they show “No slug” instead.
- **Launch checklist:** Pre–Phase 22 verification and Phase 35 deferred note so launch and future phases are aligned.

No hero code, CornerNav, or Uploadcare changes. No visual redesign.

---

## Acceptance checklist

- [x] QA checklist doc created (`docs/PHASE21_QA_REGRESSION_SUITE.md`).
- [x] Public route audit completed (/, /booking, /events, /events/[slug], /media, /media/galleries/[slug], /shop, /shop/[slug]).
- [x] Admin route audit completed (/admin, /admin/hero, /admin/events, /admin/media, /admin/booking, /admin/shop).
- [x] Empty states verified (media hub, gallery, events, shop, product, booking).
- [x] Broken/fake links removed where found (admin collections slug guard).
- [x] No new Uploadcare references in UI flows (legacy-only references remain).
- [x] Launch checklist updated with Phase 21 and Phase 35 note.
- [x] Hero Phase 35 backlog explicitly documented as deferred.
- [x] `npm run build` passes.

---

## Known deferred issues

- **Phase 35 — Hero stutter:** If the hero carousel exhibits stutter (e.g. when slot 2 plays), it remains in the Phase 35 backlog. Do not reopen `HeroVideoCarouselPremium` or hero rotation for stutter fixes in subsequent phases unless Phase 35 is explicitly in scope. See `docs/PHASE35_HERO_STUTTER_BACKLOG.md`.

---

*Last updated: Phase 21 — QA + Regression Suite.*
