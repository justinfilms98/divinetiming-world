# D1 — Creative Dashboard Home

> **Status (2026-10-26 night):** built on `feat/dashboard-d1`, refined after owner iPhone review,
> on preview only. Final behaviour and follow-ups are at the end of this document.

# Original plan

Goal: when Lex or Laurance open the admin on a phone, the first screen answers three questions in
one glance: **what needs my attention, what is live, and what can I do next.** No schema changes,
no new services, no change to security policies.

## What exists today

`/admin` shows six counts (events, products, videos, collections, media, releases), recent booking
inquiries and quick links, loaded with seven separate browser-side queries.

## Proposed layout (phone order; 2–3 columns from 768 px)

1. **Needs attention** — a short list of tappable items, each opening the exact editor:
   - drafts untouched for 7+ days (events, collections, products, releases)
   - events in the next 30 days missing a photo or ticket link
   - booking inquiries still "new" after 48 hours
   - products without an image or price
   - legal policies still unpublished (Privacy and Terms are pending today)
   - hero slots without a poster
2. **Quick actions** — four large buttons: Upload media, Add event, New collection, Edit homepage.
   Secondary: New product, New release. "Send newsletter" shown disabled until newsletter N2.
3. **Coming up** — next three events with Draft/Published and ticket status.
4. **Recent uploads** — last six thumbnails (small optimized images), tap to edit.
5. **What's live** — Published vs Draft counts per type, so drafts are never forgotten.
6. **Inbox** — latest three booking inquiries with status.
7. **Storage** — "366 MB of 1 GB used" (computed server-side; Supabase does not expose bandwidth
   through an API, so egress stays on the Supabase dashboard).
8. *(optional)* **Fan activity** — clicks on events, collections and products in the last 7 days,
   from the existing `analytics_events` table (101 rows so far; no page-view tracking exists).

Every card has a loading skeleton, an honest empty state, and 44 px tap targets.

## Data

- New read-only `GET /api/admin/overview` behind `requireAdmin()`, one round trip, parallel
  queries, `no-store`. Replaces the seven browser-side queries.
- "Needs attention" rules as pure functions in `lib/admin/overview.ts` with unit tests.
- Files: `app/admin/page.tsx`, `app/api/admin/overview/route.ts`, `lib/admin/overview.ts`(+ test),
  `components/admin/dashboard/*`.

## Estimate

About 2–2.5 working days including tests and phone verification; owner review extra.
Preview first; production only with approval.

## Decisions needed (resolved: all six rules, both cards and the four quick actions approved)

1. Which "needs attention" rules to include (list above).
2. Include the storage card and the optional fan-activity card?
3. Confirm the four primary quick actions.

# Final D1 behaviour

- **Demonstration content** is identified by exact record id in `lib/admin/demoContent.ts`
  (7 events, 2 collections, 1 product — the owner-approved demo set). Never by title. Demo records
  keep their status and stay editable; the dashboard leaves them out of reminders, "Coming up",
  live/draft counts and fan-activity rankings, shows "N demo" counts, and the Events, Collections
  and Shop lists label them "Demo". The Shop still counts as live for the legal-pages rule while a
  demo product is publicly visible.
- **Fan activity** counts recorded clicks on real content; clicks on demo content are reported
  separately and never ranked. It is labelled as clicks, not unique visitors.
- **Storage plan** comes from `SUPABASE_PLAN` (`free` | `pro`, server env). Without it the Free
  plan (1 GB) is assumed and the card says "Limit assumes…". The bandwidth notice is shown only on
  the Free plan and only until the 2026-10-14 → 11-14 billing cycle ends.
- **Typography**: body text 14–16 px, secondary labels ≥12 px; 44 px touch targets at every width.
- **Layout**: one column on phones and tablets; side cards two-up from 1024 px; three columns
  from 1280 px.

# Future enhancements (not in D1)

- **Cross-device snooze**: snoozes live in the browser (localStorage), so snoozing on a phone does
  not hide the item on a laptop. Syncing needs a small table (`admin_snoozes`) — only worth adding
  if this becomes annoying.
- **Internal-traffic filtering**: analytics rows record no host, user or environment, so preview
  testing and owners' own clicks can't be separated from fans. A future tracking change could tag
  the environment (production vs preview) and skip signed-in admins; existing rows stay as they are.
- **Owner-editable demo flag**: an `is_demo` column would let owners mark demo records themselves
  instead of editing `demoContent.ts` (migration + approval).
- **Video thumbnails**: D3 priority — posters generated at upload, without downloading originals.
- **Plan detection**: reading the Supabase plan automatically needs a management token; kept as
  configuration on purpose.
