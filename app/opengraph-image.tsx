import { ImageResponse } from 'next/og';
import { BrandShareCard } from '@/components/brand/BrandImage';

export const alt = 'DIVINE:TIMING';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(<BrandShareCard />, size);
}
