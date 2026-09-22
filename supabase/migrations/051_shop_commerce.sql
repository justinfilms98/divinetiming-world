-- ============================================================
-- SPRINT 3 §14: SHOP COMMERCE UPGRADES
--
-- Extends the existing Stripe shop (products + product_variants).
-- Adds SKU, category, shipping weight, preorder, sale window, and
-- opt-in inventory tracking. Size/color live on variants.
--
-- Additive and idempotent. Does NOT seed products or invent stock.
-- track_inventory defaults to false so existing rows are not treated
-- as sold out. inventory_count is only meaningful when tracking is on.
--
-- Stripe Price IDs stay on variants (existing) and can now live on
-- products for single-SKU items. Checkout continues to use those IDs.
--
-- Inventory decrement stays on the existing Stripe webhook path:
-- decrement_inventory(variant_id) only subtracts when track_inventory
-- is true. decrement_product_inventory covers products without variants.
--
-- RLS: keep public SELECT; fix product_variants admin writes with
-- WITH CHECK (true) so admin INSERT works. Mutations still go through
-- /api/admin/products after requireAdmin() + service role.
--
-- Rollback: run 051_shop_commerce.down.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Products
-- ------------------------------------------------------------

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS shipping_weight_grams INTEGER,
  ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preorder_ships_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sale_starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sale_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inventory_count INTEGER,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_shipping_weight_grams_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_shipping_weight_grams_check
      CHECK (shipping_weight_grams IS NULL OR shipping_weight_grams >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_inventory_count_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_inventory_count_check
      CHECK (inventory_count IS NULL OR inventory_count >= 0);
  END IF;
END $$;

COMMENT ON COLUMN public.products.sku IS 'Optional product-level SKU. Unique when set.';
COMMENT ON COLUMN public.products.category IS 'Free-text merch category (Apparel, Vinyl, …).';
COMMENT ON COLUMN public.products.shipping_weight_grams IS 'Shipping weight in grams. Null = not set; never invent a weight.';
COMMENT ON COLUMN public.products.is_preorder IS 'When true, public shop shows Preorder. Purchase still uses Stripe Price IDs.';
COMMENT ON COLUMN public.products.preorder_ships_at IS 'Optional ships-on date for preorders. Informational only.';
COMMENT ON COLUMN public.products.sale_starts_at IS 'Optional sale window start. Null = no start bound.';
COMMENT ON COLUMN public.products.sale_ends_at IS 'Optional sale window end. Null = no end bound.';
COMMENT ON COLUMN public.products.track_inventory IS 'Opt-in. False (default) means do not show sold-out or a stock number.';
COMMENT ON COLUMN public.products.inventory_count IS 'On-hand count when track_inventory is true and the product has no variants. Null = unset.';
COMMENT ON COLUMN public.products.stripe_price_id IS 'Existing Stripe Price ID for products sold without a variant.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique
  ON public.products (sku)
  WHERE sku IS NOT NULL AND sku <> '';

CREATE INDEX IF NOT EXISTS idx_products_category
  ON public.products (category);

CREATE INDEX IF NOT EXISTS idx_products_sale_window
  ON public.products (sale_starts_at, sale_ends_at);

-- ------------------------------------------------------------
-- 2. Variants — size / color / SKU / weight / tracking
-- ------------------------------------------------------------

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS shipping_weight_grams INTEGER,
  ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_shipping_weight_grams_check'
  ) THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT product_variants_shipping_weight_grams_check
      CHECK (shipping_weight_grams IS NULL OR shipping_weight_grams >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_inventory_count_check'
  ) THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT product_variants_inventory_count_check
      CHECK (inventory_count IS NULL OR inventory_count >= 0);
  END IF;
END $$;

COMMENT ON COLUMN public.product_variants.sku IS 'Optional variant SKU. Unique when set.';
COMMENT ON COLUMN public.product_variants.size IS 'Size option (S, M, L, …).';
COMMENT ON COLUMN public.product_variants.color IS 'Color option.';
COMMENT ON COLUMN public.product_variants.shipping_weight_grams IS 'Override product shipping weight for this variant.';
COMMENT ON COLUMN public.product_variants.track_inventory IS 'Opt-in. False (default) means inventory_count is not used for sold-out.';
COMMENT ON COLUMN public.product_variants.inventory_count IS 'On-hand count when track_inventory is true. Existing default 0 is ignored until tracking is enabled.';
COMMENT ON COLUMN public.product_variants.stripe_price_id IS 'Existing Stripe Price ID used by checkout for this variant.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_sku_unique
  ON public.product_variants (sku)
  WHERE sku IS NOT NULL AND sku <> '';

CREATE INDEX IF NOT EXISTS idx_product_variants_size_color
  ON public.product_variants (product_id, size, color);

-- ------------------------------------------------------------
-- 3. Inventory decrement — only when tracking is on
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.decrement_inventory(variant_id UUID, quantity INTEGER)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF quantity IS NULL OR quantity <= 0 THEN
    RETURN;
  END IF;
  UPDATE public.product_variants
  SET
    inventory_count = GREATEST(0, COALESCE(inventory_count, 0) - quantity),
    updated_at = NOW()
  WHERE id = variant_id
    AND track_inventory = true;
END;
$$;

COMMENT ON FUNCTION public.decrement_inventory(UUID, INTEGER) IS
  'Webhook-only decrement. No-op unless the variant has track_inventory = true.';

CREATE OR REPLACE FUNCTION public.decrement_product_inventory(p_product_id UUID, quantity INTEGER)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF quantity IS NULL OR quantity <= 0 THEN
    RETURN;
  END IF;
  UPDATE public.products
  SET
    inventory_count = GREATEST(0, COALESCE(inventory_count, 0) - quantity),
    updated_at = NOW()
  WHERE id = p_product_id
    AND track_inventory = true;
END;
$$;

COMMENT ON FUNCTION public.decrement_product_inventory(UUID, INTEGER) IS
  'Webhook-only decrement for products without a variant. No-op unless track_inventory = true.';

GRANT EXECUTE ON FUNCTION public.decrement_inventory(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_product_inventory(UUID, INTEGER) TO anon, authenticated;

-- ------------------------------------------------------------
-- 4. RLS — keep public reads; make variant writes insert-safe
-- ------------------------------------------------------------

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access" ON public.product_variants;
CREATE POLICY "Admin full access"
  ON public.product_variants
  FOR ALL
  USING (true)
  WITH CHECK (true);
