-- Client content insert (legal drafts + press kit). Keeps legal status = draft.
-- Address remains an explicit unpublished placeholder.

-- ============================================================
-- LEGAL POLICIES (draft only — do not publish until address + review)
-- ============================================================

UPDATE legal_policies SET
  title = 'Privacy Policy',
  status = 'draft',
  effective_date = NULL,
  updated_at = NOW(),
  body_md = $md$
> **DRAFT — NOT PUBLISHED.** Business/legal address is still pending. Do not publish until `[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]` is replaced and this text is reviewed.

# Privacy Policy

**Operator:** Alexel Laurence Oulton (individual / autónomo), trading as **DIVINE:TIMING**  
**NIE:** Y0922860E  
**Brand:** DIVINE:TIMING  
**Contact email:** info@divinetimingmusic.com  
**Business / legal address:** `[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]`  
**Jurisdiction:** Spain (Canary Islands / Spanish consumer and data-protection law)

This policy explains how personal data is handled when you use divinetiming.world and related services (booking inquiries, email signup, shop, and contact forms).

## Who is responsible

The data controller is **Alexel Laurence Oulton**, operating as an individual autónomo under the trading name DIVINE:TIMING. DIVINE:TIMING is not currently a separate incorporated company.

## What we collect

Depending on how you use the site, we may process:

- **Identity and contact data** — name, email, phone, company/venue (when you submit a booking or contact form)
- **Event inquiry details** — event name, type, proposed date, city/country, venue, attendance estimate, budget range, message
- **Community signup** — email and optional city/country when you join the mailing list
- **Order data** — name, email, shipping address, and purchase details when the shop is enabled and you check out (processed via our payment provider)
- **Technical data** — basic first-party analytics events stored by us (no third-party advertising pixels by default), and standard server logs

We do not ask for payment card numbers on our servers; card data is handled by Stripe when checkout is enabled.

## Why we process data (purposes and legal bases)

| Purpose | Legal basis (GDPR / Spanish LOPDGDD) |
| --- | --- |
| Respond to booking / contact inquiries | Legitimate interests / steps prior to a contract |
| Fulfil and ship shop orders | Performance of a contract |
| Send community / tribe email you opted into | Consent (you may withdraw anytime) |
| Operate and secure the website | Legitimate interests |
| Meet legal / tax / accounting obligations | Legal obligation |

## Where data is processed

Data is stored with our hosting and database providers (including Supabase) and, when payments are enabled, Stripe. Servers may be located in the EU or other regions under appropriate transfer safeguards used by those providers.

## How long we keep data

- Booking / contact inquiries: retained while useful for follow-up and for a reasonable period afterward for dispute and accounting records
- Mailing-list subscriptions: until you unsubscribe or we delete the list entry
- Orders and invoices: for the periods required under Spanish tax and commercial law
- Analytics events: short retention for operational metrics

## Your rights

Under GDPR / LOPDGDD you may request access, rectification, erasure, restriction, portability, and objection, and you may withdraw consent where processing is consent-based. Contact **info@divinetimingmusic.com**. You may also lodge a complaint with the Spanish Agencia Española de Protección de Datos (AEPD).

## Cookies and embeds

We use essential first-party storage needed for the site to function (for example cart and session identifiers). We do not run Google Analytics or Meta Pixel by default. Embedded third-party players (for example YouTube) may set their own cookies when you play content — see the provider’s policy.

## Changes

We will update this page when practices change. Draft versions are not public until published in the CMS with an effective date.

## Contact

Alexel Laurence Oulton · DIVINE:TIMING · info@divinetimingmusic.com  
`[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]`
$md$
WHERE slug = 'privacy';

UPDATE legal_policies SET
  title = 'Terms of Service',
  status = 'draft',
  effective_date = NULL,
  updated_at = NOW(),
  body_md = $md$
> **DRAFT — NOT PUBLISHED.** Business/legal address is still pending. Do not publish until `[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]` is replaced and this text is reviewed.

# Terms of Service

**Operator:** Alexel Laurence Oulton (individual / autónomo), trading as **DIVINE:TIMING**  
**NIE:** Y0922860E  
**Contact:** info@divinetimingmusic.com  
**Address:** `[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]`  
**Governing law:** Spain. Courts of the consumer’s place of residence apply for consumer disputes where mandatory consumer law so requires; otherwise courts competent for the operator’s domicile in Spain.

## About these terms

These terms govern use of divinetiming.world, booking inquiries, and purchases of products offered in the shop. By using the site you agree to them.

## Who we are

DIVINE:TIMING is the trading / brand name of **Alexel Laurence Oulton**, an individual autónomo. It is not currently a separate company.

