import { describe, expect, it } from 'vitest';
import { changedFields, EMPTY_JOURNAL_FORM, episodeToForm, journalPayload } from './editorForm';
import type { AdminJournalEpisode } from './types';

const EPISODE: AdminJournalEpisode = {
  id: 'ep-1',
  slug: 'episode-3-barcelona',
  episode_number: 3,
  title: 'Barcelona',
  location: 'Barcelona, Spain',
  summary: 'Two days.',
  description: null,
  cover_image_url: 'https://x/cover.jpg',
  external_cover_asset_id: null,
  cover_alt: null,
  gallery_id: null,
  status: 'draft',
  release_note: null,
  scheduled_for: '2026-12-05T12:00:00.000Z',
  published_at: null,
  display_order: 0,
  seo_title: null,
  seo_description: null,
  created_at: '2026-11-11T00:00:00Z',
  updated_at: '2026-11-11T00:00:00Z',
  video: { episode_id: 'ep-1', provider: 'youtube', video_id: 'aqz-KE-bpKQ', is_vertical: false, duration_seconds: null },
};

describe('Journal editor form', () => {
  it('shows a saved episode, including its video as a watch link', () => {
    const form = episodeToForm(EPISODE);
    expect(form).toMatchObject({ episode_number: '3', scheduled_for: '2026-12-05', video_url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' });
  });

  it('an unchanged form sends nothing but the id', () => {
    const form = episodeToForm(EPISODE);
    expect(changedFields(form, { ...form, title: ' Barcelona ' })).toEqual([]);
    expect(journalPayload(form, form, 'ep-1')).toEqual({ id: 'ep-1' });
  });

  it('an edit sends only the fields that changed, in the API’s format', () => {
    const initial = episodeToForm(EPISODE);
    const payload = journalPayload({ ...initial, summary: ' Three days. ', episode_number: '4', scheduled_for: '', video_url: '' }, initial, 'ep-1');
    expect(payload).toEqual({ id: 'ep-1', episode_number: 4, summary: 'Three days.', scheduled_for: null, video_url: '' });
  });

  it('a new episode sends its filled fields and starts as a draft', () => {
    const payload = journalPayload({ ...EMPTY_JOURNAL_FORM, title: 'Iceland', episode_number: '4' }, null);
    expect(payload).toEqual({ title: 'Iceland', episode_number: 4, status: 'draft' });
  });
});
