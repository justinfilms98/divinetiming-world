import { Reveal } from '@/components/motion/Reveal';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/home/SectionHeading';
import { StoryCard } from '@/components/collections/StoryCard';
import type { GalleryForHub } from '@/lib/content/shared';

interface CollectionsHubProps {
  stories: GalleryForHub[];
}

export function CollectionsHub({ stories }: CollectionsHubProps) {
  if (stories.length === 0) {
    return (
      <section className="band-sand">
        <Container className="section-padding text-center">
          <Reveal className="max-w-xl mx-auto">
            <p className="section-label mb-3">Collections</p>
            <h2 className="type-h2 text-[var(--text)]">Stories will appear here</h2>
            <p className="type-body text-[var(--text-muted)] mt-5 prose-readability mx-auto">
              Visual stories are published when they are ready to share.
            </p>
          </Reveal>
        </Container>
      </section>
    );
  }

  const featured = stories.filter((story) => story.is_featured);
  const rest = stories.filter((story) => !story.is_featured);
  const lead = featured[0] ?? null;
  const following = [...featured.slice(1), ...rest];

  return (
    <>
      {lead && (
        <section className="band-night relative overflow-hidden">
          <div className="hero-grain" aria-hidden />
          <Container className="relative section-padding">
            <Reveal>
              <p className="section-label mb-8">Featured</p>
              <StoryCard story={lead} featured />
            </Reveal>
          </Container>
        </section>
      )}

      {following.length > 0 && (
        <section className="band-sand">
          <Container className="section-padding">
            <Reveal>
              <SectionHeading
                label="Collections"
                title={lead ? 'More stories' : 'Visual stories'}
              />
            </Reveal>
            <div className="mt-12 space-y-16 md:space-y-24">
              {following.map((story, index) => (
                <Reveal key={story.id} delay={index * 0.04}>
                  <StoryCard story={story} imageOnRight={index % 2 === 1} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
