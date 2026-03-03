# Phase summaries — Luxury upgrade

## PHASE 0 — Design system foundation (typography, spacing, buttons, cards)

### Files touched
- `app/globals.css`
- `components/ui/LuxuryButton.tsx`

### What changed
- **Two-font system**: Formalized as `--font-display` (Playfair Display, headlines) and `--font-ui` (Inter, body/controls). Kept `--font-headline` / `--font-body` as aliases.
- **Typography tokens**: Added `--text-h1` through `--text-button`, `--line-height-*`, `--letter-spacing-tight|normal|wide|nav|caps`, and utility classes: `.type-h1`, `.type-h2`, `.type-h3`, `.type-subtitle`, `.type-body`, `.type-small`, `.type-label`, `.type-button`.
- **Spacing/UI tokens**: Added `--radius-button`, `--radius-button-sm`, `--radius-card`, `--radius-card-lg`, `--shadow-button`, `--shadow-button-hover`, `--shadow-card`, `--shadow-card-hover`.
- **Cards**: `.luxury-card` now uses `var(--radius-card)` and `var(--shadow-card)`.
- **Buttons**: `LuxuryButton` — primary uses gold shadow CSS variables (no orange); added `secondary` variant; sizes use `--radius-button` and `min-h` for tap targets; applied `.type-button` for consistent label typography.

### Acceptance
- [ ] Typography looks consistent across Home / Events / Media / Booking and Admin.
- [ ] Buttons look premium and consistent (primary gold glow, secondary outline).
- [ ] No random font usage on headings/buttons.

---

## PHASE 1 — Kill horizontal scroll (mobile + desktop)

### Files touched
- `app/globals.css` — `html`/`body`: `overflow-x: clip`, `body` `min-width: 0`.
- `components/layout/SocialDock.tsx` — Removed `absolute left-[-817px] top-[32px]` from the social bar (root cause of off-screen content and horizontal scroll).
- `components/layout/PublicLayout.tsx` — Wrapped page content in `div` with `w-full max-w-[100vw] overflow-x-clip min-w-0`; added `OverflowDebug`.
- `components/dev/OverflowDebug.tsx` — New: dev-only helper. With `?debugOverflow=1` in development, outlines and logs elements whose `scrollWidth` > viewport.
- `app/page.tsx` — Home root: `overflow-x-hidden` → `w-full max-w-[100vw] overflow-x-clip`.
- `app/events/page.tsx` — Root and section: `overflow-x-clip`; content div: `min-w-0`.
- `app/booking/page.tsx` — Root: `w-full max-w-[100vw] overflow-x-clip`.
- `app/media/page.tsx` — Root: `w-full max-w-[100vw] overflow-x-clip`.
- `app/events/[slug]/page.tsx` — Root: `overflow-x-clip`; **params fix**: support `params` as `Promise<{ slug: string }>` (Next 15/16) so event detail no longer 404s.

### Acceptance
- [ ] On mobile (e.g. iPhone), you cannot swipe right into black empty space on Home.
- [ ] Events list no longer shifts left / no right-scroll.
- [ ] Booking and Media: no right-scroll.
- [ ] Desktop: no horizontal scrollbars.
- [ ] Clicking an event goes to detail page (no 404).
- [ ] Optional: In dev, open `?debugOverflow=1` and confirm no red outlines (or only expected ones).

---

## PHASE 2 — Mobile nav / hamburger menu polish + platform logo links

### Files touched
- `lib/platformLinks.tsx` — **New.** Single source of truth: `getPlatformLinks(overrides?)`, `PlatformLink` type, `PlatformLinkOverrides`, and icon components (`SpotifyIcon`, `AppleMusicIcon`, `YouTubeIcon`, `InstagramIcon`, `PlatformIcon`). All links https; used by Home, Booking, menu, SocialDock.
- `lib/ui/useFocusTrap.ts` — **New.** Lightweight focus trap: focuses first focusable, Tab/Shift+Tab cycles inside, Escape calls `onEscape`.
- `lib/ui/useScrollLock.ts` — **New.** Locks body scroll when menu open; restores on cleanup.
- `components/layout/CornerNav.tsx` — Mobile menu replaced with premium drawer: full-viewport backdrop (blur + fade), right-side panel (slide 280ms, `w-[85vw] max-w-[320px]`), scroll lock, focus trap, ESC and click-outside close, focus returns to hamburger. Nav links with active state; “Listen” section with platform icon row (44px min tap targets, `aria-label` “Open Spotify” etc.). Uses `getPlatformLinks(siteSettings)` and `PlatformIcon`. No overflow-x.
- `components/layout/PublicLayout.tsx` — Passes `siteSettings` to `CornerNav`.
- `components/layout/SocialDock.tsx` — Uses `getPlatformLinks(siteSettings)` and `PlatformIcon`; removed duplicate default URLs and inline SVGs.
- `components/authority/AuthorityCTAs.tsx` — Uses `getPlatformLinks(siteSettings)` for Book + Listen buttons; added `siteSettings` prop; design tokens for buttons.
- `components/authority/ListenNow.tsx` — Uses `getPlatformLinks(platformOverrides)`; props changed from `streamingLinks` to `platformOverrides`.
- `components/home/HeroContent.tsx` — Primary CTA uses `<a target="_blank" rel="noopener noreferrer">` when `ctaUrl` is external; button classes use `--radius-button`.
- `app/page.tsx` — Listen URL fallback from `getPlatformLinks(siteSettings)` instead of authority-config.
- `app/booking/page.tsx` — Passes `siteSettings` to `AuthorityCTAs`.

### What changed
- **Platform links**: One config in `lib/platformLinks.tsx`. Defaults: Spotify, Apple Music, YouTube, Instagram. Overridable via `siteSettings` (or partial). Home hero “Listen Now”, Booking CTAs, mobile menu “Listen” row, and SocialDock all use it.
- **Mobile menu**: Drawer from right (280ms ease), backdrop blur, body scroll lock, focus trap, ESC and overlay click close, focus return to hamburger. “Listen” section with icon-only buttons (44px min), `aria-label` per platform. Panel constrained so no horizontal overflow.
- **Accessibility**: Menu is `role="dialog"` `aria-modal="true"`, close and nav links focusable, Tab trapped, ESC closes.

### Acceptance
- [ ] iPhone: menu opens/closes smoothly, no jitter.
- [ ] No right-swipe into empty space when menu is open or closed.
- [ ] Platform icons in menu open correct URLs in a new tab.
- [ ] Home “Listen Now”, Booking buttons, and menu icons all use URLs from `lib/platformLinks.tsx` (with optional siteSettings override).
- [ ] Keyboard: Tab cycles inside menu, ESC closes, focus returns to hamburger.

