# D2-B: owner-controlled creative settings and public-site refinements (plan, 2026-11-10)

Status: **plan only, not started.** Based on production `main` 76ce431. Nothing here is built, and migration 059 isn't applied; both need owner approval.

Goal: Lex and Liam can change the homepage, Events page and footer themselves from the existing admin, on a phone, without a developer. Two things stay as they are: the three-slot mixed-media hero, and the bandwidth savings from D2-A.1.

## What production does today

| Area | Today (code / data) |
|---|---|
| Navigation | `components/layout/CornerNav.tsx`. Text uses `--text` with gold (`--accent`) hover and active states; the mobile drawer has a sand/night background. `components/layout/Header.tsx` isn't used and hard-codes Instagram `divinetiming_ofc` |
| Home hero | Three positional slots (`hero_slots`); production shows slot 1 (image) only. No logo is set (`hero_logo_url` empty), so the animated text title shows. `subtext` is empty, so "We are one." isn't shown |
| Hero buttons | Primary: `cta_text` / `cta_url`, falling back to "Listen now" → `/music`. Secondary: **hard-coded** "Book the act" → `/booking` in `app/page.tsx` |
| Homepage sections | Fixed order in `app/page.tsx`: Now Playing, Experience, Upcoming events, Manifesto, Films, Tribe (signup, `id="tribe"`), Shop highlight, Booking CTA. None can be hidden; Now Playing hides itself only when there's no release |
| Events page | The hero headline and subtext are already editable (Hero editor → Events tab). The section copy is **hard-coded**: "Upcoming / Next dates", the ticket line, the empty-state text, and "Touring history / Where we've played" with an automatic "N shows · N cities" summary |
| Footer and links | `lib/platformLinks.tsx` knows Spotify, Apple Music, YouTube and **one** Instagram. The footer shows Spotify, YouTube and Instagram. `site_settings.instagram_url` = `instagram.com/divinetimingworld`; the code default is `instagram.com/divinetiming_ofc`. There are no SoundCloud or Beatport fields site-wide (only per release) |
| Admin | Hero editor (Homepage & Hero), Settings (four platform URLs), Events, Press Kit, About. The settings APIs (`/api/admin/site-settings`, `/api/admin/page-settings`) update named fields only |

## Changes

### 1. Black navigation bar, white text (code only)

- `CornerNav`:
  - A solid black bar (`#000`, or the night token) on every page, with white nav text and the wordmark in white.
  - The active and hover colour is an owner decision: gold (the current accent) or white with an underline.
  - Keep the 44 px touch targets and visible focus rings. White on black is 21:1 contrast.
- **Mobile drawer:** black with white links, the same social row, and the same focus trap and Escape behaviour.
- **Remove the unused `Header.tsx`** (dead code with a hard-coded Instagram link). This needs approval because it deletes a file; it isn't shown anywhere.
- **Performance:** a solid bar lets us drop the `backdrop-blur`, which is cheaper on phones. No new assets.

### 2. Keep the three-slot mixed-media hero (no change)

No changes to `lib/hero/heroCarousel.ts`, `hero_slots`, slot states or renditions. The 125-combination tests (`heroCombos`) and the D2-A/D2-A.1 tests must stay green. Only the text and buttons around the hero change.

### 3. "We are one." beneath the hero logo (content, no code)

- The `subtext` field already renders under the logo.
- In the admin:
  1. Re-pick the logo (`DT_LOGO_W.png` is already in the Media Library).
  2. Type "We are one." in Subtext.
- Both are owner content edits. I can do them at release time only with explicit approval.

### 4. Editable "Listen" and "Join the tribe" buttons (migration 059)

- **New fields:** `hero_sections.secondary_cta_text` and `secondary_cta_url`.
- **Fallback:** when they're empty, today's "Book the act" → `/booking` shows, so nothing changes at deploy.
- **"Join the tribe"** points to `#tribe`. Hash links scroll smoothly, as the primary button already does; the secondary button needs the same handling.
- **Validation (API):** the same rules for both buttons. Allowed: `https://…`, a site path (`/music`) or a homepage anchor (`#tribe`). Rejected: everything else (`javascript:`, `data:`, `//host`). Labels are capped at 40 characters.
- **Admin:** the Hero editor, Home tab, gets a "Buttons" card with label and link for each button. It shows a preview of the two buttons and a warning if the target section is hidden (see 5).

