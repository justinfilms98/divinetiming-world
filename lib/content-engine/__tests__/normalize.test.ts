import { describe, it, expect } from 'vitest';
import {
  sanitizeExternalUrl,
  buildSourceIdentity,
  extractYouTubeId,
  inferSourceType,
  inferDraftType,
  resolveVideoPublishTarget,
  isTerminalDraftStatus,
} from '@/lib/content-engine/normalize';

describe('sanitizeExternalUrl', () => {
  it('accepts http/https URLs and normalizes them', () => {
    expect(sanitizeExternalUrl('https://youtube.com/watch?v=abc')).toBe(
      'https://youtube.com/watch?v=abc',
    );
    expect(sanitizeExternalUrl('  http://example.com/x  ')).toBe('http://example.com/x');
  });

  it('rejects unsafe or non-string inputs', () => {
    expect(sanitizeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeExternalUrl('data:text/html,<script>')).toBeNull();
    expect(sanitizeExternalUrl('not a url')).toBeNull();
    expect(sanitizeExternalUrl('')).toBeNull();
    expect(sanitizeExternalUrl(null)).toBeNull();
    expect(sanitizeExternalUrl(123 as unknown)).toBeNull();
  });
});

describe('buildSourceIdentity (idempotency key)', () => {
  it('builds a stable lowercase provider:id key', () => {
    expect(buildSourceIdentity('YouTube', 'dQw4w9WgXcQ')).toBe('youtube:dQw4w9WgXcQ');
  });

  it('returns null when there is no external id (manual entries are not deduped by identity)', () => {
    expect(buildSourceIdentity('manual', null)).toBeNull();
    expect(buildSourceIdentity('manual', '')).toBeNull();
    expect(buildSourceIdentity('', 'x')).toBeNull();
  });

  it('is deterministic for the same inputs', () => {
    expect(buildSourceIdentity('instagram', 'ABC')).toBe(
      buildSourceIdentity('instagram', 'ABC'),
    );
  });
});

describe('extractYouTubeId', () => {
  it('parses watch, youtu.be, and bare id forms', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-YouTube input', () => {
    expect(extractYouTubeId('https://instagram.com/p/xyz')).toBeNull();
    expect(extractYouTubeId(42 as unknown)).toBeNull();
  });
});

describe('classification', () => {
  it('infers source type from URL', () => {
    expect(inferSourceType('https://youtu.be/x')).toBe('video');
    expect(inferSourceType('https://www.instagram.com/reel/x')).toBe('reel');
    expect(inferSourceType('https://www.instagram.com/p/x')).toBe('post');
    expect(inferSourceType('https://example.com')).toBe('link');
    expect(inferSourceType(null)).toBe('unknown');
  });

  it('maps source type to a conservative draft type', () => {
    expect(inferDraftType('video')).toBe('video');
    expect(inferDraftType('reel')).toBe('media');
    expect(inferDraftType('link')).toBe('unknown');
  });
});

describe('resolveVideoPublishTarget (unambiguous publish rule)', () => {
  const base = { title: 'Clip', extracted: {}, media: [] };

  it('resolves a YouTube video draft from the source URL', () => {
    const target = resolveVideoPublishTarget(
      { ...base, draft_type: 'video' },
      'https://youtu.be/dQw4w9WgXcQ',
    );
    expect(target).toEqual({ entityType: 'video', youtubeId: 'dQw4w9WgXcQ', title: 'Clip' });
  });

  it('resolves from extracted.youtube_id when present', () => {
    const target = resolveVideoPublishTarget({
      ...base,
      draft_type: 'video',
      extracted: { youtube_id: 'dQw4w9WgXcQ' },
    });
    expect(target?.youtubeId).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-video drafts (stays an approved draft)', () => {
    expect(
      resolveVideoPublishTarget({ ...base, draft_type: 'media' }, 'https://youtu.be/x'),
    ).toBeNull();
  });

  it('returns null when no YouTube id can be derived', () => {
    expect(
      resolveVideoPublishTarget({ ...base, draft_type: 'video' }, 'https://instagram.com/p/x'),
    ).toBeNull();
  });

  it('falls back to a non-empty default title', () => {
    const target = resolveVideoPublishTarget(
      { title: '', extracted: {}, media: [], draft_type: 'video' },
      'https://youtu.be/dQw4w9WgXcQ',
    );
    expect(target?.title).toBe('Untitled');
  });
});

describe('isTerminalDraftStatus', () => {
  it('treats published/rejected/ignored as terminal', () => {
    expect(isTerminalDraftStatus('published')).toBe(true);
    expect(isTerminalDraftStatus('rejected')).toBe(true);
    expect(isTerminalDraftStatus('ignored')).toBe(true);
  });

  it('treats active states as non-terminal', () => {
    expect(isTerminalDraftStatus('new')).toBe(false);
    expect(isTerminalDraftStatus('needs_review')).toBe(false);
    expect(isTerminalDraftStatus('approved')).toBe(false);
  });
});