---

## PHASE 3 — Home hero + CTA polish (luxury, mobile-first, cinematic)

### Files touched
- `app/page.tsx` — Hero content restructured: optional eyebrow (“ELECTRONIC DUO”), logo/intro, MemberLine, HeroContent, HeroPlatformRow. Safe-area top padding, `min-w-0` for overflow. MemberNames removed from page (replaced by inline MemberLine).
- `components/home/HeroContent.tsx` — Optional eyebrow/headline; design tokens (type-h1, type-subtitle); `.hero-cta-primary` / `.hero-cta-secondary`; fade-up 120ms delay, 14px y, duration 520ms; `useReducedMotion` shortens animation; max-width on subtext; `hero-text-shadow` on subtext.
- `components/home/MemberLine.tsx` — **New.** “By Lex Laurence & Liam Bongo” line: muted, small, wide tracking; fade-in with reduced-motion support.
- `components/home/HeroPlatformRow.tsx` — **New.** Platform icon row from `getPlatformLinks(overrides)`; 44px tap targets, subtle border/hover; fade-in with reduced-motion support.
- `components/home/DivineTimingIntro.tsx` — Display font (`--font-display`), `.hero-text-shadow` on title for readability.
- `components/hero/HeroCarousel.tsx` — Softer overlay (from-black/25, to-black/60, radial 50%→35%); content overlay `overflow-hidden min-w-0`.
- `components/hero/UnifiedHero.tsx` — Same cinematic overlay tweak as HeroCarousel.
- `app/globals.css` — `.hero-cta-primary` and `.hero-cta-secondary` (48px min-height, shadow, hover lift, active press, focus ring); `.hero-text-shadow` for hero text readability.

### What changed
- **Hero composition:** Eyebrow (when no custom headline) → Title (logo or DivineTimingIntro) → Member line → Subtext → CTA cluster (Listen + Booking) → Platform icon row. Vertical rhythm and safe-area padding; no horizontal overflow.
- **CTAs:** Primary: gold, shadow, hover lift, active press. Secondary: outline, hover fill. Both 48px+ height, shared radius and focus rings. External links use `target="_blank" rel="noopener noreferrer"`.
- **Background:** Softer vignette/gradient (lighter black, larger transparent center) for a more cinematic look without flattening the image.
- **Readability:** `.hero-text-shadow` on eyebrow, title, subtext, and member line.
- **Micro-interactions:** Fade-up on HeroContent (14px, 520ms, 120ms delay); reduced motion respected across MemberLine, HeroPlatformRow, HeroContent.

### Acceptance
- [ ] iPhone (375/390): Hero balanced; CTAs readable and tappable; no overlap; safe-area respected.
- [ ] Desktop: Hero intentional; not empty or crowded; text readable on varied backgrounds.
- [ ] No horizontal scroll reintroduced.
- [ ] Platform row uses `getPlatformLinks`; links open in new tab.
- [ ] Reduced motion: hero content still appears without long animations.

---

## PHASE 4 — Events (public + admin sync): thumbnails, routing, premium cards

### Data flow (audit)

- **List page:** `app/events/page.tsx` → `getEvents()` from `lib/content/index.ts` → Supabase `events` table `select('*')`, then `withResolvedThumbnails(events)` from `lib/eventMedia.ts` attaches `resolved_thumbnail_url` per event.
- **Detail page:** `app/events/[slug]/page.tsx` → `getEventBySlug(slugOrId)` → query by `id` (if UUID) or `slug.eq.${slugNorm}` (slug normalized to lowercase), then `resolveEventThumbnailUrl(event)` for hero/side image.
- **Event model (DB):** `id`, `slug` (unique), `date`, `city`, `venue`, `ticket_url`, `is_featured`, `title`, `description`, `time`, `thumbnail_url` (TEXT), `external_thumbnail_asset_id` (UUID → `external_media_assets`), `display_order`, `created_at`, `updated_at`. No `thumbnail_storage_path` column; resolution uses `thumbnail_url` (https) and/or `external_thumbnail_asset_id`.
- **Admin:** Saves `thumbnail_url` (direct URL from upload/library) and `external_thumbnail_asset_id`. Public resolution: `resolveEventThumbnailUrl()` uses storage path if present (future), then valid `thumbnail_url`, then resolve from `external_thumbnail_asset_id` via `resolveMediaUrl()` (Uploadcare/Drive).

### Files touched

- `lib/eventMedia.ts` — **New.** `resolveEventThumbnailUrl(event)` (async), `withResolvedThumbnails(events)`, `eventDetailHref(event)` (slug lowercase or id). Order: storage path → thumbnail_url (https) → external_thumbnail_asset_id.
- `lib/types/content.ts` — Event type: added `resolved_thumbnail_url?: string | null`.
- `lib/content/index.ts` — `getEvents()` returns `withResolvedThumbnails(events)`; `getEventBySlug(slugOrId)` normalizes slug to lowercase, resolves thumbnail, attaches `resolved_thumbnail_url`.
- `components/events/EventCard.tsx` — Uses `eventDetailHref(event)` and `resolved_thumbnail_url ?? thumbnail_url`; fixed aspect 16/9 (md: 4/3); premium placeholder (date label, no “No Image”); type-label / type-h3; hover shadow + active scale; focus rings; luxury-card.
- `app/events/[slug]/page.tsx` — Hero and side image use `resolved_thumbnail_url ?? thumbnail_url`; design tokens for title/CTA; min-w-0 for layout.
- `app/api/admin/events/route.ts` — Accepts `slug` on create/update; `toKebabSlug()` for normalization; update sets slug when provided; create uses slug input or `generateEventSlug(title, city, date)`.
- `app/admin/events/page.tsx` — Event interface includes `slug`; form adds “URL slug” field with placeholder; payload sends `slug` for create/update.

### Fixes summary

- **Thumbnails:** Single resolution path: `resolveEventThumbnailUrl()` used by list and detail. Admin-uploaded thumbnails (direct URL or external_thumbnail_asset_id) now resolve and display on public list and detail.
- **Routing:** Slug normalized to lowercase in `getEventBySlug`; links use `eventDetailHref(event)` (slug lowercase or id). Admin can set/edit slug (kebab-case); API normalizes and generates on create if empty.
- **UI:** Event cards: 16/9 (4/3 on md), premium placeholder, type hierarchy, hover/press, no horizontal overflow. Detail: resolved image for hero and block, design tokens, CTA button only when `ticket_url` present.

### Acceptance

