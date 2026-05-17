# Phase 12 — SEO + Metadata + Social Sharing

## Goal
Ensure every public page has correct metadata and social sharing previews: clean search indexing, intentional social previews, and event sharing support.

---

## 1) Files modified

| File | Change |
|------|--------|
| `lib/site.ts` | **New.** Centralized `BASE_URL`, `SITE_NAME`, `DEFAULT_OG_IMAGE`, `canonicalUrl()`, `absoluteImageUrl()` for SEO and OG image URLs. |
| `app/layout.tsx` | Uses `lib/site` for `BASE_URL`, `SITE_NAME`, `DEFAULT_OG_IMAGE`; adds `twitter.images` for default OG image. |
| `app/page.tsx` | **12.1** Metadata: title "Divine Timing — Liam Bongo & Lex Laurence", description, **12.5** `alternates.canonical: '/'`, **12.2/12.3** openGraph + twitter. |
| `app/events/page.tsx` | **12.5** `alternates.canonical: '/events'`; openGraph.url, twitter.description. |
| `app/events/[slug]/page.tsx` | **12.1/12.2/12.3** Full metadata with event-specific og:image when event has thumbnail; **12.5** canonical path; **12.4** JSON-LD Event structured data (name, startDate, location, image, description, url). |
| `app/media/page.tsx` | **12.5** canonical `/media`; openGraph.url, full twitter. |
| `app/shop/page.tsx` | **12.5** canonical `/shop`; openGraph.url, full twitter. |
| `app/booking/page.tsx` | **12.5** canonical `/booking`; openGraph.url, full twitter + description. |
| `app/about/page.tsx` | **12.1** Metadata added (title, description, **12.5** canonical `/about`, openGraph, twitter). |
| `app/epk/page.tsx` | **12.5** canonical `/epk`; openGraph.url; twitter card + description. |
| `app/presskit/page.tsx` | **12.1** Metadata added (title, description, canonical `/presskit`, openGraph, twitter). |
| `app/shop/[slug]/page.tsx` | **12.5** canonical `/shop/[slug]`; openGraph + twitter full (description, url). |
| `app/media/galleries/[slug]/page.tsx` | **12.5** canonical `/media/galleries/[slug]`; openGraph + twitter full. |
| `app/cart/layout.tsx` | **New.** Metadata for cart (title, description, canonical `/cart`, robots noindex). |

---

## 2) Metadata structure

### Page metadata standard (12.1)
- **Home:** title "Divine Timing — Liam Bongo & Lex Laurence", short description.
- **Events / Media / Shop / Booking / About:** title uses layout template (`%s | Divine Timing`); short, natural descriptions (no keyword stuffing).
- **Event detail:** title from event (title or city); description = title — location.
- **Product / Gallery:** title from entity; description from content or fallback.

### OpenGraph (12.2)
- **Root layout:** `og:type` website, `og:locale` en_US, `og:siteName`, default `og:image` from `/opengraph.png` (1200×630).
- **Per page:** `og:title`, `og:description`, `og:url` (path; resolved via metadataBase), `og:type` website.
- **Event detail:** when event has thumbnail, `og:image` overridden with absolute event image URL.

### Twitter cards (12.3)
- **Root:** `twitter:card` summary_large_image, default title/description/images.
- **Per page:** `twitter:title`, `twitter:description`; event detail overrides `twitter:images` when event has image.

### Canonical URLs (12.5)
- Every public page sets `alternates.canonical` to its path (e.g. `/events`, `/events/my-event`). Resolved as absolute URL via Next.js `metadataBase`.

### Fallback OG image
- Default: `/opengraph.png`. Ensure `public/opengraph.png` exists (1200×630 recommended) for site-wide previews when a page does not override.

---

## 3) Event schema implementation (12.4)

Event detail page injects a `<script type="application/ld+json">` with schema.org **Event**:

- **@context:** https://schema.org  
- **@type:** Event  
- **name:** event title  
- **startDate:** event date (YYYY-MM-DD)  
- **description:** when present  
- **image:** absolute URL when event has thumbnail  
- **location:** Place with name (venue) and address (addressLocality = city) when venue/city present  
- **url:** absolute event page URL  

Improves event visibility in search and event discovery.

---

## 4) Acceptance checklist

- [x] Every public page defines title and description.
- [x] OpenGraph metadata (og:title, og:description, og:image, og:type, og:url) set across the site; event pages override image when available.
- [x] Twitter cards (summary_large_image, title, description, image) render correctly.
- [x] Event detail pages include JSON-LD Event structured data.
- [x] Canonical URLs present on all public pages (and cart).
- [x] Build passes.

---

**Phase 7–11 behavior unchanged.** Add or update `public/opengraph.png` (1200×630) for default social previews.
