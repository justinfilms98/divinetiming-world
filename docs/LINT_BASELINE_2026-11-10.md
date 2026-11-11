# Lint baseline after Next.js 16.4.6 (2026-11-10)

`npx eslint` on `main` c319a7c reports **36 errors** (and 57 warnings). Before the upgrade, `main` 5a68e17 had 23 errors. Lint doesn't block `next build`, and none of these changes how the site runs today. They're recorded here so a separate maintenance task can fix them, and so future lint runs can be compared against a known list.

## What changed

- **23 pre-existing** errors were already reported before the upgrade: 15 `react-hooks/set-state-in-effect` and 8 `@typescript-eslint/no-explicit-any`.
- **13 newly detected.** `eslint-config-next` 16.4.6 ships a newer React Hooks plugin, and it now reports the same pattern in more places: 12 `react-hooks/set-state-in-effect` and 1 `react-hooks/immutability`.
  - The code on those lines didn't change. Each was last edited between 2026-01-18 and 2026-09-22.
- **0 newly introduced code defects.** None of the 36 lines was written or changed by the D1 / D2-A / D2-A.1 release (`e11ede2..5a68e17`) or by the security release. I checked this with `git blame` on each flagged line.

## What the rules mean here

- **`react-hooks/set-state-in-effect`** flags calling `setState` directly in a `useEffect` body. Typical cases here:
  - Copying fetched or prop data into state.
  - Marking "mounted" for animations (`PulsingLogo`, `Reveal`, `PageTransition`).
  - Reading `localStorage` (`CartContext`).

  Each causes an extra render, and some can briefly show stale UI. Fixes are case by case:
  - Derive the value during render.
  - Initialise state lazily.
  - Use `useSyncExternalStore` for browser-only values.
  - Move fetch-then-set into an event handler or a data hook.
- **`react-hooks/immutability`** (`app/admin/shop/page.tsx:117`) flags a value that is changed after it was used in render. Fix it by copying the value before changing it.
- **`@typescript-eslint/no-explicit-any`** marks `any` types in the Stripe checkout and Google Drive integration code. Fix it with the Stripe and Google API types.

## Plan (separate maintenance task, not scheduled)

- **Don't disable or downgrade the React Hooks rules** to make the count drop. Fix the code. Where a case is genuinely correct, use a single-line `eslint-disable-next-line` with a reason.
- Work file by file in small commits, starting with:
  1. Admin pages, which have the most new findings.
  2. The shared components used on the public homepage: `HeroContent`, `HeroPlatformRow`, `MemberLine`, `DivineTimingIntro`, `CornerNav`.
  3. The `any` types.
- **Test each change:**
  - Existing unit tests, plus a render check of the affected page on a preview.
  - For homepage components, the hero carousel and intro animations on mobile and desktop.
  - For admin pages, load, edit and save on staging.
- **Done when** `npx eslint` reports 0 errors, so lint can become a required check before releases.

## All 36 findings

