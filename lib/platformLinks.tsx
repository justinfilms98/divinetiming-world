/**
 * Single source of truth for platform / streaming / social links.
 * Used by: Home hero CTAs, Booking page buttons, mobile menu "Listen" row, SocialDock.
 * All links open in new tab with rel="noopener noreferrer" and must be https.
 */

import React from 'react';

export type PlatformId = 'spotify' | 'appleMusic' | 'youtube' | 'instagram';

export interface PlatformLink {
  id: PlatformId;
  label: string;
  href: string;
}

/** Overrides from e.g. site_settings (Admin). Only provided keys override defaults. */
export interface PlatformLinkOverrides {
  spotify_url?: string | null;
  apple_music_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
}

const DEFAULTS: Record<PlatformId, string> = {
  spotify: 'https://open.spotify.com/artist/3oXSupbNxaPpkEnMbuK8IS',
  appleMusic: 'https://music.apple.com/es/artist/divine-timing/1851580045',
  youtube: 'https://www.youtube.com/@divinetimingworld',
  instagram: 'https://www.instagram.com/divinetiming_ofc',
};

function ensureHttps(url: string): string {
  const u = (url || '').trim();
  if (!u) return '';
  return u.startsWith('http') ? u : `https://${u}`;
}

/**
 * Returns platform links for display. Pass siteSettings (or partial) to override defaults.
 * Only returns entries with a valid https href.
 */
export function getPlatformLinks(overrides?: PlatformLinkOverrides | null): PlatformLink[] {
  const hrefs: Record<PlatformId, string> = {
    spotify: ensureHttps(overrides?.spotify_url ?? DEFAULTS.spotify),
    appleMusic: ensureHttps(overrides?.apple_music_url ?? DEFAULTS.appleMusic),
    youtube: ensureHttps(overrides?.youtube_url ?? DEFAULTS.youtube),
    instagram: ensureHttps(overrides?.instagram_url ?? DEFAULTS.instagram),
  };
  const order: PlatformId[] = ['spotify', 'appleMusic', 'youtube', 'instagram'];
  const labels: Record<PlatformId, string> = {
    spotify: 'Spotify',
    appleMusic: 'Apple Music',
    youtube: 'YouTube',
    instagram: 'Instagram',
  };
  return order
    .filter((id) => hrefs[id]?.startsWith('https://'))
    .map((id) => ({ id, label: labels[id], href: hrefs[id] }));
}

/** Icon components for each platform (inline SVG). Use in menu and SocialDock. */
export function SpotifyIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.359.24-.66.54-.779 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

export function AppleMusicIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M21.35 11.1h-1.2c-.1 0-.2.1-.2.2v7.3c0 .1-.1.2-.2.2H4.25c-.1 0-.2-.1-.2-.2v-8.4c0-.1-.1-.2-.2-.2H2.65c-.1 0-.2.1-.2.2v9.8c0 .5.4.9.9.9h18.4c.5 0 .9-.4.9-.9v-8.9c0-.1-.1-.2-.2-.2zm-3.1-2.2c-.1 0-.2.1-.2.2v1.2c0 .1-.1.2-.2.2h-1.2c-.1 0-.2-.1-.2-.2V5.5c0-.3.2-.5.5-.5h1.2c.1 0 .2-.1.2-.2V3.6c0-.1-.1-.2-.2-.2h-1.2c-1.1 0-2 .9-2 2v4.4c0 .1.1.2.2.2h1.2c.1 0 .2-.1.2-.2v-1.2c0-.1.1-.2.2-.2h1.2c.1 0 .2-.1.2-.2V9.1c0-.1-.1-.2-.2-.2zm-3.1 0c-.1 0-.2.1-.2.2v1.2c0 .1-.1.2-.2.2h-1.2c-.1 0-.2-.1-.2-.2V5.5c0-.3.2-.5.5-.5h1.2c.1 0 .2-.1.2-.2V3.6c0-.1-.1-.2-.2-.2h-1.2c-1.1 0-2 .9-2 2v4.4c0 .1.1.2.2.2h1.2c.1 0 .2-.1.2-.2v-1.2c0-.1.1-.2.2-.2h1.2c.1 0 .2-.1.2-.2V9.1c0-.1-.1-.2-.2-.2zm-3.1 0c-.1 0-.2.1-.2.2v1.2c0 .1-.1.2-.2.2h-1.2c-.1 0-.2-.1-.2-.2V5.5c0-.3.2-.5.5-.5h1.2c.1 0 .2-.1.2-.2V3.6c0-.1-.1-.2-.2-.2h-1.2c-1.1 0-2 .9-2 2v4.4c0 .1.1.2.2.2h1.2c.1 0 .2-.1.2-.2v-1.2c0-.1.1-.2.2-.2h1.2c.1 0 .2-.1.2-.2V9.1c0-.1-.1-.2-.2-.2z" />
    </svg>
  );
}