- [ ] Mobile Events list: centered, no overflow-x.
- [ ] Event cards show thumbnails when uploaded in admin.
- [ ] Clicking any event does not 404.
- [ ] Detail page matches selected event and shows correct image.
- [ ] Placeholder looks premium when no image.
- [ ] Admin: slug field present; create/update save correctly; thumbnail preview shows.

---

## PHASE 5 — Media page (alive, artsy, gallery + video, admin-sync)

### Data flow (audit)

- **Where media lives:** Galleries and gallery_media in Supabase (`galleries`, `gallery_media`). Videos in `videos` (id, title, youtube_id, thumbnail_url, display_order). Cover/media can use direct URLs or `external_cover_asset_id` / `external_media_asset_id` → `external_media_assets` (Uploadcare or Google Drive). Media page hero comes from `hero_sections` (page_slug = `media`); same resolution as other pages (mediaFinalUrl from storage path or media_url or external_media_asset_id).
- **Admin creates:** Galleries via `/api/admin/galleries` (name, slug, description, cover_image_url, external_cover_asset_id). Gallery media via `/api/admin/gallery-media` (gallery_id, media_type, url or external_media_asset_id). Videos via `/api/admin/videos` (title, youtube_id, thumbnail_url). Media hero: Dashboard hero editor, page = Media.
- **Public fetches:** `getGalleriesWithMedia()` and `getVideos()` and `getHeroSection('media')`. Galleries and gallery_media get resolved cover/URLs server-side in content layer (`resolveGalleryCoverUrl`, `resolveGalleryMediaUrl`). Videos get `resolved_thumbnail_url` (admin thumbnail or YouTube mqdefault). No N+1: resolution runs once per gallery and per media item in the same request.
- **Why “No Image” went away:** Public list now uses `resolved_cover_url` from the single resolver path; when missing, a premium empty card (icon + short message) is shown instead of “No Image” text.

### Single resolver path (like events)

- `lib/mediaGallery.ts`: `resolveGalleryCoverUrl(gallery)`, `resolveGalleryMediaUrl(item)` (returns url + thumbnailUrl), `resolveVideoThumbnailUrl(video)` (sync: thumbnail_url or YouTube mqdefault).
- List and detail use the same resolved fields: `getGalleriesWithMedia()` attaches `resolved_cover_url` and per-item `resolved_url` / `resolved_thumbnail_url`; `getGalleryBySlug(slug)` does the same for one gallery; `getVideos()` returns `MediaPageVideo[]` with `resolved_thumbnail_url`.

### Files touched

- `lib/mediaGallery.ts` — **New.** Resolvers for gallery cover, gallery media URLs, video thumbnail (server-side only).
- `lib/types/content.ts` — Gallery: `external_cover_asset_id`, `resolved_cover_url`. GalleryMedia: `url` optional, `external_media_asset_id`, `resolved_url`, `resolved_thumbnail_url`.
- `lib/content/index.ts` — `getGalleriesWithMedia()` resolves cover and media URLs; `getGalleryBySlug(slug)` added; `getVideos()` returns `MediaPageVideo[]` with `resolved_thumbnail_url`.
- `app/media/page.tsx` — Unchanged; already uses getGalleriesWithMedia, getVideos, hero section; passes data to MediaPageClient.
- `app/media/galleries/[slug]/page.tsx` — Uses `getGalleryBySlug(await params.slug)`; supports async params; passes resolved media to GalleryDetailClient; `max-w-[100vw] overflow-x-clip min-w-0`.
- `components/media/MediaPageClient.tsx` — Rewritten: tabs “Collections” (default) and “Videos”; Collections = pin-style grid (1/2/3/4 cols), cards use `resolved_cover_url` or `MediaEmptyCard`, link to `/media/galleries/[slug]`; Videos = thumbnail-only cards, mixed aspect (every 3rd tall), click opens `VideoPlayerModal` (iframe only when modal open); no inline gallery view; design tokens.
- `components/media/MediaEmptyCard.tsx` — **New.** Premium empty state (icon + message), no “No Image” text.
- `components/media/VideoPlayerModal.tsx` — **New.** Modal: blurred/dim background, focus trap, scroll lock, ESC/overlay close; embed URL from youtube_id only (no autoplay with sound); iframe mounted when open.
- `components/media/ViewerModal.tsx` — Focus trap, scroll lock, backdrop blur; used on gallery detail for photo/video lightbox.
- `components/media/GalleryDetailClient.tsx` — Unchanged; receives resolved media URLs from page.
- `app/admin/collections/page.tsx` — **New.** List galleries, add collection (name, description), delete; link to view on site; note on using API/library for cover and photos.
- `app/admin/videos/page.tsx` — **New.** List videos, add video (title, YouTube URL or ID), delete.
- `app/admin/page.tsx` — Dashboard: added Collections and Videos cards; Media library card shows `external_media_assets` count.

### Routes (public)

- `/media` — Hub: hero (image or video from hero_sections), tabs Collections | Videos; default tab Collections.
- `/media/galleries/[slug]` — Collection detail: hero title + description, photo grid, lightbox (ViewerModal) with next/prev, ESC, overlay click, focus trap, scroll lock.

### Acceptance checklist

- [ ] Mobile: no horizontal scroll on `/media` and `/media/galleries/[slug]`.
- [ ] Collections show real cover images when uploaded in admin (resolved_cover_url).
- [ ] Collection detail page loads correct photos (resolved_url / resolved_thumbnail_url).
- [ ] Lightbox works: ESC, overlay click, next/prev; focus trap and scroll lock.
- [ ] Videos tab shows mixed-aspect cards (thumbnails only); click opens modal; background blur; iframe loads only in modal; no autoplay with sound.
- [ ] Hero supports video or image (existing hero_sections + UnifiedHero); readable overlay.
- [ ] Empty states: premium placeholder, no “No Image” text.
- [ ] Admin: Collections and Videos pages allow add/delete; public Media page reflects content.

---

## PHASE 5.1 — Harden video + modals (QA follow-up)

### Embed security
- **API** (`/api/admin/videos`): Accept only `youtube_id` or `youtube_url`; normalize via `parseYouTubeId()` to 11-char ID. Reject invalid/non-YouTube with 400. Store `youtube_id` only (no raw URLs).
- **VideoPlayerModal iframe**: `sandbox="allow-scripts allow-same-origin allow-presentation"`, `referrerPolicy="strict-origin-when-cross-origin"`, `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"`. Embed URL keeps `autoplay=0` (user taps to play).

### Performance
- **Hub** uses `getGalleriesForHub()`: one query for galleries (no `gallery_media` rows), one for `gallery_media(gallery_id)` to compute counts. Resolve only cover per gallery. Detail page continues to use `getGalleryBySlug()` with full media. `/media` stays fast with many galleries/photos.

