import { describe, expect, it } from 'vitest';
import {
  applyChapterOrder,
  chapterImageUrl,
  chapterSavePayload,
  chapterView,
  dirtyChapterIds,
  editChapter,
  isChapterDirty,
  planChapterMove,
  replaceSavedRows,
  settleChapterCreated,
  settleChapterDeleted,
  settleChapterSaved,
  type JourneyBlock,
  type JourneyEditorState,
} from './journeyDrafts';

function block(id: string, order: number, extra: Partial<JourneyBlock> = {}): JourneyBlock {
  return {
    id,
    title: `Chapter ${id}`,
    era_label: null,
    body: null,
    image_url: null,
    external_image_asset_id: null,
    align: 'left',
    display_order: order,
    status: 'published',
    external_image_asset: null,
    ...extra,
  };
}

const OLD_ASSET = { id: 'asset-old', preview_url: 'https://cdn/old.jpg' };

function start(): JourneyEditorState {
  return {
    rows: [
      block('a', 0, { image_url: 'https://cdn/old.jpg', external_image_asset_id: 'asset-old', external_image_asset: OLD_ASSET }),
      block('b', 1),
      block('c', 2),
    ],
    drafts: {},
  };
}

describe('per-chapter drafts', () => {
  it('saving chapter A keeps chapter B’s unsaved text and uploaded image', () => {
    let s = start();
    s = editChapter(s, 'a', { title: 'The land (edited)' });
    s = editChapter(s, 'b', { body: 'Unsaved story', image_url: 'https://cdn/b-new.jpg', external_image_asset_id: 'asset-b' });
    const sent = { ...s.drafts.a };
    const payload = chapterSavePayload(s, 'a')!;
    expect(payload.title).toBe('The land (edited)');

    s = settleChapterSaved(s, { ...s.rows[0]!, title: 'The land (edited)' }, sent);

    expect(isChapterDirty(s, 'a')).toBe(false);
    expect(isChapterDirty(s, 'b')).toBe(true);
    expect(chapterView(s, 'b')).toMatchObject({ body: 'Unsaved story', image_url: 'https://cdn/b-new.jpg' });
    expect(chapterImageUrl(s, 'b')).toBe('https://cdn/b-new.jpg');
  });

  it('an upload that lands in chapter B while chapter A is saving survives the save', () => {
    let s = editChapter(start(), 'a', { title: 'A2' });
    const sent = { ...s.drafts.a };
    s = editChapter(s, 'b', { image_url: 'https://cdn/b-upload.jpg', external_image_asset_id: 'asset-b2' });
    s = settleChapterSaved(s, { ...s.rows[0]!, title: 'A2' }, sent);
    expect(chapterImageUrl(s, 'b')).toBe('https://cdn/b-upload.jpg');
    expect(dirtyChapterIds(s)).toEqual(['b']);
  });

  it('edits made to chapter A while its own save was in flight stay unsaved', () => {
    let s = editChapter(start(), 'a', { title: 'First' });
    const sent = { ...s.drafts.a };
    s = editChapter(s, 'a', { title: 'Second', body: 'typed during save' });
    s = settleChapterSaved(s, { ...s.rows[0]!, title: 'First' }, sent);
    expect(s.drafts.a).toEqual({ title: 'Second', body: 'typed during save' });
  });

  it('typing a field back to its saved value clears the unsaved flag', () => {
    let s = editChapter(start(), 'b', { title: 'Changed' });
    expect(isChapterDirty(s, 'b')).toBe(true);
    s = editChapter(s, 'b', { title: 'Chapter b' });
    expect(isChapterDirty(s, 'b')).toBe(false);
  });
});

describe('image previews', () => {
  it('shows a replacement image immediately, not the old library asset', () => {
    const s = editChapter(start(), 'a', { image_url: 'https://cdn/new.jpg', external_image_asset_id: 'asset-new' });
    expect(chapterImageUrl(s, 'a')).toBe('https://cdn/new.jpg');
  });

  it('shows no image after Remove image, even though the saved row still has an asset', () => {
    const s = editChapter(start(), 'a', { image_url: null, external_image_asset_id: null });
    expect(chapterImageUrl(s, 'a')).toBeNull();
    expect(isChapterDirty(s, 'a')).toBe(true);
  });

  it('shows the saved asset when there is no draft', () => {
    expect(chapterImageUrl(start(), 'a')).toBe('https://cdn/old.jpg');
  });
});

describe('add, delete, reorder and refresh keep other drafts', () => {
  it('adding a chapter keeps existing drafts', () => {
    let s = editChapter(start(), 'b', { body: 'draft' });
    s = settleChapterCreated(s, block('d', 3));
    expect(s.rows.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(s.drafts.b).toEqual({ body: 'draft' });
  });

  it('deleting a chapter removes only that chapter and its draft', () => {
    let s = editChapter(editChapter(start(), 'b', { body: 'keep' }), 'c', { body: 'gone' });
    s = settleChapterDeleted(s, 'c');
    expect(s.rows.map((r) => r.id)).toEqual(['a', 'b']);
    expect(s.drafts).toEqual({ b: { body: 'keep' } });
  });

  it('plans a move even when display_order values are duplicated, and applying it keeps drafts', () => {
    let s: JourneyEditorState = { rows: [block('a', 0), block('b', 0), block('c', 0)], drafts: {} };
    s = editChapter(s, 'a', { title: 'unsaved' });
    const plan = planChapterMove(s, 'c', 'up')!;
    expect(plan.rows.map((r) => r.id)).toEqual(['a', 'c', 'b']);
    expect(plan.changes).toEqual([
      { id: 'c', display_order: 1 },
      { id: 'b', display_order: 2 },
    ]);
    s = applyChapterOrder(s, plan.changes);
    expect(s.rows.map((r) => r.id)).toEqual(['a', 'c', 'b']);
    expect(s.drafts.a).toEqual({ title: 'unsaved' });
  });

  it('refreshing saved rows from the server never discards unsaved drafts', () => {
    let s = editChapter(start(), 'b', { body: 'unsaved' });
    s = replaceSavedRows(s, [block('b', 0), block('a', 1)]);
    expect(s.rows.map((r) => r.id)).toEqual(['b', 'a']);
    expect(s.drafts.b).toEqual({ body: 'unsaved' });
  });
});
