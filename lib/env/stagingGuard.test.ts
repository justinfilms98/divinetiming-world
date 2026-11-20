import { describe, expect, it } from 'vitest';
import { assertStagingIsolation, PRODUCTION_SUPABASE_REF, STAGING_SUPABASE_REF } from './stagingGuard';

describe('assertStagingIsolation', () => {
  it('allows non-staging branches on any project', () => {
    expect(() =>
      assertStagingIsolation({
        gitRef: 'feat/artist-mission-board',
        supabaseUrl: `https://${PRODUCTION_SUPABASE_REF}.supabase.co`,
      })
    ).not.toThrow();
  });

  it('allows staging branches on the staging project', () => {
    expect(() =>
      assertStagingIsolation({
        gitRef: 'staging/d2a',
        supabaseUrl: `https://${STAGING_SUPABASE_REF}.supabase.co`,
      })
    ).not.toThrow();
  });

  it('refuses staging branches on production or missing URL', () => {
    expect(() =>
      assertStagingIsolation({
        gitRef: 'staging/mission-board',
        supabaseUrl: `https://${PRODUCTION_SUPABASE_REF}.supabase.co`,
      })
    ).toThrow(/production|Refusing/i);

    expect(() =>
      assertStagingIsolation({
        gitRef: 'staging/mission-board',
        supabaseUrl: '',
      })
    ).toThrow(/missing NEXT_PUBLIC_SUPABASE_URL|Refusing/i);
  });
});
