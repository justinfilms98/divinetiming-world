'use client';

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
    <section className="rounded-xl border border-white/10 bg-white/5 p-6" aria-labelledby="booking-bio-heading">
      <h2 id="booking-bio-heading" className="text-lg font-semibold text-white mb-4">
        {title}
      </h2>
      {!hasContent && (
        <p className="text-white/50 text-sm">No bio content yet. Add content in Admin → About.</p>
      )}
      {useRich && (
        <div
          className="about-bio-content max-w-prose text-white/90 leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_img]:max-h-[400px] [&_p]:mb-4 [&_ul]:my-4 [&_ol]:my-4 [&_li]:mb-1 [&_a]:underline [&_a]:decoration-white/40 [&_a:hover]:opacity-90"
          style={{ fontFamily: 'var(--font-playfair-display), serif' }}
          dangerouslySetInnerHTML={{ __html: bioHtml }}
        />
      )}
      {!useRich && bioParagraphs.length > 0 && (
        <div
          className="text-white/90 leading-relaxed space-y-4"
          style={{ fontFamily: 'var(--font-playfair-display), serif' }}
        >
          {bioParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
    </section>
  );
}
