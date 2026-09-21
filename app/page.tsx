import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { DivineTimingIntro } from '@/components/home/DivineTimingIntro';
import { HeroLogo } from '@/components/home/HeroLogo';
import { HeroContent } from '@/components/home/HeroContent';
import { HeroPlatformRow } from '@/components/home/HeroPlatformRow';
import { NowPlayingSection } from '@/components/home/NowPlayingSection';
import { ExperienceSection } from '@/components/home/ExperienceSection';
import { UpcomingEventsSection } from '@/components/home/UpcomingEventsSection';
import { ManifestoSection } from '@/components/home/ManifestoSection';
import { FilmsSection } from '@/components/home/FilmsSection';
import { ShopHighlightSection } from '@/components/home/ShopHighlightSection';
import { TribeSection } from '@/components/home/TribeSection';
import { BookingCtaSection } from '@/components/home/BookingCtaSection';
import {
  getHeroSection,
  getSiteSettings,
  getPageSettings,
  getEvents,
  getProducts,
  getVideos,
  getLatestRelease,
} from '@/lib/content/server';
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
  const [heroSection, siteSettings, pageSettings, upcomingEvents, products, videos, latestRelease] = await Promise.all([
    getHeroSection('home'),
    getSiteSettings(),
    getPageSettings('home'),
    getEvents({ upcomingOnly: true }),
    getProducts(),
    getVideos(),
    getLatestRelease(),
  ]);
  // Music is the first thing a fan should reach. Admins can still override both
  // label and destination via hero_sections.cta_text/cta_url.
  const primaryCtaText = heroSection?.cta_text?.trim() || 'Listen now';
  const primaryCtaUrl = heroSection?.cta_url?.trim() || '/music';

  const featuredEvents = upcomingEvents.slice(0, 3);
  const featuredProducts = [...products]
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    .slice(0, 4);
  const featuredVideos = videos.slice(0, 2);
  const experienceBackdrop =
    featuredEvents.find((e) => e.resolved_thumbnail_url)?.resolved_thumbnail_url ?? null;

  const overlayOpacity = heroSection?.overlay_opacity ?? 0.4;
  const artistName = heroSection?.headline ?? siteSettings?.artist_name ?? pageSettings?.seo_title ?? 'DIVINE:TIMING';
  const animationType = (heroSection?.animation_type as 'warp' | 'clock' | 'none') ?? 'warp';
  const animationEnabled = heroSection?.animation_enabled ?? true;
  const labelText = heroSection?.label_text?.trim() || undefined;

  const { mediaUrl, mediaType, posterUrl } = getHeroSingleSource(heroSection);
  const heroSlides = getHeroAllSlots(heroSection);

  const heroContent = (
    <div className="relative z-10 flex flex-col items-center justify-center text-center w-full min-w-0 pb-8 px-4 md:px-6">
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
        secondaryCtaText="Book the act"
        secondaryCtaUrl="/contact"
      />
      <HeroPlatformRow overrides={siteSettings ?? undefined} delay={0.5} />
    </div>
  );

  const heroVideoUrl = mediaType === 'video' && mediaUrl ? mediaUrl : null;

  return (
    <div className="relative flex flex-col w-full max-w-[100vw] overflow-x-clip bg-black">
      {heroVideoUrl && (
        <link rel="preload" href={heroVideoUrl} as="fetch" crossOrigin="anonymous" />
      )}
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

      {/*
        Band rhythm alternates cinematic near-black against warm sand so the
        dark sections read as contrast rather than a second theme.
      */}
      <main className="flex flex-col w-full">
        <NowPlayingSection release={latestRelease} />
        <ExperienceSection backgroundUrl={experienceBackdrop} />
        <UpcomingEventsSection events={featuredEvents} />
        <ManifestoSection />
        <FilmsSection videos={featuredVideos} />
        <TribeSection />
        <ShopHighlightSection products={featuredProducts} />
        <BookingCtaSection bookingEmail={siteSettings?.booking_email ?? null} />
      </main>
    </div>
  );
}
