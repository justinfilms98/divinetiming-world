'use client';

import Image from 'next/image';

interface BookingAboutCardProps {
  title?: string | null;
  body?: string | null;
  imageUrl?: string | null;
}

export function BookingAboutCard({ title, body, imageUrl }: BookingAboutCardProps) {
  if (!title && !body && !imageUrl) {
    return (
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-white/50 text-sm">
        <p>No about content yet. Edit in Admin → Page Settings → Booking.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
      {imageUrl && (
        <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
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
        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h2>
      )}
      {body && (
        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{body}</p>
      )}
    </div>
  );
}
