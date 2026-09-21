import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { SectionCta } from './SectionCta';

export function ManifestoSection() {
  return (
    <section className="band-dune">
      <Container className="section-padding">
        <Reveal className="max-w-3xl mx-auto text-center">
          <p className="section-label mb-3">The world</p>
          <p className="type-h3 text-[var(--text)] leading-relaxed">
            DIVINE:TIMING was built on one idea: the moments, people and places that shape us
            are never disconnected.
          </p>
          <p className="type-body text-[var(--text-muted)] mt-6 prose-readability mx-auto">
            Our music draws from rhythms, stories and cultures encountered around the world.
            Every set is an invitation to move, connect and meet each other in the present
            moment.
          </p>
          <div className="mt-8 flex justify-center">
            <SectionCta href="/journey" variant="secondary">
              Our story
            </SectionCta>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
