/**
 * Shared public-page metadata. Descriptions must come from existing CMS
 * fields or restrained brand defaults — never invented copy.
 */

import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/site';

export interface PublicPageMetadataInput {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  image?: string;
  robots?: Metadata['robots'];
}

export function publicPageMetadata(input: PublicPageMetadataInput): Metadata {
  const ogTitle = input.ogTitle ?? `${input.title} | ${SITE_NAME}`;
  const image = input.image ?? DEFAULT_OG_IMAGE;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      title: ogTitle,
      description: input.description,
      url: input.path,
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: input.description,
      images: [image],
    },
    ...(input.robots ? { robots: input.robots } : {}),
  };
}
