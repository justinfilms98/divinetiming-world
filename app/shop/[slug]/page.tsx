import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProductDetailClient } from '@/components/shop/ProductDetailClient';
import { ProductImageGallery } from '@/components/shop/ProductImageGallery';
import { Section } from '@/components/ui/Section';
import { ContentRail } from '@/components/layout/ContentRail';
import { absoluteImageUrl } from '@/lib/site';
import { getProductBySlug } from '@/lib/content/server';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product' };
  const path = `/shop/${slug}`;
  const description = product.description || `Shop ${product.name} — Divine Timing`;
  const firstImage = (product.product_images as { image_url: string }[] | undefined)?.[0]?.image_url;
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
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const images = (product.product_images as { image_url: string; display_order?: number }[]) ?? [];

  return (
    <div className="flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <main className="flex-1 pt-8 md:pt-12 pb-20 min-w-0">
        <Section className="px-0">
          <ContentRail>
            <div className="w-full max-w-full">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent2)] transition-colors duration-200 mb-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] rounded nav-link-underline relative"
            >
              ← Back to Shop
            </Link>
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-10 md:gap-16 items-start max-w-6xl mx-auto w-full">
              <div className="w-full">
                <ProductImageGallery images={images} productName={product.name} />
              </div>

              <div className="min-w-0 flex flex-col md:sticky md:top-28">
                <div className="flex flex-wrap gap-2 mb-5">
                  {(product as { is_featured?: boolean }).is_featured && (
                    <span className="px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-[0.2em] font-medium bg-[var(--accent)]/15 text-[var(--accent)]">Featured</span>
                  )}
                  {(product as { badge?: string | null }).badge && (
                    <span className="px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-[0.2em] font-medium border border-[var(--accent)]/40 text-[var(--accent)]">{(product as { badge: string }).badge}</span>
                  )}
                  {(() => {
                    const variants = (product as { product_variants?: { inventory_count?: number }[] }).product_variants ?? [];
                    const soldOut = variants.length > 0 && variants.every((v) => (v.inventory_count ?? 0) <= 0);
                    return soldOut ? (
                      <span className="px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-[0.2em] font-medium bg-[var(--text-muted)]/15 text-[var(--text-muted)]">Sold out</span>
                    ) : null;
                  })()}
                </div>
                <h1 className="type-h1 text-[var(--text)] mb-3 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  {product.name}
                </h1>
                {(product as { subtitle?: string | null }).subtitle && (
                  <p className="type-subtitle text-[var(--text-muted)] mb-5 tracking-wide">{(product as { subtitle: string }).subtitle}</p>
                )}
                <p className="text-[var(--text)] text-2xl font-medium tabular-nums mb-8">{formatPrice(product.price_cents)}</p>

                <div className="pt-6 border-t border-[var(--accent)]/10">
                  <ProductDetailClient product={product} />
                </div>

                {product.description && (
                  <div className="mt-10 pt-8 border-t border-[var(--accent)]/10">
                    <h2 className="type-label text-[var(--accent)] tracking-[0.25em] mb-4">DETAILS</h2>
                    <div className="text-[var(--text-muted)] type-body space-y-4 leading-relaxed">
                      {product.description.trim().split(/\n\n+/).filter(Boolean).map((para: string, i: number) => (
                        <p key={i}>{para.replace(/\n/g, ' ').trim()}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>
          </ContentRail>
        </Section>
      </main>
    </div>
  );
}
