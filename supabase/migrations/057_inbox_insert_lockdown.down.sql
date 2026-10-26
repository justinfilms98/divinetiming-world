-- Rollback 057_inbox_insert_lockdown.sql

CREATE POLICY "Anyone can subscribe" ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert booking_inquiries" ON booking_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role insert analytics" ON analytics_events FOR INSERT WITH CHECK (true);
