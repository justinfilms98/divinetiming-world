import { HeroCarousel } from '@/components/hero/HeroCarousel';
import { HeroCarouselV2 } from '@/components/hero/HeroCarouselV2';
import { HeroVideoCarouselPremium } from '@/components/hero/HeroVideoCarouselPremium';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { DivineTimingIntro } from '@/components/home/DivineTimingIntro';
import { HeroLogo } from '@/components/home/HeroLogo';
import { HeroContent } from '@/components/home/HeroContent';
import { MemberLine } from '@/components/home/MemberLine';
import { HeroPlatformRow } from '@/components/home/HeroPlatformRow';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { getHeroSection, getHeroCarouselSlides, getSiteSettings, getPageSettings } from '@/lib/content/server';
import { getPlatformLinks } from '@/lib/platformLinks';
import { DEFAULT_OG_IMAGE } from '@/lib/site';
import type { Metadata } from 'next';

// Dynamic: fetch from DB on every request for immediate admin reflection
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Divine Timing — Liam Bongo & Lex Laurence',
  description: 'Live, evolving, in motion. Electronic duo Divine Timing.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Divine Timing — Liam Bongo & Lex Laurence',
    description: 'Live, evolving, in motion. Electronic duo Divine Timing.',
    url: '/',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Divine Timing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Divine Timing — Liam Bongo & Lex Laurence',
    description: 'Live, evolving, in motion. Electronic duo Divine Timing.',
    images: [DEFAULT_OG_IMAGE],
  },
};

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
  const labelText = heroSection?.label_text?.trim() || undefined;

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

  const heroSlots = heroSection?.hero_slots ?? null;
  const validSlots = heroSlots && heroSlots.length > 0 ? heroSlots : null;
  const videoSlots = validSlots?.filter((s) => s.media_type === 'video' && s.resolved_video_url) ?? [];
  const premiumVideos = videoSlots.map((s) => ({
    url: s.resolved_video_url!,
    posterUrl: s.resolved_poster_url ?? undefined,
  }));
  const usePremiumCarousel = premiumVideos.length >= 1;
  const useV2Carousel = Boolean(validSlots) && !usePremiumCarousel;

  if (process.env.NODE_ENV === 'development') {
    const rawSlots = (heroSection as { hero_slots?: unknown })?.hero_slots;
    const rawArr = Array.isArray(rawSlots) ? rawSlots : [];
    rawArr.slice(0, 3).forEach((s: unknown, i: number) => {
      const o = s && typeof s === 'object' ? (s as Record<string, unknown>) : {};
      console.log(`[Phase 17.D] hero_slot_${i + 1}`, JSON.stringify({ slot_index: o.slot_index, enabled: o.enabled, media_type: o.media_type, video_storage_path: o.video_storage_path ?? null }));
    });
    console.log('[Phase 17.D] validSlots length:', validSlots?.length ?? 0);
    console.log('[Phase 17.D] premiumVideos length:', premiumVideos.length);
    console.log('[Phase 17.D] premiumVideos URLs:', premiumVideos.map((v) => (v.url || '').slice(-60)));
  }

  return (
    <div className="relative min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip bg-black">
      {usePremiumCarousel ? (
        <HeroVideoCarouselPremium
          videos={premiumVideos}
          devLogLabel="Phase 17.D"
          overlayOpacity={Number(overlayOpacity)}
          heightPreset="full"
          showScrollCue
        >
          {heroContent}
        </HeroVideoCarouselPremium>
      ) : useV2Carousel && validSlots ? (
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
