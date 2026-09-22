import {
  getAboutContent,
  getAboutPhotos,
  getAboutTimeline,
  getSiteSettings,
  getHeroSection,
  getPageSettings,
  getPressKitBundle,
} from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { AboutContent } from '@/components/about/AboutContent';
import { presskitLongBio, presskitShortBio } from '@/lib/presskit/display';
import { DEFAULT_OG_IMAGE } from '@/lib/site';
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
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Divine Timing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About | Divine Timing',
    description: 'The story behind Divine Timing — Liam Bongo & Lex Laurence.',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function AboutPage() {
  const [aboutContent, aboutPhotos, timeline, siteSettings, heroSection, pageSettings, pressKit] =
    await Promise.all([
      getAboutContent(),
      getAboutPhotos(),
      getAboutTimeline(),
      getSiteSettings(),
      getHeroSection('about'),
      getPageSettings('about'),
      getPressKitBundle(),
    ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'About';
  const subtext = heroSection?.subtext;
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;
  const shortBio = presskitShortBio(pressKit.kit);
  const hasLongBio = !!presskitLongBio(pressKit.kit);

  return (
    <div className="flex flex-col w-full max-w-[100vw] overflow-x-clip bg-[var(--bg)]">
      <div className="flex-1">
        <UnifiedHero
          mediaType={mediaType ?? undefined}
          mediaUrl={mediaUrl ?? undefined}
          overlayOpacity={Number(overlayOpacity)}
          headline={headline}
          subtext={subtext ?? undefined}
          heightPreset="tall"
        />

        <AboutContent
          shortBio={shortBio}
          hasLongBio={hasLongBio}
          extraHtml={aboutContent?.bio_html ?? null}
          photos={aboutPhotos}
          timeline={timeline}
          member1Name={siteSettings?.member_1_name || 'Liam Bongo'}
          member2Name={siteSettings?.member_2_name || 'Lex Laurence'}
        />
      </div>
    </div>
  );
}
