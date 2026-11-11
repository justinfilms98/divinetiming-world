import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/motion/Reveal';
import { JournalCard } from '@/components/journal/JournalCard';
import type { PublicJournalEpisode } from '@/lib/journal/types';
import { SectionHeading } from './SectionHeading';
import { SectionCta } from './SectionCta';

/** "Latest from the Journal": up to three cards linking to their episodes. No players load here. */
export function JournalHighlightSection({ episodes }: { episodes: PublicJournalEpisode[] }) {
  if (episodes.length === 0) return null;
  return (
    <section className="band-night relative overflow-hidden">
      <div className="hero-grain" aria-hidden />
      <Container className="relative section-padding">
        <Reveal>
          <SectionHeading label="Journal" title="Latest from the Journal" />
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-10">
          {episodes.map((episode, index) => (
            <Reveal key={episode.id} delay={index * 0.05}>
              <JournalCard episode={episode} />
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10">
          <SectionCta href="/journal" variant="secondary">
            All episodes
          </SectionCta>
        </Reveal>
      </Container>
    </section>
  );
}
