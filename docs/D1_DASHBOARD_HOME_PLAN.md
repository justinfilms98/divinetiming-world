# D1 — Creative Dashboard Home (plan, not started)

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

## Decisions needed

1. Which "needs attention" rules to include (list above).
2. Include the storage card and the optional fan-activity card?
3. Confirm the four primary quick actions.
