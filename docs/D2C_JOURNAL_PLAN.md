# D2-C Journal — architecture proposal

Status: **proposal only, nothing implemented or applied** (2026-11-10).
Proposed migration: `supabase/proposed/060_journal.sql` with `060_journal.down.sql`. Both parse as
PostgreSQL 17; neither has been run on staging or production.

The Journal lets Lex and Liam publish vlog episodes and travel stories from the admin, each with a
title, description, cover, optional video, episode number, status, optional release information and
an order. Known planned entries: Episode 3 — Barcelona, Episode 4 — Iceland. Nothing is created or
published automatically. Descriptions, dates and video links come from the owners.

## 1. Can an existing model be reused?

| Table | What it is | Fit for episodes |
| --- | --- | --- |
| `videos` | YouTube films on the Media page (title, youtube_id, caption, status, order) | No: no slug, description, cover, number or coming-soon state; changing it would affect the Media page |
| `journey_blocks` | Ordered story blocks on `/journey` | No: page sections, not dated entries with their own URLs |
| `releases` | Music catalogue (slug, cover, status, description, video_url, order) | Closest shape, but music-specific (release type, streaming links). Used as the template, not shared |
| `galleries` (Collections) | Photo sets | **Reused**: an episode can link to a collection for its photos (`gallery_id`) |
| `external_media_assets` | Media Library | **Reused** for covers, stored like `releases` (URL plus asset id) |

Recommendation: a new `journal_episodes` table modelled on `releases`, plus a small
`journal_episode_videos` table, reusing the Media Library, Collections and the existing embed parser.

## 2. Schema (migration 060)

`journal_episodes`:
- Text fields: `slug` (unique, lowercase, e.g. `episode-3-barcelona`), `title` (required, 120), `location` (80), `summary` (300, card and meta description), `description` (plain text, 5,000).
- `episode_number`: optional, 1 to 9999. Unique among episodes that aren't archived.
- Cover: `cover_image_url` (https only), `external_cover_asset_id`, `cover_alt`.
- `gallery_id`: optional link to a Collection.
- `status`: `draft` (default) / `coming_soon` / `published` / `archived`.
- Release information: `release_note` (60, e.g. "Coming in December"), `scheduled_for`.
- `published_at`: set the first time the episode is published; required while published.
- `display_order`, `seo_title` (70), `seo_description` (160), `created_at`, `updated_at` (trigger).

`journal_episode_videos` (one row per episode):
- `provider` (`youtube` or `vimeo`) and `video_id`. The format is checked: an 11-character YouTube id or a numeric Vimeo id.
- `is_vertical`, `duration_seconds`.

Raw embed HTML or iframes are never stored; only a provider and id, which the site turns into its own
player. The video lives in its own table so an unlisted link pasted early stays private until the
episode is published.

The migration is additive: two new tables, no change to any existing table, policy or row. The undo
script drops both tables, so it is destructive once episodes exist; export them first.

## 3. Security (RLS and admin authorisation)

This follows the existing lockdown (migrations 041 and 054):
- RLS on both tables, read policies only, no write policies.
- Writes go only through `/api/admin/journal`. It runs `requireAdmin()` (the signed-in user must be in `admin_users` or `ADMIN_EMAILS`), then uses the service-role client, as the releases and hero APIs do.
- Insert, update, delete and truncate are also revoked from `anon` and `authenticated`, as a second safeguard.

| Status | Public can read | Video readable |
| --- | --- | --- |
| draft | no (admins only) | no |
| coming_soon | yes, every episode column | **no** |
| published | yes | yes |
| archived | no (admins only) | no |

Owners should know that anything typed into a coming-soon episode (description included) is
publicly readable. Only the video is held back.

## 4. Media Library integration

- Cover: "Choose from library" uses the same `MediaLibraryPicker` as the hero logo, filtered to images. A new upload goes into the library as usual. Reusing an image never uploads a copy.
- The cover is stored as `cover_image_url` plus `external_cover_asset_id`, like `releases`. Removing a cover or deleting an episode never deletes the file.
- Images are served through the existing optimised, 31-day-cached image path, never as originals.
- Photos: link an existing Collection rather than uploading into the episode.

## 5. Video delivery and costs

Recommended: **YouTube**, uploaded as unlisted and switched to public when the episode is published.
Vimeo works the same way through the existing `lib/embed.ts` parser.

- Hosting, adaptive streaming, captions and the bandwidth are free on YouTube. People can also find the episodes there.
- The site shows the cover with a play button. The YouTube player (`youtube-nocookie.com`) loads only when someone taps play, matching the Media page's click-to-load tiles. Nothing is downloaded from YouTube until then.

