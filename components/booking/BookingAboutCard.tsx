'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/Card';

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
      <Card className="p-6 w-full border-[var(--accent)]/[0.08] bg-[var(--bg)]/80 rounded-xl">
        <h3 className="type-h3 text-[var(--text)] mb-2 font-medium" style={{ fontFamily: 'var(--font-display)' }}>{displayTitle}</h3>
        <p className="type-body text-[var(--text-muted)] leading-relaxed prose-readability">{displayBody}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 overflow-hidden w-full border-[var(--accent)]/[0.08] bg-[var(--bg)]/80 rounded-xl">
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
        <p className="type-body text-[var(--text-muted)] leading-relaxed whitespace-pre-line prose-readability">{body}</p>
      )}
    </Card>
  );
}
