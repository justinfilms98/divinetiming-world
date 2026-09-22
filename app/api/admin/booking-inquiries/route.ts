import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { apiSuccess, apiError } from '@/lib/apiResponses';

export type InquiryStatus =
  | 'new'
  | 'contacted'
  | 'negotiating'
  | 'confirmed'
  | 'declined'
  | 'archived';

const STATUSES: InquiryStatus[] = [
  'new',
  'contacted',
  'negotiating',
  'confirmed',
  'declined',
  'archived',
];

/** Full inquiry list, newest first. Service-role read, so archived rows show too. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { data, error } = await auth
    .supabase!.from('booking_inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiSuccess({ inquiries: data ?? [] });
}

/** Updates pipeline state and the free-text next action on one inquiry. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: { id?: string; status?: string; next_action?: string | null };
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  if (!body.id) return apiError('Inquiry id is required', 400);

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as InquiryStatus)) {
      return apiError(`status must be one of: ${STATUSES.join(', ')}`, 400);
    }
    update.status = body.status;
  }

  if (body.next_action !== undefined) {
    update.next_action =
      typeof body.next_action === 'string' ? body.next_action.trim() || null : null;
  }

  const { data, error } = await auth
    .supabase!.from('booking_inquiries')
    .update(update)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess({ inquiry: data });
}

/** Permanent delete. Prefer the 'archived' status for routine cleanup. */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return apiError('Inquiry id is required', 400);

  const { error } = await auth.supabase!.from('booking_inquiries').delete().eq('id', id);
  if (error) return apiError(error.message, 500);

  return apiSuccess({ deleted: id });
}
