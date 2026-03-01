# DivineTiming.World – Site Redesign and Audit

This document summarises the completed deep audit and provides a developer prompt for implementation. It reflects research into modern minimalist design, ecommerce best practices, and admin-dashboard UX.

---

## Detailed Recommendations

### Visual Design & User Experience

- **Home page:** Keep it to a single screen, remove unnecessary elements, move statistics to the booking page, and limit the calls to action to one primary (e.g. “Listen Now”) and one secondary (e.g. “Booking”). Use generous white space and a restrained colour palette; reposition the floating cart icon so it doesn’t overlap the shop link.
- **Hero sections:** Convert oversize heroes on secondary pages into compact headers with a smaller background image, page title and short tagline. This avoids pushing important content below the fold and reduces cognitive overload from duplicate CTAs.
- **Navigation:** Redesign the menu with clear labels/icons, possibly a sticky top bar or hamburger for mobile. Move the cart icon to a non-overlapping area and use a subtle badge to indicate item count.
- **Branding:** Adopt a consistent modern typeface and allow uploading a high-resolution PNG logo for the home page headline. Provide guidance on logo dimensions and file size.
- **Colour palette:** Define a cohesive dark-theme palette with muted neutrals and a single accent colour. Use accent colours sparingly for interactive elements.
- **Notifications:** Add slide-in pop-ups (corner or header bar) for new music/video announcements. Ensure the design matches the site’s style, includes a CTA and close button, and use triggers to avoid user fatigue.

### Admin Dashboard & CMS

- **Dashboard redesign:** Create a clean dashboard with a collapsible sidebar (Settings, Events, Media, Shop, Heroes, About). Emphasise key tasks at the top and hide advanced options until needed. Remove developer-only panels and network logs.
- **CMS integration:** Enable editing of the About page and other content via a WYSIWYG editor with drag-and-drop components, preview, scheduling and version control.
- **Media management:** Use a reliable storage solution. If using Uploadcare, ensure account quotas are sufficient; for Supabase, set CORS correctly and make buckets public. Provide clear upload progress indicators and display thumbnails in the library.
- **Hero manager:** Consolidate hero settings into tabs for each page, permit PNG logo upload for the home page, and include controls for overlay opacity and cropping. Limit CTAs per page.
- **Events & Shop management:** Add forms for event details with image uploads and easy edit/delete actions. For the shop, display product images, names, prices and stock status, support drag-and-drop uploads of multiple images, and use high-quality photos with zoom or 360-degree views. Clean layouts and clear typography help maintain a minimalist aesthetic.
- **Security & roles:** Implement role-based access control and keep audit logs of changes.

### Technical Improvements

- **File delivery:** Verify subscription status on Uploadcare and ensure files exist; for Supabase, configure buckets as public and correct CORS headers.
- **Performance:** Compress hero images, enable lazy loading for videos, and optimise JavaScript/CSS. Adopt responsive design so the site functions well on all devices.
- **Quality assurance:** Conduct usability testing with stakeholders and non-technical users, and test across browsers and devices.

---

## Developer Prompt

**Project:** DivineTiming.World Redesign & Admin Overhaul

**Goal:** Transition the site from a “new web designer” aesthetic to a polished, minimalist experience. Simplify the admin interface and resolve media upload issues.

**Tasks:**

1. **UI/UX Redesign:** Implement a one-screen home page with dark theme, minimal colour palette and a single primary CTA; allow PNG logo upload; move statistics to the booking page; reduce heroes on secondary pages to small headers; and fix the overlapping cart icon.
2. **Notification System:** Add a slide-in pop-up (corner or header) to announce new releases, matching the site’s style and providing a close button.
3. **Admin Dashboard:** Build a minimal dashboard with a collapsible sidebar for Settings, Events, Media, Shop, Heroes and About. Include WYSIWYG editing for content pages and consolidated hero settings.
4. **Media Storage:** Ensure reliable storage (Uploadcare/Supabase) with public access and correct CORS; handle uploads with progress indicators and error feedback.
5. **Performance & Accessibility:** Compress assets, enable lazy loading and design responsively; ensure text contrast and keyboard accessibility.
6. **Testing & Documentation:** Include unit tests, user testing, and documentation to ensure non-technical users can manage content.

---

## Recommended order of work

1. **Stabilize media storage** – CORS, public permissions, quotas (Uploadcare + optional Supabase). ✅ Done.
2. **Logo upload + media uploads** – PNG logo in hero editor; multi-file support, progress indicators, previews; file format/size guidance.
3. **WYSIWYG/CMS** – Rich-text editor for About and other content; reuses the same media pipeline.
4. **Notifications** – Slide-in for new releases; minimal dependencies.
5. **Role-based access and audit logs** – After core admin features are in place.
6. **Performance and QA tuning** – Testing, compression, lazy loading, refinements.

## Implementation Status (from audit application)

| Recommendation | Status |
|----------------|--------|
| Home: one screen, primary CTA Listen + secondary Booking | Done |
| Stats moved to booking page | Done |
| Cart icon repositioned (no overlap with Shop) | Done – cart bottom-right, Booking link inset |
| Secondary page heroes → compact headers | Done – `compact` preset, used on events/media/shop/about/booking |
| Admin: collapsible sidebar | Done |
| Admin nav: Settings, Events, Media, Shop, Heroes, About | Done |
| **1. Stabilize media storage** | Done – [docs/MEDIA_STORAGE.md](MEDIA_STORAGE.md), CORS/quota/verification |
| **2. Logo upload + media uploads** | **Done (Prod verified)** – hero_logo_url, Admin logo UI (PNG/SVG 2MB), shared `lib/uploadcare.ts`, progress/error UX. QA: API validation, HeroLogo fallback, Save disabled while uploading, beforeunload on upload, Events/Shop submit disabled when uploading, shop product image onError fallback, `validateHeroLogoUrl` test, canary in checklist. See [docs/STEP2_QA.md](STEP2_QA.md). |
| **3. WYSIWYG/CMS** for About and content | Pending – architecture proposal only: [docs/STEP3_PROPOSAL.md](STEP3_PROPOSAL.md). Do not implement until approved. |
| **4. Notifications** (slide-in) | Pending |
| **5. Role-based access and audit logs** | Pending |
| **6. Performance and QA tuning** | Pending |
