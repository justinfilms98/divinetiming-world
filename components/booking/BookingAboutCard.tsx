'use client';

import Image from 'next/image';

interface BookingAboutCardProps {
  title?: string | null;
  body?: string | null;
  imageUrl?: string | null;
}

const DEFAULT_ABOUT = 'Get in touch for bookings, collaborations, and press.';

export function BookingAboutCard({ title, body, imageUrl }: BookingAboutCardProps) {
  const displayTitle = title || 'About';
  const displayBody = body || DEFAULT_ABOUT;
  if (!title && !body && !imageUrl) {
    return (
      <div className="p-6 rounded-[var(--radius-card)] border border-[var(--accent)]/10 bg-[var(--bg-secondary)] shadow-[var(--shadow-card)]">
        <h3 className="type-h3 text-[var(--text)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>{displayTitle}</h3>
        <p className="type-body text-[var(--text-muted)] leading-relaxed">{displayBody}</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-[var(--radius-card)] border border-[var(--accent)]/10 bg-[var(--bg-secondary)] shadow-[var(--shadow-card)]">
      {imageUrl && (
        <div className="relative aspect-video rounded-[var(--radius-card)] overflow-hidden mb-4">
          <Image
            src={imageUrl}
            alt={title || 'About'}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        </div>
      )}
      {title && (
        <h3 className="type-h3 text-[var(--text)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>{title}</h3>
      )}
      {body && (
        <p className="type-body text-[var(--text-muted)] leading-relaxed whitespace-pre-line">{body}</p>
      )}
    </div>
  );
}
