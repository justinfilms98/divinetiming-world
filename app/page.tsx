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
import { JournalHighlightSection } from '@/components/home/JournalHighlightSection';
import { isJournalPublicEnabled } from '@/lib/features';
import { getPublicJournalEpisodes } from '@/lib/journal/server';
import { displayImageUrl } from '@/lib/media/webCopies';
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
import { getPlatformLinks } from '@/lib/platformLinks';
import { resolveHomeSections } from '@/lib/site/homeSections';
import { resolveHeroButtons } from '@/lib/hero/heroButtons';
import { musicGroupJsonLd } from '@/lib/seo/jsonld';
import { absoluteImageUrl, BASE_URL, DEFAULT_OG_IMAGE, SITE_NAME, SITE_TAGLINE } from '@/lib/site';
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
  const sections = resolveHomeSections(siteSettings?.home_sections);
  // Switched-off sections don't query their data at all.
  const showJournal = sections.journal && isJournalPublicEnabled();
  const [upcomingEvents, products, videos, latestRelease, journalEpisodes] = await Promise.all([
    sections.upcoming_events || sections.experience ? getEvents({ upcomingOnly: true }) : Promise.resolve([]),
    sections.shop ? getProducts() : Promise.resolve([]),
    sections.films ? getVideos() : Promise.resolve([]),
    sections.now_playing ? getLatestRelease() : Promise.resolve(null),
    showJournal ? getPublicJournalEpisodes() : Promise.resolve([]),
  ]);
  // Listen → /music and Join the tribe → /#tribe unless an admin set the buttons.
  const heroButtons = resolveHeroButtons(heroSection, sections);

  const featuredEvents = upcomingEvents.slice(0, 3);
  const featuredProducts = [...products]
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    .slice(0, 4);
  const featuredVideos = videos.slice(0, 2);
  const latestEpisodes = journalEpisodes.slice(0, 3).map((e) => ({ ...e, cover_image_url: displayImageUrl(e.cover_image_url) }));
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
        <>
          {/* The image logo is the visual title; DivineTimingIntro renders its own h1. */}
          <h1 className="sr-only">{artistName}</h1>
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
        </>
      ) : (
        <DivineTimingIntro
          artistName={artistName}
          animationType={animationType}
          animationEnabled={animationEnabled}
        />
      )}
      <HeroContent
        subtext={heroSection?.subtext ?? undefined}
        ctaText={heroButtons.primary?.text}
        ctaUrl={heroButtons.primary?.url}
        secondaryCtaText={heroButtons.secondary?.text}
        secondaryCtaUrl={heroButtons.secondary?.url}
      />
      <HeroPlatformRow overrides={siteSettings ?? undefined} delay={0.5} />
    </div>
  );

  const musicGroup = musicGroupJsonLd({
    name: siteSettings?.artist_name?.trim() || SITE_NAME,
    url: BASE_URL,
    description: SITE_TAGLINE,
    image: absoluteImageUrl(DEFAULT_OG_IMAGE),
    sameAs: getPlatformLinks(siteSettings ?? undefined).map((link) => link.href),
    members: [siteSettings?.member_1_name, siteSettings?.member_2_name]
      .filter((name): name is string => Boolean(name?.trim()))
      .map((name) => ({ name: name.trim() })),
  });

  return (
    <div className="relative flex flex-col w-full max-w-[100vw] overflow-x-clip bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(musicGroup) }}
      />
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
      <div className="flex flex-col w-full">
        {sections.now_playing && <NowPlayingSection release={latestRelease} />}
        {sections.experience && <ExperienceSection backgroundUrl={experienceBackdrop} />}
        {sections.upcoming_events && <UpcomingEventsSection events={featuredEvents} />}
        {sections.manifesto && <ManifestoSection />}
        {sections.films && <FilmsSection videos={featuredVideos} />}
        {showJournal && <JournalHighlightSection episodes={latestEpisodes} />}
        {sections.tribe && <TribeSection />}
        {sections.shop && <ShopHighlightSection products={featuredProducts} />}
        {sections.booking && <BookingCtaSection bookingEmail={siteSettings?.booking_email ?? null} />}
      </div>
    </div>
  );
}
