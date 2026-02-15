import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { DivineTimingIntro } from '@/components/home/DivineTimingIntro';
import { HeroContent } from '@/components/home/HeroContent';
import { MemberNames } from '@/components/home/MemberNames';
import { StatsRow } from '@/components/authority/StatsRow';
import { PressLogosRow } from '@/components/authority/PressLogosRow';
import { ListenNow } from '@/components/authority/ListenNow';
import { CollabsGrid } from '@/components/authority/CollabsGrid';
import { AuthorityCTAs } from '@/components/authority/AuthorityCTAs';
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

  const mediaType = heroSection?.media_type ?? siteSettings?.hero_media_type ?? null;
  const mediaUrl = heroSection?.media_url ?? siteSettings?.hero_media_url ?? null;
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
      </UnifiedHero>

      <main className="flex flex-col flex-1 w-full">
        <SignatureDivider />
        <section className="py-8 md:py-12" aria-label="Stats">
          <StatsRow stats={authority.stats ?? []} />
        </section>
        <SignatureDivider />
        <section id="listen" className="py-8 md:py-12" aria-label="Listen">
          <ListenNow
            streamingLinks={authority.streamingLinks}
            featuredEmbed={authority.featuredEmbed}
          />
        </section>
        <SignatureDivider />
        <section className="py-8 md:py-12" aria-label="Press">
          <PressLogosRow logos={authority.pressLogos ?? []} />
        </section>
        <section className="py-8 md:py-12" aria-label="Collaborations">
          <CollabsGrid collabs={authority.collabs ?? []} />
        </section>
        <SignatureDivider />
        <section className="py-8 md:py-16" aria-label="Actions">
          <AuthorityCTAs className="pb-8" showEPK={false} />
        </section>
      </main>
    </div>
  );
}
