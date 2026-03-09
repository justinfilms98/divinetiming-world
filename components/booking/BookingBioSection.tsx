'use client';

import { Card } from '@/components/ui/Card';

/**
 * Renders about_content bio on the Booking page (same sanitized HTML / fallback as public About).
 * Use only with sanitized bio_html from DB.
 */
interface BookingBioSectionProps {
  bioHtml?: string | null;
  bioText: string;
  title?: string;
}

export function BookingBioSection({
  bioHtml,
  bioText,
  title = 'About',
}: BookingBioSectionProps) {
  const useRich = bioHtml != null && bioHtml.trim() !== '';
  const bioParagraphs = bioText ? bioText.split('\n\n').filter(Boolean) : [];
  const hasContent = useRich || bioParagraphs.length > 0;

  return (
    <Card as="section" className="p-6" aria-labelledby="booking-bio-heading">
      <h2 id="booking-bio-heading" className="type-h3 text-[var(--text)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </h2>
      {!hasContent && (
        <p className="text-[var(--text-muted)] text-sm type-body">No bio content yet.</p>
      )}
      {useRich && (
        <div
          className="about-bio-content max-w-prose text-[var(--text)] leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_img]:max-h-[400px] [&_p]:mb-4 [&_ul]:my-4 [&_ol]:my-4 [&_li]:mb-1 [&_a]:text-[var(--accent)] [&_a:hover]:opacity-90"
          style={{ fontFamily: 'var(--font-body)' }}
          dangerouslySetInnerHTML={{ __html: bioHtml }}
        />
      )}
      {!useRich && bioParagraphs.length > 0 && (
        <div className="text-[var(--text)] leading-relaxed space-y-4 type-body prose-readability" style={{ fontFamily: 'var(--font-body)' }}>
          {bioParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
    </Card>
  );
}
