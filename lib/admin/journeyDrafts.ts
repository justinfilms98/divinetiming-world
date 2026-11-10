/**
 * Journey editor state: saved rows from the server plus per-chapter unsaved drafts keyed by id.
 *
 * Saving, adding, deleting or reordering one chapter only replaces that chapter's saved row,
 * so every other chapter's unsaved text and images survive.
 */

export type JourneyAlign = 'left' | 'right' | 'center';
export type JourneyStatus = 'draft' | 'published';

export interface JourneyBlock {
  id: string;
  title: string | null;
  era_label: string | null;
  body: string | null;
  image_url: string | null;
  external_image_asset_id: string | null;
  align: JourneyAlign;
  display_order: number;
  status: JourneyStatus;
  external_image_asset?: { id: string; preview_url: string | null } | null;
}

export const JOURNEY_EDITABLE = ['title', 'era_label', 'body', 'image_url', 'external_image_asset_id', 'align', 'status'] as const;
export type JourneyEditableKey = (typeof JOURNEY_EDITABLE)[number];
export type JourneyDraft = Partial<Pick<JourneyBlock, JourneyEditableKey>>;

export interface JourneyEditorState {
  rows: JourneyBlock[];
  drafts: Record<string, JourneyDraft>;
}

export function normalizeJourneyBlock(raw: Record<string, unknown>): JourneyBlock {
  const align = raw.align === 'right' || raw.align === 'center' ? raw.align : 'left';
  return {
    id: String(raw.id),
    title: (raw.title as string | null) ?? null,
    era_label: (raw.era_label as string | null) ?? null,
    body: (raw.body as string | null) ?? null,
    image_url: (raw.image_url as string | null) ?? null,
    external_image_asset_id: (raw.external_image_asset_id as string | null) ?? null,
    align,
    display_order: typeof raw.display_order === 'number' ? raw.display_order : 0,
    status: raw.status === 'published' ? 'published' : 'draft',
    external_image_asset: (raw.external_image_asset as JourneyBlock['external_image_asset']) ?? null,
  };
}

function sortRows(rows: JourneyBlock[]): JourneyBlock[] {
  return [...rows].sort((a, b) => a.display_order - b.display_order);
}

function sameValue(a: unknown, b: unknown): boolean {
  return (a ?? null) === (b ?? null);
}

/** Drop draft keys that equal the saved row; returns null when nothing is left unsaved. */
function pruneDraft(row: JourneyBlock, draft: JourneyDraft): JourneyDraft | null {
  const out: JourneyDraft = {};
  for (const key of JOURNEY_EDITABLE) {
    if (key in draft && !sameValue(draft[key], row[key])) (out as Record<string, unknown>)[key] = draft[key];
  }
  return Object.keys(out).length ? out : null;
}

function setDraft(drafts: JourneyEditorState['drafts'], id: string, draft: JourneyDraft | null) {
  const next = { ...drafts };
  if (draft) next[id] = draft;
  else delete next[id];
  return next;
}

/** Apply an edit to one chapter's draft. Reverting a field to its saved value clears it. */
export function editChapter(state: JourneyEditorState, id: string, patch: JourneyDraft): JourneyEditorState {
  const row = state.rows.find((r) => r.id === id);
  if (!row) return state;
  return { ...state, drafts: setDraft(state.drafts, id, pruneDraft(row, { ...state.drafts[id], ...patch })) };
}

export function isChapterDirty(state: JourneyEditorState, id: string): boolean {
  return !!state.drafts[id];
}

export function dirtyChapterIds(state: JourneyEditorState): string[] {
  return state.rows.filter((r) => state.drafts[r.id]).map((r) => r.id);
}

/** What the editor shows for a chapter: saved row overlaid with its unsaved draft. */
export function chapterView(state: JourneyEditorState, id: string): JourneyBlock | null {
  const row = state.rows.find((r) => r.id === id);
  if (!row) return null;
  const draft = state.drafts[id];
  return draft ? { ...row, ...draft } : row;
}

/**
 * Image preview. A draft image (new upload, or removal) always wins over the saved library asset,
 * so replacing or removing an image shows immediately instead of the old picture.
 */
