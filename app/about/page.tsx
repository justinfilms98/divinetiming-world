import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  getAboutContent,
  getAboutPhotos,
  getAboutTimeline,
  getSiteSettings,
  getHeroSection,
  getPageSettings,
} from '@/lib/content';
import { AboutHero } from '@/components/about/AboutHero';
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
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.media_url ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <AboutHero
          mediaType={mediaType}
          mediaUrl={mediaUrl}
          overlayOpacity={Number(overlayOpacity)}
          headline={headline}
          subtext={subtext}
        />

        <AboutContent
          bioText={bioText}
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
