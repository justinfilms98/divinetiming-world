import { getProducts, getHeroSection, getPageSettings } from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { ShopPageClient } from '@/components/shop/ShopPageClient';
import { Section } from '@/components/ui/Section';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Official Divine Timing merchandise and music.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'Shop | Divine Timing',
    description: 'Official Divine Timing merchandise and music.',
    url: '/shop',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop | Divine Timing',
    description: 'Official Divine Timing merchandise and music.',
  },
};

export default async function ShopPage() {
  const [products, heroSection, pageSettings] = await Promise.all([
    getProducts(),
    getHeroSection('shop'),
    getPageSettings('shop'),
  ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Shop';
  const tagline = heroSection?.subtext;
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        badge={heroSection?.label_text?.trim() || undefined}
        headline={headline}
        subtext={tagline ?? undefined}
        heightPreset="compact"
      />
      <div className="mt-20" />
      <SignatureDivider />
      <Section className="section-lift">
        <ShopPageClient products={products} />
      </Section>
    </div>
  );
}