### 5. Show or hide homepage sections (migration 059)

- **New field:** `site_settings.home_sections` (jsonb), for example `{"now_playing": false, "films": true, …}`.
- **Missing keys mean "shown"**, so production looks the same until someone switches a section off.
- **Sections:** Now Playing, Experience, Upcoming events, Manifesto, Films, Tribe signup, Shop highlight, Booking CTA. The hero isn't switchable.
- **Admin:** Homepage & Hero → "Homepage sections" card, with one switch per section (44 px), saved on its own (partial update).
- **Performance:** a hidden section's data isn't fetched; for example, no `getLatestRelease()` when Now Playing is off.
- **Safety:** if Tribe is hidden while a hero button points to `#tribe`, the admin warns, and the public page hides that button instead of linking to nothing.
- Now Playing stays controlled by the release "Pin as Now Playing" setting when it's shown.

### 6. Editable Events page headings and descriptions (migration 059)

- **New field:** `page_settings.section_copy` (jsonb), on the `events` row.
- **Keys and current defaults:**

  | Key | Default today |
  |---|---|
  | `upcoming_label` | Upcoming |
  | `upcoming_title` | Next dates |
  | `upcoming_intro` | Tickets go through the promoter or venue for each date. |
  | `empty_text` | No dates announced right now. New shows are posted here first. |
  | `past_label` | Touring history |
  | `past_title` | Where we've played |
  | `past_intro` | (the automatic summary line, if empty) |
  | `show_touring_summary` | true |

- An empty value falls back to today's text. Text only, capped at 200 characters per field; no HTML is stored.
- **Admin:** Hero editor → Events tab, "Page text" card under the existing hero fields.

### 7. Footer: both Instagram accounts, SoundCloud and Beatport (migration 059)

- **New fields:** `site_settings.instagram_secondary_url`, `soundcloud_url` and `beatport_url`. Optional label fields `instagram_label` and `instagram_secondary_label` distinguish the two Instagram accounts (for example "@divinetimingworld" and "@divinetiming_ofc").
- **`lib/platformLinks.tsx`:**
  - New platform IDs `instagram2`, `soundcloud` and `beatport`, with inline SVG icons (no icon library, no requests).
  - A link only shows when its URL is set.
  - The JSON-LD `sameAs` includes the new links (SEO).
- **Footer:** Spotify, Apple Music, YouTube, Instagram ×2, SoundCloud, Beatport, in an order the owner chooses. It wraps on phones; each icon is a 44 px target with an accessible name.
- **Admin:** Settings → "Social & music links", with the new fields and host checks:
  - `soundcloud.com` for SoundCloud.
  - `beatport.com` for Beatport.
  - `instagram.com` for both Instagram fields.
  - https only.
- **Already provided by the owner:**
  - `https://soundcloud.com/divinetiming_music`
  - `https://www.beatport.com/artist/divinetiming/1423755`

### 8. Creative control through the existing admin

- **Where things live:** everything sits in existing admin pages (Homepage & Hero, Settings). No new admin sections, so navigation doesn't change.
- **Same patterns as D2-A:**
  - Save only the fields that changed.
  - Unsaved-changes warning, and visible errors with specific messages.
  - Each card saves on its own.
- **Mobile first:** 360–390 px layouts, 16 px inputs (no iOS zoom), 44 px targets, and no sideways scroll.
- **Preview:** each card shows a small live preview (buttons, footer icons). There's no separate draft mode in D2-B.

## Migration 059 (reviewed draft, not applied)

Review of the earlier proposal: it stays **additive only**.

- Nullable columns, no rewrites of existing rows, no change to security rules.
- All three tables are public-read with no public write policies; writes go through the admin API using the service role. Every new column holds only public, display-only content.
- URL checks run in the API, plus a light `https://` check in the database.
- The jsonb shapes are validated in the API and kept small.
- It's applied to staging first, and to production only at release time, with approval.

