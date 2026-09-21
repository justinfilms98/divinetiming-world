import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, city, country, source } = body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from('subscribers').insert({
      email: normalizedEmail,
      first_name: firstName ? String(firstName).trim() || null : null,
      city: city ? String(city).trim() || null : null,
      country: country ? String(country).trim() || null : null,
      source: source ? String(source).trim() : 'homepage',
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
