import { MediaPageClient } from '@/components/media/MediaPageClient';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
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
        badge={heroSection?.label_text?.trim() || undefined}
        headline={headline}
        subtext={subtext ?? undefined}
        heightPreset="compact"
      />

      <div className="mt-20" />

      <SignatureDivider />

      {/* Gallery tabs below hero */}
      <Section className="section-lift">
        <Container>
          <p className="text-center text-[var(--text-muted)] type-body mb-10 max-w-[45ch] mx-auto">
            Browse photo collections and videos.
          </p>
          <MediaPageClient
          galleries={galleries}
          videos={videos}
          headline={headline}
          subtext={subtext}
          showHeadline={false}
        />
        </Container>
      </Section>
    </div>
  );
}
