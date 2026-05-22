-- ============================================
-- LEGAL POLICIES
-- Privacy / Terms / Refund / Shipping pages with editable markdown body.
-- These are PLACEHOLDERS — replace with real legal copy before launch.
-- ============================================

CREATE TABLE IF NOT EXISTS legal_policies (
  slug TEXT PRIMARY KEY CHECK (slug IN ('privacy', 'terms', 'refund', 'shipping')),
  title TEXT NOT NULL,
  body_md TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE legal_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read legal_policies" ON legal_policies FOR SELECT USING (true);
CREATE POLICY "Admin full legal_policies" ON legal_policies FOR ALL USING (true) WITH CHECK (true);

-- Seed placeholder copy — clearly marked as draft so the team replaces it before launch.
INSERT INTO legal_policies (slug, title, body_md) VALUES
  ('privacy',
   'Privacy Policy',
   E'> **DRAFT — REPLACE BEFORE LAUNCH.** This placeholder is not legal advice.\n\n## What we collect\n\nWhen you visit this site we collect basic anonymous analytics (page views, referrer). When you submit the inquiry form or place an order we collect the name, email, and details you provide so we can respond and fulfill the purchase.\n\n## How we use it\n\n- To respond to inquiries.\n- To process and ship purchases.\n- To send order confirmations and shipping updates.\n- To improve the site (aggregate, non-personal analytics).\n\nWe do not sell personal information.\n\n## Payments\n\nPayments are processed by Stripe. We never see or store your full card details.\n\n## Cookies\n\nWe use first-party cookies for session and cart. No third-party advertising cookies.\n\n## Your rights\n\nEmail us to request a copy of, correction to, or deletion of your data.\n\n## Contact\n\nQuestions? Reach us via the Contact page.'),
  ('terms',
   'Terms of Service',
   E'> **DRAFT — REPLACE BEFORE LAUNCH.** This placeholder is not legal advice.\n\n## Use of this site\n\nBy using this site you agree to these terms. If you do not agree, please do not use the site.\n\n## Orders\n\nAll orders are subject to acceptance and availability. Prices are shown in the currency on the product page and may change without notice. Taxes and shipping are calculated at checkout.\n\n## Intellectual property\n\nAll content — music, photography, video, copy, logos — is owned by the artist or licensed for use here. Do not reproduce, redistribute, or use commercially without written permission.\n\n## Limitation of liability\n\nThe site and merchandise are provided "as is." To the maximum extent permitted by law, the artist and operators are not liable for indirect or consequential damages arising from your use of the site.\n\n## Governing law\n\nThese terms are governed by the laws of the artist''s jurisdiction.\n\n## Contact\n\nQuestions? Reach us via the Contact page.'),
  ('refund',
   'Refund Policy',
   E'> **DRAFT — REPLACE BEFORE LAUNCH.** This placeholder is not legal advice.\n\n## Returns\n\nWe accept returns of unworn, unwashed merchandise in its original condition within **14 days** of delivery.\n\n## How to return\n\nEmail us via the Contact page with your order number and the reason for return. We''ll send return instructions.\n\n## Refunds\n\nOnce we receive and inspect the returned item, your refund is issued to the original payment method within 5–10 business days. Original shipping costs are non-refundable.\n\n## Damaged or wrong items\n\nIf an item arrives damaged or you received the wrong item, contact us within **7 days** of delivery and we''ll make it right at no cost to you.\n\n## Final sale\n\nDigital downloads, gift cards, and items marked "final sale" are not eligible for return.'),
  ('shipping',
   'Shipping Policy',
   E'> **DRAFT — REPLACE BEFORE LAUNCH.** This placeholder is not legal advice.\n\n## Processing time\n\nOrders are processed and shipped within **2–5 business days** of payment. You''ll receive a tracking email when your order ships.\n\n## Domestic shipping\n\nStandard domestic shipping arrives in **3–7 business days** after dispatch.\n\n## International shipping\n\nInternational orders typically arrive in **7–21 business days** after dispatch, depending on destination and customs. You are responsible for any import duties or taxes charged by your country.\n\n## Lost or delayed packages\n\nIf your package has not arrived within 30 days of dispatch, contact us via the Contact page and we''ll work with the carrier to locate it.\n\n## Address accuracy\n\nMake sure your shipping address is correct at checkout. We are not responsible for packages shipped to the address you provided if it is incorrect or incomplete.')
ON CONFLICT (slug) DO NOTHING;
