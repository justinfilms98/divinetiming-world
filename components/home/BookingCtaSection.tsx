import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { SectionCta } from './SectionCta';

interface BookingCtaSectionProps {
  /** Shown as a direct line for buyers who would rather email than use the form. */
  bookingEmail?: string | null;
}

export function BookingCtaSection({ bookingEmail }: BookingCtaSectionProps) {
  return (
    <section className="band-night relative overflow-hidden">
      <div className="hero-grain" aria-hidden />
      <Container className="relative section-padding">
        <Reveal className="max-w-3xl mx-auto text-center">
          <p className="section-label mb-3">Booking</p>
          <h2 className="type-h2 text-[var(--text)]">Bring DIVINE:TIMING to your city</h2>
          <p className="type-subtitle text-[var(--text-muted)] mt-5 max-w-xl mx-auto">
            Festivals, clubs, private events and cultural experiences worldwide.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <SectionCta href="/booking">Book the act</SectionCta>
            <SectionCta href="/presskit" variant="secondary">
              Download press kit
            </SectionCta>
          </div>
          {bookingEmail && (
            <p className="type-caption mt-6">
              <a
                href={`mailto:${bookingEmail}`}
                className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors focus-ring rounded"
              >
                {bookingEmail}
              </a>
            </p>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
