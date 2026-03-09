-- Add event_type to booking_inquiries for staging/preview
ALTER TABLE booking_inquiries ADD COLUMN IF NOT EXISTS event_type TEXT;