```sql
-- 059_d2b_creative_controls.sql
alter table hero_sections
  add column if not exists secondary_cta_text text,
  add column if not exists secondary_cta_url text;

alter table site_settings
  add column if not exists instagram_secondary_url text,
  add column if not exists instagram_label text,
  add column if not exists instagram_secondary_label text,
  add column if not exists soundcloud_url text,
  add column if not exists beatport_url text,
  add column if not exists home_sections jsonb;

alter table page_settings
  add column if not exists section_copy jsonb;

alter table site_settings
  add constraint site_settings_social_https check (
    coalesce(instagram_secondary_url, 'https://') like 'https://%'
    and coalesce(soundcloud_url, 'https://') like 'https://%'
    and coalesce(beatport_url, 'https://') like 'https://%'
  );
```

```sql
-- 059_d2b_creative_controls.down.sql
alter table site_settings drop constraint if exists site_settings_social_https;
alter table page_settings drop column if exists section_copy;
alter table site_settings
  drop column if exists home_sections, drop column if exists beatport_url,
  drop column if exists soundcloud_url, drop column if exists instagram_secondary_label,
  drop column if exists instagram_label, drop column if exists instagram_secondary_url;
alter table hero_sections
  drop column if exists secondary_cta_url, drop column if exists secondary_cta_text;
```

The code reads every new column defensively. If the migration hasn't run, or is rolled back, the site shows today's content. So the code can deploy safely before or after the migration, and a rollback doesn't need the down script.

## Media cost, performance and mobile

- **No new media, fonts, libraries or services.** Icons are inline SVG.
- **Fewer queries:** hidden homepage sections skip their database queries.
- **The hero is untouched,** so the D2-A.1 savings (94% less storage bandwidth) are unaffected.
- **Acceptance at 360, 390, 768 and 1440 px:**
  - No sideways scroll.
  - Nav and footer contrast at least 4.5:1 (black/white is 21:1).
  - LCP and bytes no worse than today on the homepage. Measured on staging with the cache off, like the D2-A.1 measurement.
  - Real iPhone Safari and Android Chrome checks by the owner.

## Tests

- **Unit tests:**
  - Hero button resolution: fallbacks, `#tribe` hidden when Tribe is off, and URL validation that rejects `javascript:` and `//host`.
  - `home_sections` parsing: missing keys mean shown, and unknown keys are ignored.
  - Events copy fallbacks and length caps.
  - `platformLinks`: new IDs, order, an empty value means hidden, and host checks.
  - The settings APIs only update the fields that were sent.
- **Regression:** the existing 371 tests, including the hero combinations and the sanitizer.
- **Staging:**
  1. Apply 059 on staging.
  2. Edit each new field in the admin, save, then reload twice.
  3. Check the public pages at four widths.
  4. Hide and show every homepage section.
  5. Run the down script, confirm the site falls back to today's content, then re-apply.
- **Production verification:** the usual read-only checks and fingerprints. Content is only changed by the owner, or by me with explicit approval.

## Delivery

One branch (`feat/d2b-creative-controls`), in three reviewable commits:

1. Nav and footer links.
2. Hero buttons and homepage section switches.
3. Events page text.

One migration (059), one staging pass, one release.

**Estimate:** about 3–4 working days, including tests and staging verification, plus owner review time.

**Rollback:** Vercel Instant Rollback (the code tolerates missing columns), or `git revert -m 1`. The 059 down script is optional.

## Owner inputs needed before starting

1. **Instagram:** both accounts are `@divinetimingworld` (in Settings today) and `@divinetiming_ofc` (code default). Which comes first, and should the footer show labels?
2. **Links:** confirm SoundCloud `https://soundcloud.com/divinetiming_music` and Beatport `https://www.beatport.com/artist/divinetiming/1423755`. Should they also appear in the hero icon row and the mobile menu, or only the footer?
3. **Listen:** keep `/music`, or go straight to Spotify?
4. **Join the tribe:** replace "Book the act" as the hero's second button, scrolling to the homepage signup? Booking stays in the nav and at the bottom of the homepage.
5. **Nav:** solid black on every page, including over the hero, or transparent over the hero and black once scrolled? Gold or white for the active and hover state?
6. **Homepage sections:** should Now Playing (or anything else) be hidden when this ships, or all shown until you switch them?
7. **Events text:** the exact headings and intro lines you want (earlier ideas were "The story so far" and "Every gathering, from the first 50 to 600+"). Keep the automatic "N shows · N cities" line?
8. **Logo and "We are one.":** will you re-pick the logo and type the subtext yourselves after release, or should I do it as part of the release (an approved content change)?
9. **Approvals:** migration 059 (staging, then production), and deleting the unused `Header.tsx`.
