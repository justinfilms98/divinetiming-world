import { createClient } from '@/lib/supabase/server';
import { GlassPanel } from '@/components/ui/GlassPanel';
import Link from 'next/link';
import Image from 'next/image';

export default async function ShopPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('*, product_images(image_url, display_order)')
    .eq('is_active', true)
    .order('display_order');

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <GlassPanel className="max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center tracking-tight">
          SHOP
        </h1>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => {
              const mainImage = product.product_images?.[0]?.image_url;

              return (
                <Link
                  key={product.id}
                  href={`/shop/${product.slug}`}
                  className="block group"
                >
                  <div className="relative aspect-square bg-white/5 rounded-lg overflow-hidden mb-4 border border-white/10">
                    {mainImage ? (
                      <Image
                        src={mainImage}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="text-white font-semibold mb-1">{product.name}</div>
                  <div className="text-[var(--accent)] font-medium">{formatPrice(product.price_cents)}</div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-white/70 py-12">
            <p>No products available. Check back soon!</p>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
