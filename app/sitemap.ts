import type { MetadataRoute } from 'next';
import {
  getEvents,
  getGalleries,
  getLegalPolicy,
  getProducts,
  getReleases,
} from '@/lib/content/server';
import { collectionStoryHref } from '@/lib/content/shared';
import { eventDetailHref } from '@/lib/eventDetailHref';
import { BASE_URL } from '@/lib/site';
import type { LegalPolicySlug } from '@/lib/types/content';

const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/music', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/events', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/booking', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/shop', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/journey', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/presskit', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/media', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/collections', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
];

const LEGAL_SLUGS: LegalPolicySlug[] = ['privacy', 'terms', 'refund', 'shipping'];

function entry(
  path: string,
  extras?: Pick<MetadataRoute.Sitemap[number], 'lastModified' | 'changeFrequency' | 'priority'>
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE_URL}${path}`,
    changeFrequency: extras?.changeFrequency ?? 'monthly',
    priority: extras?.priority ?? 0.5,
    ...(extras?.lastModified && { lastModified: extras.lastModified }),
  };
}

/**
 * Public indexable routes only. Excludes admin, API, login, cart (noindex),
 * /label (noindex / 404 unless flagged), /epk (redirects to /presskit),
 * and draft legal or unpublished content.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, releases, products, galleries, legal] = await Promise.all([
    getEvents(),
    getReleases(),
    getProducts(),
    getGalleries(),
    Promise.all(LEGAL_SLUGS.map((slug) => getLegalPolicy(slug))),
  ]);

  const publishedGalleries = galleries.filter((g) => !g.status || g.status === 'published');
  const publishedLegal = legal.filter((policy): policy is NonNullable<typeof policy> => policy != null);

  return [
    ...STATIC_PATHS.map((row) =>
      entry(row.path, { changeFrequency: row.changeFrequency, priority: row.priority })
    ),
    ...publishedLegal.map((policy) =>
      entry(`/${policy.slug}`, {
        lastModified: policy.updated_at,
        changeFrequency: 'yearly',
        priority: 0.3,
      })
    ),
    ...releases.map((release) =>
      entry(`/music/${release.slug}`, {
        lastModified: release.updated_at,
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    ),
    ...events.map((event) =>
      entry(eventDetailHref(event), {
        lastModified: event.updated_at,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    ),
    ...products.map((product) =>
      entry(`/shop/${product.slug}`, {
        lastModified: product.updated_at,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    ),
    ...publishedGalleries.map((gallery) =>
      entry(collectionStoryHref(gallery.slug), {
        lastModified: gallery.updated_at,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    ),
  ];
}
