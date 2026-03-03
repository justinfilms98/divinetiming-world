import { MediaPageClient } from '@/components/media/MediaPageClient';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import {
  getGalleriesForHub,
  getVideos,
  getHeroSection,
  getPageSettings,
} from '@/lib/content/server';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Media',
  description: 'Videos, photo galleries, and press from Divine Timing.',
  openGraph: { title: 'Media | Divine Timing', description: 'Videos, photo galleries, and press from Divine Timing.' },
  twitter: { card: 'summary_large_image', title: 'Media | Divine Timing' },
};

export default async function MediaPage() {
  const [galleries, videos, heroSection, pageSettings] = await Promise.all([
    getGalleriesForHub(),
    getVideos(),
    getHeroSection('media'),
    getPageSettings('media'),
  ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Media';
  const subtext = heroSection?.subtext;
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        headline={headline}
        subtext={subtext ?? undefined}
        heightPreset="compact"
      />

      <SignatureDivider />

      {/* Gallery tabs below hero */}
      <MediaPageClient
        galleries={galleries}
        videos={videos}
        headline={headline}
        subtext={subtext}
        showHeadline={false}
      />
    </div>
  );
}
