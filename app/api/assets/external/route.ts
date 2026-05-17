import { NextRequest, NextResponse } from 'next/server';

/**
 * Legacy Uploadcare registration endpoint — deprecated.
 * New uploads use Supabase storage and POST /api/admin/media/register with provider "supabase".
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Uploadcare is no longer used. Upload via Supabase and register with POST /api/admin/media/register (provider: "supabase").' },
    { status: 410 }
  );
}
