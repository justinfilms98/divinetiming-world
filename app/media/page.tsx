import { MediaPageClient } from '@/components/media/MediaPageClient';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { Section } from '@/components/ui/Section';
import {
  getGalleriesForHub,
  getVideos,
  getHeroSection,
  getPageSettings,
} from '@/lib/content/server';
import { getPublicLibraryVideoAssets } from '@/lib/media/publicLibraryVideos';
import { stripArtistBylineFromHeroSubtext } from '@/lib/content/heroSubtext';
import { ContentRail } from '@/components/layout/ContentRail';
import { DEFAULT_OG_IMAGE } from '@/lib/site';
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
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Divine Timing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Media | Divine Timing',
    description: 'Videos, photo galleries, and press from Divine Timing.',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function MediaPage() {
  const [galleries, youtubeVideos, libraryVideos, heroSection, pageSettings] = await Promise.all([
    getGalleriesForHub(),
    getVideos(),
    getPublicLibraryVideoAssets(),
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
    <div className="flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        badge={heroSection?.label_text?.trim() || undefined}
        headline={headline}
        subtext={subtext}
        heightPreset="compact"
      />

      <Section padded={false} className="section-lift page-body">
        <ContentRail>
          <div className="w-full">
            <MediaPageClient
              galleries={galleries}
              videos={videos}
              headline={headline}
              subtext={subtext}
              showHeadline={false}
            />
          </div>
        </ContentRail>
      </Section>
    </div>
  );
}
