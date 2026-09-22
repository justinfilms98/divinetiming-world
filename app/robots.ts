import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/site';

/**
 * Public site is indexable. Admin, API, and login stay out of the index.
 * Cart is noindex via its layout metadata rather than a robots disallow.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/api', '/api/', '/login'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
