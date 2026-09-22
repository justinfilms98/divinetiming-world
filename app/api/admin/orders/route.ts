import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { apiSuccess, apiError } from '@/lib/apiResponses';

const STATUSES = ['pending', 'paid', 'failed', 'fulfilled', 'cancelled', 'refunded'] as const;
type OrderStatus = (typeof STATUSES)[number];

/** List orders newest first, with line items. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { data, error } = await auth
    .supabase!.from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiSuccess({ orders: data ?? [] });
}

/** Update fulfillment fields / status on one order. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: {
    id?: string;
    status?: string;
    tracking_number?: string | null;
    admin_notes?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  if (!body.id) return apiError('Order id is required', 400);

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as OrderStatus)) {
      return apiError(`status must be one of: ${STATUSES.join(', ')}`, 400);
    }
    update.status = body.status;
    if (body.status === 'fulfilled') {
      update.fulfilled_at = new Date().toISOString();
    }
  }

  if (body.tracking_number !== undefined) {
    update.tracking_number =
      typeof body.tracking_number === 'string' ? body.tracking_number.trim() || null : null;
  }

  if (body.admin_notes !== undefined) {
    update.admin_notes =
      typeof body.admin_notes === 'string' ? body.admin_notes.trim() || null : null;
  }

  const { data, error } = await auth
    .supabase!.from('orders')
    .update(update)
    .eq('id', body.id)
    .select('*, order_items(*)')
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess({ order: data });
}