Not recommended for now: self-hosting video in Supabase Storage.
- A 10–15 minute 1080p vlog is roughly 300 MB–1 GB even after compression.
- Every full view downloads all of it, with no quality switching on mobile data.
- 1,000 full views of a 400 MB file is about 400 GB of transfer. That alone can exceed the plan's included transfer and is then billed per GB (check current Supabase pricing), undoing the D2-A bandwidth savings.
- Managed streaming (Cloudflare Stream, Mux) bills per minute stored and watched. It belongs with the D3 Media Studio if the owners later want an ad-free, branded player.

Covers cost little: a few hundred KB each, served from cache.

Risk: DJ vlogs with copyrighted music can be claimed, muted, or blocked from embedding in some
countries on YouTube. The episode page links to "Watch on YouTube" as a fallback.

## 6. Public pages (mobile first)

Pages are behind a feature flag (`NEXT_PUBLIC_JOURNAL_PUBLIC_ENABLED`, the same pattern as the Label).
With it off, `/journal` returns 404, and nav, footer and sitemap don't mention it. The admin still
works, so episodes can be prepared in private.

`/journal` (list):
- Short intro, then a "Next episode" card for coming-soon episodes, then published episodes, newest first. `display_order` can override the order.
- One column on phones, two from 768 px, three from 1280 px. Each card shows the 16:9 cover, "EP 03 · Barcelona", the title, the summary and either the date or "Coming soon".
- The first cover loads eagerly; the rest load lazily.

`/journal/[slug]` (published):
- Cover with a tap-to-play player (a vertical player for vertical videos).
- Episode number, location and date, then the description in paragraphs.
- The linked Collection's photos, if any.
- Previous and next episode, then "Listen" and "Join the tribe" links.

`/journal/[slug]` (coming soon):
- Cover, "Coming soon" with the release note or date, and the summary. No player.
- A "Join the tribe to hear first" link.
- If the planned date has passed and it still isn't published, it shows plain "Coming soon", never a stale date.

Draft and archived episodes return 404.

## 7. SEO and metadata

- `generateMetadata` per episode:
  - Title "Episode 3 — Barcelona | DIVINE:TIMING Journal" (or `seo_title`).
  - Description from `seo_description` or the summary.
  - The cover as the share (OG/Twitter) image.
  - A canonical URL.
- Published episodes with a video get `VideoObject` JSON-LD: name, description, thumbnail, upload date, embed URL and duration when known.
- Sitemap: `/journal` and published episodes only. Coming-soon pages are `noindex, follow`.
- Slugs are locked once published, so shared links keep working.

## 8. Navigation

The bar has six links (MUSIC, EVENTS, JOURNEY | MEDIA, SHOP, BOOK). Options:
1. Add JOURNAL to the right group: MUSIC, EVENTS, JOURNEY | JOURNAL, MEDIA, SHOP, BOOK (4 on the right). **Recommended**: it sits with the other video and photo content.
2. Add it to the left, next to JOURNEY. The two similar names side by side may confuse.
3. No nav link at first; reach it from the footer, a homepage section, and Media/Journey.

Whichever option is chosen, also:
- Add it to the footer's Explore list.
- Add an optional homepage section, "Latest from the Journal", with its own switch in Homepage sections, off by default.

## 9. Admin

- Sidebar: Content → Journal, after Journey.
- `/admin/journal` list: number, title, status chip, up/down ordering, "New episode".
- Editor fields:
  - Title; slug (suggested from number and title); number; location; summary; description.
  - Cover: library or upload, plus alt text.
  - Video link: paste any YouTube or Vimeo link; it's checked and previewed.
  - Vertical switch; status; release note and date; linked Collection; SEO (collapsed).
- Saving works like the hero editor: only changed fields are sent, with an unsaved-changes warning and the same error messages.
- Publishing:
  - Needs a title and a cover. The video is optional, so photo/text travel stories are possible (owner decision).
  - `published_at` is set once.
  - No automatic publishing in this version; the planned date is shown only.
- Remove means Archive. Permanent delete is offered for drafts only, behind a confirmation. Neither touches media.
- API: `GET/POST/PATCH /api/admin/journal`, `POST /api/admin/journal/reorder`. Validation lives in `lib/journal/` with unit and route tests, as for the D2-B APIs. Saves refresh `/journal`, the episode page and the sitemap.

## 10. Delivery plan (after approval)

1. Commit 1: apply 060 on staging, plus `lib/journal` types, validation, slug and status rules, and tests.
2. Commit 2: the admin API and admin page.
3. Commit 3: the public list and episode pages, SEO, sitemap and nav entry, behind the flag.
4. Staging: create test episodes on staging only (never in production), and run screenshots at 360/390/768/1440 plus the mobile checklist.
5. Production: separate approval for migration 060, the deploy, and turning the flag on.

