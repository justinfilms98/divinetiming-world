import { describe, expect, it } from 'vitest';
import { requestedStatus, statusForCreate } from './publicationStatus';

const STATUSES = ['draft', 'published', 'archived'] as const;

describe('statusForCreate', () => {
  it('defaults new items to draft when the status is missing or unrecognised', () => {
    expect(statusForCreate(undefined, STATUSES)).toBe('draft');
    expect(statusForCreate(null, STATUSES)).toBe('draft');
    expect(statusForCreate('', STATUSES)).toBe('draft');
    expect(statusForCreate('PUBLISHED', STATUSES)).toBe('draft');
    expect(statusForCreate(true, STATUSES)).toBe('draft');
  });

  it('publishes only when explicitly requested', () => {
    expect(statusForCreate('published', STATUSES)).toBe('published');
    expect(statusForCreate('archived', STATUSES)).toBe('archived');
  });
});

describe('requestedStatus', () => {
  it('returns null for an omitted status so edits keep the stored value', () => {
    expect(requestedStatus(undefined, STATUSES)).toBeNull();
    expect(requestedStatus('live', STATUSES)).toBeNull();
  });

  it('returns a valid explicit status', () => {
    expect(requestedStatus('draft', STATUSES)).toBe('draft');
    expect(requestedStatus('published', STATUSES)).toBe('published');
  });
});
