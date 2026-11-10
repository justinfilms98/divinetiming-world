import { describe, expect, it } from 'vitest';
import { describeSaveError } from './saveErrors';

describe('describeSaveError', () => {
  it('explains a lost connection and that the edits are kept', () => {
    expect(describeSaveError({ status: 0, subject: 'slot 2' })).toMatch(/couldn't be reached.*still here/);
  });

  it('tells the owner to sign in again when the session ended', () => {
    expect(describeSaveError({ status: 401, subject: 'the Home hero' })).toMatch(/session has ended/);
    expect(describeSaveError({ status: 403, subject: 'x' })).toMatch(/Sign in again/);
  });

  it('shows the server’s validation message', () => {
    expect(describeSaveError({ status: 400, serverMessage: 'CTA label is required when CTA URL is set.', subject: 'x' })).toContain(
      'CTA label is required'
    );
  });

  it('hides the generic "Operation failed." but keeps the status', () => {
    const msg = describeSaveError({ status: 500, serverMessage: 'Operation failed.', subject: 'chapter “The land”' });
    expect(msg).toBe("Couldn't save chapter “The land” (server error 500). Try again in a moment. Your changes are still here.");
  });

  it('uses the action verb and a custom note', () => {
    expect(describeSaveError({ status: 500, subject: 'the chapters', action: 'reorder', keptNote: 'Order refreshed.' })).toMatch(
      /^Couldn't reorder the chapters .* Order refreshed\.$/
    );
  });
});
