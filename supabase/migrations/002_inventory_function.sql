-- Function to decrement inventory
CREATE OR REPLACE FUNCTION decrement_inventory(variant_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE product_variants
  SET inventory_count = GREATEST(0, inventory_count - quantity)
  WHERE id = variant_id;
END;
$$ LANGUAGE plpgsql;
