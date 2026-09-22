-- ============================================================
-- SPRINT 3: LEGAL & COMPLIANCE (brief section 24)
--
-- Upgrades the existing `legal_policies` table (migration 036) into the
-- publishable legal-document model the brief requires: document type key,
-- title, body, draft/published status, last-updated timestamp, effective date.
--
-- Deliberately EXTENDS `legal_policies` instead of creating a parallel
-- `legal_documents` table. 036 already ships the table, four seeded rows,
-- /privacy, /terms, /refund, /shipping, and an admin editor. A second table
-- would duplicate all of that and leave two sources of truth for the same
-- four documents.
--
-- Additive and idempotent: every column is nullable or defaulted, so existing
-- rows keep working. Rollback: run 044_legal_documents.down.sql.
--
-- SECURITY FIX. 036 granted `FOR ALL USING (true) WITH CHECK (true)` to PUBLIC,
-- which let the anon role INSERT/UPDATE/DELETE legal copy, and its public
-- SELECT policy was `USING (true)`, which exposed unreviewed drafts. This
-- migration adopts the 041_releases.sql model instead: public SELECT is limited
-- to published rows and NO write policies exist. Every mutation goes through
-- /api/admin/legal-policies, which uses the service role after requireAdmin().
-- ============================================================

-- ------------------------------------------------------------
-- 1. Publication state
-- ------------------------------------------------------------

-- Existing rows predate the workflow and hold unreviewed placeholder copy, so
-- defaulting to 'draft' correctly pulls them off the public site.
ALTER TABLE legal_policies
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'legal_policies_status_check'
  ) THEN
    ALTER TABLE legal_policies
      ADD CONSTRAINT legal_policies_status_check
      CHECK (status IN ('draft','published'));
  END IF;
END $$;

-- The date the document takes legal effect. Set by whoever reviews the copy and
-- kept independent of `updated_at`, so fixing a typo does not move it.
ALTER TABLE legal_policies
  ADD COLUMN IF NOT EXISTS effective_date DATE;

ALTER TABLE legal_policies
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 036 left updated_at nullable; the public "last updated" line depends on it.
UPDATE legal_policies SET updated_at = NOW() WHERE updated_at IS NULL;

ALTER TABLE legal_policies
  ALTER COLUMN updated_at SET NOT NULL;

-- Public reads filter on status.
CREATE INDEX IF NOT EXISTS idx_legal_policies_status
  ON legal_policies (status);

-- ------------------------------------------------------------
-- 2. Row level security
-- ------------------------------------------------------------

ALTER TABLE legal_policies ENABLE ROW LEVEL SECURITY;

-- Both 036 policies are wrong and are replaced, not amended.
DROP POLICY IF EXISTS "Admin full legal_policies" ON legal_policies;
DROP POLICY IF EXISTS "Public read legal_policies" ON legal_policies;

DROP POLICY IF EXISTS "Public can read published legal_policies" ON legal_policies;
CREATE POLICY "Public can read published legal_policies" ON legal_policies
  FOR SELECT USING (status = 'published');

-- ------------------------------------------------------------
-- 3. Placeholder skeletons
--
-- The 036 seeds read as finished prose and invented binding terms nobody had
-- approved: a 14-day return window, 2-5 day processing, 3-7 day domestic
-- delivery, 7-21 day international delivery. Those numbers were fabricated.
--
-- They are replaced with skeletons that carry the correct section headings for
-- each document type plus bracketed placeholders everywhere a real commitment
-- belongs, so nothing here can be mistaken for approved legal text.
--
-- Each UPDATE only rewrites a body that still matches the 036 seed marker (or is
-- empty). If a human has already pasted reviewed copy, the migration leaves it
-- untouched, which also makes re-running safe.
-- ------------------------------------------------------------

-- Ensure all four document types exist, in case a row was deleted after 036 ran.
INSERT INTO legal_policies (slug, title, body_md, status)
VALUES
  ('privacy',  'Privacy Policy',          '', 'draft'),
  ('terms',    'Terms of Service',        '', 'draft'),
  ('refund',   'Refund & Returns Policy', '', 'draft'),
  ('shipping', 'Shipping Policy',         '', 'draft')
ON CONFLICT (slug) DO NOTHING;