| # | Status | Rule | Location | Line last changed |
|---|---|---|---|---|
| 1 | newly detected | `react-hooks/set-state-in-effect` | `app/admin/booking-inquiries/page.tsx:85` | 480293c 2026-09-22 |
| 2 | newly detected | `react-hooks/set-state-in-effect` | `app/admin/collections/page.tsx:224` | d173a21 2026-03-10 |
| 3 | newly detected | `react-hooks/set-state-in-effect` | `app/admin/collections/page.tsx:94` | 5b607c3 2026-03-03 |
| 4 | newly detected | `react-hooks/set-state-in-effect` | `app/admin/inbox/page.tsx:87` | 480293c 2026-09-22 |
| 5 | newly detected | `react-hooks/set-state-in-effect` | `app/admin/integrations/page.tsx:59` | 480293c 2026-09-22 |
| 6 | newly detected | `react-hooks/set-state-in-effect` | `app/admin/label/page.tsx:37` | 480293c 2026-09-22 |
| 7 | newly detected | `react-hooks/set-state-in-effect` | `app/admin/orders/page.tsx:71` | 480293c 2026-09-22 |
| 8 | newly detected | `react-hooks/immutability` | `app/admin/shop/page.tsx:117` | 1be0196 2026-01-18 |
| 9 | newly detected | `react-hooks/set-state-in-effect` | `app/admin/videos/page.tsx:74` | 5b607c3 2026-03-03 |
| 10 | newly detected | `react-hooks/set-state-in-effect` | `components/admin/DashboardHeroEditor.tsx:269` | d173a21 2026-03-10 |
| 11 | newly detected | `react-hooks/set-state-in-effect` | `components/admin/MediaAssetEditor.tsx:44` | 480293c 2026-09-22 |
| 12 | newly detected | `react-hooks/set-state-in-effect` | `components/admin/MediaLibraryPicker.tsx:61` | 76008ca 2026-03-09 |
| 13 | newly detected | `react-hooks/set-state-in-effect` | `components/admin/MediaLibraryPicker.tsx:69` | 76008ca 2026-03-09 |
| 14 | pre-existing | `@typescript-eslint/no-explicit-any` | `app/api/checkout/route.ts:24` | f93ea6b 2026-02-13 |
| 15 | pre-existing | `@typescript-eslint/no-explicit-any` | `app/api/checkout/route.ts:25` | f93ea6b 2026-02-13 |
| 16 | pre-existing | `@typescript-eslint/no-explicit-any` | `app/api/checkout/route.ts:37` | f93ea6b 2026-02-13 |
| 17 | pre-existing | `@typescript-eslint/no-explicit-any` | `app/api/checkout/route.ts:98` | f93ea6b 2026-02-13 |
| 18 | pre-existing | `@typescript-eslint/no-explicit-any` | `app/api/integrations/google-drive/assets/route.ts:59` | 8dead56 2026-02-13 |
| 19 | pre-existing | `@typescript-eslint/no-explicit-any` | `app/api/integrations/google-drive/folder/[folderId]/files/route.ts:54` | 8dead56 2026-02-13 |
| 20 | pre-existing | `react-hooks/set-state-in-effect` | `components/events/EventsHero.tsx:26` | 8dead56 2026-02-13 |
| 21 | pre-existing | `react-hooks/set-state-in-effect` | `components/home/DivineTimingIntro.tsx:21` | f9db84a 2026-02-13 |
| 22 | pre-existing | `react-hooks/set-state-in-effect` | `components/home/HeroContent.tsx:36` | 5b607c3 2026-03-03 |
| 23 | pre-existing | `react-hooks/set-state-in-effect` | `components/home/HeroPlatformRow.tsx:22` | 5b607c3 2026-03-03 |
| 24 | pre-existing | `@typescript-eslint/no-explicit-any` | `components/home/HeroSection.tsx:8` | 1be0196 2026-01-18 |
| 25 | pre-existing | `react-hooks/set-state-in-effect` | `components/home/MemberLine.tsx:24` | 5b607c3 2026-03-03 |
| 26 | pre-existing | `react-hooks/set-state-in-effect` | `components/home/PulsingLogo.tsx:18` | 1be0196 2026-01-18 |
| 27 | pre-existing | `react-hooks/set-state-in-effect` | `components/layout/CornerNav.tsx:46` | 5b607c3 2026-03-03 |
| 28 | pre-existing | `react-hooks/set-state-in-effect` | `components/media/MediaCarousel.tsx:26` | f9db84a 2026-02-13 |
| 29 | pre-existing | `react-hooks/set-state-in-effect` | `components/media/VideoFeed.tsx:47` | df1135c 2026-03-15 |
| 30 | pre-existing | `react-hooks/set-state-in-effect` | `components/media/VideoFeed.tsx:53` | 53c35fb 2026-03-15 |
| 31 | pre-existing | `react-hooks/set-state-in-effect` | `components/motion/PageTransition.tsx:28` | 9d5f38b 2026-02-15 |
| 32 | pre-existing | `react-hooks/set-state-in-effect` | `components/motion/Reveal.tsx:52` | 9d5f38b 2026-02-15 |
| 33 | pre-existing | `react-hooks/set-state-in-effect` | `components/shop/CartContext.tsx:52` | 4d1ed6a 2026-02-16 |
| 34 | pre-existing | `react-hooks/set-state-in-effect` | `components/shop/ShopCheckoutBanner.tsx:20` | 480293c 2026-09-22 |
| 35 | pre-existing | `react-hooks/set-state-in-effect` | `components/space/SpaceBackdrop.tsx:27` | 1be0196 2026-01-18 |
| 36 | pre-existing | `@typescript-eslint/no-explicit-any` | `lib/integrations/googleDrive.ts:114` | 8dead56 2026-02-13 |
