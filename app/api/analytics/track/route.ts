import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server-role';

const MAX_BODY = 2048;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event_name = body?.event_name;
    if (!event_name || typeof event_name !== 'string') {
      return NextResponse.json({ error: 'Missing event_name' }, { status: 400 });
    }
    const payload = {
      event_name: body.event_name,
      path: typeof body.path === 'string' ? body.path.slice(0, 500) : null,
      entity_type: typeof body.entity_type === 'string' ? body.entity_type.slice(0, 100) : null,
      entity_id: typeof body.entity_id === 'string' ? body.entity_id.slice(0, 100) : null,
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : null,
      session_id: typeof body.session_id === 'string' ? body.session_id.slice(0, 100) : null,
      user_id: body.user_id || null,
    };
    const bodyStr = JSON.stringify(payload);
    if (bodyStr.length > MAX_BODY) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 400 });
    }
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from('analytics_events').insert(payload);
    if (error) {
      console.error('Analytics insert error:', error);
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
