import {
  getSiteSettings,
  getBookingContent,
  getHeroSection,
  getPageSettings,
  getAboutContent,
} from '@/lib/content';
import { getAuthorityConfig } from '@/lib/authority-config';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { StatsRow } from '@/components/authority/StatsRow';
import { AuthorityCTAs } from '@/components/authority/AuthorityCTAs';
import { BookingPresentationSections } from '@/components/booking/BookingPresentationSections';
import { BookingForm } from '@/components/booking/BookingForm';
import { BookingAboutCard } from '@/components/booking/BookingAboutCard';
import { BookingBioSection } from '@/components/booking/BookingBioSection';

export const dynamic = 'force-dynamic';

export default async function BookingPage() {
  const [siteSettings, bookingSections, heroSection, pageSettings, aboutContent] = await Promise.all([
    getSiteSettings(),
    getBookingContent(),
    getHeroSection('booking'),
    getPageSettings('booking'),
    getAboutContent(),
  ]);
  const authority = getAuthorityConfig(null);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Booking';
  const pitch = heroSection?.subtext ?? bookingSections[0]?.description ??
    'For booking inquiries, vendor information, and management requests, get in touch.';
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
        subtext={pitch}
        heightPreset="compact"
      />

      <SignatureDivider />
      {authority.stats?.length ? (
        <>
          <section className="py-8 md:py-12" aria-label="Stats">
            <StatsRow stats={authority.stats} />
          </section>
          <SignatureDivider />
        </>
      ) : null}
      <section className="py-8 px-4 flex justify-center">
        <AuthorityCTAs showBook showListen showEPK={false} />
      </section>
      <SignatureDivider />

      <BookingPresentationSections sections={bookingSections} />

      {/* Inquiry form + About section side by side */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3">
            <BookingForm />
          </div>
          <div className="lg:col-span-2 space-y-8">
            <BookingBioSection
              bioHtml={aboutContent?.bio_html ?? null}
              bioText={aboutContent?.bio_text ?? ''}
              title="About"
            />
            <BookingAboutCard
              title={pageSettings?.booking_about_title}
              body={pageSettings?.booking_about_body}
              imageUrl={pageSettings?.booking_about_image_url}
            />
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-sm font-medium uppercase tracking-widest text-white/70 mb-4">Press / EPK</h3>
              <div className="flex flex-col gap-3">
                <a
                  href="/epk"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/30 transition-colors font-medium text-sm"
                >
                  View EPK
                </a>
                <a
                  href="/media"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/5 transition-colors text-sm"
                >
                  Download Press Photos
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact fallback */}
      <section className="py-12 px-4 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-white/60 mb-6">Or reach us directly</p>
          <div className="flex flex-wrap justify-center gap-8">
            <a
              href={`tel:${siteSettings?.booking_phone || '+33 635 640 200'}`}
              className="text-[var(--accent)] hover:text-[var(--accent2)] transition-colors font-medium"
            >
              {siteSettings?.booking_phone || '+33 635 640 200'}
            </a>
            <a
              href={`mailto:${siteSettings?.booking_email || 'info@divinetimingmusic.com'}`}
              className="text-[var(--accent)] hover:text-[var(--accent2)] transition-colors font-medium"
            >
              {siteSettings?.booking_email || 'info@divinetimingmusic.com'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