UPDATE legal_policies SET
  title = 'Privacy Policy',
  updated_at = NOW(),
  body_md = $doc$> **UNREVIEWED DRAFT — NOT LEGALLY BINDING. DO NOT PUBLISH.**
> Every value in [SQUARE BRACKETS] is a placeholder that must be replaced, and the finished text must be reviewed by a qualified lawyer in your jurisdiction before this document is published.

## Who we are

This site is operated by [LEGAL ENTITY NAME], [ENTITY TYPE, e.g. sole trader / LLC / Ltd], registered at [REGISTERED ADDRESS]. For privacy questions, contact [PRIVACY CONTACT EMAIL] or write to [CONTACT ADDRESS].

[IF REQUIRED IN YOUR JURISDICTION: name your Data Protection Officer or EU/UK representative here, or state that you are not required to appoint one.]

## What information we collect

- **Information you give us.** [LIST EACH FORM AND THE FIELDS IT COLLECTS — e.g. newsletter signup: email address; booking inquiry: name, email, phone, event details; shop order: name, email, shipping address.]
- **Order and payment information.** [DESCRIBE WHAT YOU RECEIVE FROM THE PAYMENT PROCESSOR AND WHAT YOU NEVER SEE.]
- **Site usage information.** [DESCRIBE THE ANALYTICS ACTUALLY IN USE. As built, this site records anonymous page paths and an anonymous session identifier on its own server, and does not record IP addresses or use third-party analytics or advertising services. CONFIRM THIS IS STILL TRUE BEFORE PUBLISHING.]

## Why we use it, and our legal basis

[FOR EACH PURPOSE, STATE THE LEGAL BASIS YOUR JURISDICTION REQUIRES — e.g. contract, consent, legitimate interests.]

- To respond to inquiries: [LEGAL BASIS]
- To process, ship, and support orders: [LEGAL BASIS]
- To send marketing email you asked for: [LEGAL BASIS]
- To understand how the site is used: [LEGAL BASIS]

We do not sell personal information. [CONFIRM THIS, AND STATE WHETHER YOU "SHARE" IT FOR TARGETED ADVERTISING AS DEFINED BY APPLICABLE US STATE LAW.]

## Who we share it with

[LIST EVERY PROCESSOR AND SUB-PROCESSOR BY NAME, WHAT IT RECEIVES, AND WHERE IT STORES DATA. Verify this against the integrations actually deployed — a guessed list is a compliance problem, not a placeholder.]

- Payment processing: [PAYMENT PROCESSOR]
- Site hosting: [HOSTING PROVIDER]
- Database and file storage: [DATABASE PROVIDER]
- Transactional and marketing email: [EMAIL PROVIDER]
- Order fulfilment and shipping: [FULFILMENT PARTNER / CARRIERS]

## International transfers

[IF PERSONAL DATA LEAVES ITS COUNTRY OF ORIGIN, IDENTIFY THE DESTINATIONS AND THE SAFEGUARD YOU RELY ON.]

## How long we keep it

[STATE A RETENTION PERIOD PER CATEGORY — e.g. inquiries: [DATA RETENTION PERIOD]; order records: [DATA RETENTION PERIOD, OFTEN SET BY TAX LAW]; newsletter subscribers: until unsubscribe plus [DATA RETENTION PERIOD].]

## Cookies and local storage