No new npm packages are needed.

## 11. Implementation requirements (from the code review)

These are requirements for the D2-C build. Each has a test or a check that proves it.

- **Admin navigation.** The Journal entry in `ADMIN_NAV_GROUPS` ships in the same commit as `/admin/journal`. The existing coverage test (`adminNavigation.test.ts`: every admin page linked exactly once) stays in place and must pass unchanged.
- **Public navigation highlight.** `CornerNav` matches only exact paths today (`pathname === href`). JOURNAL uses a path-prefix match: `/journal` or anything under `/journal/`, but not `/journalism`.
  - The prefix match goes in one shared helper, and the existing links keep exact matching.
  - Test: `/journal/episode-3-barcelona` highlights JOURNAL and nothing else.
- **Genuine 404s.** Draft, archived and unknown episodes must return **HTTP 404**, not a not-found screen with HTTP 200 (the existing `loading.tsx` streaming problem on other detail pages).
  - `/journal/[slug]` has no `loading.tsx`, and calls `notFound()` before anything streams.
  - Verified with real HTTP requests against staging, not screenshots: `curl -s -o /dev/null -w "%{http_code}"` for a published, a coming-soon, a draft, an archived and an unknown slug (expected 200, 200, 404, 404, 404).
- **Cache refresh from the server.** Journal saves call `revalidatePath` inside the admin API, as the releases route does (`revalidateRelease()`): `/journal`, the episode's own page (old and new slug when it changes), `/` if a homepage section is added, and `/sitemap.xml`. The browser `/api/revalidate` helper isn't relied on, because it doesn't allow `/journal`.
- **Test database.** Extend `test/fakeSupabase.ts` with `.in(column, values)`, so public fetchers can filter `status in ('published', 'coming_soon')` and be tested as written. Add a test for the stand-in itself.
- **Video safety.** Video links are parsed only by `normalizeHeroEmbed()` in `lib/embed.ts` (strict YouTube and Vimeo). No new or duplicate URL parsing.
  - The database's id-format check (migration) and the server-side check agree.
  - Raw embed HTML and unknown hosts are rejected with a clear message.
- **Structured data and metadata.**
  - A `VideoObject` JSON-LD helper is added to `lib/seo/jsonld.ts` with tests. It is emitted **only** when the episode is `published` **and** has a valid video row.
  - Coming-soon pages get no video data, use `noindex, follow`, and expose only the fields already public for coming-soon episodes.
  - `generateMetadata` and the sitemap read through the same published/coming-soon fetchers as the page. Draft and archived episodes can never reach titles, descriptions, OG images, JSON-LD or the sitemap.
  - Tests cover each status.
- **Migration numbering.** If the unpublished-media security fix is approved first (recommended), it takes 060 and this Journal migration becomes **061**, with the same content.

Other notes:
- **Covers:** store the URL as well as the asset id, as releases and events do. Anonymous visitors can't read `internal` library rows (the default since migration 058), so a join alone would show no cover.
- **Vimeo images:** `next.config.ts` image hosts don't include Vimeo thumbnails. That's fine while covers come from the Media Library; add the host only if provider thumbnails are used.
- **Draft preview:** an admin-only preview through Next.js `draftMode()` (roadmap proposal) can follow later.

Issues found outside the Journal are tracked separately:
- **Unpublished media visibility:** confirmed. Draft Collection media is publicly readable and storage listing is open. Audit and proposed fix: `SECURITY_UNPUBLISHED_MEDIA_AUDIT_2026-11-11.md` (branch `security/unpublished-media`). Recommended before the Journal; the Journal's own tables are designed not to repeat it.
- **YouTube Videos draft-by-default and roadmap correction:** `FOLLOWUPS_2026-11-11.md` and the roadmap (branch `docs/followups-2026-11-11`).

## 12. Owner decisions needed

1. Navigation placement (section 8), and whether the name "Journal" next to "Journey" is right.
2. Episodes 1 and 2: do they exist (for example on YouTube), and should they be added before 3 and 4?
3. Video host: YouTube (recommended) or Vimeo.
4. Can an episode be published without a video (photo/text travel story)?
5. Coming soon: show these on the list? Show a date, a note ("Coming in December"), or neither?
6. Publishing: manual (recommended for now) or automatic at the planned time (needs a scheduled job; later).
7. A homepage "Latest from the Journal" section: wanted? (It would be off by default.)
8. Description: plain paragraphs (recommended) or rich text (bold, links) via the existing bio editor.
9. Content for Barcelona and Iceland: titles, summaries, descriptions, covers, video links and dates, all from the owners.
