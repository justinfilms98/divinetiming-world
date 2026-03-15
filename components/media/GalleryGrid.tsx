'use client';

import { Reveal } from '@/components/motion/Reveal';
import { Grid } from '@/components/ui/Grid';
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

  return (
    <Reveal>
      <Grid cols={4} className={className}>
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
      </Grid>
    </Reveal>
  );
}