[DESCRIBE WHAT IS ACTUALLY STORED IN THE VISITOR'S BROWSER. As built, this site uses first-party browser storage for the shopping cart and for an anonymous analytics session identifier, plus a first-party login cookie for administrators only. It sets no third-party advertising or cross-site tracking cookies. RE-VERIFY BEFORE PUBLISHING, AND UPDATE THIS SECTION IF ANY THIRD-PARTY TRACKING IS ADDED.]

## Your rights

[LIST THE RIGHTS THAT APPLY UNDER [JURISDICTION] AND HOW TO EXERCISE THEM — typically access, correction, deletion, portability, objection, withdrawal of consent, and the right to complain to a regulator.]

To make a request, contact [PRIVACY CONTACT EMAIL]. We respond within [RESPONSE WINDOW REQUIRED BY LAW].

[NAME THE SUPERVISORY AUTHORITY OR REGULATOR A VISITOR MAY COMPLAIN TO.]

## Children

This site is not directed to children under [AGE THRESHOLD FOR YOUR JURISDICTION], and we do not knowingly collect their personal information.

## Changes to this policy

We will post any changes on this page and update the effective date shown above.

## Contact

[LEGAL ENTITY NAME], [CONTACT ADDRESS] — [PRIVACY CONTACT EMAIL]$doc$
WHERE slug = 'privacy'
  AND (body_md = '' OR body_md LIKE '> **DRAFT — REPLACE BEFORE LAUNCH.**%');


UPDATE legal_policies SET
  title = 'Terms of Service',
  updated_at = NOW(),
  body_md = $doc$> **UNREVIEWED DRAFT — NOT LEGALLY BINDING. DO NOT PUBLISH.**
> Every value in [SQUARE BRACKETS] is a placeholder that must be replaced, and the finished text must be reviewed by a qualified lawyer in your jurisdiction before this document is published.

## Agreement to these terms

These terms are a contract between you and [LEGAL ENTITY NAME] ("we", "us"), registered at [REGISTERED ADDRESS]. By using this site or placing an order you agree to them. If you do not agree, please do not use the site.

## Who may use this site

You must be at least [MINIMUM AGE] to use this site, and at least [MINIMUM AGE TO PURCHASE] to place an order.

## Orders and acceptance

[STATE WHEN A CONTRACT IS FORMED — e.g. on dispatch, or on order confirmation.] All orders are subject to acceptance and availability. We may decline or cancel an order and refund you in full. [DESCRIBE HOW YOU HANDLE PRICING OR STOCK ERRORS.]

## Prices, taxes, and payment

Prices are shown in [CURRENCY]. [STATE WHETHER PRICES INCLUDE OR EXCLUDE TAX, AND WHEN SHIPPING AND TAX ARE CALCULATED.] Payments are processed by [PAYMENT PROCESSOR] under its own terms. [STATE WHO IS RESPONSIBLE FOR IMPORT DUTIES.]

## Shipping, returns, and refunds

Delivery is governed by our Shipping Policy, and returns and refunds by our Refund & Returns Policy. Both form part of these terms.

## Tickets and live events

[IF YOU SELL TICKETS OR TAKE BOOKINGS THROUGH THIS SITE, SET OUT THE TERMS — e.g. ticket transfer, cancellation, rescheduling, refunds for a cancelled show, age restrictions, and venue rules. IF NOT, DELETE THIS SECTION.]

## Intellectual property

All content on this site — recordings, compositions, photography, video, artwork, copy, and the [LEGAL ENTITY NAME] and DIVINE:TIMING names and logos — is owned by us or licensed to us. [STATE WHAT PERSONAL, NON-COMMERCIAL USE IS PERMITTED, AND WHAT REQUIRES WRITTEN PERMISSION.] Contact [LICENSING CONTACT EMAIL] for licensing and sync requests.

## Your submissions

[IF VISITORS CAN SUBMIT PHOTOS, COMMENTS, OR OTHER MATERIAL, STATE WHAT LICENCE YOU RECEIVE AND WHAT YOU MAY REMOVE. IF NOT, DELETE THIS SECTION.]

## Acceptable use

You agree not to [LIST PROHIBITED CONDUCT — e.g. scrape the site, resell access, interfere with its operation, infringe our rights, or upload unlawful material].

## Third-party links and services

This site links to third-party platforms such as [LIST — e.g. streaming services, ticketing partners, social platforms]. We do not control them and are not responsible for their content or their terms.

## Disclaimers

The site and its content are provided "as is" and "as available", without warranties of any kind, to the fullest extent permitted by the law of [JURISDICTION].

## Limitation of liability

[THE ENFORCEABLE SCOPE AND ANY MANDATORY CARVE-OUTS DEPEND ENTIRELY ON [JURISDICTION] AND ON CONSUMER PROTECTION LAW. A LAWYER MUST DRAFT THIS SECTION — DO NOT SHIP BOILERPLATE. Consumer law in many jurisdictions makes broad exclusions void, and nothing here may limit liability for death, personal injury, or fraud.]

## Indemnity

[IF YOU REQUIRE AN INDEMNITY FROM USERS, HAVE A LAWYER DRAFT IT. OTHERWISE DELETE THIS SECTION.]

## Changes to the site or these terms

We may change the site or these terms. Material changes will be posted here with a new effective date. [STATE WHETHER CONTINUED USE CONSTITUTES ACCEPTANCE, AND WHETHER YOU GIVE ADVANCE NOTICE.]

## Termination

We may suspend or end your access to the site if you breach these terms.

## Governing law and disputes

These terms are governed by the law of [GOVERNING LAW / JURISDICTION], and disputes will be heard by the courts of [COURTS / VENUE]. [IF YOU INTEND TO REQUIRE ARBITRATION OR WAIVE CLASS ACTIONS, A LAWYER MUST DRAFT AND VALIDATE IT — IT IS UNENFORCEABLE OR RESTRICTED IN SOME JURISDICTIONS.] [DO NOT REMOVE ANY MANDATORY CONSUMER RIGHT TO BRING A CLAIM LOCALLY.]

## Contact

[LEGAL ENTITY NAME], [CONTACT ADDRESS] — [LEGAL CONTACT EMAIL]$doc$
WHERE slug = 'terms'
  AND (body_md = '' OR body_md LIKE '> **DRAFT — REPLACE BEFORE LAUNCH.**%');


UPDATE legal_policies SET
  title = 'Refund & Returns Policy',
  updated_at = NOW(),
  body_md = $doc$> **UNREVIEWED DRAFT — NOT LEGALLY BINDING. DO NOT PUBLISH.**
> Every value in [SQUARE BRACKETS] is a placeholder that must be replaced, and the finished text must be reviewed by a qualified lawyer in your jurisdiction before this document is published.
>
> **The return window and who pays return postage are set by consumer law in many jurisdictions, not by preference.** Confirm the statutory minimum for [JURISDICTION] before filling in any number below.

## Your statutory rights

[STATE THE MANDATORY CANCELLATION OR RETURN RIGHT THAT APPLIES IN [JURISDICTION], AND CONFIRM THIS POLICY MEETS OR EXCEEDS IT. Nothing in this policy may reduce a right you have by law.]

## Return window

We accept returns of unworn, unwashed items in their original condition, with tags and packaging intact, within **[REFUND WINDOW]** of [DELIVERY OR DISPATCH — CHOOSE ONE].

## How to start a return

Email [RETURNS CONTACT EMAIL] with your order number and the reason for the return. We reply within [RESPONSE WINDOW] with instructions. [STATE WHETHER A RETURN AUTHORISATION IS REQUIRED BEFORE SENDING ANYTHING BACK.]

Send approved returns to [RETURN ADDRESS].

## Who pays return shipping

[STATE CLEARLY: [WHO PAYS RETURN SHIPPING] for a change of mind, and who pays when the item is faulty, damaged, or wrong. In many jurisdictions you must cover return costs for faulty goods.] [STATE WHETHER YOU PROVIDE A PREPAID RETURN LABEL.]

## Refunds

Once we receive and inspect the return, we issue your refund to the original payment method within **[REFUND PROCESSING TIME]**. Your bank or card issuer may take additional time to post it.

- Original shipping charges: [REFUNDED OR NOT REFUNDED]
- Restocking fee: [RESTOCKING FEE, OR "None"]

## Exchanges

[STATE WHETHER YOU OFFER EXCHANGES, AND HOW SIZE OR VARIANT SWAPS WORK. IF YOU DO NOT OFFER THEM, SAY SO PLAINLY.]

## Damaged, faulty, or incorrect items

If your order arrives damaged or faulty, or is not what you ordered, contact [RETURNS CONTACT EMAIL] within **[DAMAGE REPORT WINDOW]** of delivery with your order number and photographs. We will [REPLACE / REFUND / REPAIR — STATE THE REMEDY AND WHO CHOOSES IT] at no cost to you.

## Items that cannot be returned

[LIST ANY EXCLUSIONS AND CONFIRM EACH ONE IS PERMITTED IN [JURISDICTION] — commonly custom or personalised items, opened media, digital downloads, gift cards, and clearance items. Blanket "final sale" exclusions are unenforceable in some places.]

## Order cancellations and changes

Orders can be changed or cancelled before dispatch by emailing [ORDERS CONTACT EMAIL]. [STATE WHAT HAPPENS IF THE ORDER HAS ALREADY SHIPPED.]

## Event tickets and bookings

[TICKET REFUNDS USUALLY FOLLOW DIFFERENT RULES FROM MERCHANDISE. STATE YOUR TERMS FOR A CANCELLED, RESCHEDULED, OR POSTPONED EVENT, OR DELETE THIS SECTION IF YOU DO NOT SELL TICKETS HERE.]

## Contact

[LEGAL ENTITY NAME], [RETURN ADDRESS] — [RETURNS CONTACT EMAIL]$doc$
WHERE slug = 'refund'
  AND (body_md = '' OR body_md LIKE '> **DRAFT — REPLACE BEFORE LAUNCH.**%');


UPDATE legal_policies SET
  title = 'Shipping Policy',
  updated_at = NOW(),
  body_md = $doc$> **UNREVIEWED DRAFT — NOT LEGALLY BINDING. DO NOT PUBLISH.**
> Every value in [SQUARE BRACKETS] is a placeholder that must be replaced, and the finished text must be reviewed by a qualified lawyer in your jurisdiction before this document is published.
>
> **Do not guess the delivery estimates or carriers below.** Take them from your actual fulfilment arrangement, because a published delivery promise you cannot meet is a consumer law problem.

## Where we ship

We ship from [SHIP-FROM COUNTRY] to [SHIPPING REGIONS / COUNTRIES SERVED]. [LIST ANY DESTINATIONS YOU CANNOT SHIP TO.]

## Processing time

Orders are packed and dispatched within **[PROCESSING TIME]** of payment clearing. [NOTE ANY EXCEPTIONS — e.g. pre-orders, made-to-order items, tour periods, or public holidays.]

## Carriers and delivery estimates

We ship with [SHIPPING CARRIERS]. Delivery estimates run from dispatch, not from the order date, and are estimates rather than guarantees.

- Domestic: **[DOMESTIC DELIVERY ESTIMATE]**
- International: **[INTERNATIONAL DELIVERY ESTIMATE]**

[ADD ANY EXPRESS OR TRACKED UPGRADE YOU OFFER, WITH ITS OWN ESTIMATE.]

## Shipping costs

[STATE HOW SHIPPING IS PRICED — flat rate, weight-based, or calculated at checkout — AND ANY FREE SHIPPING THRESHOLD.] Shipping costs are shown at checkout before payment.

## Tracking

[STATE WHETHER ALL ORDERS ARE TRACKED, AND WHEN THE VISITOR RECEIVES THEIR TRACKING NUMBER.]

## Customs, duties, and import taxes

[STATE WHO PAYS IMPORT DUTIES AND TAXES ON INTERNATIONAL ORDERS, AND THAT CUSTOMS CLEARANCE CAN ADD UNPREDICTABLE DELAY. CONFIRM AGAINST YOUR CHECKOUT CONFIGURATION — IF DUTIES ARE COLLECTED AT CHECKOUT, SAY SO.]

## Delays, lost parcels, and damage in transit

If your order has not arrived within **[LOST PACKAGE WINDOW]** of dispatch, contact [SHIPPING CONTACT EMAIL] and we will open an enquiry with the carrier. [STATE WHO BEARS THE RISK OF LOSS IN TRANSIT — THIS IS SET BY LAW FOR CONSUMER SALES IN MANY JURISDICTIONS.] Report visible damage within **[DAMAGE REPORT WINDOW]** of delivery. See our Refund & Returns Policy for remedies.

## Address accuracy and failed delivery

Please check your shipping address at checkout. [STATE WHAT HAPPENS IF AN ADDRESS IS WRONG OR INCOMPLETE, IF A PARCEL GOES UNCLAIMED, AND WHETHER RESHIPPING IS CHARGEABLE.]

## Split shipments and pre-orders

[STATE WHETHER MIXED ORDERS SHIP TOGETHER OR SEPARATELY, AND HOW PRE-ORDER DISPATCH DATES ARE COMMUNICATED. DELETE IF NOT APPLICABLE.]

## Contact

[LEGAL ENTITY NAME], [CONTACT ADDRESS] — [SHIPPING CONTACT EMAIL]$doc$
WHERE slug = 'shipping'
  AND (body_md = '' OR body_md LIKE '> **DRAFT — REPLACE BEFORE LAUNCH.**%');


-- Placeholder copy must never be live, even if a 036 row was published by hand.
UPDATE legal_policies
SET status = 'draft', effective_date = NULL
WHERE body_md LIKE '> **UNREVIEWED DRAFT — NOT LEGALLY BINDING. DO NOT PUBLISH.**%';
