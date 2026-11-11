/**
 * Homepage section switches (site_settings.home_sections, migration 059).
 * A missing key means "shown", so the homepage stays as it is until an admin switches something off.
 */

export const HOME_SECTIONS = [
  { id: 'now_playing', label: 'Now playing', hint: 'Latest or pinned release' },
  { id: 'experience', label: 'The DIVINE:TIMING experience', hint: 'Live intro band' },
  { id: 'upcoming_events', label: 'Live dates', hint: 'Next three upcoming events (hidden anyway when there are none)' },
  { id: 'manifesto', label: 'The world', hint: 'Manifesto text' },
  { id: 'films', label: 'Films', hint: 'Two featured videos (hidden anyway when there are none)' },
  { id: 'tribe', label: 'Join the tribe', hint: 'Newsletter signup' },
  { id: 'shop', label: 'Shop highlight', hint: 'Featured products (hidden anyway when there are none)' },
  { id: 'booking', label: 'Booking', hint: 'Bring DIVINE:TIMING to your city' },
] as const;

export type HomeSectionId = (typeof HOME_SECTIONS)[number]['id'];
export type HomeSectionVisibility = Record<HomeSectionId, boolean>;

const IDS = new Set<string>(HOME_SECTIONS.map((s) => s.id));

/** Visibility for every section; anything malformed is treated as "shown". */
export function resolveHomeSections(raw: unknown): HomeSectionVisibility {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(HOME_SECTIONS.map(({ id }) => [id, source[id] !== false])) as HomeSectionVisibility;
}

export type HomeSectionsCheck = { ok: true; value: Partial<HomeSectionVisibility> } | { ok: false; error: string };

/** Admin input: an object of known section ids to booleans. Unknown ids are refused, not ignored. */
export function checkHomeSectionsInput(raw: unknown): HomeSectionsCheck {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'Homepage sections must be a list of on/off switches.' };
  const value: Partial<HomeSectionVisibility> = {};
  for (const [key, on] of Object.entries(raw as Record<string, unknown>)) {
    if (!IDS.has(key)) return { ok: false, error: `Unknown homepage section "${key}".` };
    if (typeof on !== 'boolean') return { ok: false, error: `Section "${key}" must be on or off.` };
    value[key as HomeSectionId] = on;
  }
  return { ok: true, value };
}
