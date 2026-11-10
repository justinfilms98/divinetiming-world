/**
 * Demonstration records the owner created to show Lex and Laurance how the site works
 * (listed in docs/ROADMAP_2026-10-26.md, "Demo content set to draft", owner-approved).
 *
 * Matched by exact record id, never by title. Demo records stay fully editable and keep their
 * publishing status; the dashboard only leaves them out of reminders, "Coming up" and the
 * fan-activity rankings, and labels them "Demo" in the admin lists.
 *
 * To mark another record as a demo, add its id here. A database flag would let owners toggle
 * this themselves; that needs a migration and owner approval, so it is not used yet.
 */
export const DEMO_CONTENT = {
  // The seven original demo events became the real "The Sunset of Elefantum" I–VII series
  // (owner-published 2026-11-10), so no event is a demo any more.
  events: [] as string[],
  collections: ['e923b6b6-ad3a-451a-8ccd-1b50d59a7fd2', 'd77dc441-678a-4b59-b566-4aadce501db5'],
  products: ['f2820cd1-3ac7-4a23-a6de-3e5f20d74b21'],
  releases: [] as string[],
} as const;

export type DemoKind = keyof typeof DEMO_CONTENT;

const DEMO_IDS: Record<DemoKind, ReadonlySet<string>> = {
  events: new Set(DEMO_CONTENT.events),
  collections: new Set(DEMO_CONTENT.collections),
  products: new Set(DEMO_CONTENT.products),
  releases: new Set(DEMO_CONTENT.releases),
};

export function isDemo(kind: DemoKind, id: string | null | undefined): boolean {
  return !!id && DEMO_IDS[kind].has(id);
}
