import { cn } from '@/lib/ui/cn';

interface SectionHeadingProps {
  /** Small-caps eyebrow above the headline. */
  label?: string;
  title: string;
  intro?: string;
  align?: 'left' | 'center';
  className?: string;
}

/**
 * Shared homepage section heading. Colour comes from tokens only, so the same
 * markup reads correctly on both sand and `.band-night` sections.
 */
export function SectionHeading({
  label,
  title,
  intro,
  align = 'left',
  className,
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <div className={cn(centered && 'text-center', className)}>
      {label && <p className="section-label mb-3">{label}</p>}
      <h2 className="type-h2 text-[var(--text)]">{title}</h2>
      {intro && (
        <p
          className={cn(
            'type-body text-[var(--text-muted)] mt-4 prose-readability',
            centered && 'mx-auto'
          )}
        >
          {intro}
        </p>
      )}
    </div>
  );
}
