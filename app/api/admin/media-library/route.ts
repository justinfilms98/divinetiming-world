import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

/** DELETE - remove asset from library. POST is handled by /api/assets/external */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await supabase.from('external_media_assets').delete().eq('id', id);
    if (error) {
      console.error('Admin media-library DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath('/admin/media');
    revalidatePath('/media');
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin media-library DELETE error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
