-- Phase E: Product storytelling — optional subtitle and badge for premium merch presentation.
-- subtitle: short line under product name (e.g. "Limited run").
-- badge: optional label (e.g. 'Limited', 'New'). Sold out is derived from variant inventory.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS badge TEXT;

COMMENT ON COLUMN public.products.subtitle IS 'Optional short line under product name.';
COMMENT ON COLUMN public.products.badge IS 'Optional label: Limited, New, etc. Sold out is derived from inventory.';
