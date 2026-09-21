import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { SectionCta } from './SectionCta';

interface ExperienceSectionProps {
  /** Live footage still, resolved from a featured event. Falls back to flat night. */
  backgroundUrl?: string | null;
}

export function ExperienceSection({ backgroundUrl }: ExperienceSectionProps) {
  return (
    <section className="band-night relative overflow-hidden">
      {backgroundUrl && (
        <>
          <Image
            src={backgroundUrl}
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-[var(--bg-night)]/80 via-[var(--bg-night)]/60 to-[var(--bg-night)]"
            aria-hidden
          />
        </>
      )}
      <div className="hero-grain" aria-hidden />

      <Container className="relative section-padding">
        <Reveal className="max-w-2xl">
          <p className="section-label mb-3">Live</p>
          <h2 className="type-h2 text-[var(--text)]">The DIVINE:TIMING experience</h2>
          <p className="type-subtitle text-[var(--text-muted)] mt-5">
            Live percussion. Vocals. Electronic music. One shared moment.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <SectionCta href="/events">See live dates</SectionCta>
            <SectionCta href="/contact" variant="secondary">
              Book DIVINE:TIMING
            </SectionCta>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
