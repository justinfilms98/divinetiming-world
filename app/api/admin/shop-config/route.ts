import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';

/** Returns whether Stripe is configured (for admin banner). Does not expose keys. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const stripeConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')
  );
  return NextResponse.json({ stripeConfigured });
}