## Site content

Music, images, logos, and text on this site are owned by or licensed to the operator unless otherwise stated. You may not copy or redistribute them for commercial use without permission.

## Booking inquiries

Submitting a booking form is an inquiry, not a confirmed booking. Availability, fees, and technical riders are agreed separately in writing. We may decline inquiries at our discretion.

## Shop orders (when checkout is enabled)

- Product descriptions and prices are shown on the product page before payment.
- A binding purchase is formed when payment is successfully authorised through our payment provider.
- We reserve the right to cancel an order and refund if a product cannot be fulfilled (for example stock error).
- Digital content, if any is offered, may have limited withdrawal rights once performance begins with your prior consent, as allowed by Spanish / EU consumer law.

## User conduct

Do not misuse the site (spam, scraping that harms the service, unlawful content, attempts to breach security).

## Limitation of liability

Nothing in these terms limits liability that cannot be limited under Spanish law (including liability for death or personal injury caused by negligence, or fraud). For other losses, our liability is limited to the amount you paid for the relevant order, where applicable.

## Changes

We may update these terms. The published version with its effective date is the version that applies.

## Contact

info@divinetimingmusic.com · `[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]`
$md$
WHERE slug = 'terms';

UPDATE legal_policies SET
  title = 'Refund & Withdrawal Policy',
  status = 'draft',
  effective_date = NULL,
  updated_at = NOW(),
  body_md = $md$
> **DRAFT — NOT PUBLISHED.** Business/legal address is still pending. Do not publish until `[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]` is replaced and this text is reviewed.

# Refund & Withdrawal Policy

**Operator:** Alexel Laurence Oulton (autónomo), trading as **DIVINE:TIMING**  
**NIE:** Y0922860E  
**Contact:** info@divinetimingmusic.com  
**Address:** `[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]`

This policy applies to distance sales of goods through the DIVINE:TIMING shop to consumers, under Spanish and EU consumer rules.

## Right of withdrawal (consumers in the EU / EEA / UK as applicable)

If you are a consumer, you generally have **14 calendar days** from the day you receive the goods to withdraw from the contract without giving a reason, unless an exception applies (for example sealed goods not suitable for return for health/hygiene reasons once unsealed, or custom-made items).

To exercise withdrawal, email **info@divinetimingmusic.com** with your order details within the withdrawal period. You then return the goods without undue delay and in any event within 14 days of informing us, in unused condition with original packaging where reasonably possible. You normally bear the direct cost of return shipping unless we agree otherwise in writing.

We refund the price paid for the goods (and standard outbound shipping where required by law) using the original payment method after we receive the goods or proof of return, whichever is earlier as required by law.

## Defective or incorrect items

If an item arrives damaged, faulty, or not as described, contact us promptly with photos and your order reference. We will arrange repair, replacement, or refund as required under Spanish consumer guarantee rules (garantía legal).

## Non-consumer / business buyers

Business (B2B) purchases may have different return terms agreed in writing. Unless agreed, statutory consumer withdrawal rights do not apply to traders.

## Booking deposits and performance fees

Live booking fees and deposits are governed by the booking agreement, not this shop policy.

## Contact

info@divinetimingmusic.com · `[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]`
$md$
WHERE slug = 'refund';

UPDATE legal_policies SET
  title = 'Shipping Policy',
  status = 'draft',
  effective_date = NULL,
  updated_at = NOW(),
  body_md = $md$
> **DRAFT — NOT PUBLISHED.** Business/legal address is still pending. Do not publish until `[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]` is replaced and this text is reviewed.

# Shipping Policy

**Operator:** Alexel Laurence Oulton (autónomo), trading as **DIVINE:TIMING**  
**NIE:** Y0922860E  
**Contact:** info@divinetimingmusic.com  
**Ship-from / business address:** `[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]`  
**Territory:** **Worldwide**, subject to carrier coverage and any legal restrictions.

## International delivery

We ship physical merchandise internationally where carriers allow. Delivery times and costs depend on destination, weight, and the options shown at checkout. **We do not publish fixed shipping prices or delivery windows on this page** unless they are configured and displayed in the shop checkout at the time of purchase. Always rely on the amounts and estimates shown before you pay.

## Your address

You are responsible for providing a complete and accurate shipping address. We are not responsible for delays or failed delivery caused by an incorrect, incomplete, or inaccessible address. Additional fees for redelivery or return-to-sender may apply.

## Customs, duties, and import taxes

For international orders, customs duties, import VAT/IGIC equivalents, and clearance fees **may be charged by your country’s authorities or the carrier**. Unless checkout explicitly states that duties are collected in advance, those charges are typically **your responsibility** and are not included in the product price. Clearance can add unpredictable delay beyond the carrier’s transit estimate.

