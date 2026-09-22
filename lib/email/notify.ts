import 'server-only';

/**
 * Transactional email via the Resend REST API.
 *
 * Called over fetch rather than the SDK so the project gains no dependency.
 * Every function degrades to a no-op when RESEND_API_KEY is unset, matching
 * how checkout behaves without STRIPE_SECRET_KEY: a missing integration must
 * never turn a visitor's successful submission into an error.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

async function send({ to, subject, html, replyTo }: SendArgs): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [to],
        subject,
        html,
        ...(replyTo && { reply_to: replyTo }),
      }),
    });

    if (!res.ok) {
      console.error('Resend send failed:', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    console.error('Resend send error:', err);
    return false;
  }
}

export interface BookingNotificationFields {
  name: string;
  email: string;
  organization?: string | null;
  phone?: string | null;
  event_name?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  city?: string | null;
  country?: string | null;
  venue?: string | null;
  estimated_attendance?: number | null;
  budget_range?: string | null;
  how_heard?: string | null;
  message: string;
}

const FIELD_LABELS: [keyof BookingNotificationFields, string][] = [
  ['organization', 'Company'],
  ['phone', 'Phone'],
  ['event_name', 'Event'],
  ['event_type', 'Event type'],
  ['event_date', 'Proposed date'],
  ['venue', 'Venue'],
  ['city', 'City'],
  ['country', 'Country'],
  ['estimated_attendance', 'Estimated attendance'],
  ['budget_range', 'Budget'],
  ['how_heard', 'Heard about us via'],
];

/**
 * Alerts the booking contact that an inquiry arrived. Returns false when email
 * is not configured or the send failed; callers should treat that as
 * non-fatal, since the inquiry is already persisted.
 */
export async function sendBookingNotification(
  to: string,
  inquiry: BookingNotificationFields
): Promise<boolean> {
  const rows = FIELD_LABELS.filter(([key]) => {
    const v = inquiry[key];
    return v !== null && v !== undefined && String(v).trim() !== '';
  })
    .map(
      ([key, label]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#5E5E5E;">${label}</td><td style="padding:4px 0;color:#1C1C1C;">${escapeHtml(String(inquiry[key]))}</td></tr>`
    )
    .join('');

  const subjectParts = [inquiry.event_name, inquiry.city].filter(Boolean).join(' · ');
  const subject = subjectParts
    ? `Booking inquiry: ${inquiry.name} — ${subjectParts}`
    : `Booking inquiry: ${inquiry.name}`;

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:640px;">
      <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#C6A75E;margin:0 0 8px;">New booking inquiry</p>
      <h1 style="font-size:22px;margin:0 0 4px;color:#1C1C1C;">${escapeHtml(inquiry.name)}</h1>
      <p style="margin:0 0 20px;"><a href="mailto:${escapeHtml(inquiry.email)}" style="color:#C6A75E;">${escapeHtml(inquiry.email)}</a></p>
      ${rows ? `<table style="border-collapse:collapse;font-size:14px;margin-bottom:20px;">${rows}</table>` : ''}
      <div style="border-top:1px solid #E8E1D6;padding-top:16px;">
        <p style="font-size:14px;color:#1C1C1C;white-space:pre-wrap;margin:0;">${escapeHtml(inquiry.message)}</p>
      </div>
    </div>
  `;

  return send({ to, subject, html, replyTo: inquiry.email });
}

/** Confirms to the sender that their inquiry landed. Best effort. */
export async function sendInquiryAcknowledgement(
  to: string,
  name: string
): Promise<boolean> {
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:640px;">
      <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#C6A75E;margin:0 0 8px;">DIVINE:TIMING</p>
      <p style="font-size:16px;color:#1C1C1C;">Thanks ${escapeHtml(name)} — your inquiry reached us.</p>
      <p style="font-size:14px;color:#5E5E5E;">We read every message and will come back to you shortly with availability and details.</p>
    </div>
  `;

  return send({ to, subject: 'We received your inquiry — DIVINE:TIMING', html });
}
