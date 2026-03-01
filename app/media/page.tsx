import { MediaPageClient } from '@/components/media/MediaPageClient';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import {
  getGalleriesWithMedia,
  getVideos,
  getHeroSection,
  getPageSettings,
} from '@/lib/content';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const [galleriesWithMedia, videos, heroSection, pageSettings] = await Promise.all([
    getGalleriesWithMedia(),
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
    <div className="min-h-screen flex flex-col">
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
        galleries={galleriesWithMedia}
        videos={videos}
        headline={headline}
        subtext={subtext}
        showHeadline={false}
      />
    </div>
  );
}
