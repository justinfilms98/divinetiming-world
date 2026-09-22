-- Rollback 053_orders_fulfillment.sql

DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;

ALTER TABLE orders
  DROP COLUMN IF EXISTS fulfilled_at,
  DROP COLUMN IF EXISTS admin_notes,
  DROP COLUMN IF EXISTS tracking_number,
  DROP COLUMN IF EXISTS shipping_postal,
  DROP COLUMN IF EXISTS shipping_country,
  DROP COLUMN IF EXISTS shipping_city,
  DROP COLUMN IF EXISTS shipping_address,
  DROP COLUMN IF EXISTS shipping_name;
