import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { DivineTimingIntro } from '@/components/home/DivineTimingIntro';
import { HeroLogo } from '@/components/home/HeroLogo';
import { HeroContent } from '@/components/home/HeroContent';
import { HeroPlatformRow } from '@/components/home/HeroPlatformRow';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { getHeroSection, getSiteSettings, getPageSettings } from '@/lib/content/server';
import { getHeroSingleSource, getHeroAllSlots } from '@/lib/content/heroSingleSource';
import { DEFAULT_OG_IMAGE } from '@/lib/site';
import type { Metadata } from 'next';

// Dynamic: fetch from DB on every request for immediate admin reflection
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'DIVINE:TIMING',
  description: 'Live, evolving, in motion.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'DIVINE:TIMING',
    description: 'Live, evolving, in motion.',
    url: '/',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Divine Timing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DIVINE:TIMING',
    description: 'Live, evolving, in motion.',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function HomePage() {
  const [heroSection, siteSettings, pageSettings] = await Promise.all([
    getHeroSection('home'),
    getSiteSettings(),
    getPageSettings('home'),
  ]);
  // Primary CTA defaults to Shop; admins can still override via hero_sections.cta_text/cta_url.
  const primaryCtaText = heroSection?.cta_text?.trim() || 'Shop the collection';
  const primaryCtaUrl = heroSection?.cta_url?.trim() || '/shop';

  const overlayOpacity = heroSection?.overlay_opacity ?? 0.4;
  const artistName = heroSection?.headline ?? siteSettings?.artist_name ?? pageSettings?.seo_title ?? 'DIVINE:TIMING';
  const animationType = (heroSection?.animation_type as 'warp' | 'clock' | 'none') ?? 'warp';
  const animationEnabled = heroSection?.animation_enabled ?? true;
  const labelText = heroSection?.label_text?.trim() || undefined;

  const { mediaUrl, mediaType, posterUrl } = getHeroSingleSource(heroSection);
  const heroSlides = getHeroAllSlots(heroSection);

  const heroContent = (
    <div className="relative z-10 flex flex-col items-center justify-center text-center w-full min-w-0 pt-[max(env(safe-area-inset-top),1.5rem)] pb-8 px-4 md:px-6">
      {labelText && (
        <p className="type-hero-label text-white mb-3 hero-text-shadow">
          {labelText}
        </p>
      )}
      {heroSection?.logoFinalUrl ? (
        <HeroLogo
          url={heroSection.logoFinalUrl}
          alt="Divine Timing logo"
          fallback={
            <DivineTimingIntro
              artistName={artistName}
              animationType={animationType}
              animationEnabled={animationEnabled}
            />
          }
        />
      ) : (
        <DivineTimingIntro
          artistName={artistName}
          animationType={animationType}
          animationEnabled={animationEnabled}
        />
      )}
      <HeroContent
        subtext={heroSection?.subtext ?? undefined}
        ctaText={primaryCtaText}
        ctaUrl={primaryCtaUrl}
        secondaryCtaText="Watch & Listen"
        secondaryCtaUrl="/media"
      />
      <HeroPlatformRow overrides={siteSettings ?? undefined} delay={0.5} />
    </div>
  );

  return (
    <div className="relative min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip bg-black">
      <UnifiedHero
        mediaUrl={mediaUrl}
        mediaType={mediaType}
        posterUrl={posterUrl}
        slides={heroSlides}
        overlayOpacity={Number(overlayOpacity)}
        heightPreset="full"
        showScrollCue
      >
        {heroContent}
      </UnifiedHero>

      <main className="flex flex-col flex-1 w-full">
        <SignatureDivider className="my-14 md:my-20" />
      </main>
    </div>
  );
}
