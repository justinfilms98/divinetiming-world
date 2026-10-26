import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';
import { sendBookingNotification, sendInquiryAcknowledgement } from '@/lib/email/notify';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Each inquiry emails an acknowledgement, so cap repeats per address to stop mail-bombing. */
const MAX_INQUIRIES_PER_EMAIL_PER_HOUR = 3;

/** Trims to null so empty form fields don't store empty strings. */
function str(value: unknown, max = 300): string | null {
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, max) || null;
}

function int(value: unknown): number | null {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot: real visitors never fill this hidden field. Pretend success.
    if (typeof body.website === 'string' && body.website.trim()) {
      return NextResponse.json({ success: true });
    }

    // The contact form and the booking form post different shapes; accept both.
    const name = str(body.name, 150);
    const email = str(body.email, 254)?.toLowerCase() ?? null;
    const message = str(body.message, 5000);
    const organization = str(body.company ?? body.organization);
    const eventType = str(body.eventType ?? body.event_type);
    const eventDate = str(body.eventDate ?? body.event_date);
    const budgetRange = str(body.budgetRange ?? body.budget_range);

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    // Anon has no insert policy on booking_inquiries; only this route writes.
    const supabase = getServiceClient();

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recent } = await supabase
      .from('booking_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', since);
    if ((recent ?? 0) >= MAX_INQUIRIES_PER_EMAIL_PER_HOUR) {
      return NextResponse.json(
        { error: 'We already received your inquiry. We will be in touch soon.' },
        { status: 429 }
      );
    }

    const city = str(body.city);
    const country = str(body.country);
    // Older rows use a single free-text location; keep it populated so the
    // admin list stays consistent across both form shapes.
    const location = str(body.location) ?? ([city, country].filter(Boolean).join(', ') || null);

    const row: Record<string, unknown> = {
      name,
      email,
      organization,
      event_date: eventDate,
      location,
      budget_range: budgetRange,
      message,
      phone: str(body.phone),
      event_name: str(body.eventName ?? body.event_name),
      city,
      country,
      venue: str(body.venue),
      estimated_attendance: int(body.estimatedAttendance ?? body.estimated_attendance),
      how_heard: str(body.howHeard ?? body.how_heard),
    };
    if (eventType !== null) row.event_type = eventType;

    const { error } = await supabase.from('booking_inquiries').insert(row);

    if (error) {
      console.error('Booking inquiry insert error:', error);
      return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 });
    }

    // Notifications are best effort: the inquiry is already saved, so a mail
    // failure must not surface as a submission failure.
    const { data: settings } = await supabase
      .from('site_settings')
      .select('booking_email')
      .maybeSingle();
    const notifyTo = (settings as { booking_email?: string | null } | null)?.booking_email;

    if (notifyTo) {
      await sendBookingNotification(notifyTo, {
        name,
        email,
        organization,
        phone: row.phone as string | null,
        event_name: row.event_name as string | null,
        event_type: eventType,
        event_date: eventDate,
        city,
        country,
        venue: row.venue as string | null,
        estimated_attendance: row.estimated_attendance as number | null,
        budget_range: budgetRange,
        how_heard: row.how_heard as string | null,
        message,
      });
    }
    await sendInquiryAcknowledgement(email, name);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Booking API error:', err);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