### Modal accessibility
- **VideoPlayerModal**: `role="dialog"`, `aria-modal="true"`, `aria-label="Video player"`. Save `document.activeElement` when opening; restore focus to that element on close.
- **ViewerModal**: `role="dialog"`, `aria-modal="true"`, `aria-label="Media viewer"`. Same focus restore on close. Arrow keys (Left/Right) already drive prev/next; ESC closes.

### Layout / design system
- **MediaEmptyCard**: Uses `rounded-[var(--radius-card)]` and `shadow-[var(--shadow-card)]` (same as luxury-card).
- **Video cards**: Hover/press aligned with EventCard (`hover:shadow-[var(--shadow-card-hover)]`, `active:scale-[0.995]`, 300ms transition).
- **Tall cards**: Mixed aspect (9:16) only at `md+`; on mobile all video cards are `aspect-video` so the feed looks intentional.

### Files touched
- `app/api/admin/videos/route.ts` — Normalize YouTube ID; reject invalid; store only 11-char id.
- `lib/content/index.ts` — `getGalleriesForHub()` (cover + media_count); keep `getGalleriesWithMedia()` for legacy.
- `app/media/page.tsx` — Use `getGalleriesForHub()`.
- `components/media/MediaPageClient.tsx` — Accept `GalleryForHub[]`; `hasMedia` from `media_count`; tall class `md:aspect-[9/16]` only.
- `components/media/VideoPlayerModal.tsx` — iframe sandbox/referrerPolicy/allow; dialog ARIA; focus restore on close.
- `components/media/ViewerModal.tsx` — dialog ARIA; focus restore on close.
- `components/media/MediaEmptyCard.tsx` — radius + shadow tokens.

---

## PHASE 6 — Booking page (total rebuild: “ancient scroll / story” + admin-controlled copy)

### Vision
Booking is the main lead page: narrative “ancient scroll” feel, long scroll, subtle celestial/time motifs (stars, clock, sunset), alternating left/right story blocks, Book Now CTA that smooth-scrolls to the form. Admin controls all hero text, story blocks, and contact/sponsors.

### Audit (current before Phase 6)
- **`/booking`**: UnifiedHero, SignatureDivider, StatsRow, AuthorityCTAs, BookingPresentationSections, then form + BookingAboutCard + BookingBioSection + EPK links, then contact strip. Data from getSiteSettings, getBookingContent, getHeroSection('booking'), getPageSettings('booking'), getAboutContent.
- **DB**: `booking_content` (title, description, display_order, image_url); `hero_sections` (page_slug=booking: headline, subtext, cta_text, cta_url); `page_settings` (booking_about_*, now booking_sponsors); `site_settings` (booking_email, booking_phone).
- **Placeholder**: BookingAboutCard showed “No about content yet. Edit in Admin…” when empty → replaced with premium default copy.

### Content model (admin-controlled)
- **Hero**: headline, subtext, cta_text (e.g. “Book Now”), cta_url (`#booking-form`) from `hero_sections` (page_slug=booking). Migration sets default CTA.
- **Story blocks**: `booking_content` with new `align_preference` ('left'|'right'|'auto'), `accent` ('star'|'clock'|'sunset'|null). Public page uses title = heading, description = body; alternating alignment by index or preference.
- **Contact**: `site_settings.booking_email`, `booking_phone`; `page_settings.booking_sponsors` (textarea/comma list). Admin → Booking edits all.

### DB / migration
- **024_booking_phase6_story.sql**: Add `booking_content.align_preference`, `booking_content.accent`; add `page_settings.booking_sponsors`; set booking hero CTA default to “Book Now” / `#booking-form` when empty; seed 4 default story sections if table empty.

### Public booking page layout
- **Hero**: Title + subtitle from hero_sections; primary CTA “Book Now” (smooth-scroll to `#booking-form` via native `<a href="#booking-form">`; HeroContent updated to use `<a>` for hash links); secondary links “View EPK”, “Press Photos”.
- **Story**: `BookingStoryScroll` — each block is a Reveal (fade-up, stagger); alternating left/right from `align_preference` or index; type-h2 heading, type-body body; motifs (StarsMotif, ClockMotif, SunsetMotif) in background at 5–6% opacity, clipped (no overflow-x).
- **Form section** (`id="booking-form"`, `scroll-mt-24`): Card with BookingForm (name, email, organization, event date, location, budget, message; 48px+ inputs, design tokens); contact block (email, phone); BookingAboutCard; BookingBioSection; sponsors (if set); EPK / Press links.
- **No** StatsRow or AuthorityCTAs at top; single long narrative scroll then form.

