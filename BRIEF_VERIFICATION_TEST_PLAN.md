# Brief verification test plan

Use this to judge whether the project brief was implemented well **without** Stripe or the legal address.

Run against local `npm run dev` (http://localhost:3000) while logged into admin for CMS checks.

---

## A. Public conversion paths (must pass)

| # | Check | Pass criteria |
| --- | --- | --- |
| A1 | Homepage bands | Hero → Now playing / experience / events / manifesto / films / tribe / shop / booking CTA; dark/light bands readable |
| A2 | Nav | MUSIC, EVENTS, JOURNEY, MEDIA, SHOP, BOOK present; BOOK → `/booking` |
| A3 | Music | `/music` shows HANUMANTUM (or empty state if unpublished); detail page has story/streaming when set |
| A4 | Booking | `/booking` form submits; row appears in `/admin/booking-inquiries` with status `new` (**no email required**) |
| A5 | Tribe | Homepage tribe form accepts email; invalid email rejected |
| A6 | About | Short bio visible; long bio not dumped — link toward press kit |
| A7 | Press kit | `/presskit` shows short/long bio, tech rider, reel embed, booking contact, performances |
| A8 | Events | Upcoming vs past sections; no invented stats |
| A9 | Collections | `/collections` curated stories (not masonry dump); empty OK |
| A10 | Legal drafts | `/privacy` `/terms` `/refund` `/shipping` all **404** while draft |
| A11 | Label | `/label` 404 unless feature flag on |
| A12 | Shop (no Stripe) | Browse products, add to cart, open cart; Checkout returns friendly “not enabled yet” (no crash) |
| A13 | Shop banners | Manual visit `/shop?success=true` and `/shop/test?canceled=true` shows then clears banner |

---

## B. Admin / CMS (must pass)

| # | Check | Pass criteria |
| --- | --- | --- |
| B1 | Dashboard | Quick actions include Releases, Events, Inquiries, Press Kit, Shop, Policies, Orders |
| B2 | Inquiries | Pipeline statuses + next action editable |
| B3 | Policies | All four drafts load; address placeholder visible; publish toggle exists but **leave draft** |
| B4 | Press kit | Reel URL, rider, short bio, performances editable |
| B5 | Media | Metadata editor (alt, tags, usage, archive); featured requires alt |
| B6 | Shop admin | SKU / category / inventory / variants editable |
| B7 | Orders | `/admin/orders` loads empty state explaining Stripe deferred |
| B8 | Journey | Chapters draft-safe; public empty until published |

---

## C. Technical smoke (must pass)

```bash
npx tsc --noEmit
```

Optional HTTP checks:

```bash
curl -s -o NUL -w "%{http_code}" http://localhost:3000/
curl -s -o NUL -w "%{http_code}" http://localhost:3000/booking
curl -s -o NUL -w "%{http_code}" http://localhost:3000/presskit
curl -s -o NUL -w "%{http_code}" http://localhost:3000/privacy
curl -s -o NUL -w "%{http_code}" http://localhost:3000/music
curl -s -o NUL -w "%{http_code}" http://localhost:3000/shop
```

Expected: home/booking/presskit/music/shop → **200**; privacy → **404**.

Booking API:

```bash
curl -s -X POST http://localhost:3000/api/booking -H "Content-Type: application/json" -d "{\"name\":\"QA Tester\",\"email\":\"qa@example.com\",\"message\":\"Brief verification inquiry\"}"
```

Expect `{ "success": true }`. Delete the QA row from admin afterward.

Checkout without Stripe:

```bash
curl -s -X POST http://localhost:3000/api/checkout -H "Content-Type: application/json" -d "{\"items\":[]}"
```

Expect **4xx/503** JSON error, not a 500 stack dump.

---

## D. Explicitly out of scope for this test

- Live or test Stripe card charges
- Publishing legal pages
- Resend email delivery
- Importing the full Google Drive archive

---

## Verdict rubric

- **Brief done well:** All of A + B + C pass; only blockers are address + Stripe.
- **Needs work:** Any public 500, booking not saving, legal pages leaking while draft, or checkout crashing the app.
