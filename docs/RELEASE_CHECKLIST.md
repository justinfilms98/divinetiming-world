# Luxury Release Checklist

Use this checklist for every preview and production deploy.

**How to use**: Before merging, run `npm run build` and complete section A. After a preview deploy, run section B (and optionally `node scripts/smoke.mjs https://your-preview-url.vercel.app`). After production deploy, run section C. Keep rollback steps (D) handy.

## A) Pre-merge (developer)

- [ ] `npm run build` passes
- [ ] `npm run lint` (if configured)
- [ ] `npm run typecheck` (if configured)
- [ ] `npm run assert:hero-logo` passes (hero_logo_url validation)
- [ ] Env vars for preview exist: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server)

**Canary (Vercel):** Confirm Supabase env (e.g. `NEXT_PUBLIC_SUPABASE_URL`) is set so uploads and media resolution work after deploy.

## B) Preview deploy (visual + functional)

### Public site

- [ ] **Home**: Hero loads (image/video), overlay readable, no layout jump
- [ ] **Events**: List renders, Upcoming/Past toggle works, click event opens detail
- [ ] **Media**: Hero present, galleries grid loads, gallery detail opens, viewer works
- [ ] **Shop**: Product list loads, product detail loads, cart trigger visible, cart drawer works
- [ ] **Booking**: Form renders, About panel renders, mobile layout stacks
- [ ] **Navigation**: All links work, no 404s
- [ ] **Footer/header**: Consistent, no overflow on mobile

### Storage (see [docs/MEDIA_STORAGE.md](MEDIA_STORAGE.md))

- [ ] **Media uploads**: One admin upload (Media library) succeeds; asset URL loads in browser (no 404/CORS)
- [ ] **Supabase** (if used): `media` bucket public, RLS allows public read; CORS allows app origins
- [ ] **Cart/nav**: Cart button does not overlap nav links on any breakpoint (cart is bottom-right; Booking link inset)

### Step 2 QA (logo + media uploads — see [docs/STEP2_QA.md](STEP2_QA.md))

- [ ] **Hero logo**: Admin → Hero Editor → Home → upload PNG logo → Save → refresh admin (logo preview persists) → refresh home (logo renders); remove logo → text title returns; broken logo URL falls back to text
- [ ] **Events**: Upload event image → Save → public Events page shows image on card and detail (no “media unavailable”)
- [ ] **Media**: Upload multiple items → they appear in admin list and on public Media page immediately
- [ ] **Shop**: Create/edit product with multiple images → thumbnails in admin and on public Shop/product page

### Admin

- [ ] **Auth**: Non-admin cannot access admin pages
- [ ] **Hero Manager**: Upload image/video, save, reflect on live site
- [ ] **Events**: Create/edit/delete, thumbnail upload
- [ ] **Media Library**: Upload, view item, copy URL, delete
- [ ] **Galleries**: Create, cover, add media, reorder, delete
- [ ] **Shop**: Create/edit product, upload images, product link works

### SEO

- [ ] Titles/descriptions present on key pages
- [ ] OG image present on key pages
- [ ] JSON-LD present on `/events/[slug]`, `/shop/[slug]` (if implemented)

### Performance

- [ ] No large CLS from hero/cards
- [ ] Videos have poster/fallback
- [ ] No console errors

## C) Production deploy (post-release smoke)

- [ ] Run the same critical-path checks above in production
- [ ] Verify canonical URLs and OG tags in production

## D) Rollback plan

1. **Revert in Vercel**: Deployments → select previous deployment → "Promote to Production"
2. **Revert a PR**: Revert the merge commit and push; redeploy
3. **Before rollback**: Capture screenshots/errors and note the failing deployment URL

## Smoke script

Run `node scripts/smoke.mjs` (or `node scripts/smoke.mjs https://your-preview-url.vercel.app`) to hit key routes and confirm 200 + HTML.
