import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import { ProductDetailClient } from '@/components/shop/ProductDetailClient';
import { absoluteImageUrl } from '@/lib/site';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, description, product_images(image_url)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (!product) return { title: 'Product' };
  const path = `/shop/${slug}`;
  const description = product.description || `Shop ${product.name} — Divine Timing`;
  const firstImage = (product.product_images as { image_url: string }[] | null)?.[0]?.image_url;
  const ogImageUrl = absoluteImageUrl(firstImage ?? null);
  return {
    title: `${product.name} | Divine Timing Shop`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${product.name} | Divine Timing Shop`,
      description,
      url: path,
      type: 'website',
      ...(ogImageUrl && {
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: product.name }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Divine Timing Shop`,
      description,
      ...(ogImageUrl && { images: [ogImageUrl] }),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('*, product_images(*), product_variants(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!product) {
    notFound();
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <main className="flex-1 pt-20 md:pt-24 min-w-0">
        <section className="py-12 md:py-16 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent2)] transition-colors mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] rounded"
            >
              ← Back to Shop
            </Link>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {/* Images: constrained so no giant hero-like overflow */}
              <div className="w-full max-w-md mx-auto md:mx-0">
                {product.product_images && product.product_images.length > 0 ? (
                  <div className="relative aspect-square w-full max-h-[480px] md:max-h-none rounded-[var(--radius-card)] overflow-hidden border border-[var(--accent)]/20 bg-[var(--bg-secondary)] shadow-[var(--shadow-card)]">
                    <Image
                      src={product.product_images[0].image_url}
                      alt={product.name}
                      fill
                      priority
                      placeholder="blur"
                      blurDataURL={BLUR_PLACEHOLDER}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square w-full max-h-[480px] md:max-h-none rounded-[var(--radius-card)] border border-[var(--accent)]/10 bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] type-body">
                    No image
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex flex-col">
                <h1 className="type-h1 text-[var(--text)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>{product.name}</h1>
                <div className="text-2xl md:text-3xl text-[var(--accent)] mb-6">{formatPrice(product.price_cents)}</div>

                {product.description && (
                  <div className="text-[var(--text-muted)] type-body mb-8 flex-1 prose-readability space-y-4">
                    {product.description.trim().split(/\n\n+/).filter(Boolean).map((para: string, i: number) => (
                      <p key={i} className="leading-relaxed">{para.replace(/\n/g, ' ').trim()}</p>
                    ))}
                  </div>
                )}

                <ProductDetailClient product={product} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
