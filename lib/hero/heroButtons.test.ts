import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_PRIMARY_BUTTON, DEFAULT_SECONDARY_BUTTON, resolveHeroButtons } from './heroButtons';
import { resolveHomeSections } from '@/lib/site/homeSections';
import { HeroContent } from '@/components/home/HeroContent';

describe('resolveHeroButtons', () => {
  it('uses Listen → /music and Join the tribe → /#tribe when nothing is set (production row today)', () => {
    expect(resolveHeroButtons({ cta_text: null, cta_url: null })).toEqual({
      primary: DEFAULT_PRIMARY_BUTTON,
      secondary: DEFAULT_SECONDARY_BUTTON,
    });
    expect(DEFAULT_PRIMARY_BUTTON).toEqual({ text: 'Listen', url: '/music' });
    expect(DEFAULT_SECONDARY_BUTTON).toEqual({ text: 'Join the tribe', url: '/#tribe' });
  });

  it('uses the admin values when set', () => {
    const b = resolveHeroButtons({
      cta_text: 'Stream',
      cta_url: 'https://open.spotify.com/artist/x',
      secondary_cta_text: 'Book the act',
      secondary_cta_url: '/booking',
    });
    expect(b.primary).toEqual({ text: 'Stream', url: 'https://open.spotify.com/artist/x' });
    expect(b.secondary).toEqual({ text: 'Book the act', url: '/booking' });
  });

  it('falls back to the default link when a saved link is unsafe', () => {
    const b = resolveHeroButtons({ cta_text: 'x', cta_url: 'javascript:alert(1)', secondary_cta_text: 'y', secondary_cta_url: '//evil.example' });
    expect(b.primary?.url).toBe('/music');
    expect(b.secondary?.url).toBe('/#tribe');
  });

  it('hides a button that scrolls to the Tribe signup when that section is switched off', () => {
    const hidden = resolveHomeSections({ tribe: false });
    expect(resolveHeroButtons({}, hidden).secondary).toBeNull();
    expect(resolveHeroButtons({ secondary_cta_text: 'Join', secondary_cta_url: '#tribe' }, hidden).secondary).toBeNull();
    expect(resolveHeroButtons({ secondary_cta_text: 'Book', secondary_cta_url: '/booking' }, hidden).secondary?.url).toBe('/booking');
    expect(resolveHeroButtons({}, hidden).primary?.url).toBe('/music');
  });
});

describe('HeroContent buttons', () => {
  const html = (props: Record<string, unknown>) => renderToStaticMarkup(createElement(HeroContent, props));

  it('renders both buttons with their links', () => {
    const out = html({ subtext: 'We are one.', ctaText: 'Listen', ctaUrl: '/music', secondaryCtaText: 'Join the tribe', secondaryCtaUrl: '/#tribe' });
    expect(out).toContain('We are one.');
    expect(out).toMatch(/href="\/music"[^>]*class="hero-cta-primary"|class="hero-cta-primary"[^>]*href="\/music"/);
    expect(out).toMatch(/href="\/#tribe"[^>]*class="hero-cta-secondary"|class="hero-cta-secondary"[^>]*href="\/#tribe"/);
  });

  it('opens an external second button in a new tab', () => {
    const out = html({ secondaryCtaText: 'SoundCloud', secondaryCtaUrl: 'https://soundcloud.com/x' });
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it('renders no second button when it is hidden', () => {
    const out = html({ ctaText: 'Listen', ctaUrl: '/music', secondaryCtaText: undefined, secondaryCtaUrl: undefined });
    expect(out).not.toContain('hero-cta-secondary');
  });
});