## Processing and dispatch

Orders are prepared after payment clears. Pre-order or made-to-order items ship according to the date stated on the product page. Processing times shown at checkout (if any) start after payment, not before.

## Tracking

Where the carrier provides tracking, we will share the tracking reference when available (usually by email to the address used at checkout). Not every service level includes full door-to-door tracking in every country.

## Delays, lost, or damaged parcels

Carriers sometimes experience delays beyond published estimates. If a tracked shipment shows no movement for an extended period, or arrives damaged, contact **info@divinetimingmusic.com** with your order number and we will open a carrier inquiry. Remedies for loss or damage follow the carrier’s process and applicable consumer law; see also our Refund & Withdrawal Policy.

## Failed delivery

If a parcel is returned because it could not be delivered, we will contact you. Reshipping may require an additional shipping charge.

## Contact

info@divinetimingmusic.com · `[BUSINESS ADDRESS PENDING — DO NOT PUBLISH]`
$md$
WHERE slug = 'shipping';

-- ============================================================
-- PRESS KIT + SITE SETTINGS (factual from Official DT Presskit 2026)
-- ============================================================

UPDATE presskit SET
  short_bio = $s$DIVINE:TIMING are a UK-born, Canary Islands–raised duo who integrate live percussion and vocals into Afro and organic house. Lex sings and chants while DJing; Liam performs on a full live drum setup. Their debut single HANUMANTUM charted in Beatport’s Top 100 Hype Afro House.$s$,
  long_bio = bio_text,
  audience_text = $a$Top listener countries: USA, Argentina, Germany, Spain, Mexico. Top age ranges: 25–34 and 35–44.$a$,
  tech_rider_text = $t$## Tech rider (live)

### Option 1
- 4× Pioneer CDJ-3000
- 1× Pioneer DJM-V10 mixer
- 1× Microphone with 2× microphone stands
- 1× Dedicated mic mixer

### Option 2
- 4× Pioneer CDJ-3000
- 1× Pioneer DJM-A9 mixer
- 1× Microphone with 2× microphone stands
- 1× Dedicated mic mixer

### Booth
Clean & tidy DJ booth. Security staff or restricted access to the DJ booth required.$t$,
  performance_reel_url = 'https://www.youtube.com/watch?v=3BrxhnOg1Uk',
  booking_contact_name = 'Helle Marie',
  booking_contact_email = 'info@divinetimingmusic.com',
  booking_contact_phone = '+33 635 640 200',
  links_text = $l$Instagram · YouTube · Spotify · SoundCloud · Website · Beatport — links also live in site settings.$l$,
  updated_at = NOW()
WHERE id = 'aaaad43f-a500-4425-b840-16a90f2db3c7';

UPDATE site_settings SET
  artist_name = 'DIVINE:TIMING',
  member_1_name = 'Lex',
  member_2_name = 'Liam',
  booking_email = 'info@divinetimingmusic.com',
  booking_phone = '+33 635 640 200',
  updated_at = NOW();

-- Notable performances (replace any empty set; idempotent by clearing then inserting)
DELETE FROM presskit_performances;

INSERT INTO presskit_performances (label, venue, city, country, year, display_order) VALUES
  ('Papagayo', 'Papagayo', 'Tenerife', 'Spain', NULL, 0),
  ('Afrotronic Festival', 'Afrotronic Festival', NULL, NULL, NULL, 1),
  ('SAOKO Fest', 'SAOKO Fest', NULL, NULL, NULL, 2),
  ('Marbella', NULL, 'Marbella', 'Spain', NULL, 3),
  ('Barcelona', NULL, 'Barcelona', 'Spain', NULL, 4),
  ('Gran Canaria', NULL, 'Gran Canaria', 'Spain', NULL, 5),
  ('Montenegro', NULL, NULL, 'Montenegro', NULL, 6);

-- Debut release if missing
INSERT INTO releases (
  title, slug, release_type, release_date, description, credits,
  beatport_url, is_featured, display_order, status
)
SELECT
  'HANUMANTUM',
  'hanumantum',
  'single',
  NULL,
  $d$Debut single by DIVINE:TIMING. Charted in Beatport’s Top 100 Hype Afro House. SAFAR’s remix entered the Top 100 Hype Organic House.$d$,
  'DIVINE:TIMING. Remix by SAFAR.',
  NULL,
  TRUE,
  0,
  'published'
WHERE NOT EXISTS (SELECT 1 FROM releases WHERE slug = 'hanumantum');

-- Confirm legal still draft
UPDATE legal_policies SET status = 'draft', effective_date = NULL;
