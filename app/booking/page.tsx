import {
  getSiteSettings,
  getBookingContent,
  getHeroSection,
  getPageSettings,
  getAboutContent,
} from '@/lib/content/server';
import { UnifiedHero } from '@/components/hero/UnifiedHero';
import { HeroContent } from '@/components/home/HeroContent';
import { SignatureDivider } from '@/components/brand/SignatureDivider';
import { BookingStoryScroll } from '@/components/booking/BookingStoryScroll';
import { BookingForm } from '@/components/booking/BookingForm';
import { BookingAboutCard } from '@/components/booking/BookingAboutCard';
import { BookingBioSection } from '@/components/booking/BookingBioSection';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Booking',
  description: 'Book Divine Timing for your event. Get in touch for festivals, club nights, and collaborations.',
  openGraph: { title: 'Booking | Divine Timing', description: 'Book Divine Timing for your event.' },
  twitter: { card: 'summary_large_image', title: 'Booking | Divine Timing' },
};

export default async function BookingPage() {
  const [siteSettings, bookingSections, heroSection, pageSettings, aboutContent] = await Promise.all([
    getSiteSettings(),
    getBookingContent(),
    getHeroSection('booking'),
    getPageSettings('booking'),
    getAboutContent(),
  ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Booking';
  const subtext = heroSection?.subtext ?? 'Let\'s create something together.';
  const ctaText = heroSection?.cta_text ?? 'Book Now';
  const ctaUrl = heroSection?.cta_url ?? '#booking-form';
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.mediaFinalUrl ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  const bookingEmail = siteSettings?.booking_email ?? '';
  const bookingPhone = siteSettings?.booking_phone ?? '';
  const sponsorsRaw = pageSettings?.booking_sponsors ?? '';
  const sponsors = sponsorsRaw ? sponsorsRaw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <UnifiedHero
        mediaType={mediaType ?? undefined}
        mediaUrl={mediaUrl ?? undefined}
        overlayOpacity={Number(overlayOpacity)}
        headline={headline}
        subtext={subtext}
        heightPreset="compact"
      >
        <HeroContent ctaText={ctaText} ctaUrl={ctaUrl} />
        <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm">
          <Link href="/epk" className="text-white/70 hover:text-white transition-colors underline underline-offset-2">
            View EPK
          </Link>
          <Link href="/media" className="text-white/70 hover:text-white transition-colors underline underline-offset-2">
            Press Photos
          </Link>
        </div>
      </UnifiedHero>

      <SignatureDivider />

      <BookingStoryScroll sections={bookingSections} />

      <SignatureDivider />

      <section
        id="booking-form"
        className="scroll-mt-32 py-16 md:py-20 px-4 min-w-0"
        aria-label="Booking form and contact"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3">
            <div className="p-6 md:p-8 rounded-[var(--radius-card)] border border-[var(--accent)]/20 bg-[var(--bg-secondary)] shadow-[var(--shadow-card)]">
              <BookingForm />
            </div>
          </div>
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-[var(--radius-card)] border border-[var(--accent)]/10 bg-[var(--bg-secondary)] p-6">
              <h3 className="type-h3 text-[var(--text)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Contact
              </h3>
              <div className="space-y-2 type-body text-[var(--text-muted)]">
                {bookingEmail && (
                  <p>
                    <a href={`mailto:${bookingEmail}`} className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                      {bookingEmail}
                    </a>
                  </p>
                )}
                {bookingPhone && (
                  <p>
                    <a href={`tel:${bookingPhone}`} className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                      {bookingPhone}
                    </a>
                  </p>
                )}
              </div>
            </div>
            <BookingAboutCard
              title={pageSettings?.booking_about_title}
              body={pageSettings?.booking_about_body}
              imageUrl={pageSettings?.booking_about_image_url}
            />
            <BookingBioSection
              bioHtml={aboutContent?.bio_html ?? null}
              bioText={aboutContent?.bio_text ?? ''}
              title="About"
            />
            {sponsors.length > 0 && (
              <div className="rounded-[var(--radius-card)] border border-[var(--accent)]/10 bg-[var(--bg-secondary)] p-6">
                <h3 className="type-small text-[var(--text-muted)] uppercase tracking-wider mb-3">Partners & affiliations</h3>
                <p className="type-body text-[var(--text-muted)] whitespace-pre-line">{sponsors.join('\n')}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/epk"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-[var(--radius-button)] bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/30 transition-colors type-button"
              >
                View EPK
              </Link>
              <Link
                href="/media"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-[var(--radius-button)] border border-[var(--accent)]/20 text-[var(--text-muted)] hover:bg-white/5 transition-colors type-button"
              >
                Press Photos
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
