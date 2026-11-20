# Artist Mission Board

Released on production `main` **4b3751e** (2026-11-20). Extends the D1 admin dashboard with a second lane, **Your next moves**, under **Needs your attention**.

## What it is

Deterministic content suggestions built from the same read-only `GET /api/admin/overview` payload as Needs Attention. No AI, no migrations, no new tables.

| Lane | Purpose |
|---|---|
| Needs your attention | Operational / visitor-facing risk (unchanged) |
| Your next moves | Proactive creative next steps (cap 5) |

## Priority order

1. Merchandise (essential) — real products only; demo IDs excluded  
2. Essential events — missing flyer (grouped), missing venue/city/date  
3. Journal drafts — incomplete or ready-to-review  
4. Suggested event polish — one grouped “Enhance your event history”  
5. Website — collection covers/frames, social destinations  

Each mission shows category + **Essential** / **Suggested**. Suggested items are never treated as launch blockers.

## Automatic completion

Missions disappear on the next overview fetch when their data predicate stops matching (same pattern as Needs Attention). No server-side “mark done.”

## Snooze and dismiss

| Action | Storage | Behavior |
|---|---|---|
| Snooze | `localStorage` `dt-admin-mission-snoozes-v1` | Hidden for 7 days on this device |
| Not relevant | `localStorage` `dt-admin-mission-dismissals-v2` | Hidden until restored, or until a fingerprinted grouped mission’s membership changes |
| Restore | — | “N hidden · show again” clears snoozes and dismissals on this device |

Recently completed (session only): missions that vanish without being dismissed can appear briefly under “Recently completed.”

## Device-local limitations

Snooze, dismiss, and recently-completed state do **not** sync across devices or browsers. Cross-device progress (e.g. an `admin_snoozes` table) is a future enhancement and is not part of this release.

## Staging isolation

`staging/*` deployments must use Divine Timing Staging Supabase (`goapnjajsjslxbjqthyo`). `instrumentation.ts` / `lib/env/stagingGuard.ts` fail closed if a staging branch points at production.

## Related code

- Rules: `lib/admin/overview.ts` (`buildMissions`, `visibleMissions`)  
- API: `app/api/admin/overview/route.ts`  
- UI: `components/admin/dashboard/MissionPanel.tsx`  
- Plan/audit: prior Mission Board readiness plan (batch 1)  

D3-B / D3-C Media Studio work remains separate and is not included in this release.
