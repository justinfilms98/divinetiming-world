import type { MetadataRoute } from 'next';
import { SITE_TAGLINE } from '@/lib/site';
import { BRAND_NIGHT } from '@/components/brand/BrandImage';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DIVINE:TIMING',
    short_name: 'DIVINE:TIMING',
    description: SITE_TAGLINE,
    start_url: '/',
    display: 'standalone',
    background_color: BRAND_NIGHT,
    theme_color: BRAND_NIGHT,
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
