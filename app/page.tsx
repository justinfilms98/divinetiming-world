import { HeroCarousel } from '@/components/hero/HeroCarousel';
import { HeroCarouselV2 } from '@/components/hero/HeroCarouselV2';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { DivineTimingIntro } from '@/components/home/DivineTimingIntro';
import { HeroLogo } from '@/components/home/HeroLogo';
import { HeroContent } from '@/components/home/HeroContent';
import { MemberLine } from '@/components/home/MemberLine';
import { HeroPlatformRow } from '@/components/home/HeroPlatformRow';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { getHeroSection, getHeroCarouselSlides, getSiteSettings, getPageSettings } from '@/lib/content/server';
import { getPlatformLinks } from '@/lib/platformLinks';

// Dynamic: fetch from DB on every request for immediate admin reflection
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [heroSection, carouselSlides, siteSettings, pageSettings] = await Promise.all([
    getHeroSection('home'),
    getHeroCarouselSlides('home', { stripOverlay: true }),
    getSiteSettings(),
    getPageSettings('home'),
  ]);
  const platformLinks = getPlatformLinks(siteSettings ?? undefined);
  const defaultListenUrl = platformLinks[0]?.href ?? '#';
  const listenUrl = heroSection?.cta_url || defaultListenUrl;

  const overlayOpacity = heroSection?.overlay_opacity ?? 0.4;
  const artistName = heroSection?.headline ?? siteSettings?.artist_name ?? pageSettings?.seo_title ?? 'DIVINE:TIMING';
  const animationType = (heroSection?.animation_type as 'warp' | 'clock' | 'none') ?? 'warp';
  const animationEnabled = heroSection?.animation_enabled ?? true;
  const eyebrow = heroSection?.headline ? undefined : 'ELECTRONIC DUO';

  const heroContent = (
    <div className="relative z-10 flex flex-col items-center justify-center text-center w-full min-w-0 pt-[max(env(safe-area-inset-top),1.5rem)] pb-8 px-4 md:px-6">
      {eyebrow && (
        <p className="type-label text-white/60 mb-3 tracking-[var(--letter-spacing-caps)] hero-text-shadow">
          {eyebrow}
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
      <MemberLine
        member1Name={siteSettings?.member_1_name ?? undefined}
        member2Name={siteSettings?.member_2_name ?? undefined}
      />
      <HeroContent
        subtext={heroSection?.subtext}
        ctaText={heroSection?.cta_text ?? 'Listen Now'}
        ctaUrl={heroSection?.cta_url || listenUrl}
        secondaryCtaText="Booking"
        secondaryCtaUrl="/booking"
      />
      <HeroPlatformRow overrides={siteSettings ?? undefined} />
    </div>
  );

  // Only use V2 carousel when at least one slot is enabled AND has valid media (server resolves hero_slots to this)
  const heroSlots = heroSection?.hero_slots ?? null;
  const validSlots = heroSlots && heroSlots.length > 0 ? heroSlots : null;
  const useV2Carousel = Boolean(validSlots);

  return (
    <div className="relative min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      {useV2Carousel && validSlots ? (
        <HeroCarouselV2
          slots={validSlots}
          overlayOpacity={Number(overlayOpacity)}
          heightPreset="full"
          showScrollCue
        >
          {heroContent}
        </HeroCarouselV2>
      ) : carouselSlides.length > 0 ? (
        <HeroCarousel
          slides={carouselSlides}
          overlayOpacity={Number(overlayOpacity)}
          heightPreset="full"
        >
          {heroContent}
        </HeroCarousel>
      ) : (heroSection?.mediaFinalUrl ?? siteSettings?.hero_media_url) ? (
        <HeroCarousel
          slides={[{
            type: (heroSection?.media_type === 'video' ? 'video' : 'image') as 'video' | 'image',
            source: heroSection?.mediaFinalUrl ?? siteSettings?.hero_media_url ?? '',
          }]}
          overlayOpacity={Number(overlayOpacity)}
          heightPreset="full"
        >
          {heroContent}
        </HeroCarousel>
      ) : (
        <UnifiedHero
          mediaUrl={null}
          mediaType={null}
          overlayOpacity={Number(overlayOpacity)}
          heightPreset="full"
        >
          {heroContent}
        </UnifiedHero>
      )}

      <main className="flex flex-col flex-1 w-full">
        <SignatureDivider />
      </main>
    </div>
  );
}
