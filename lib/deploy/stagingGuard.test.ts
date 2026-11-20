import { describe, expect, it } from 'vitest';
import { isStagingDeployBranch, stagingSupabaseUrlAllowed } from './stagingGuard';

describe('stagingSupabaseUrlAllowed', () => {
  it('allows staging URL on staging/d3a', () => {
    expect(isStagingDeployBranch('staging/d3a')).toBe(true);
    expect(stagingSupabaseUrlAllowed('https://goapnjajsjslxbjqthyo.supabase.co', 'staging/d3a')).toBe(true);
  });

  it('rejects production URL on staging/d3a', () => {
    expect(stagingSupabaseUrlAllowed('https://lokewuvbrrvmlgdwivoa.supabase.co', 'staging/d3a')).toBe(false);
    expect(stagingSupabaseUrlAllowed(null, 'staging/d3a')).toBe(false);
  });

  it('does not constrain main', () => {
    expect(isStagingDeployBranch('main')).toBe(false);
    expect(stagingSupabaseUrlAllowed('https://lokewuvbrrvmlgdwivoa.supabase.co', 'main')).toBe(true);
  });
});
