import { getProducts, getHeroSection, getPageSettings } from '@/lib/content';
import { ShopHero } from '@/components/shop/ShopHero';
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
      <ShopHero
        mediaType={mediaType}
        mediaUrl={mediaUrl}
        overlayOpacity={Number(overlayOpacity)}
        headline={headline}
        tagline={tagline}
      />
      <ShopPageClient products={products} />
    </div>
  );
}
