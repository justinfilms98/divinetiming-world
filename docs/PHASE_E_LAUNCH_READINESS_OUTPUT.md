# Phase E — Launch Readiness + Final Luxury Tightening — Output

## 1. Dead code removed

### Deleted files / components

| Item | Notes |
|------|--------|
| `components/hero/HeroCarousel.tsx` | Legacy carousel; homepage uses UnifiedHero only (Phase C). |
| `components/hero/HeroCarouselV2.tsx` | Slot-based carousel; no longer used. |
| `components/hero/HeroVideoCarouselPremium.tsx` | Premium video carousel; no longer used. |
| `components/hero/FilmFlare.tsx` | Used only by HeroCarouselV2; removed with V2. |

### Removed code (no longer used)

| Location | Change |
|----------|--------|
| `lib/content/server.ts` | Removed `getHeroCarouselSlides()` and unused `parseYouTubeId` import. |

**Note:** Type `HeroCarouselSlide` and its export from `server.ts` / `shared.ts` are retained for possible reuse or external types. No remaining source imports the deleted hero components.

---

## 2. Merch polish changes

### Product storytelling

- **Subtitle:** Optional `products.subtitle` (migration `033_products_subtitle_badge.sql`). Shown under product name on list and detail. Admin: "Subtitle (optional)" in product form.
- **Featured:** Existing `is_featured` surfaced as a **Featured** badge on list cards and detail (accent pill).
- **Badge:** Optional `products.badge` (same migration). Admin dropdown: None / Limited / New. Shown as a bordered pill on list and detail. Sold out is derived from variant inventory, not stored.
- **Sold out:** When all variants have `inventory_count <= 0`, **Sold out** badge is shown; list card shows disabled "Sold out" instead of Add to Cart; detail already had "Out of Stock" on CTAs.

### Consistency (list + detail)

- List card: badges (Featured, badge, Sold out) above title; subtitle under name; price; then Add to Cart / View Options / Sold out.
- Detail: same badges above H1; subtitle under H1; price; description; variant/quantity; Add to Cart (primary) and Buy Now (secondary).
- Card styling: unchanged (rounded-xl, hover, motion tokens). Detail uses Container + Section and ProductImageGallery.

### Files

- `supabase/migrations/033_products_subtitle_badge.sql` (new)
- `lib/types/content.ts` — Product: `subtitle?`, `badge?`
- `app/api/admin/products/route.ts` — accept and persist `subtitle`, `badge`
- `app/admin/shop/page.tsx` — form fields and Product interface
- `components/shop/ShopPageClient.tsx` — badges, subtitle, sold-out CTA
- `app/shop/[slug]/page.tsx` — badges, subtitle, responsive gap

---

## 3. Mobile fixes made

- **Shop detail:** Grid gap made responsive: `gap-8 sm:gap-10 md:gap-14` to avoid cramped spacing on small screens.
- **Shop list:** CTAs keep `min-h-[48px]` for touch; Sold out state renders a non-interactive span so layout stays consistent.
- **General:** Section/Container and Grid already drive responsive layout; hero uses `min-h-[100dvh]` (Phase D). No further mobile-only code changes in this phase.

**Recommendation:** Run a manual pass on real devices (Home, Events, Media, Shop, Booking, Press Kit) for spacing, crop, alignment, CTA stacking, and gallery/thumb behavior.

---

## 4. Admin flow verification results

