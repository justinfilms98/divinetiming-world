import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function capped(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return null;
  return String(value).trim().slice(0, max) || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, city, country, source } = body;

    // Honeypot: real visitors never fill this hidden field. Pretend success.
    if (typeof body.website === 'string' && body.website.trim()) {
      return NextResponse.json({ success: true });
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (normalizedEmail.length > 254 || !EMAIL_PATTERN.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    // Anon has no insert policy on subscribers; only this route can write, and
    // only these columns (status/segment keep their database defaults).
    const supabase = getServiceClient();
    const { error } = await supabase.from('subscribers').insert({
      email: normalizedEmail,
      first_name: capped(firstName, 100),
      city: capped(city, 100),
      country: capped(country, 100),
      source: capped(source, 50) ?? 'homepage',
    });

    // 23505 = unique violation. Re-subscribing is a no-op, not an error the
    // visitor should see.
    if (error && error.code !== '23505') {
      console.error('Subscriber insert error:', error);
      return NextResponse.json({ error: 'Could not complete signup.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Subscribe API error:', err);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
