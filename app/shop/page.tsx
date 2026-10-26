import { getProducts, getHeroSection, getPageSettings } from '@/lib/content/server';
import { stripArtistBylineFromHeroSubtext } from '@/lib/content/heroSubtext';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { Suspense } from 'react';
import { ShopPageClient } from '@/components/shop/ShopPageClient';
import { ShopCheckoutBanner } from '@/components/shop/ShopCheckoutBanner';
import { Section } from '@/components/ui/Section';
import { ContentRail } from '@/components/layout/ContentRail';
import { publicPageMetadata } from '@/lib/seo/pageMetadata';

export const dynamic = 'force-dynamic';

export const metadata = publicPageMetadata({
  title: 'Shop',
  description: 'Official Divine Timing merchandise and music.',
  path: '/shop',
});

export default async function ShopPage() {
  const [products, heroSection, pageSettings] = await Promise.all([
    getProducts(),
    getHeroSection('shop'),
    getPageSettings('shop'),
  ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Shop';
  const tagline = stripArtistBylineFromHeroSubtext(heroSection?.subtext);
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  return (
    <div className="flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        badge={heroSection?.label_text?.trim() || undefined}
        headline={headline}
        subtext={tagline}
        heightPreset="compact"
      />
      <Section padded={false} className="section-lift page-body">
        <ContentRail>
          <Suspense fallback={null}>
            <ShopCheckoutBanner />
          </Suspense>
          <ShopPageClient products={products} />
        </ContentRail>
      </Section>
    </div>
  );
}
