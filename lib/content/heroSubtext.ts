/**
 * Brand rule: artist-byline ("By X & Y") must not appear in hero subtext on
 * homepage, events, media, or shop. Use this when passing hero subtext to
 * UnifiedHero on those pages.
 */
export function stripArtistBylineFromHeroSubtext(subtext: string | null | undefined): string | undefined {
  if (subtext == null || typeof subtext !== 'string') return undefined;
  const trimmed = subtext.trim();
  if (!trimmed) return undefined;
  // Match "By ... & ..." (artist credit line)
  if (/^By\s+.+\s+&\s+.+$/i.test(trimmed)) return undefined;
  return trimmed;
}
