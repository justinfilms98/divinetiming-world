/**
 * JSON-LD structured data for Events and Products.
 * Inject script with type="application/ld+json" in relevant pages.
 */

export interface EventJsonLdInput {
  name: string;
  startDate: string;
  endDate?: string;
  location?: { name: string; address?: string };
  description?: string;
  url?: string;
  image?: string;
}

export function eventJsonLd(event: EventJsonLdInput): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    startDate: event.startDate,
    ...(event.endDate && { endDate: event.endDate }),
    ...(event.location && {
      location: {
        '@type': 'Place',
        name: event.location.name,
        ...(event.location.address && { address: event.location.address }),
      },
    }),
    ...(event.description && { description: event.description }),
    ...(event.url && { url: event.url }),
    ...(event.image && { image: event.image }),
  };
}

export interface ProductJsonLdInput {
  name: string;
  description?: string;
  image?: string[];
  offers?: { price: number; priceCurrency: string; availability: string };
  url?: string;
}

export function productJsonLd(product: ProductJsonLdInput): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.description && { description: product.description }),
    ...(product.image?.length && { image: product.image }),
    ...(product.url && { url: product.url }),
    ...(product.offers && {
      offers: {
        '@type': 'Offer',
        price: product.offers.price,
        priceCurrency: product.offers.priceCurrency,
        availability: `https://schema.org/${product.offers.availability}`,
      },
    }),
  };
}
