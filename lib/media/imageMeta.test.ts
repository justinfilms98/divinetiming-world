import { describe, expect, it } from 'vitest';
import { MAX_REPORTED_DIMENSION, sanitizeReportedDimensions } from '@/lib/media/imageMeta';

describe('sanitizeReportedDimensions', () => {
  it('keeps positive integers within bounds', () => {
    expect(sanitizeReportedDimensions(1920, 1080)).toEqual({ width: 1920, height: 1080 });
  });

  it('rejects non-integers, zero, negatives and absurd sizes', () => {
    expect(sanitizeReportedDimensions(1.5, 1080)).toEqual({ width: null, height: null });
    expect(sanitizeReportedDimensions(0, 1080)).toEqual({ width: null, height: null });
    expect(sanitizeReportedDimensions(-1, 1080)).toEqual({ width: null, height: null });
    expect(sanitizeReportedDimensions(MAX_REPORTED_DIMENSION + 1, 1080)).toEqual({ width: null, height: null });
    expect(sanitizeReportedDimensions('1920', 1080)).toEqual({ width: null, height: null });
  });
});
