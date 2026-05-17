# Phase 5 — Hero Content Controls (Public polish)

## Goal
Everything visible on the home hero is admin-editable; remove remaining hard-coded hero copy and add CTA validation.

---

## 1) Files changed

| File | Change |
|------|--------|
| `supabase/migrations/028_hero_label_text.sql` | **NEW** — Add `label_text TEXT` to `hero_sections`. |
| `lib/types/content.ts` | Add `label_text?: string \| null` to `HeroSection`. |
| `lib/content/server.ts` | Include `label_text` in `HERO_SELECT`. |
| `app/api/admin/hero/route.ts` | Accept `label_text`; validate CTA (URL set ⇒ label required); return 400 with message for inline error. |
| `components/admin/DashboardHeroEditor.tsx` | Add `label_text` to interface and save payload; add "Label text" field; add `ctaError` state and inline validation; show API CTA error under CTA label field. |
| `app/page.tsx` | Remove hard-coded "ELECTRONIC DUO"; use `heroSection?.label_text` for eyebrow; render label only when set. |
| `app/events/page.tsx` | Pass `badge={heroSection?.label_text?.trim() \|\| undefined}` to `UnifiedHero`. |
| `app/media/page.tsx` | Pass `badge={...}` to `UnifiedHero`. |
| `app/shop/page.tsx` | Pass `badge={...}` to `UnifiedHero`. |
| `app/booking/page.tsx` | Pass `badge={...}` to `UnifiedHero`. |
| `app/events/[slug]/page.tsx` | Pass `badge={eventsHero?.label_text?.trim() \|\| undefined}` to `UnifiedHero`. |

---

## 2) What changed

### Label text (replaces "Electronic duo")
- **DB:** `hero_sections.label_text` (optional). Blank = do not render the label on the public hero.
- **Admin:** Hero Editor has a "Label text (optional)" field per page. Stored and loaded with the rest of the hero.
- **Public home:** The small-caps label above the logo is now `heroSection?.label_text`; when blank, the label block is not rendered. No fallback to "ELECTRONIC DUO".
- **Public other pages:** Events, Media, Shop, Booking (and event detail) pass `label_text` into `UnifiedHero` as the existing `badge` prop, so the label appears above the headline when set.

### CTA guardrails
- **Rule:** If CTA URL is set, CTA label must be set. (If label is set but URL is empty, the CTA button is not shown — we require both to show the button.)
- **Admin:** Before save, client checks: if `cta_url` is non-empty and `cta_text` is empty → set `ctaError` and do not call the API. CTA label input shows red border and inline error: "CTA label is required when CTA URL is set."
- **API:** Server validates the same rule; on failure returns `400` with `{ error: "CTA label is required when CTA URL is set." }`. Admin shows this message under the CTA label field (no alert).
- **Public:** `HeroContent` already only renders the primary CTA when both `ctaText` and `ctaUrl` are truthy, so no change.

### CTA behavior (documented)
- **If URL present but label empty:** Error in admin; save blocked; inline error under CTA label.
- **If label present but URL empty:** CTA button is **hidden** on the public site (URL required to show the button). No error in admin; both fields remain optional until URL is set.

---

## 3) Acceptance checklist

- [x] "Electronic duo" is fully removed from public UI (no hard-coded string).
- [x] Admin can set/clear label text per page; it reflects on the corresponding public page hero (home: label above logo; events/media/shop/booking: badge above headline).
- [x] CTA validation: URL without label → inline error under CTA label, save prevented (client + server).
- [x] API 400 CTA error is shown as inline error, not alert.
- [x] Build passes.

---

## 4) Run migration

Apply the new column before using in production or local DB:

```bash
# If using Supabase CLI
supabase db push

# Or run the SQL in Supabase Dashboard SQL editor:
# See supabase/migrations/028_hero_label_text.sql
```
