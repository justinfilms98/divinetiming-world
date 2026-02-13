import { HeroMedia } from '@/components/home/HeroMedia';
import { DivineTimingIntro } from '@/components/home/DivineTimingIntro';
import { HeroContent } from '@/components/home/HeroContent';
import { MemberNames } from '@/components/home/MemberNames';
import { getHeroSection, getSiteSettings, getPageSettings } from '@/lib/content';

// Dynamic: fetch from DB on every request for immediate admin reflection
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [heroSection, siteSettings, pageSettings] = await Promise.all([
    getHeroSection('home'),
    getSiteSettings(),
    getPageSettings('home'),
  ]);

  const mediaType = heroSection?.media_type ?? siteSettings?.hero_media_type ?? null;
  const mediaUrl = heroSection?.media_url ?? siteSettings?.hero_media_url ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.4;
  const artistName = heroSection?.headline ?? siteSettings?.artist_name ?? pageSettings?.seo_title ?? 'DIVINE:TIMING';
  const animationType = (heroSection?.animation_type as 'warp' | 'clock' | 'none') ?? 'warp';
  const animationEnabled = heroSection?.animation_enabled ?? true;

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <MemberNames
        member1Name={siteSettings?.member_1_name ?? undefined}
        member2Name={siteSettings?.member_2_name ?? undefined}
      />

      <HeroMedia
        mediaType={mediaType}
        mediaUrl={mediaUrl}
        overlayOpacity={Number(overlayOpacity)}
      />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <DivineTimingIntro
          artistName={artistName}
          animationType={animationType}
          animationEnabled={animationEnabled}
        />
        <HeroContent
          subtext={heroSection?.subtext}
          ctaText={heroSection?.cta_text}
          ctaUrl={heroSection?.cta_url}
        />
      </div>
    </div>
  );
}
