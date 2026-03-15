import { MediaPageClient } from '@/components/media/MediaPageClient';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import {
  getGalleriesForHub,
  getVideos,
  getLibraryVideoAssets,
  getHeroSection,
  getPageSettings,
} from '@/lib/content/server';
import { stripArtistBylineFromHeroSubtext } from '@/lib/content/heroSubtext';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Media',
  description: 'Videos, photo galleries, and press from Divine Timing.',
  alternates: { canonical: '/media' },
  openGraph: {
    title: 'Media | Divine Timing',
    description: 'Videos, photo galleries, and press from Divine Timing.',
    url: '/media',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Media | Divine Timing',
    description: 'Videos, photo galleries, and press from Divine Timing.',
  },
};

export default async function MediaPage() {
  const [galleries, youtubeVideos, libraryVideos, heroSection, pageSettings] = await Promise.all([
    getGalleriesForHub(),
    getVideos(),
    getLibraryVideoAssets(),
    getHeroSection('media'),
    getPageSettings('media'),
  ]);
  const videos = [...youtubeVideos, ...libraryVideos];

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Media';
  const subtext = stripArtistBylineFromHeroSubtext(heroSection?.subtext);
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        badge={heroSection?.label_text?.trim() || undefined}
        headline={headline}
        subtext={subtext}
        heightPreset="compact"
      />

      <div className="mt-20" />

      <SignatureDivider className="my-14 md:my-16" />

      <Section className="section-lift py-14 md:py-20">
        <Container className="max-w-[1100px] mx-auto px-4 md:px-6">
          <div className="w-full">
            <p className="text-center text-[var(--text-muted)] type-body mb-12 md:mb-14 max-w-[45ch] mx-auto leading-relaxed">
              Browse photo collections and videos.
            </p>
            <MediaPageClient
              galleries={galleries}
              videos={videos}
              headline={headline}
              subtext={subtext}
              showHeadline={false}
            />
          </div>
        </Container>
      </Section>
    </div>
  );
}
