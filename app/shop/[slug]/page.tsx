import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProductDetailClient } from '@/components/shop/ProductDetailClient';
import { ProductImageGallery } from '@/components/shop/ProductImageGallery';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
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
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <main className="flex-1 pt-20 md:pt-24 min-w-0">
        <Section className="px-0">
          <Container>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent2)] transition-colors duration-200 mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] rounded nav-link-underline relative"
            >
              ← Back to Shop
            </Link>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-14 items-start">
              <div className="w-full max-w-md mx-auto md:mx-0">
                <ProductImageGallery images={images} productName={product.name} />
              </div>

              <div className="min-w-0 flex flex-col">
                <div className="flex flex-wrap gap-2 mb-2">
                  {(product as { is_featured?: boolean }).is_featured && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--accent)]/20 text-[var(--accent)]">Featured</span>
                  )}
                  {(product as { badge?: string | null }).badge && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium border border-[var(--accent)]/40 text-[var(--accent)]">{(product as { badge: string }).badge}</span>
                  )}
                  {(() => {
                    const variants = (product as { product_variants?: { inventory_count?: number }[] }).product_variants ?? [];
                    const soldOut = variants.length > 0 && variants.every((v) => (v.inventory_count ?? 0) <= 0);
                    return soldOut ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--text-muted)]/20 text-[var(--text-muted)]">Sold out</span>
                    ) : null;
                  })()}
                </div>
                <h1 className="type-h1 text-[var(--text)] mb-2 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  {product.name}
                </h1>
                {(product as { subtitle?: string | null }).subtitle && (
                  <p className="type-subtitle text-[var(--text-muted)] mb-3">{(product as { subtitle: string }).subtitle}</p>
                )}
                <p className="text-[var(--accent)] type-h3 font-semibold mb-6">{formatPrice(product.price_cents)}</p>

                {product.description && (
                  <div className="text-[var(--text-muted)] type-body mb-8 flex-1 prose-readability space-y-4 leading-relaxed">
                    {product.description.trim().split(/\n\n+/).filter(Boolean).map((para: string, i: number) => (
                      <p key={i}>{para.replace(/\n/g, ' ').trim()}</p>
                    ))}
                  </div>
                )}

                <ProductDetailClient product={product} />
              </div>
            </div>
          </Container>
        </Section>
      </main>
    </div>
  );
}
