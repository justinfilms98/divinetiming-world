import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, organization, eventDate, location, budgetRange, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.from('booking_inquiries').insert({
      name: String(name).trim(),
      email: String(email).trim(),
      organization: organization ? String(organization).trim() : null,
      event_date: eventDate ? String(eventDate).trim() : null,
      location: location ? String(location).trim() : null,
      budget_range: budgetRange ? String(budgetRange).trim() : null,
      message: String(message).trim(),
    });

    if (error) {
      console.error('Booking inquiry insert error:', error);
      return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Booking API error:', err);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
