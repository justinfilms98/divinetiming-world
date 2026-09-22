import { describe, expect, it } from 'vitest';
import {
  breadcrumbJsonLd,
  eventJsonLd,
  musicGroupJsonLd,
  productJsonLd,
  releaseJsonLd,
} from '@/lib/seo/jsonld';

describe('musicGroupJsonLd', () => {
  it('omits empty sameAs and members rather than inventing them', () => {
    const json = musicGroupJsonLd({
      name: 'Divine Timing',
      url: 'https://divinetiming.world',
      description: 'Live, evolving, in motion.',
      sameAs: ['', null, '  '],
      members: [{ name: '' }],
    }) as Record<string, unknown>;

    expect(json['@type']).toBe('MusicGroup');
    expect(json.sameAs).toBeUndefined();
    expect(json.member).toBeUndefined();
    expect(json.description).toBe('Live, evolving, in motion.');
  });

  it('emits platform profiles and people only when provided', () => {
    const json = musicGroupJsonLd({
      name: 'Divine Timing',
      url: 'https://divinetiming.world',
      sameAs: ['https://open.spotify.com/artist/3oXSupbNxaPpkEnMbuK8IS'],
      members: [{ name: 'Liam Bongo' }],
    }) as Record<string, unknown>;

    expect(json.sameAs).toEqual(['https://open.spotify.com/artist/3oXSupbNxaPpkEnMbuK8IS']);
    expect(json.member).toEqual([{ '@type': 'Person', name: 'Liam Bongo' }]);
  });
});

describe('releaseJsonLd', () => {
  it('uses MusicAlbum for EPs and MusicRecording for singles', () => {
    const album = releaseJsonLd({
      name: 'Night Work',
      url: 'https://divinetiming.world/music/night-work',
      releaseType: 'ep',
      artistName: 'Divine Timing',
      artistUrl: 'https://divinetiming.world',
    }) as Record<string, unknown>;
    const single = releaseJsonLd({
      name: 'Pulse',
      url: 'https://divinetiming.world/music/pulse',
      releaseType: 'single',
      artistName: 'Divine Timing',
      artistUrl: 'https://divinetiming.world',
    }) as Record<string, unknown>;

    expect(album['@type']).toBe('MusicAlbum');
    expect(single['@type']).toBe('MusicRecording');
  });
});

describe('productJsonLd', () => {
  it('emits an Offer only when price data is provided', () => {
    const bare = productJsonLd({ name: 'Tee' }) as Record<string, unknown>;
    const withOffer = productJsonLd({
      name: 'Tee',
      url: 'https://divinetiming.world/shop/tee',
      offers: { price: 40, priceCurrency: 'USD', availability: 'InStock' },
    }) as { offers: Record<string, unknown> };

    expect(bare.offers).toBeUndefined();
    expect(withOffer.offers['@type']).toBe('Offer');
    expect(withOffer.offers.price).toBe(40);
  });
});

describe('eventJsonLd', () => {
  it('omits offers when there is no ticket URL', () => {
    const json = eventJsonLd({
      name: 'Ibiza',
      startDate: '2026-07-01',
      bookingStatus: 'on_sale',
    }) as Record<string, unknown>;
    expect(json.offers).toBeUndefined();
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers crumbs and drops empty items', () => {
    const json = breadcrumbJsonLd([
      { name: 'Divine Timing', url: 'https://divinetiming.world' },
      { name: '', url: 'https://divinetiming.world/music' },
      { name: 'Pulse', url: 'https://divinetiming.world/music/pulse' },
    ]) as { '@type': string; itemListElement: { position: number; name: string }[] };

    expect(json['@type']).toBe('BreadcrumbList');
    expect(json.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Divine Timing', item: 'https://divinetiming.world' },
      { '@type': 'ListItem', position: 2, name: 'Pulse', item: 'https://divinetiming.world/music/pulse' },
    ]);
  });
});
