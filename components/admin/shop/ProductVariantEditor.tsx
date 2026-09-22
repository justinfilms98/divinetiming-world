'use client';

import { Plus, Trash2 } from 'lucide-react';

export type VariantDraft = {
  key: string;
  id?: string;
  name: string;
  size: string;
  color: string;
  sku: string;
  price: string;
  inventory: string;
  track_inventory: boolean;
  shipping_weight_grams: string;
  stripe_price_id: string;
};

export function emptyVariantDraft(): VariantDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    size: '',
    color: '',
    sku: '',
    price: '',
    inventory: '',
    track_inventory: false,
    shipping_weight_grams: '',
    stripe_price_id: '',
  };
}

interface ProductVariantEditorProps {
  variants: VariantDraft[];
  onChange: (next: VariantDraft[]) => void;
}

export function ProductVariantEditor({ variants, onChange }: ProductVariantEditorProps) {
  const update = (key: string, patch: Partial<VariantDraft>) => {
    onChange(variants.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-white/70 text-sm font-medium">Variants (sizes / colors)</label>
        <button
          type="button"
          onClick={() => onChange([...variants, emptyVariantDraft()])}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-white/80 border border-white/20 rounded-lg hover:border-[#C6A75E] hover:text-[#C6A75E]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add variant
        </button>
      </div>
      <p className="text-white/50 text-xs mb-3">
        Optional. Each variant can have its own Stripe Price ID, SKU, and stock. Leave inventory tracking off unless you have a real count.
      </p>
      {variants.length === 0 ? (
        <p className="text-white/40 text-sm border border-dashed border-white/15 rounded-lg px-3 py-4">
          No variants — this product sells as a single item.
        </p>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.key} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/50">Variant {index + 1}</span>
                <button
                  type="button"
                  onClick={() => onChange(variants.filter((v) => v.key !== variant.key))}
                  className="p-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                  title="Remove variant"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-xs mb-1">Display name</label>
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => update(variant.key, { name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    placeholder="Auto from size / color if empty"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs mb-1">SKU</label>
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) => update(variant.key, { sku: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs mb-1">Size</label>
                  <input
                    type="text"
                    value={variant.size}
                    onChange={(e) => update(variant.key, { size: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    placeholder="S, M, L…"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs mb-1">Color</label>
                  <input
                    type="text"
                    value={variant.color}
                    onChange={(e) => update(variant.key, { color: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    placeholder="Black, Sand…"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs mb-1">Price override ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.price}
                    onChange={(e) => update(variant.key, { price: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    placeholder="Uses product price if empty"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs mb-1">Weight (grams)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={variant.shipping_weight_grams}
                    onChange={(e) => update(variant.key, { shipping_weight_grams: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-white/60 text-xs mb-1">Stripe Price ID</label>
                  <input
                    type="text"
                    value={variant.stripe_price_id}
                    onChange={(e) => update(variant.key, { stripe_price_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    placeholder="price_…"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={variant.track_inventory}
                  onChange={(e) => update(variant.key, { track_inventory: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-white/70 text-sm">Track inventory for this variant</span>
              </label>
              {variant.track_inventory && (
                <div>
                  <label className="block text-white/60 text-xs mb-1">Quantity on hand</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={variant.inventory}
                    onChange={(e) => update(variant.key, { inventory: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    placeholder="Enter the real count — do not guess"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
