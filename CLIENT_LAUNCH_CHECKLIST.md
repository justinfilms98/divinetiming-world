# Client launch checklist

Engineering brief is complete. Only two blockers remain before full launch.

---

## Blockers (must have)

### 1. Business / legal address

- **What we need:** The operator’s physical business/legal contact address (Spain / Canary Islands autónomo).
- **Where it goes:** Replace every `` `[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]` `` in `/admin/policies` (Privacy, Terms, Refund, Shipping), then **publish** and set effective dates.
- **Do not:** Publish while the placeholder remains. Legal pages are **draft** and correctly 404 on the public site until then.

### 2. Stripe test-mode e2e

- **What we need:** Stripe **test-mode** keys + webhook; card checkout with a real `price_…` ID; `checkout.session.completed`; order row in `/admin/orders`; inventory decrement only when `track_inventory` is on.
- **Where it goes:** Hosting / local env (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, publishable key). Shop UI, cart, checkout route, orders admin, and webhook path already exist.
- **Do not:** Use live keys until test-mode path is verified.

---

## Already inserted from client materials

- Legal drafts for Spain/Canary Islands autónomo (Alexel Laurence Oulton, NIE Y0922860E, trading as DIVINE:TIMING) — **still draft**
- Press kit short bio, tech rider (CDJ/DJM options), booking contact (Helle Marie / info@divinetimingmusic.com / +33 635 640 200)
- Performance reel: `https://www.youtube.com/watch?v=3BrxhnOg1Uk`
- Notable performances (Papagayo, Afrotronic, SAOKO, Marbella, Barcelona, Gran Canaria, Montenegro)
- Site settings booking email/phone + member names Lex / Liam
- HANUMANTUM release (published) when missing
- Official logo already in Supabase media (`hero/logos/home-logo.png`, `library/…DT_LOGO_W.png`); PDF at client Downloads is the print source
- Google Drive archive: https://drive.google.com/drive/folders/1N_nY6NPJDduetFIEmWyAjzkQ0fe63JvB (ingest further assets into Media Library as needed)

---

## Intentionally deferred (not launch blockers for content QA)

- **Resend** — booking/contact inquiries already save to DB and show in `/admin/booking-inquiries` without email delivery
- **Live Stripe** — blocked by item 2 above
- Optional: one-sheet PDF URL, hospitality rider text, additional high-res press assets from Drive

---

## Soft follow-ups (nice before launch)

- Replace leftover “test” shop product / “Test” gallery rows with real catalog and stories
- Fill media-library alt text / tags on existing ~20 assets
- Re-check privacy analytics wording if any new third-party tracker is added