export function chapterImageUrl(state: JourneyEditorState, id: string): string | null {
  const row = state.rows.find((r) => r.id === id);
  if (!row) return null;
  const draft = state.drafts[id];
  if (draft && ('image_url' in draft || 'external_image_asset_id' in draft)) {
    return ('image_url' in draft ? draft.image_url : row.image_url) ?? null;
  }
  return row.external_image_asset?.preview_url ?? row.image_url ?? null;
}

/** Request body for saving one chapter: its saved row plus its draft. */
export function chapterSavePayload(state: JourneyEditorState, id: string): (JourneyDraft & { id: string; display_order: number }) | null {
  const view = chapterView(state, id);
  if (!view) return null;
  const payload: JourneyDraft & { id: string; display_order: number } = { id, display_order: view.display_order };
  for (const key of JOURNEY_EDITABLE) (payload as Record<string, unknown>)[key] = view[key];
  return payload;
}

/**
 * A chapter save succeeded. Replace only that chapter's saved row; keep any edits made to it
 * while the request was in flight (fields that differ from what was sent), and leave every
 * other chapter's draft alone.
 */
export function settleChapterSaved(state: JourneyEditorState, saved: JourneyBlock, sent: JourneyDraft): JourneyEditorState {
  const rows = state.rows.map((r) => (r.id === saved.id ? saved : r));
  const current = state.drafts[saved.id];
  let remaining: JourneyDraft | null = null;
  if (current) {
    const newer: JourneyDraft = {};
    for (const key of JOURNEY_EDITABLE) {
      if (key in current && !(key in sent && sameValue(current[key], sent[key]))) {
        (newer as Record<string, unknown>)[key] = current[key];
      }
    }
    remaining = pruneDraft(saved, newer);
  }
  return { rows, drafts: setDraft(state.drafts, saved.id, remaining) };
}

export function settleChapterCreated(state: JourneyEditorState, created: JourneyBlock): JourneyEditorState {
  return { ...state, rows: sortRows([...state.rows.filter((r) => r.id !== created.id), created]) };
}

export function settleChapterDeleted(state: JourneyEditorState, id: string): JourneyEditorState {
  return { rows: state.rows.filter((r) => r.id !== id), drafts: setDraft(state.drafts, id, null) };
}

/**
 * Move one chapter up or down. Returns the new order and the minimal display_order changes to
 * send; renumbers by position so duplicate display_order values can't make a move a no-op.
 */
export function planChapterMove(
  state: JourneyEditorState,
  id: string,
  dir: 'up' | 'down'
): { rows: JourneyBlock[]; changes: { id: string; display_order: number }[] } | null {
  const index = state.rows.findIndex((r) => r.id === id);
  const target = dir === 'up' ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= state.rows.length) return null;
  const moved = [...state.rows];
  [moved[index], moved[target]] = [moved[target]!, moved[index]!];
  const changes: { id: string; display_order: number }[] = [];
  const rows = moved.map((r, i) => {
    if (r.display_order === i) return r;
    changes.push({ id: r.id, display_order: i });
    return { ...r, display_order: i };
  });
  return { rows, changes };
}

/** A reorder succeeded: apply the new display_order values to the current rows (drafts untouched). */
export function applyChapterOrder(
  state: JourneyEditorState,
  changes: { id: string; display_order: number }[]
): JourneyEditorState {
  const order = new Map(changes.map((c) => [c.id, c.display_order]));
  return {
    ...state,
    rows: sortRows(state.rows.map((r) => (order.has(r.id) ? { ...r, display_order: order.get(r.id)! } : r))),
  };
}

/** Fresh rows from the server (e.g. after a failed reorder); drafts of chapters that still exist are kept. */
export function replaceSavedRows(state: JourneyEditorState, rows: JourneyBlock[]): JourneyEditorState {
  const drafts: JourneyEditorState['drafts'] = {};
  for (const row of rows) {
    const d = state.drafts[row.id];
    const pruned = d ? pruneDraft(row, d) : null;
    if (pruned) drafts[row.id] = pruned;
  }
  return { rows: sortRows(rows), drafts };
}
