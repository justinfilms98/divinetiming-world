import { describe, expect, it } from 'vitest';
import { checkEventsCopyInput, eventsHistoryIntro, resolveEventsCopy } from './eventsCopy';

const SUMMARY = '8 shows · 5 cities';

describe('resolveEventsCopy', () => {
  it("uses today's wording when nothing is saved (production today)", () => {
    const c = resolveEventsCopy(null);
    expect(c).toMatchObject({
      upcoming_label: 'Upcoming',
      upcoming_title: 'Next dates',
      upcoming_intro: 'Tickets go through the promoter or venue for each date.',
      empty_text: 'No dates announced right now. New shows are posted here first.',
      past_label: 'Touring history',
      past_title: "Where we've played",
      past_intro: '',
      show_touring_summary: true,
    });
  });

  it('uses saved text and ignores malformed values', () => {
    const c = resolveEventsCopy({ past_title: '  The story so far ', past_label: 42, upcoming_title: '', show_touring_summary: 'no' });
    expect(c.past_title).toBe('The story so far');
    expect(c.past_label).toBe('Touring history');
    expect(c.upcoming_title).toBe('Next dates');
    expect(c.show_touring_summary).toBe(true);
  });
});

describe('eventsHistoryIntro', () => {
  it('reproduces the current sentence exactly when nothing is customised', () => {
    expect(eventsHistoryIntro(resolveEventsCopy(null), SUMMARY)).toEqual({
      intro: '8 shows · 5 cities — and counting. Every date below was a real room.',
      summaryLine: null,
    });
    expect(eventsHistoryIntro(resolveEventsCopy(null), null).intro).toBe('Previous dates, kept on the record.');
  });

  it('shows the owner text with the summary on its own line, which can be switched off', () => {
    const copy = resolveEventsCopy({ past_title: 'The story so far', past_intro: 'Every gathering, from the first 50 to 600+' });
    expect(eventsHistoryIntro(copy, SUMMARY)).toEqual({ intro: 'Every gathering, from the first 50 to 600+', summaryLine: SUMMARY });
    expect(eventsHistoryIntro({ ...copy, show_touring_summary: false }, SUMMARY)).toEqual({
      intro: 'Every gathering, from the first 50 to 600+',
      summaryLine: null,
    });
  });

  it('hides the summary inside the default sentence when switched off', () => {
    expect(eventsHistoryIntro(resolveEventsCopy({ show_touring_summary: false }), SUMMARY).intro).toBe('Previous dates, kept on the record.');
  });
});

describe('checkEventsCopyInput', () => {
  it('accepts known fields, trims text and turns empty into null', () => {
    expect(checkEventsCopyInput({ past_title: ' The story so far ', past_intro: '', show_touring_summary: false })).toEqual({
      ok: true,
      value: { past_title: 'The story so far', past_intro: null, show_touring_summary: false },
    });
  });

  it.each([
    [null, 'set of fields'],
    [{ headline: 'x' }, 'Unknown'],
    [{ past_title: 'x'.repeat(81) }, '80 characters'],
    [{ past_intro: '<script>alert(1)</script>' }, '< or >'],
    [{ past_title: 7 }, 'must be text'],
    [{ show_touring_summary: 'yes' }, 'on or off'],
  ])('rejects %j', (input, message) => {
    const r = checkEventsCopyInput(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(message);
  });
});
