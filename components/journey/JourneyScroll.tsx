import Image from 'next/image';
import { Reveal } from '@/components/motion/Reveal';
import { Container } from '@/components/ui/Container';
import { BLUR_PLACEHOLDER } from '@/lib/utils/blur';
import { cn } from '@/lib/ui/cn';
import type { JourneyBlock } from '@/lib/types/content';

interface JourneyScrollProps {
  blocks: JourneyBlock[];
}

export function JourneyScroll({ blocks }: JourneyScrollProps) {
  if (blocks.length === 0) {
    return (
      <section className="band-sand">
        <Container className="section-padding text-center">
          <Reveal className="max-w-xl mx-auto">
            <p className="section-label mb-3">Journey</p>
            <h2 className="type-h2 text-[var(--text)]">The story is still being written</h2>
            <p className="type-body text-[var(--text-muted)] mt-5 prose-readability mx-auto">
              Chapters will appear here once they are ready to share.
            </p>
          </Reveal>
        </Container>
      </section>
    );
  }

  return (
    <div>
      {blocks.map((block, index) => (
        <JourneyChapter key={block.id} block={block} index={index} />
      ))}
    </div>
  );
}

function JourneyChapter({ block, index }: { block: JourneyBlock; index: number }) {
  const imageUrl = block.resolved_image_url ?? block.image_url ?? null;
  const night = index % 2 === 1;
  const number = String(index + 1).padStart(2, '0');
  const title = block.title?.trim() || '';
  const era = block.era_label?.trim() || '';
  const heading = title || era || `Chapter ${number}`;
  const showEra = Boolean(era && title);
  const isCentered = block.align === 'center' || !imageUrl;
  const imageOnLeft = block.align === 'left';

  return (
    <section className={cn(night ? 'band-night relative overflow-hidden' : 'band-sand')}>
      {night && <div className="hero-grain" aria-hidden />}
      <Container className="relative section-padding">
        <Reveal>
          <article
            className="grid grid-cols-1 md:grid-cols-[4.5rem_minmax(0,1fr)] gap-5 md:gap-10"
            aria-labelledby={`journey-chapter-${block.id}`}
          >
            <div className="flex md:flex-col items-center gap-3 md:gap-0" aria-hidden>
              <span className="type-label text-[var(--accent)] tracking-[0.2em]">{number}</span>
              <div className="hidden md:block w-px flex-1 min-h-[5rem] mt-4 bg-[var(--accent)]/25" />
            </div>

            <div className="min-w-0">
              {showEra && <p className="section-label mb-3">{era}</p>}
              <h2
                id={`journey-chapter-${block.id}`}
                className="type-h1 text-[var(--text)] tracking-tight"
              >
                {heading}
              </h2>

              {isCentered ? (
                <div className="mt-8 max-w-3xl">
                  {imageUrl && (
                    <ChapterImage
                      src={imageUrl}
                      alt={title || era || 'Journey chapter'}
                      priority={index === 0}
                      className="aspect-[16/9] mb-8"
                    />
                  )}
                  <ChapterBody body={block.body} />
                </div>
              ) : (
                <div
                  className={cn(
                    'mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center',
                    !imageOnLeft && 'md:[&>div:first-child]:order-2'
                  )}
                >
                  <ChapterImage
                    src={imageUrl!}
                    alt={title || era || 'Journey chapter'}
                    priority={index === 0}
                    className="aspect-[4/5]"
                  />
                  <ChapterBody body={block.body} />
                </div>
              )}
            </div>
          </article>
        </Reveal>
      </Container>
    </section>
  );
}

function ChapterImage({
  src,
  alt,
  priority,
  className,
}: {
  src: string;
  alt: string;
  priority: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-[var(--radius-card-lg)] bg-[var(--bg-secondary)]',
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  );
}

function ChapterBody({ body }: { body: string | null }) {
  const text = body?.trim();
  if (!text) return null;
  return (
    <div className="text-[var(--text-muted)] type-body space-y-4 leading-relaxed prose-readability">
      {text.split(/\n\n+/).map((paragraph, idx) => (
        <p key={idx} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
