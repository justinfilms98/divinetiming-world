import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { DivineTimingIntro } from '@/components/home/DivineTimingIntro';
import { HeroLogo } from '@/components/home/HeroLogo';
import { HeroContent } from '@/components/home/HeroContent';
import { MemberNames } from '@/components/home/MemberNames';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { getHeroSection, getSiteSettings, getPageSettings } from '@/lib/content';
import { getAuthorityConfig } from '@/lib/authority-config';

// Dynamic: fetch from DB on every request for immediate admin reflection
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [heroSection, siteSettings, pageSettings] = await Promise.all([
    getHeroSection('home'),
    getSiteSettings(),
    getPageSettings('home'),
  ]);
  const authority = getAuthorityConfig(null);
  const listenUrl =
    authority.streamingLinks?.spotify ??
    authority.streamingLinks?.apple_music ??
    heroSection?.cta_url ??
    '#';

  const mediaType = heroSection?.media_type ?? siteSettings?.hero_media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? siteSettings?.hero_media_url ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.4;
  const artistName = heroSection?.headline ?? siteSettings?.artist_name ?? pageSettings?.seo_title ?? 'DIVINE:TIMING';
  const animationType = (heroSection?.animation_type as 'warp' | 'clock' | 'none') ?? 'warp';
  const animationEnabled = heroSection?.animation_enabled ?? true;

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <MemberNames
        member1Name={siteSettings?.member_1_name ?? undefined}
        member2Name={siteSettings?.member_2_name ?? undefined}
      />

      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        heightPreset="full"
      >
        <div className="relative z-10 flex flex-col items-center justify-center">
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
            subtext={heroSection?.subtext}
            ctaText={heroSection?.cta_text ?? 'Listen Now'}
            ctaUrl={heroSection?.cta_url || listenUrl}
            secondaryCtaText="Booking"
            secondaryCtaUrl="/booking"
          />
        </div>
      </UnifiedHero>

      <main className="flex flex-col flex-1 w-full">
        <SignatureDivider />
      </main>
    </div>
  );
}
