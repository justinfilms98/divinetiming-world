import { getProducts, getHeroSection, getPageSettings } from '@/lib/content';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { ShopPageClient } from '@/components/shop/ShopPageClient';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const [products, heroSection, pageSettings] = await Promise.all([
    getProducts(),
    getHeroSection('shop'),
    getPageSettings('shop'),
  ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Shop';
  const tagline = heroSection?.subtext;
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.media_url ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        headline={headline}
        subtext={tagline ?? undefined}
        heightPreset="tall"
      />
      <SignatureDivider />
      <ShopPageClient products={products} />
    </div>
  );
}
