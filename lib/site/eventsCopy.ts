/**
 * Editable Events page text (page_settings.section_copy on the "events" row, migration 059).
 * Every field falls back to today's wording when empty, so nothing changes until an admin edits it.
 */

export const EVENTS_COPY_FIELDS = [
  { key: 'upcoming_label', label: 'Upcoming: small label', fallback: 'Upcoming', max: 40, multiline: false },
  { key: 'upcoming_title', label: 'Upcoming: heading', fallback: 'Next dates', max: 80, multiline: false },
  { key: 'upcoming_intro', label: 'Upcoming: intro', fallback: 'Tickets go through the promoter or venue for each date.', max: 200, multiline: true },
  { key: 'empty_text', label: 'Message when no dates are announced', fallback: 'No dates announced right now. New shows are posted here first.', max: 200, multiline: true },
  { key: 'past_label', label: 'History: small label', fallback: 'Touring history', max: 40, multiline: false },
  { key: 'past_title', label: 'History: heading', fallback: "Where we've played", max: 80, multiline: false },
  { key: 'past_intro', label: 'History: supporting text', fallback: '', max: 200, multiline: true },
] as const;

export type EventsCopyKey = (typeof EVENTS_COPY_FIELDS)[number]['key'];
export type EventsCopy = Record<EventsCopyKey, string> & { show_touring_summary: boolean };

const KEYS = new Set<string>([...EVENTS_COPY_FIELDS.map((f) => f.key), 'show_touring_summary']);

function clean(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** The text to render; empty or malformed values use today's wording. */
export function resolveEventsCopy(raw: unknown): EventsCopy {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const copy = { show_touring_summary: src.show_touring_summary !== false } as EventsCopy;
  for (const f of EVENTS_COPY_FIELDS) {
    const v = typeof src[f.key] === 'string' ? clean(src[f.key] as string).slice(0, f.max) : '';
    copy[f.key] = v || f.fallback;
  }
  return copy;
}

/**
 * "History" intro line. With no custom text it keeps today's sentence built from the automatic
 * shows/cities summary. With custom text, the summary (when shown) becomes its own line.
 */
export function eventsHistoryIntro(copy: EventsCopy, summary: string | null): { intro: string; summaryLine: string | null } {
  const custom = copy.past_intro.trim();
  const auto = copy.show_touring_summary ? summary : null;
  if (!custom) {
    return { intro: auto ? `${auto} — and counting. Every date below was a real room.` : 'Previous dates, kept on the record.', summaryLine: null };
  }
  return { intro: custom, summaryLine: auto };
}

export type EventsCopyCheck = { ok: true; value: Partial<Record<EventsCopyKey, string | null>> & { show_touring_summary?: boolean } } | { ok: false; error: string };

/** Admin input: known keys only; text is trimmed and length-capped, empty clears (null). Plain text only. */
export function checkEventsCopyInput(raw: unknown): EventsCopyCheck {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'Events page text must be a set of fields.' };
  const value: Record<string, string | boolean | null> = {};
  for (const [key, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!KEYS.has(key)) return { ok: false, error: `Unknown Events page field "${key}".` };
    if (key === 'show_touring_summary') {
      if (typeof v !== 'boolean') return { ok: false, error: 'The shows/cities line switch must be on or off.' };
      value[key] = v;
      continue;
    }
    const field = EVENTS_COPY_FIELDS.find((f) => f.key === key)!;
    if (v === null) {
      value[key] = null;
      continue;
    }
    if (typeof v !== 'string') return { ok: false, error: `${field.label} must be text.` };
    const text = clean(v);
    if (text.length > field.max) return { ok: false, error: `${field.label} must be ${field.max} characters or fewer.` };
    if (/[<>]/.test(text)) return { ok: false, error: `${field.label} can't contain < or >.` };
    value[key] = text || null;
  }
  return { ok: true, value };
}
