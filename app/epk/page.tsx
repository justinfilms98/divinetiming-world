import { getHeroSection, getSiteSettings, getPageSettings } from '@/lib/content';
import { getAuthorityConfig } from '@/lib/authority-config';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { AuthorityCTAs } from '@/components/authority/AuthorityCTAs';
import { Reveal } from '@/components/motion/Reveal';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Electronic Press Kit | DIVINE:TIMING',
  description: 'Bio, highlights, press photos, and booking contact for DIVINE:TIMING.',
  openGraph: {
    title: 'Electronic Press Kit | DIVINE:TIMING',
    description: 'Bio, highlights, press photos, and booking contact for DIVINE:TIMING.',
  },
};

export default async function EPKPage() {
  const [heroSection, siteSettings, pageSettings] = await Promise.all([
    getHeroSection('media'),
    getSiteSettings(),
    getPageSettings('home'),
  ]);
  const authority = getAuthorityConfig(null);
  const epk = authority.epk ?? {};
  const headline = pageSettings?.seo_title ?? siteSettings?.artist_name ?? 'DIVINE:TIMING';
  const mediaUrl = heroSection?.mediaFinalUrl ?? undefined;
  const mediaType = heroSection?.media_type ?? undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHero
        mediaUrl={mediaUrl}
        mediaType={mediaType}
        overlayOpacity={0.5}
        headline="Electronic Press Kit"
        subtext={headline}
        heightPreset="standard"
      />
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            {epk.bio && (
              <p className="text-white/90 text-lg leading-relaxed mb-8">{epk.bio}</p>
            )}
            {epk.highlights && epk.highlights.length > 0 && (
              <ul className="list-none space-y-2 mb-8">
                {epk.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/80">
                    <span className="text-[var(--accent)]">—</span>
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
          <SignatureDivider />
          <Reveal>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              {epk.press_photos_url && (
                <a
                  href={epk.press_photos_url}
                  className="px-5 py-2.5 border border-white/20 text-white/90 rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  Press Photos
                </a>
              )}
              {epk.epk_pdf_url && (
                <a
                  href={epk.epk_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 border border-white/20 text-white/90 rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  Download EPK (PDF)
                </a>
              )}
              {(epk.contact_email || siteSettings?.booking_email) && (
                <a
                  href={`mailto:${epk.contact_email || siteSettings?.booking_email}`}
                  className="px-5 py-2.5 text-[var(--accent)] hover:underline text-sm"
                >
                  Contact
                </a>
              )}
            </div>
            <AuthorityCTAs showBook showListen showEPK={false} />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
