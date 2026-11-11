# D2-C Journal — implementation decision package (2026-11-11)

Status: **paused**. No Journal tables, pages or episodes exist. Migration 061 is proposed only (branch
`docs/d2c-journal-plan`). The full design is in `D2C_JOURNAL_PLAN.md`.

## Readiness

| Prerequisite | State |
| --- | --- |
| Unpublished-media security fix (060) | **Done**, production 2026-11-11 |
| Journal migration 061 | Written; parses as PostgreSQL 17; all dependencies (`is_admin()`, `update_updated_at_column()`, Collections, Media Library) exist on staging and production |
| Visibility model | Drafts and archived episodes admin-only. Coming soon: public card, no video. Published: public with video. Video links held in a separate table until publication. Same RLS pattern as 054 and 060 |
| Build requirements | Plan section 11: admin nav and its test, JOURNAL highlight on episode pages, real HTTP 404s, server-side refresh, `.in()` in the test database, the strict video parser, published-only metadata and `VideoObject` data |
| New packages | None |

## Decisions needed from Lex and Liam

Each has a recommended default, so the build can start as soon as these are confirmed.

| # | Decision | Recommended default |
| --- | --- | --- |
| 1 | Where Journal sits in the menu | Right-hand group: JOURNAL, MEDIA, SHOP, BOOK (left keeps MUSIC, EVENTS, JOURNEY). Also in the footer's Explore list |
| 2 | Name "Journal" next to "Journey" | Keep "Journal"; the Journey page stays the band's story |
| 3 | Episodes 1 and 2 | Tell us if they exist (for example on YouTube) and whether to add them before 3 (Barcelona) and 4 (Iceland) |
| 4 | Video host | YouTube, uploaded as unlisted and made public on release |
| 5 | Publishing without a video | Allowed (photo and text travel stories) |
| 6 | Coming-soon episodes | Show them as a "Next episode" card with a short note (e.g. "Coming in December"); a date only if certain |
| 7 | Release timing | Manual Publish for now; automatic scheduled release later if wanted |
| 8 | Homepage section "Latest from the Journal" | Build it, off by default, switchable in Homepage sections |
| 9 | Description style | Plain paragraphs (rich text later if needed) |
| 10 | Episode content | Lex and Liam supply titles, summaries, descriptions, covers, video links and any dates for each episode. Nothing is invented or published automatically |

## What approval unlocks

1. Apply 061 on **staging**, plus the `lib/journal` rules and tests.
2. Admin Journal page, its menu entry and API, on staging.
3. Public `/journal` and episode pages behind a switch that is off by default. Real-HTTP checks: published and coming soon return 200, draft, archived and unknown return 404.
4. Staging test episodes only (never in production), screenshots at 360/390/768/1440, and the mobile checklist.
5. A separate production approval for 061, the deploy, and switching the Journal on.

## Not affected

The homepage hero, D2-B and D2-B.1 settings, Media Library, existing content and security policies
are untouched by the Journal build. Its tables are new and its public pages stay hidden until the
switch is turned on.
