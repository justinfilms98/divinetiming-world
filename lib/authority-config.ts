/**
 * Authority / EPK content shape.
 * Stored in code for now; can later be moved to site_settings.authority (JSONB) if a column is added.
 * No DB migration in Phase 23 — edit this file or add optional column later.
 */

export interface AuthorityStat {
  value: string;
  label: string;
}

export interface PressLogo {
  name: string;
  logo_url: string;
  url?: string;
}

export interface StreamingLinks {
  spotify?: string;
  apple_music?: string;
  youtube?: string;
  bandcamp?: string;
}

export interface FeaturedEmbed {
  type: 'spotify' | 'youtube';
  id: string; // spotify URI or youtube video id
}

export interface CollabItem {
  name: string;
  image_url?: string;
  url?: string;
}

export interface EpkContent {
  bio?: string;
  highlights?: string[];
  press_photos_url?: string;
  contact_email?: string;
  contact_phone?: string;
  epk_pdf_url?: string;
}

export interface AuthorityConfig {
  stats?: AuthorityStat[];
  pressLogos?: PressLogo[];
  streamingLinks?: StreamingLinks;
  featuredEmbed?: FeaturedEmbed;
  collabs?: CollabItem[];
  epk?: EpkContent;
}

const defaultAuthority: AuthorityConfig = {
  stats: [
    { value: '50+', label: 'Shows' },
    { value: '10+', label: 'Countries' },
    { value: '500K+', label: 'Streams' },
  ],
  pressLogos: [],
  streamingLinks: {
    spotify: 'https://open.spotify.com/artist/3oXSupbNxaPpkEnMbuK8IS',
    apple_music: 'https://music.apple.com/es/artist/divine-timing/1851580045',
    youtube: 'https://www.youtube.com/@divinetimingworld',
  },
  featuredEmbed: { type: 'spotify', id: '3oXSupbNxaPpkEnMbuK8IS' },
  collabs: [],
  epk: {
    bio: 'DIVINE:TIMING — live, evolving, in motion.',
    highlights: ['International touring', 'Festival highlights', 'Premium production'],
    press_photos_url: '/media',
    epk_pdf_url: undefined,
  },
};

/** Returns authority config. Later: merge with site_settings.authority from DB. */
export function getAuthorityConfig(overrides?: AuthorityConfig | null): AuthorityConfig {
  if (!overrides) return defaultAuthority;
  return {
    ...defaultAuthority,
    ...overrides,
    stats: overrides.stats ?? defaultAuthority.stats,
    streamingLinks: { ...defaultAuthority.streamingLinks, ...overrides.streamingLinks },
    epk: { ...defaultAuthority.epk, ...overrides.epk },
  };
}
