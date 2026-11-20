import { describe, expect, it } from 'vitest';
import { buildMissions, visibleMissions } from './overview';

/** Mirrors staging MISSION-QA fixtures — completion without touching production. */
describe('mission completion (staging fixture mirror)', () => {
  const NOW = new Date('2026-11-20T21:00:00Z');
  const socials = {
    instagram_url: 'https://x',
    youtube_url: 'https://x',
    spotify_url: 'https://x',
    apple_music_url: 'https://x',
    soundcloud_url: 'https://x',
    beatport_url: 'https://x',
  };

  const incompleteEvents = [
    {
      id: 'aaaaaaaa-0001-4000-8000-000000000001',
      title: 'MISSION-QA Past No Flyer',
      city: 'Tenerife',
      venue: 'Beach Club',
      date: new Date(NOW.getTime() - 10 * 864e5).toISOString(),
      status: 'published',
      booking_status: 'announced',
      ticket_url: null,
      artwork_url: null,
      updated_at: null,
      description: 'Enough description text for the mission copy threshold to pass cleanly.',
      gallery_url: null,
      media_count: 0,
    },
    {
      id: 'aaaaaaaa-0001-4000-8000-000000000002',
      title: 'MISSION-QA Past No Gallery',
      city: 'Tenerife',
      venue: 'Rooftop',
      date: new Date(NOW.getTime() - 20 * 864e5).toISOString(),
      status: 'published',
      booking_status: 'announced',
      ticket_url: null,
      artwork_url: 'https://example.com/flyer-qa.jpg',
      updated_at: null,
      description: 'Enough description text for the mission copy threshold to pass cleanly.',
      gallery_url: null,
      media_count: 0,
    },
    {
      id: 'aaaaaaaa-0001-4000-8000-000000000003',
      title: 'MISSION-QA Blank Location',
      city: ' ',
      venue: ' ',
      date: new Date(NOW.getTime() + 14 * 864e5).toISOString(),
      status: 'published',
      booking_status: 'announced',
      ticket_url: null,
      artwork_url: 'https://example.com/upcoming-qa.jpg',
      updated_at: null,
      description: 'Upcoming show with enough description text for thresholds.',
      gallery_url: null,
      media_count: 0,
    },
  ];

  it('surfaces merch, essential event gaps, journal, and one optional enhance mission', () => {
    const before = buildMissions(
      {
        events: incompleteEvents,
        products: [],
        collections: [
          {
            id: 'bbbbbbbb-0001-4000-8000-000000000001',
            name: 'MISSION-QA Collection No Cover',
            status: 'published',
            updated_at: null,
            has_cover: false,
            frame_count: 0,
          },
        ],
        journal: [
          {
            id: '7ea51543-d95a-49d1-983d-5bdbe9207e5f',
            title: 'STAGING TEST — Episode 3',
            status: 'draft',
            summary: null,
            description: null,
            cover_image_url: null,
            updated_at: null,
            episode_number: 3,
          },
        ],
        socials,
        attentionIds: [],
      },
      NOW
    );

    expect(before.map((m) => m.id)).toEqual([
      'mission:shop:empty-real',
      'mission:event:aaaaaaaa-0001-4000-8000-000000000003:location',
      'mission:event:aaaaaaaa-0001-4000-8000-000000000001:artwork',
      'mission:journal:7ea51543-d95a-49d1-983d-5bdbe9207e5f:incomplete',
      'mission:events:enhance-history',
    ]);
    expect(before.find((m) => m.id === 'mission:events:enhance-history')?.priority).toBe('suggested');
  });

  it('clears missions when underlying staging content is completed', () => {
    const after = buildMissions(
      {
        events: incompleteEvents.map((e) =>
          e.id.endsWith('001')
            ? { ...e, artwork_url: 'https://example.com/fixed.jpg', media_count: 2, gallery_url: 'https://example.com/g' }
            : e.id.endsWith('002')
              ? { ...e, media_count: 3, gallery_url: 'https://example.com/g' }
              : { ...e, city: 'Tenerife', venue: 'Club' }
        ),
        products: [
          {
            id: 'cccccccc-0001-4000-8000-000000000001',
            name: 'MISSION-QA Real Tee',
            status: 'published',
            updated_at: NOW.toISOString(),
            price_cents: 2500,
            image_count: 1,
            description: 'A qualifying non-demo merch product used only for mission completion tests on staging.',
            track_inventory: false,
            inventory_count: null,
            variants: [],
          },
        ],
        collections: [
          {
            id: 'bbbbbbbb-0001-4000-8000-000000000001',
            name: 'MISSION-QA Collection No Cover',
            status: 'published',
            updated_at: null,
            has_cover: true,
            frame_count: 4,
          },
        ],
        journal: [
          {
            id: '7ea51543-d95a-49d1-983d-5bdbe9207e5f',
            title: 'STAGING TEST — Episode 3',
            status: 'draft',
            summary: 'Ready summary for staging.',
            description: 'A full enough description body for the journal mission threshold.',
            cover_image_url: 'https://example.com/cover.jpg',
            updated_at: null,
            episode_number: 3,
          },
        ],
        socials,
        attentionIds: [],
      },
      NOW
    );

    expect(after.map((m) => m.id)).toEqual(['mission:journal:7ea51543-d95a-49d1-983d-5bdbe9207e5f:ready-review']);
  });

  it('restores enhance mission after dismiss when membership fingerprint changes', () => {
    const first = buildMissions(
      {
        events: incompleteEvents.filter((e) => e.id.endsWith('002')),
        products: [
          {
            id: 'p',
            name: 'Tee',
            status: 'published',
            updated_at: null,
            price_cents: 1,
            image_count: 1,
            description: 'Enough product description text for merch readiness.',
          },
        ],
        collections: [],
        journal: [],
        socials,
        attentionIds: [],
      },
      NOW
    );
    const enhance = first.find((m) => m.id === 'mission:events:enhance-history')!;
    expect(visibleMissions(first, {}, [{ id: enhance.id, fingerprint: enhance.fingerprint }], NOW).visible).toHaveLength(0);

    const second = buildMissions(
      {
        events: incompleteEvents.filter((e) => e.id.endsWith('001') || e.id.endsWith('002')).map((e) =>
          e.id.endsWith('001') ? { ...e, artwork_url: 'https://example.com/a.jpg' } : e
        ),
        products: [
          {
            id: 'p',
            name: 'Tee',
            status: 'published',
            updated_at: null,
            price_cents: 1,
            image_count: 1,
            description: 'Enough product description text for merch readiness.',
          },
        ],
        collections: [],
        journal: [],
        socials,
        attentionIds: [],
      },
      NOW
    );
    const next = second.find((m) => m.id === 'mission:events:enhance-history')!;
    expect(next.fingerprint).not.toBe(enhance.fingerprint);
    expect(visibleMissions(second, {}, [{ id: enhance.id, fingerprint: enhance.fingerprint }], NOW).visible.map((m) => m.id)).toContain(
      'mission:events:enhance-history'
    );
  });
});
