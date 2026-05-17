# Divine Timing World — System Charter

**Status:** Authoritative architecture document. All changes to layout, navigation, brand, and homepage must align with this charter.

---

## 1. Global Layout System

### Canonical Rules

- **One canonical max-width container:** `1200px` (CSS: `--content-max-width: 1200px`, component: `<Container>` / class `.container-standard` or `.content-width`).
- **One spacing scale:** 8px base — use `--space-sm` (16px), `--space-md` (32px), `--space-section` (80px); section padding: `--section-padding-mobile` (60px), `--section-padding-tablet` (80px), `--section-padding-desktop` (120px). Horizontal content padding: `px-5 md:px-8` (20px / 32px).
- **One hero layout structure:** Full-viewport hero with centered content rail; optional badge, headline, subtext (see Brand Identity for subtext rules); CTAs below.
- **One section spacing rhythm:** Use `Section` component or `section-padding` / `mt-section` / `mb-section` for vertical rhythm.

### Alignment Rules

- All page content must align to the same center rail: use `<Container>` (max-w-[1200px] mx-auto px-5 md:px-8) for main content.
- Corner navigation elements are decorative/navigation anchors only; they do not define content width.
- No page may introduce a new alignment system (e.g. ad-hoc max-w-4xl or max-w-7xl for main content without charter approval).

### Layout “Lean Left” Investigation

- Root cause: Inconsistent use of container — some pages use `Container`, others use one-off wrappers. Sticky nav uses `.content-width` (max-width + margin auto) and is correct.
- **Corrective rule:** Every public page’s main content (below hero) must use `<Container>` or the same max-width + mx-auto + px-5 md:px-8. Do not rely on padding alone without a centered max-width container.

---

## 2. Navigation Architecture

### Four-Corner Framework

The site uses a **four-corner navigation framework** for the main public experience. This system must remain intact and clean.

**Canonical primary navigation (corner + center):**

| Position   | Label    | Route     |
|-----------|----------|-----------|
| Center    | DIVINE:TIMING | /        |
| Corner 1  | EVENTS   | /events   |
| Corner 2  | MEDIA    | /media    |
| Corner 3  | SHOP     | /shop     |
| Corner 4  | BOOKING  | /booking  |

**Secondary / industry navigation:**

- **Press Kit** — must **NOT** live in the main corner navigation.
- Press Kit is available as:
  - Footer link → `/presskit`
  - Booking page module (e.g. “Download EPK” / “Press Kit” link)
  - Direct route: `/presskit`

### Route Rules

- **Single canonical route for press kit:** `/presskit`.
- `/epk` must redirect to `/presskit` (HTTP redirect). No duplicate links (e.g. do not show both “Press Kit” and “EPK” in footer).
- Implementation: Redirect `/epk` → `/presskit`; all internal links use `/presskit`.

---

## 3. Brand Identity System

### Central Brand Mark

- The site should primarily display **DIVINE : TIMING** (or **DIVINE:TIMING** per existing lockup) as the central brand mark in global UI and heroes.

### Subtitle / Artist Credit Rules

- The subtitle **“By Liam Bongo & Lex Laurence”** (or equivalent artist-byline) **must not appear in global UI chrome.**
- It may appear **only** in:
  - About page
  - Press Kit
  - Artist bio contexts (e.g. long-form bio blocks)

**Remove from:**

- Homepage hero
- Events page hero
- Media page hero
- Shop page hero
- Global layout components (header, footer byline is acceptable only in footer as “By X & Y” in one place; charter prefers footer to show brand + single “By” line, not repeated elsewhere)

### Metadata

- Default title/OG for the site: **DIVINE:TIMING** (or “Divine Timing” where sentence case is appropriate). Avoid repeating the full “By Liam Bongo & Lex Laurence” in every page title; reserve for About/Press Kit and meta description where relevant.

---

## 4. Homepage System (Campaign Flexibility)

The homepage must support **campaign flexibility** without code changes.

### CTA Slots

- **One primary CTA** (e.g. button/link)
- **One secondary CTA**

### Example Campaign Modes

| Campaign       | Primary CTA   | Secondary CTA |
|----------------|---------------|----------------|
| Release        | Listen Now    | Shop           |
| Tour           | Events        | Shop           |
| Merch drop     | Shop          | Media          |

### Implementation

- Primary and secondary CTA copy and URLs are driven by **Home hero** content (e.g. `hero_sections` for page_slug `home`: `cta_text`, `cta_url`, and secondary CTA fields). No hardcoding of campaign mode in layout; admin can switch campaign by editing hero CTAs.

---

## 5. Public Content and Visibility

- **Placeholder content:** No test events, test merch, or test text (e.g. “swagland”, “WEED”, “<3”) may appear on the public site. Use **draft/publish** (or equivalent) where applicable so only intended content is visible.
- **Media collections:** If a media item is uploaded, assigned to a collection, and marked public, it **must** appear on the public collection page. Empty collections must show a clear empty state.

---

## 6. Admin Architecture (Label Operability)

- Admin navigation is organized by **content intent**, not database abstractions.
- Target structure:
  - Dashboard
  - Homepage (hero + campaign CTAs)
  - Events
  - Media Library
  - Collections
  - Shop
  - Booking Inquiries
  - Press Kit
  - Site Settings

- **Do not expose** internal names (e.g. `galleryMediaJoin`, `heroAssetResolver`) to label staff. Expose labels like “Homepage Hero”, “Media Upload”, “Product Gallery”.

### Publish Workflow

- Major content types support: **Draft**, **Published**, **Archived** (or equivalent). Public pages render only **published** (or active) content.

### Admin Usability

- Every content type: thumbnail preview, reorder controls, publish toggle, edit flow, delete flow, clear success/error messages. Target: admin understands the system in under 5 minutes.

---

## 7. Hero, Responsive, Accessibility, Performance

- **Hero:** Prioritize smoothness over complexity. Prefer a single hero surface (video OR poster) with timed source switching if a multi-slot carousel causes reliability issues.
- **Responsive:** Defined breakpoints (Desktop / Tablet / Mobile); hero centered, corner nav adapts, media/shop grids collapse cleanly.
- **Accessibility:** Sufficient contrast over hero media, clear button and form labels, visible focus states, readable text sizes.
- **Performance:** Efficient video load, image optimization, no unnecessary scripts; hero media must not block page load.

---

## Document History

- Initial charter created as part of platform architecture reset (Master Directive).
