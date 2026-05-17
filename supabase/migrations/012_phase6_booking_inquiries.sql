-- PHASE 6: Booking page - inquiries table for form submissions

CREATE TABLE booking_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  event_date TEXT,
  location TEXT,
  budget_range TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_inquiries_created ON booking_inquiries(created_at DESC);

-- RLS
ALTER TABLE booking_inquiries ENABLE ROW LEVEL SECURITY;
-- Public can insert (form submissions)
CREATE POLICY "Public insert booking_inquiries" ON booking_inquiries FOR INSERT WITH CHECK (true);
-- Authenticated users (admins) can read
CREATE POLICY "Admin read booking_inquiries" ON booking_inquiries FOR SELECT USING (auth.role() = 'authenticated');