export function YouTubeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function InstagramIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

/** Simple Icons 13.21.0 (CC0). */
export function SoundCloudIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.747.747 0 0 1 .452-.724s.75-.513 2.333-.513a5.364 5.364 0 0 1 2.763.755 5.433 5.433 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12.884 0 1.73.358 2.347.992s.948 1.49.922 2.373ZM10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0ZM9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0Zm-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0Zm-1.647.77a26.108 26.108 0 0 1-.008 7.147.272.272 0 0 1-.542 0 27.955 27.955 0 0 1 0-7.147.275.275 0 0 1 .55 0Zm-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412-.026.28-.514.283-.54 0-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0Zm-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0Z" />
    </svg>
  );
}

/** Simple Icons 13.21.0 (CC0). */
export function BeatportIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M21.429 17.055a7.114 7.114 0 0 1-.794 3.246 6.917 6.917 0 0 1-2.181 2.492 6.698 6.698 0 0 1-3.063 1.163 6.653 6.653 0 0 1-3.239-.434 6.796 6.796 0 0 1-2.668-1.932 7.03 7.03 0 0 1-1.481-2.983 7.124 7.124 0 0 1 .049-3.345 7.015 7.015 0 0 1 1.566-2.937l-4.626 4.73-2.421-2.479 5.201-5.265a3.791 3.791 0 0 0 1.066-2.675V0h3.41v6.613a7.172 7.172 0 0 1-.519 2.794 7.02 7.02 0 0 1-1.559 2.353l-.153.156a6.768 6.768 0 0 1 3.49-1.725 6.687 6.687 0 0 1 3.845.5 6.873 6.873 0 0 1 2.959 2.564 7.118 7.118 0 0 1 1.118 3.8Zm-3.089 0a3.89 3.89 0 0 0-.611-2.133 3.752 3.752 0 0 0-1.666-1.424 3.65 3.65 0 0 0-2.158-.233 3.704 3.704 0 0 0-1.92 1.037 3.852 3.852 0 0 0-1.031 1.955 3.908 3.908 0 0 0 .205 2.213c.282.7.76 1.299 1.374 1.721a3.672 3.672 0 0 0 2.076.647 3.637 3.637 0 0 0 2.635-1.096c.347-.351.622-.77.81-1.231.188-.461.285-.956.286-1.456Z" />
    </svg>
  );
}

const PLATFORM_ICON_MAP = {
  spotify: SpotifyIcon,
  appleMusic: AppleMusicIcon,
  youtube: YouTubeIcon,
  instagram: InstagramIcon,
  soundcloud: SoundCloudIcon,
  beatport: BeatportIcon,
} as const;

export function PlatformIcon({ id, className }: { id: keyof typeof PLATFORM_ICON_MAP; className?: string }) {
  const Icon = PLATFORM_ICON_MAP[id];
  return Icon ? <Icon className={className} /> : null;
}
