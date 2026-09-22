-- Rollback for 051_shop_commerce.sql

DROP INDEX IF EXISTS public.idx_product_variants_size_color;
DROP INDEX IF EXISTS public.idx_product_variants_sku_unique;
DROP INDEX IF EXISTS public.idx_products_sale_window;
DROP INDEX IF EXISTS public.idx_products_category;
DROP INDEX IF EXISTS public.idx_products_sku_unique;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_shipping_weight_grams_check;
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_inventory_count_check;

ALTER TABLE public.product_variants
  DROP CONSTRAINT IF EXISTS product_variants_shipping_weight_grams_check;
ALTER TABLE public.product_variants
  DROP CONSTRAINT IF EXISTS product_variants_inventory_count_check;

ALTER TABLE public.products
  DROP COLUMN IF EXISTS sku,
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS shipping_weight_grams,
  DROP COLUMN IF EXISTS is_preorder,
  DROP COLUMN IF EXISTS preorder_ships_at,
  DROP COLUMN IF EXISTS sale_starts_at,
  DROP COLUMN IF EXISTS sale_ends_at,
  DROP COLUMN IF EXISTS track_inventory,
  DROP COLUMN IF EXISTS inventory_count,
  DROP COLUMN IF EXISTS stripe_price_id;

ALTER TABLE public.product_variants
  DROP COLUMN IF EXISTS sku,
  DROP COLUMN IF EXISTS size,
  DROP COLUMN IF EXISTS color,
  DROP COLUMN IF EXISTS shipping_weight_grams,
  DROP COLUMN IF EXISTS track_inventory;

DROP FUNCTION IF EXISTS public.decrement_product_inventory(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.decrement_inventory(variant_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.product_variants
  SET inventory_count = GREATEST(0, inventory_count - quantity)
  WHERE id = variant_id;
END;
$$ LANGUAGE plpgsql;

DROP POLICY IF EXISTS "Admin full access" ON public.product_variants;
CREATE POLICY "Admin full access"
  ON public.product_variants
  FOR ALL
  USING (true);
