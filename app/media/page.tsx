import { MediaPageClient } from '@/components/media/MediaPageClient';
import { MediaCarousel } from '@/components/media/MediaCarousel';
import {
  getGalleriesWithMedia,
  getVideos,
  getHeroSection,
  getPageSettings,
  getMediaCarouselSlides,
} from '@/lib/content';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const [galleriesWithMedia, videos, heroSection, pageSettings, carouselSlides] = await Promise.all([
    getGalleriesWithMedia(),
    getVideos(),
    getHeroSection('media'),
    getPageSettings('media'),
    getMediaCarouselSlides(),
  ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Media';
  const subtext = heroSection?.subtext;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero carousel at top */}
      {carouselSlides.length > 0 ? (
        <div className="w-full px-4 pt-8">
          <MediaCarousel slides={carouselSlides} />
        </div>
      ) : null}

      {/* Gallery tabs below carousel */}
      <MediaPageClient
        galleries={galleriesWithMedia}
        videos={videos}
        headline={headline}
        subtext={subtext}
        showHeadline={carouselSlides.length === 0}
      />
    </div>
  );
}
