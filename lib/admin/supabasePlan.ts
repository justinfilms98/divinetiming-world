/**
 * Supabase plan limits shown on the dashboard. The plan cannot be read automatically (that
 * needs a Supabase management token, which this app does not hold), so it is configured:
 * set SUPABASE_PLAN=pro in Vercel after an upgrade. Without it the Free plan is assumed and
 * the dashboard says so, rather than presenting the limit as verified.
 */
const PLANS = {
  free: { label: 'Free', storageBytes: 1024 ** 3 },
  pro: { label: 'Pro', storageBytes: 100 * 1024 ** 3 },
} as const;

export type SupabasePlanKey = keyof typeof PLANS;

export interface SupabasePlanInfo {
  key: SupabasePlanKey;
  label: string;
  storageBytes: number;
  /** false when SUPABASE_PLAN is missing or unrecognised and Free is assumed. */
  configured: boolean;
}

export function supabasePlan(value = process.env.SUPABASE_PLAN): SupabasePlanInfo {
  const key = value?.trim().toLowerCase();
  if (key === 'free' || key === 'pro') return { key, ...PLANS[key], configured: true };
  return { key: 'free', ...PLANS.free, configured: false };
}

/**
 * One-off notice for the 2026-10-14 → 2026-11-14 billing cycle, when cached bandwidth went over
 * the Free allowance (owner-verified on the Supabase dashboard). Shown only on the Free plan and
 * only until the cycle ends, so it cannot linger once the facts change.
 */
const BANDWIDTH_NOTICE = {
  until: '2026-11-15T08:00:00Z',
  text: 'This billing cycle (to Nov 14) the Free plan’s cached download allowance is used up. Lighter homepage videos are live to slow further use.',
};

export function bandwidthNotice(plan: SupabasePlanInfo, now: Date): string | null {
  if (plan.key !== 'free') return null;
  return now.getTime() < Date.parse(BANDWIDTH_NOTICE.until) ? BANDWIDTH_NOTICE.text : null;
}
