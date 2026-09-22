import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { isLabelPublicEnabled } from '@/lib/features';

/** GET /api/admin/label — scaffold snapshot. No public data. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const [settingsRes, artistsRes, releasesRes] = await Promise.all([
    supabase.from('label_settings').select('*').limit(1).maybeSingle(),
    supabase.from('label_artists').select('*').order('display_order').order('name'),
    supabase.from('label_releases').select('*').order('display_order').order('title'),
  ]);

  if (settingsRes.error || artistsRes.error || releasesRes.error) {
    console.error('Admin label list error:', settingsRes.error || artistsRes.error || releasesRes.error);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }

  return NextResponse.json({
    settings: settingsRes.data,
    artists: artistsRes.data ?? [],
    releases: releasesRes.data ?? [],
    publicFlag: isLabelPublicEnabled(),
  });
}
