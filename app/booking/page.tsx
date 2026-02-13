import {
  getSiteSettings,
  getBookingContent,
  getHeroSection,
  getPageSettings,
} from '@/lib/content';
import { BookingHero } from '@/components/booking/BookingHero';
import { BookingPresentationSections } from '@/components/booking/BookingPresentationSections';
import { BookingForm } from '@/components/booking/BookingForm';

export const dynamic = 'force-dynamic';

export default async function BookingPage() {
  const [siteSettings, bookingSections, heroSection, pageSettings] = await Promise.all([
    getSiteSettings(),
    getBookingContent(),
    getHeroSection('booking'),
    getPageSettings('booking'),
  ]);

  const headline = heroSection?.headline ?? pageSettings?.seo_title ?? 'Booking';
  const pitch = heroSection?.subtext ?? bookingSections[0]?.description ??
    'For booking inquiries, vendor information, and management requests, get in touch.';
  const mediaType = heroSection?.media_type ?? null;
  const mediaUrl = heroSection?.media_url ?? null;
  const overlayOpacity = heroSection?.overlay_opacity ?? 0.5;

  return (
    <div className="min-h-screen flex flex-col">
      <BookingHero
        mediaType={mediaType}
        mediaUrl={mediaUrl}
        overlayOpacity={Number(overlayOpacity)}
        headline={headline}
        pitch={pitch}
      />

      <BookingPresentationSections sections={bookingSections} />

      <BookingForm />

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
