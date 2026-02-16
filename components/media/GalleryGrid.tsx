'use client';

import { Reveal } from '@/components/motion/Reveal';
import { MediaTile } from '@/components/media/MediaTile';
import type { ViewerItem } from '@/components/media/ViewerModal';

export interface GalleryGridItem {
  id: string;
  media_type: 'image' | 'video';
  url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
}

interface GalleryGridProps {
  items: GalleryGridItem[];
  onItemClick: (index: number) => void;
  className?: string;
}

export function GalleryGrid({ items, onItemClick, className }: GalleryGridProps) {
  if (!items.length) return null;

  const viewerItems: ViewerItem[] = items.map((i) => ({
    id: i.id,
    url: i.url,
    type: i.media_type,
    caption: i.caption,
  }));

  return (
    <Reveal className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <MediaTile
            key={item.id}
            type={item.media_type}
            src={item.url}
            thumbnailUrl={item.thumbnail_url}
            caption={item.caption}
            onClick={() => onItemClick(index)}
          />
        ))}
      </div>
    </Reveal>
  );
}
