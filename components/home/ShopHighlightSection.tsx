import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types/content';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from './SectionHeading';
import { SectionCta } from './SectionCta';

interface ShopHighlightSectionProps {
  products: Product[];
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ShopHighlightSection({ products }: ShopHighlightSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="band-sand">
      <Container className="section-padding">
        <Reveal>
          <SectionHeading label="Shop" title="Objects from the world" />
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mt-10">
          {products.map((product, index) => {
            const image = product.product_images?.[0]?.image_url;

            return (
              <Reveal key={product.id} delay={index * 0.05}>
                <Link href={`/shop/${product.slug}`} className="group block focus-ring rounded-[var(--radius-card)]">
                  <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    {image && (
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    )}
                    {product.badge && (
                      <span className="absolute top-3 left-3 rounded-full bg-[var(--bg)]/90 px-3 py-1 type-caption tracking-[0.16em] uppercase text-[var(--text)] border border-[var(--accent)]/30">
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="type-h3 text-[var(--text)] mt-4 group-hover:text-[var(--accent)] transition-colors duration-200 line-clamp-1">
                    {product.name}
                  </h3>
                  {product.subtitle && (
                    <p className="type-small mt-1 line-clamp-1">{product.subtitle}</p>
                  )}
                  <p className="type-body text-[var(--accent)] mt-1">
                    {formatPrice(product.price_cents)}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-10">
          <SectionCta href="/shop" variant="secondary">
            Shop all
          </SectionCta>
        </Reveal>
      </Container>
    </section>
  );
}