### Motifs
- **components/booking/motifs/**: StarsMotif, ClockMotif, SunsetMotif — lightweight SVG, opacity 5–6%, absolute, pointer-events-none, inside overflow-hidden container.

### Motion
- Smooth scroll: `scroll-behavior: smooth` (globals.css); hash CTA uses native anchor.
- Story blocks: Reveal (fade-up ~14px, 450–600ms); respects reduced motion via existing Reveal.

### Responsive
- Mobile: story blocks full-width stacked; form single column; 48px+ tap targets.
- Desktop: alternating story alignment; form 2-column (form + contact/about/sponsors). No horizontal scroll.

### Admin
- **Admin → Booking** (`/admin/booking`): Edit hero (title, subtitle, CTA label, CTA target); edit each story block (heading, body, align, accent), save per section via `/api/admin/booking-content`; edit contact (email, phone, sponsors), save via site-settings + page-settings. Toast on save. Link “View booking page”.
- **API**: `POST /api/admin/booking-content` (create/update by id); page-settings accepts `booking_sponsors`; existing hero update via page-settings with `hero: { headline, subtext, cta_text, cta_url }`.

### Files touched
- `supabase/migrations/024_booking_phase6_story.sql` — New. align_preference, accent, booking_sponsors, hero CTA default, seed story sections.
- `lib/types/content.ts` — BookingContentSection: align_preference, accent; PageSettings: booking_sponsors.
- `app/api/admin/booking-content/route.ts` — New. GET sections, POST create/update.
- `app/api/admin/page-settings/route.ts` — Accept booking_sponsors.
- `components/home/HeroContent.tsx` — Hash CTA: render `<a href={ctaUrl}>` for `#` links so smooth-scroll works.
- `components/booking/BookingStoryScroll.tsx` — New. Story blocks with Reveal, alternating align, motifs.
- `components/booking/motifs/` — New. StarsMotif, ClockMotif, SunsetMotif.
- `components/booking/BookingForm.tsx` — Design tokens, min-h 48px, no outer section (page wraps in #booking-form).
- `components/booking/BookingAboutCard.tsx` — Premium default when empty (no “No content yet”); design tokens.
- `app/booking/page.tsx` — Rebuild: hero + HeroContent CTA + EPK/Press links, SignatureDivider, BookingStoryScroll, section#booking-form with form card + contact + about + bio + sponsors + links.
- `app/admin/booking/page.tsx` — New. Hero form, story blocks form, contact/sponsors form; load via Supabase client.
- `components/admin/AdminNav.tsx` — Add Booking link.

### Acceptance checklist
- [ ] Booking page feels premium and story-like; long scroll is intentional.
- [ ] “Book Now” smooth-scrolls to the form.
- [ ] Client can edit story blocks (and hero, contact) in Admin → Booking.
- [ ] Motifs are present but subtle; no overflow-x.
- [ ] Form is clean, responsive, validated; 48px+ targets on mobile.
- [ ] No “No content yet” on public page; default about copy when empty.
- [ ] Mobile and desktop: no horizontal scroll.

---

## PHASE 6.1 — Booking polish (readability, motif safety, scroll offset, admin UX)

### Goals
1. Motifs never cause overflow or readability issues.
2. Story text width clamped for editorial readability.
3. Book Now scroll lands correctly below sticky header on iOS.
4. Admin → Booking: Save All, reorder (up/down), optional reset, character hints.

### A) Story readability (editorial clamp)
- **BookingStoryScroll.tsx**: Body text container `max-w-[60ch]`, heading container `max-w-[40ch]`; `leading-relaxed`; `min-w-0` on flex children and article for correct clamping.

### B) Motif overflow safety
- **BookingStoryScroll.tsx**: Story section `overflow-x-clip overflow-y-visible`; motif wrapper `absolute inset-0 overflow-hidden pointer-events-none` and `aria-hidden="true"`.
- **motifs/StarsMotif, ClockMotif, SunsetMotif**: SVG `w-full h-full` (or equivalent), percentage-based positioning where applicable; no hardcoded sizes that exceed parent; wrapper `aria-hidden="true"`.

### C) Book Now scroll offset
- **app/booking/page.tsx**: Form section `id="booking-form"` uses `scroll-mt-32` (safe for sticky header).
- **HeroContent.tsx**: For hash CTAs (`ctaUrl.startsWith('#')`), use `onClick` with `preventDefault()` and `document.querySelector(ctaUrl)?.scrollIntoView({ behavior: 'smooth', block: 'start' })` so iOS respects offset.

### D) Admin → Booking UX
- **app/admin/booking/page.tsx**: “Save All” at top (saves hero, all story sections with current `display_order`, contact/sponsors); single success toast or error toast listing failed section(s). Up/Down reorder per story block; order persisted via Save All. “Reset to defaults” danger button with confirm modal; `POST /api/admin/booking-content` with `{ reset: true }` restores 4 seeded sections. Character count hints: heading &gt; 80 and body &gt; 1500 show soft (muted) warning.
- **app/api/admin/booking-content/route.ts**: POST body `reset: true` → delete all `booking_content`, insert DEFAULT_SECTIONS (4), return new sections; revalidatePath('/booking').

### Files touched (Phase 6.1)
- `components/booking/BookingStoryScroll.tsx`
- `components/booking/motifs/StarsMotif.tsx`, `ClockMotif.tsx`, `SunsetMotif.tsx`
- `app/booking/page.tsx`
- `components/home/HeroContent.tsx`
- `app/admin/booking/page.tsx`
- `app/api/admin/booking-content/route.ts`
- `docs/PHASE_SUMMARIES.md`

### Acceptance (Phase 6.1)
- [ ] Desktop: story reads like a crafted article (clamped width).
- [ ] iPhone: no horizontal swipe into empty space on /booking.
- [ ] Tap “Book Now” on iPhone: form title and first input visible below nav.
- [ ] Admin: reorder sections, Save All; reset to defaults with confirm; character hints visible (soft warning when over limit).

---

## PHASE 7 — Admin panel overhaul (polish, grid, workflows, legacy)

### Goals
- Admin layout and spacing consistent with public luxury system (Phase 0 tokens where applicable).
- Shared admin UI building blocks and clear active state in nav.
- Fix admin-to-public workflows: hero placeholder, events thumbnail/slug, media gallery cover, videos YouTube ID, shop Stripe banner and product thumbnails.
- Hide legacy/Uploadcare clutter behind “Advanced / Legacy” accordion.

### 1) Admin layout and components
- **AdminShell**: Main content already uses `max-w-[1200px] px-6 py-8`; no change.
- **admin.css**: Added `.admin-section-gap`, `.admin-table` (row padding, hover), `.admin-modal-backdrop`, `.admin-modal-panel`, `.admin-modal-header`, `.admin-modal-body`, `.admin-modal-footer` for consistent modals.
- **AdminSectionHeader**: New component `components/admin/AdminSectionHeader.tsx` — title, optional description, optional actions.
- **AdminNav**: Clearer active state (`ring-1 ring-slate-300/50`), `aria-current="page"` when active.

### 2) Hero
- **DashboardHeroEditor**: Added placeholder panel: “Hero Carousel (3 slots) — Coming in a future phase. The single hero below is used on all pages for now.” Single-hero upload and preview unchanged.

### 3) Events
- Slug and thumbnail already in form (Phase 4). URL slug visible with hint “Lowercase, kebab-case. Used in /events/[slug].” Thumbnail: upload or “Choose from library”; preview and resolved thumbnail used on public.

### 4) Media / Collections
- **Collections**: Edit button per gallery; modal to edit name, description, and **Set as cover** via MediaLibraryPicker. Cover is saved as `cover_url` + `cover_external_asset_id`; public page uses resolved cover.
- **Media library**: “Advanced / Legacy (asset IDs, external references)” accordion at bottom; expanded view shows table of asset ID and preview URL (first 20). Default view remains upload + thumbnail grid.

### 5) Videos
- Admin list shows **ID: {youtube_id}** under each title so extracted YouTube ID is visible; thumbnail preview already from `img.youtube.com/vi/{id}/mqdefault.jpg`.

### 6) Shop
- **Stripe banner**: When Stripe is not configured (`STRIPE_SECRET_KEY` missing or invalid), admin Shop page shows a non-blocking banner: “Stripe not connected” with env var names and short instructions. Products still editable; checkout will fail until configured.
- **API**: `GET /api/admin/shop-config` returns `{ stripeConfigured: boolean }` (admin-only).

### 7) Legacy / Uploadcare
- Media library: “Advanced / Legacy” accordion hides raw asset IDs and preview URL table; default view is clean (upload + cards).

### Files touched (Phase 7)
- `app/admin/admin.css` — table and modal utility classes.
- `components/admin/AdminSectionHeader.tsx` — new.
- `components/admin/AdminNav.tsx` — active state and aria-current.
- `components/admin/DashboardHeroEditor.tsx` — Hero Carousel placeholder.
- `app/api/admin/shop-config/route.ts` — new (Stripe check).
- `app/admin/shop/page.tsx` — Stripe banner, shop-config fetch.
- `app/admin/videos/page.tsx` — “ID:” label for YouTube ID.
- `app/admin/collections/page.tsx` — Edit modal, Set as cover (MediaLibraryPicker), load `external_cover_asset_id`.
- `app/admin/media/page.tsx` — Advanced / Legacy accordion with asset ID table.
- `docs/PHASE_SUMMARIES.md` — Phase 7 summary.

### Acceptance (Phase 7)
- [ ] Admin feels consistent (spacing, cards, modals, nav active state).
- [ ] Hero Carousel placeholder visible; single hero stable.
- [ ] Events: slug and thumbnail clear; public event uses resolved thumbnail.
- [ ] Collections: Set as cover from library; public Media uses gallery cover.
- [ ] Videos: YouTube ID visible in list; thumbnail correct.
- [ ] Shop: Stripe banner when not configured; product thumbnails show; create/edit reflects on public Shop.
- [ ] Media: default view clean; legacy/asset IDs behind accordion.
- [ ] No regression of uploads; no overflow-x in admin.

---

## PHASE 8 — Final QA, performance, launch hardening

### Goals
- Zero overflow-x across all public and admin pages.
- SEO and social previews correct (title, description, OG, Twitter, canonical).
- Forms and admin workflows validated; checkout fails gracefully when Stripe is not configured.
- Light performance pass (images, embeds, data fetching).
- Launch checklist and known limitations documented.

### Step 1 — Overflow-X audit
- **AdminShell**: Rendered `OverflowDebug` inside `Suspense` so admin routes support `?debugOverflow=1` (dashboard, collections, media, videos, shop).
- **PublicLayout**: Already wraps public content in `max-w-[100vw] overflow-x-clip`; OverflowDebug already present for public routes.
- **Root containers**: Ensured every public page root has `w-full max-w-[100vw] overflow-x-clip`: shop page, shop/[slug], cart, EPK. Events, booking, media already had it.
- **admin.css**: `html.admin-active` and `.admin-root` already set `overflow-x: hidden`.

### Step 2 — SEO + meta + social
- **Root layout**: `metadataBase` (from `NEXT_PUBLIC_SITE_URL` or `VERCEL_URL` or default), title template `%s | Divine Timing`, default description, `openGraph` (type, locale, siteName, images: `/opengraph.png`), `twitter` (summary_large_image), `robots`.
- **Per-page metadata**: Events, Booking, Media, Shop — static `title`, `description`, `openGraph`, `twitter`. Events/[slug], Media/galleries/[slug], Shop/[slug] — `generateMetadata` for dynamic title/description/OG.
- **LAUNCH_CHECKLIST**: Document adding `/public/opengraph.png` (1200×630) for social previews.

### Step 3 — Workflow validation and error states
- **Checkout**: When `STRIPE_SECRET_KEY` is missing or invalid, API returns 503 with message “Checkout is temporarily unavailable. Please try again later or contact us.” Catch block returns the same message for Stripe-related errors (no raw stack traces).
- **CartSlideOut, ProductDetailClient, cart page**: Checkout failure uses `data?.error` from API or the same user-friendly message; no generic “Failed to create checkout session” or raw errors.

### Step 4 — Performance
- **Media hub**: Already uses `getGalleriesForHub()` (optimized).
- **Events/[slug], Shop**: Next/Image with `sizes`; shop product detail already has blur placeholder.
- **Videos**: Modal only renders iframe when `open`; no change.
- No refetch loops introduced; existing patterns kept.

### Step 5 — Error/empty states
- Checkout errors standardized to premium message.
- Existing empty states (e.g. “No products yet”) left as-is; no raw debug text found in key flows.

### Step 6 — Launch checklist
- **docs/LAUNCH_CHECKLIST.md** created: env vars, pre-launch steps (overflow audit, SEO, workflows, performance, favicon), post-launch smoke tests, known limitations, and “pages to verify / good looks like” table.

### Files touched (Phase 8)
- `components/admin/AdminShell.tsx` — OverflowDebug + Suspense for admin overflow audit.
- `app/shop/page.tsx` — Root overflow-x-clip; metadata.
- `app/shop/[slug]/page.tsx` — Root overflow-x-clip; generateMetadata.
- `app/cart/page.tsx` — Root overflow-x-clip; checkout error message.
- `app/epk/page.tsx` — Root overflow-x-clip.
- `app/layout.tsx` — metadataBase, title template, openGraph, twitter, robots.
- `app/events/page.tsx` — metadata.
- `app/events/[slug]/page.tsx` — generateMetadata.
- `app/booking/page.tsx` — metadata.
- `app/media/page.tsx` — metadata.
- `app/media/galleries/[slug]/page.tsx` — generateMetadata.
- `app/api/checkout/route.ts` — Stripe check + user-friendly error response.
- `components/shop/CartSlideOut.tsx` — Use API error message on checkout failure.
- `components/shop/ProductDetailClient.tsx` — Use API error message on checkout failure.
- `docs/LAUNCH_CHECKLIST.md` — New.
- `docs/PHASE_SUMMARIES.md` — Phase 8 summary.

### Acceptance (Phase 8)
- [ ] No overflow-x on any listed route with `?debugOverflow=1` (iPhone width); no horizontal scrollbars on desktop.
- [ ] View source: correct title/description/OG/Twitter per page; OG image path valid or documented.
- [ ] Events/Media/Booking/Shop workflows and admin flows work; checkout shows friendly message when Stripe not configured.
- [ ] Media/events initial load performant; no refetch storms.
- [ ] LAUNCH_CHECKLIST.md complete; Phase 8 summary in PHASE_SUMMARIES.

---

## PHASE 9 — Hero 3-slot carousel (production-grade)

### Goals
- Replace single-hero placeholder with real 3-slot carousel per page.
- Each slot: Supabase image (storage path or library image_url) or YouTube embed (11-char ID).
- 7s interval, film flare transition, zero layout shift, reduced-motion support, mobile-safe.
- Admin UI to manage 3 slots (reorder, type, overlay); backward compatible when hero_slots is null.

### Step 1 — Database
- **supabase/migrations/026_hero_carousel.sql**: Added `hero_slots` JSONB to `hero_sections`. Structure: array of `{ type: "image"|"youtube", image_storage_path?, image_url?, youtube_id?, overlay_opacity? }`. Max 3 slots enforced in app/API.

### Step 2 — Types and content
- **lib/types/content.ts**: `HeroSlot`, `HeroSlotResolved`; `HeroSection.hero_slots` (resolved).
- **lib/storageUrls.ts**: `resolveHeroSlotImageUrl(image_storage_path)` for slot images.
- **lib/content/index.ts**: `getHeroSection` selects `hero_slots`, normalizes to max 3, resolves image URLs (storage path or slot `image_url`); returns `hero_slots: HeroSlotResolved[] | null`.

### Step 3 — Film flare and carousel component
- **app/globals.css**: `@keyframes film-flare` (0 → 0.6 → 0 opacity, 250ms).
- **components/hero/FilmFlare.tsx**: Pure CSS overlay (radial + linear gradient), animation 250ms, `aria-hidden`.
- **components/hero/HeroCarouselV2.tsx**: Accepts `slots: HeroSlotResolved[]`. Single slot = no rotation; 2–3 = 7s interval, state machine (idle → fadeOut → flare → fadeIn). Image: next/image fill/cover, sizes 100vw, priority for first. YouTube: iframe only when slide active, `controls=0&mute=1&autoplay=1&loop=1&playlist=id`, sandbox/referrerPolicy. FilmFlare shown during flare phase. Reduced motion: no interval (first slot only). Container `min-h-[100vh] md:min-h-[80vh]`.

### Step 4 — Admin
- **app/api/admin/hero/route.ts**: Accept `hero_slots` in flat and nested payload; store `slice(0, 3)`.
- **app/api/admin/page-settings/route.ts**: Accept `hero.hero_slots` for consistency.
- **components/admin/DashboardHeroEditor.tsx**: Replaced placeholder with **HeroCarouselSlotsEditor**: 3 slots, each with type (Image / YouTube), image via MediaLibraryPicker (stores `image_url`), YouTube URL/ID with `parseYouTubeId` hint, overlay 0–70%, reorder Up/Down. Save All includes `hero_slots`; toast on success.

### Step 5 — Public wiring
- **app/page.tsx**: When `heroSection?.hero_slots?.length > 0`, render `HeroCarouselV2` with resolved slots; else keep existing `HeroCarousel` / `UnifiedHero` fallback.

### Step 6 — Performance and safety
- Only active slide mounts YouTube iframe; others not mounted.
- First slide image uses `priority`; no hydration mismatch; container overflow hidden; no horizontal scroll.

### Files touched (Phase 9)
- `supabase/migrations/026_hero_carousel.sql`
- `lib/types/content.ts` — HeroSlot, HeroSlotResolved
- `lib/storageUrls.ts` — resolveHeroSlotImageUrl
- `lib/content/index.ts` — hero_slots select, resolveHeroSlots, getHeroSection
- `app/globals.css` — film-flare keyframes
- `components/hero/FilmFlare.tsx` — new
- `components/hero/HeroCarouselV2.tsx` — new
- `app/api/admin/hero/route.ts` — hero_slots
- `app/api/admin/page-settings/route.ts` — hero.hero_slots
- `components/admin/DashboardHeroEditor.tsx` — HeroCarouselSlotsEditor, hero_slots in save
- `app/page.tsx` — HeroCarouselV2 when hero_slots present
- `docs/PHASE_SUMMARIES.md` — Phase 9 summary

### Acceptance (Phase 9)
- [ ] Admin can configure 3 slots (Image or YouTube per slot), reorder, overlay 0–70%, Save All; toast on success.
- [ ] Home uses HeroCarouselV2 when hero_slots has ≥1 resolved slot; otherwise legacy single hero.
- [ ] Carousel rotates every 7s; film flare visible between transitions; no horizontal scroll; mobile Safari smooth.
- [ ] Reduced motion disables auto-rotation; first slot only.
- [ ] Fallback: when hero_slots is null or empty, existing single-hero logic unchanged.

---

## PHASE 9.1 — Hero 3-slot carousel (full slot types, upload, purge legacy, 7s+flare)

**Order implemented: B → A → D → C** (types first, then DB, then admin UI, then API).

### Goals
- Full slot types: **Image**, **Uploaded video**, or **Embed** (YouTube/Vimeo) per slot.
- Admin: exactly 3 slot cards with enable toggle, media type, upload/preview/replace/clear, overlay 0–70%, reorder; **Purge legacy Uploadcare hero URLs** with confirm (block if all slots empty unless “Purge anyway”).
- API: hero save validates/normalizes `hero_slots` (embed → 400 if invalid); **POST /api/admin/hero-slot/upload** (image/video/poster); **POST /api/admin/hero/purge-legacy**.
- Public carousel: **7s** rotation; **~900ms** flare, swap slide **300–400ms** into flare; subtle flare, no overflow-x; video autoplay muted loop; embed iframe only when slide active; reduced motion = first slot only.

### B) Types (done first)
- **lib/types/content.ts**: `HeroSlot` — slot_index 1|2|3, enabled, media_type image|video|embed, image_storage_path, image_url, video_storage_path, poster_storage_path, embed_provider, embed_id, embed_url, overlay_opacity. `HeroSlotResolved` — resolved_* URLs.
- **lib/storageUrls.ts**: `resolveHeroSlotImageUrl`, `resolveHeroSlotVideoUrl`, `resolveHeroSlotPosterUrl` (supabasePublicObjectUrl).
- **lib/embed.ts**: `normalizeHeroEmbed(input)` → YouTube/Vimeo only; null = invalid (400 in admin API).
- **lib/content/index.ts**: `resolveHeroSlots` outputs `HeroSlotResolved[]`; supports new shape and legacy.

### A) Database
- **supabase/migrations/027_hero_carousel_phase9_1.sql**: `COMMENT ON COLUMN hero_sections.hero_slots` updated to new slot shape (enabled, media_type, storage paths, embed_*, overlay_opacity). Legacy columns remain; nulled by purge-legacy API.

### D) Admin UI
- **components/admin/DashboardHeroEditor.tsx**: HeroCarouselSlotsEditor — per-slot **Enabled** toggle; Image (upload + library + Clear); Video (Upload video, Upload poster, Clear, “Video uploaded” + poster preview); Embed (YouTube/Vimeo input, normalized display, invalid hint); overlay 0–70%; reorder Up/Down; **Purge legacy Uploadcare hero URLs** panel with confirm modal and “Purge anyway” when all slots empty.

### C) API
- **app/api/admin/hero/route.ts**: `normalizeHeroSlots()` — validate/normalize hero_slots (embed via normalizeHeroEmbed, overlay 0–0.7, slot_index 1–3); return 400 for invalid embed.
- **app/api/admin/hero-slot/upload/route.ts**: POST multipart `page_slug`, `slot_index` (1–3), `kind` (image|video|poster), `file`; path `hero/{page_slug}/slot-{slot_index}/{timestamp}-{filename}`; returns `{ storage_path, public_url }`.
- **app/api/admin/hero/purge-legacy/route.ts**: POST JSON `{ page_slug }`; nulls media_url, media_storage_path, hero_logo_url, hero_logo_storage_path, external_media_asset_id for that page.

### Public carousel
- **components/hero/HeroCarouselV2.tsx**: INTERVAL_MS 7000; phase `idle` | `flare`; swap at SWAP_AT_MS 350, idle at FLARE_MS 900.
- **components/hero/FilmFlare.tsx**: Flare duration 900ms; subtle gradient (no harsh white); overflow-hidden.

### Asset
- **public/brand/README.md**: Document `DT LOGO W.png` for header/branding/OG; place in `public/brand` and use where needed.

### Files touched (Phase 9.1)
- `lib/types/content.ts`, `lib/storageUrls.ts`, `lib/embed.ts`, `lib/content/index.ts`
- `supabase/migrations/027_hero_carousel_phase9_1.sql`
- `components/admin/DashboardHeroEditor.tsx`
- `app/api/admin/hero/route.ts`, `app/api/admin/hero-slot/upload/route.ts`, `app/api/admin/hero/purge-legacy/route.ts`
- `components/hero/HeroCarouselV2.tsx`, `components/hero/FilmFlare.tsx`
- `docs/PHASE_SUMMARIES.md`, `public/brand/README.md`

### Acceptance (Phase 9.1)
- [ ] Types compile; no `any`; resolver returns HeroSlotResolved with resolved_* URLs.
- [ ] Migration 027 applies; hero_slots comment documents new shape; legacy columns nullable for purge.
- [ ] Admin: 3 slots, Image/Video/Embed per slot, upload image/video/poster, embed YouTube/Vimeo only, purge legacy with confirm; Save All persists hero_slots.
- [ ] API: hero save 400 on invalid embed; hero-slot upload returns storage_path/public_url; purge-legacy nulls legacy fields.
- [ ] Public: 7s rotation, 900ms flare, swap at ~350ms; no overflow-x; video autoplay muted loop; embed iframe when active; reduced motion = first slot only.
- [ ] iPhone: no overflow, menu + hero stable, admin slot editor functional.

---

## Server/Client split (post–Phase 9.1)

To prevent **next/headers / server-only** build errors, content and Supabase usage are split:

- **Client components** may import only: `@/lib/content/shared`, `@/lib/eventDetailHref`, `@/lib/supabase/client`, types.
- **Server components / routes** import: `@/lib/content/server`, `@/lib/supabase/server` (or service-role modules as needed).
- **Event link**: client uses `eventDetailHref` from `@/lib/eventDetailHref`; do not import `@/lib/eventMedia` in any `"use client"` file.
- Server-only modules use `import 'server-only';` (see `docs/ARCHITECTURE.md` for full rules).

---

## PHASE 9.2 — Hero carousel stabilization (QA) ✅ Completed

**Goal:** Hero carousel admin “upload from file” UX + purge legacy + verify storage paths. Order: B → A → D → C.

### B) Types + validation
- **lib/content/shared.ts**: Added `normalizeHeroSlots(raw)` used by both admin (before save) and **app/api/admin/hero/route.ts** (server). Max 3 slots, slot_index 1–3 by position, overlay_opacity 0–0.7, embed YouTube/Vimeo only; invalid embed returns `{ error }` → 400.
- Admin **handleSave** calls `normalizeHeroSlots` and alerts on error; API returns 400 with same message. Clearing embed stores null.

### A) Database
- **027_hero_carousel_phase9_1.sql**: Idempotent (COMMENT only); no destructive ops. `getHeroSection()` selects `hero_slots` via HERO_SELECT.

### D) Admin UX
- **DashboardHeroEditor** (HeroCarouselSlotsEditor): Enabled toggle, Image/Video/Embed per slot. Image: “Upload image” (file) + “Choose from library” + Clear. Video: “Upload video” + “Upload poster” + “Video uploaded” + poster preview + Clear. Embed: YouTube/Vimeo input, normalized display, invalid hint. Reorder Up/Down; indices 1–3 on save. Purge legacy panel with confirm and “Purge anyway” when all slots empty.

### C) API + public render
- **POST /api/admin/hero-slot/upload**: multipart `page_slug`, `slot_index`, `kind=image|video|poster`, `file`; path `hero/{page_slug}/slot-{slot_index}/{timestamp}-{sanitizedFilename}`; returns `{ storage_path, public_url }`.
- **POST /api/admin/hero/purge-legacy**: nulls `media_url`, `media_storage_path`, `hero_logo_url`, `hero_logo_storage_path`, `external_media_asset_id`; does not touch `hero_slots`. Idempotent.
- Home: if `hero_slots` has ≥1 valid enabled slot → HeroCarouselV2 (7s, 900ms flare, swap 350ms); else legacy hero. Reduced motion: first slot only, no rotate.

### QA + docs
- FilmFlare rounding matches hero (rounded when not full-height). No client imports of server-only modules (per ARCHITECTURE.md).
- **docs/LAUNCH_CHECKLIST.md**: Added 3 hero carousel smoke steps (upload image slot, upload video+poster, purge legacy); updated known limitations.

### Files changed (Phase 9.2)
- `lib/content/shared.ts` — `normalizeHeroSlots`, export `HeroSlot`/`HeroSlotIndex`
- `app/api/admin/hero/route.ts` — use shared `normalizeHeroSlots`, return 400 on `result.error`
- `components/admin/DashboardHeroEditor.tsx` — normalize before save, alert on error
- `app/page.tsx` — safety guard: only use HeroCarouselV2 when resolved slots have ≥1 enabled + valid media
- `docs/LAUNCH_CHECKLIST.md` — hero carousel smoke steps, known limitations
- `docs/PHASE_SUMMARIES.md` — Phase 9.2 completed + checklist

### Acceptance (Phase 9.2)
- [x] Invalid embed returns 400 with clear message; clearing embed clears stored value.
- [x] Migration 027 idempotent; existing pages render when hero_slots null.
- [x] Admin: upload image/video/poster from file; 3 slots; purge legacy with confirm.
- [x] Upload path and purge route correct; home uses slots when valid, 7s + flare.

---

## Next phases (to be filled as implemented)
- Phase 10: Brand asset polish (OG + favicon)
- Phase 11+: Conversion optimization, security audit, etc.
