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
  events: [
    '3e48395b-74d4-4900-ac38-5b078f00b6db',
    '446e3048-1b0c-498d-8b06-8d2aadd1a029',
    'f048c471-cc2a-4835-91e2-e86a82e0b2f3',
    '99d1c43e-4d1c-4db7-b19c-649e44bfc19e',
    '2efad285-a4ef-4f3a-aca3-8f7a62148610',
    '5446d4f0-5d42-41ee-b329-6ca8ab8c4d89',
    '6a6cd2dc-6d17-463f-8c15-ffe65ac86b0d',
  ],
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
