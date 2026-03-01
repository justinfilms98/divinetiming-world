# Authority & EPK Content (Phase 23)

## Where content lives

Authority and EPK content is defined in **code** only (no new DB columns in Phase 23):

- **File:** `lib/authority-config.ts`
- **Shape:** `AuthorityConfig` with optional:
  - `stats` — array of `{ value, label }` (e.g. "50+", "Shows")
  - `pressLogos` — array of `{ name, logo_url, url? }` (hide section if empty)
  - `streamingLinks` — `{ spotify?, apple_music?, youtube?, bandcamp? }`
  - `featuredEmbed` — `{ type: 'spotify' | 'youtube', id }` for lazy-loaded embed
  - `collabs` — array of `{ name, image_url?, url? }` (hide if empty)
  - `epk` — `{ bio?, highlights?, press_photos_url?, contact_email?, contact_phone?, epk_pdf_url? }`

`getAuthorityConfig(overrides)` returns merged config; pass `null` to use defaults.

## How to update stats / logos / links

1. **Edit defaults:** Open `lib/authority-config.ts` and change `defaultAuthority` (stats, pressLogos, streamingLinks, featuredEmbed, collabs, epk).
2. **Optional future:** Add a single JSONB column (e.g. `site_settings.authority`) and an admin UI to edit it; then have `getAuthorityConfig()` read from DB and merge with defaults.

## Where it’s used

- **Home:** StatsRow, ListenNow (with optional embed), PressLogosRow, CollabsGrid, SignatureDivider, AuthorityCTAs.
- **EPK page:** `/epk` — bio, highlights, press photos link, contact, EPK PDF link (if set), AuthorityCTAs (Book, Listen).
- **Booking:** AuthorityCTAs (Book, Listen, View EPK) below hero.
- **Nav:** EPK link in corner nav (desktop + mobile).

Sections hide when their data is empty (e.g. no press logos → PressLogosRow not rendered).
