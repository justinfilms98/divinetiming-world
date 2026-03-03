import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
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

export const dynamic = 'force-dynamic';

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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <UnifiedHero
          mediaType={mediaType ?? undefined}
          mediaUrl={mediaUrl ?? undefined}
          overlayOpacity={Number(overlayOpacity)}
          headline={headline}
          subtext={subtext ?? undefined}
          heightPreset="compact"
        />

        <AboutContent
          bioText={bioText}
          bioHtml={bioHtml}
          photos={aboutPhotos}
          timeline={timeline}
          member1Name={siteSettings?.member_1_name || 'Liam Bongo'}
          member2Name={siteSettings?.member_2_name || 'Lex Laurence'}
        />
      </main>
      <Footer />
    </div>
  );
}
