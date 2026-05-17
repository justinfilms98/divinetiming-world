/**
 * Server-side validation for hero_sections.hero_logo_url.
 * Returns undefined if invalid (caller should respond 400).
 */
export function validateHeroLogoUrl(value: unknown): string | null | undefined {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\/\S+$/i.test(trimmed)) return undefined;
  return trimmed;
}
