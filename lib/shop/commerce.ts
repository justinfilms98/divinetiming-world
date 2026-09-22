/**
 * Honest shop commerce state.
 * Never invents stock: sold-out and quantity caps apply only when
 * track_inventory is explicitly true. Sale/preorder come from stored dates/flags.
 */

export type InventorySource = {
  track_inventory?: boolean | null;
  inventory_count?: number | null;
};

export type CommerceVariant = InventorySource & {
  id: string;
  name: string;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  price_cents?: number | null;
  stripe_price_id?: string | null;
  shipping_weight_grams?: number | null;
};

export type CommerceProduct = InventorySource & {
  category?: string | null;
  sku?: string | null;
  shipping_weight_grams?: number | null;
  is_preorder?: boolean | null;
  preorder_ships_at?: string | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  stripe_price_id?: string | null;
  product_variants?: CommerceVariant[] | null;
};

export type ProductCommerceState = {
  category: string | null;
  sku: string | null;
  shippingWeightGrams: number | null;
  isPreorder: boolean;
  preorderShipsAt: string | null;
  saleActive: boolean;
  soldOut: boolean;
  /** Null when inventory is not tracked — do not display a number. */
  availableQuantity: number | null;
};

export const SHOP_CATEGORY_SUGGESTIONS = [
  'Apparel',
  'Vinyl',
  'Music',
  'Accessories',
  'Digital',
] as const;

export function availableQuantity(source: InventorySource | null | undefined): number | null {
  if (!source || source.track_inventory !== true) return null;
  const n = source.inventory_count;
  if (n == null || Number.isNaN(Number(n))) return 0;
  return Math.max(0, Number(n));
}

export function isOnSale(product: CommerceProduct, now = Date.now()): boolean {
  const start = product.sale_starts_at ? Date.parse(product.sale_starts_at) : NaN;
  const end = product.sale_ends_at ? Date.parse(product.sale_ends_at) : NaN;
  const hasStart = Number.isFinite(start);
  const hasEnd = Number.isFinite(end);
  if (!hasStart && !hasEnd) return false;
  if (hasStart && hasEnd && start > end) return false;
  if (hasStart && now < start) return false;
  if (hasEnd && now > end) return false;
  return true;
}

export function variantLabel(variant: Pick<CommerceVariant, 'name' | 'size' | 'color'>): string {
  const composed = [variant.size, variant.color].filter((part) => part && String(part).trim()).join(' / ');
  const name = variant.name?.trim();
  if (name) return name;
  return composed || 'Standard';
}

export function getProductCommerceState(
  product: CommerceProduct,
  now = Date.now()
): ProductCommerceState {
  const variants = product.product_variants ?? [];
  let soldOut = false;
  let avail: number | null = null;

  if (variants.length > 0) {
    const tracked = variants.filter((v) => v.track_inventory === true);
    if (tracked.length > 0) {
      const quantities = tracked.map((v) => availableQuantity(v) ?? 0);
      avail = quantities.reduce((sum, n) => sum + n, 0);
      soldOut = quantities.every((n) => n <= 0);
    }
  } else {
    avail = availableQuantity(product);
    soldOut = avail === 0;
  }

  const weight =
    product.shipping_weight_grams != null && Number(product.shipping_weight_grams) >= 0
      ? Number(product.shipping_weight_grams)
      : null;

  return {
    category: product.category?.trim() || null,
    sku: product.sku?.trim() || null,
    shippingWeightGrams: weight,
    isPreorder: product.is_preorder === true,
    preorderShipsAt: product.preorder_ships_at || null,
    saleActive: isOnSale(product, now),
    soldOut,
    availableQuantity: avail,
  };
}

export function getVariantAvailableQuantity(
  product: CommerceProduct,
  variantId: string | null | undefined
): number | null {
  const variants = product.product_variants ?? [];
  if (variantId) {
    const variant = variants.find((v) => v.id === variantId);
    return availableQuantity(variant);
  }
  if (variants.length > 0) return null;
  return availableQuantity(product);
}

export function canFulfillQuantity(
  product: CommerceProduct,
  variantId: string | null | undefined,
  quantity: number
): boolean {
  if (!Number.isFinite(quantity) || quantity <= 0) return false;
  const avail = getVariantAvailableQuantity(product, variantId);
  if (avail == null) return true;
  return quantity <= avail;
}

export function formatShipsDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(ms)
  );
}
