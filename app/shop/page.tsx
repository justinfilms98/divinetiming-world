import { getProducts, getHeroSection, getPageSettings } from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { ShopPageClient } from '@/components/shop/ShopPageClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Official Divine Timing merchandise and music.',
  openGraph: { title: 'Shop | Divine Timing', description: 'Official Divine Timing merchandise and music.' },
  twitter: { card: 'summary_large_image', title: 'Shop | Divine Timing' },
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
        headline={headline}
        subtext={tagline ?? undefined}
        heightPreset="compact"
      />
      <SignatureDivider />
      <ShopPageClient products={products} />
    </div>
  );
}
