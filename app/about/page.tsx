import {
  getAboutContent,
  getAboutPhotos,
  getAboutTimeline,
  getSiteSettings,
  getHeroSection,
  getPageSettings,
} from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { AboutContent } from '@/components/about/AboutContent';
import { Container } from '@/components/ui/Container';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About',
  description: 'The story behind Divine Timing — Liam Bongo & Lex Laurence.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About | Divine Timing',
    description: 'The story behind Divine Timing — Liam Bongo & Lex Laurence.',
    url: '/about',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About | Divine Timing',
    description: 'The story behind Divine Timing — Liam Bongo & Lex Laurence.',
  },
};

export default async function AboutPage() {
  const [aboutContent, aboutPhotos, timeline, siteSettings, heroSection, pageSettings] =
    await Promise.all([
      getAboutContent(),
      getAboutPhotos(),
      getAboutTimeline(),
      getSiteSettings(),
      getHeroSection('about'),
      getPageSettings('about'),
    ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'About';
  const subtext = heroSection?.subtext;
  const bioText = aboutContent?.bio_text ?? '';
  const bioHtml = aboutContent?.bio_html ?? null;
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip bg-[var(--bg)]">
      <main className="flex-1">
        <UnifiedHero
          mediaType={mediaType ?? undefined}
          mediaUrl={mediaUrl ?? undefined}
          overlayOpacity={Number(overlayOpacity)}
          headline={headline}
          subtext={subtext ?? undefined}
          heightPreset="tall"
        />

        <Container>
        <AboutContent
          brandStatement={heroSection?.subtext ?? undefined}
          bioText={bioText}
          bioHtml={bioHtml}
          photos={aboutPhotos}
          timeline={timeline}
          member1Name={siteSettings?.member_1_name || 'Liam Bongo'}
          member2Name={siteSettings?.member_2_name || 'Lex Laurence'}
        />
        </Container>
      </main>
    </div>
  );
}
