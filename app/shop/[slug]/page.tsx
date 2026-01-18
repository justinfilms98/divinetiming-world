import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ProductDetailClient } from '@/components/shop/ProductDetailClient';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('*, product_images(*), product_variants(*)')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();

  if (!product) {
    notFound();
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Images */}
              <div>
                {product.product_images && product.product_images.length > 0 ? (
                  <div className="relative aspect-square bg-[var(--bg2)] rounded-lg overflow-hidden">
                    <Image
                      src={product.product_images[0].image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-[var(--bg2)] rounded-lg flex items-center justify-center text-[var(--text)]/30">
                    No Image
                  </div>
                )}
              </div>

              {/* Details */}
              <div>
                <h1 className="text-4xl font-bold text-[var(--text)] mb-4">{product.name}</h1>
                <div className="text-3xl text-[var(--accent)] mb-6">
                  {formatPrice(product.price_cents)}
                </div>

                {product.description && (
                  <div className="text-[var(--text)]/70 mb-8 whitespace-pre-line">
                    {product.description}
                  </div>
                )}

                <ProductDetailClient product={product} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
