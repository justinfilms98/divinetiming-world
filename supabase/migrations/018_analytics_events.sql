-- Analytics events table (Phase 26). No PII; session_id is anonymous.
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  event_name TEXT NOT NULL,
  path TEXT,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB,
  session_id TEXT,
  user_id UUID
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity ON analytics_events(entity_type, entity_id) WHERE entity_type IS NOT NULL;

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Only service role (server) can insert; no public read for privacy.
CREATE POLICY "Service role insert analytics" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "No public select" ON analytics_events
  FOR SELECT USING (false);