| Area | Create | Edit | Publish/Unpublish | Thumbnail / visibility | Public reflection |
|------|--------|------|-------------------|------------------------|-------------------|
| **Events** | ✅ Form + API | ✅ Edit row, update | ✅ status: draft / published / archived | ✅ List shows status badge | ✅ Public list/detail filter by status = published |
| **Shop** | ✅ Form + API, images | ✅ Edit, images, variant | ✅ status in form | ✅ Featured badge, images in list/detail | ✅ Public shop filters by status = published |
| **Collections** | ✅ Create gallery, add media | ✅ Edit name/description, reorder | ✅ status (if exposed in UI) | ✅ Cover from first media | ✅ Media hub filters by status = published |
| **Videos** | ✅ Add video, YouTube URL | ✅ Edit title, order, status | ✅ status | ✅ Thumbnail from YouTube | ✅ Videos tab filters by status = published |
| **Press Kit** | ✅ Single row upsert | ✅ Edit all sections, PDF | N/A (single page) | N/A | ✅ `/presskit` reads from `presskit` table |

**Success/error states:** Admin currently uses `alert()` on error and modal close on success; list refresh and revalidate are in place. No toast or inline success message added in this phase. Improving success/error UX (e.g. toasts or inline feedback) can be a follow-up.

---

## 5. Public QA findings

- **Published-only content:** Confirmed in `lib/content/server.ts`: events, products, galleries (list + detail), and videos are filtered by `status === 'published'` when the column exists. Draft/archived do not appear on public pages.
- **Placeholder content:** Migration `032_mark_placeholder_content_draft.sql` marks obvious test/placeholder events and products as draft so they do not surface publicly. No new placeholder logic added.
- **Routes:** Public routes checked: `/`, `/events`, `/events/[slug]`, `/media`, `/media/galleries/[slug]`, `/shop`, `/shop/[slug]`, `/booking`, `/presskit`, `/about`, `/cart`. No broken routes identified.
- **Empty states:** Shop, Media (galleries/videos), Events show explicit empty-state copy. Gallery detail and product detail handle zero media / zero variants.
- **Press Kit:** Canonical URL is `/presskit` (metadata `alternates.canonical`). Redirect: `/epk` → `/presskit` (301) in `next.config.ts`. Header, Footer, and Authority CTAs link to `/presskit`. Labels are consistent ("Press Kit").

---

## 6. Final blockers before true launch readiness

1. **Run migration 033:** Apply `033_products_subtitle_badge.sql` so `products.subtitle` and `products.badge` exist. Until then, new fields are optional and the app does not break; admin form and API will persist them once the columns exist.
2. **Manual QA:** Full pass on mobile (and key desktop flows) for Home, Events, Media, Shop, Booking, Press Kit—especially touch targets, CTA stacking, and gallery/product images.
3. **Content review:** Ensure no draft or placeholder content is left published; use admin status badges and migration 032 as reference.
4. **Optional:** Add clearer admin success/error feedback (e.g. toasts or inline messages) for create/edit/publish flows.

---

## 7. Files changed

| File | Change |
|------|--------|
| `components/hero/HeroCarousel.tsx` | **Deleted** |
| `components/hero/HeroCarouselV2.tsx` | **Deleted** |
| `components/hero/HeroVideoCarouselPremium.tsx` | **Deleted** |
| `components/hero/FilmFlare.tsx` | **Deleted** |
| `lib/content/server.ts` | Removed `getHeroCarouselSlides`, removed `parseYouTubeId` import |
| `supabase/migrations/033_products_subtitle_badge.sql` | **New** — products.subtitle, products.badge |
| `lib/types/content.ts` | Product: added `subtitle?`, `badge?` |
| `app/api/admin/products/route.ts` | Accept and persist `subtitle`, `badge` |
| `app/admin/shop/page.tsx` | Product interface; form fields subtitle + badge; submit payload |
| `components/shop/ShopPageClient.tsx` | Badges (Featured, badge, Sold out), subtitle, sold-out CTA on list card |
| `app/shop/[slug]/page.tsx` | Badges, subtitle, responsive grid gap |
| `docs/PHASE_E_LAUNCH_READINESS_OUTPUT.md` | **New** — this document |

**Not changed:** HeroCarouselSlide type and its re-exports (kept for API/type stability). Admin success/error UX and deeper mobile QA are left as documented follow-ups.
