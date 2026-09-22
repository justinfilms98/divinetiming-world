-- ============================================================
-- PHASE 1: CORE CONTENT ENGINE (Social/Content Inbox foundation)
--
-- Additive only. Creates no changes to existing tables or data.
-- Rollback: run 038_content_engine.down.sql (drops these tables only).
--
-- Security model (deliberate): these tables are ADMIN-ONLY and hold
-- ingestion/source metadata (and, in later phases, references to
-- credentials). Unlike the site's public content tables, they use
-- RESTRICTIVE RLS: RLS is enabled with NO permissive policies, so the
-- anon and authenticated roles are denied by default. All access goes
-- through server routes using the service role (which bypasses RLS)
-- after requireAdmin(). Do NOT add public "USING (true)" policies here.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- content_sources: immutable-ish record of an imported item
-- (a manual URL, or later an Instagram/YouTube post).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL DEFAULT 'manual',
  -- Provider-native id. NULL allowed for manual entries (NULLs are distinct
  -- in a UNIQUE index, so multiple manual rows are permitted).
  external_content_id TEXT,
  source_type TEXT NOT NULL DEFAULT 'unknown'
    CHECK (source_type IN ('post','video','reel','carousel','image','release','event','link','unknown')),
  source_url TEXT,
  title TEXT,
  -- Original caption/title/metadata, preserved verbatim (never overwritten by AI).
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','changed','deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency: one source per (provider, external_content_id). Repeated syncs
-- must upsert rather than duplicate. Manual rows (external_content_id NULL) are exempt.
CREATE UNIQUE INDEX IF NOT EXISTS uq_content_sources_provider_external
  ON content_sources(provider, external_content_id)
  WHERE external_content_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_sources_provider ON content_sources(provider);
CREATE INDEX IF NOT EXISTS idx_content_sources_status ON content_sources(status);

ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only (see header). anon/authenticated denied by default.

-- ------------------------------------------------------------
-- content_drafts: normalized, website-ready draft derived from a source.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES content_sources(id) ON DELETE CASCADE,
  draft_type TEXT NOT NULL DEFAULT 'unknown'
    CHECK (draft_type IN ('media','video','event','release','homepage_feature','shop_promotion','general_update','unknown')),
  title TEXT,
  body TEXT,
  -- Ordered media descriptors: [{ url, media_type, ... }]
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Structured fields (dates, venue, links, etc.). AI/rules fill this later.
  extracted JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- 0..1 classification confidence; NULL until an AI/rules pass runs.
  confidence NUMERIC,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','needs_review','approved','rejected','ignored','published','error')),
  -- Set on publish: which existing-site record this draft became.
  published_entity_type TEXT,
  published_entity_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_drafts_status ON content_drafts(status);
CREATE INDEX IF NOT EXISTS idx_content_drafts_source ON content_drafts(source_id);
CREATE INDEX IF NOT EXISTS idx_content_drafts_type ON content_drafts(draft_type);

-- Idempotency: at most one active (non-terminal) draft per source, so re-syncing
-- the same source does not spawn duplicate drafts.
CREATE UNIQUE INDEX IF NOT EXISTS uq_content_drafts_active_per_source
  ON content_drafts(source_id)
  WHERE source_id IS NOT NULL AND status IN ('new','needs_review','approved');

ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only.

-- ------------------------------------------------------------
-- content_source_links: maps a published site record back to its source(s).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_source_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES content_sources(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_content_source_links
  ON content_source_links(source_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_content_source_links_entity
  ON content_source_links(entity_type, entity_id);

ALTER TABLE content_source_links ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only.

-- ------------------------------------------------------------
-- sync_runs: one row per ingestion run (manual or, later, provider sync).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL DEFAULT 'manual',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','success','error','partial')),
  counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  checkpoint TEXT,
  error_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_provider ON sync_runs(provider);
CREATE INDEX IF NOT EXISTS idx_sync_runs_started ON sync_runs(started_at DESC);

ALTER TABLE sync_runs ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only.

-- ------------------------------------------------------------
-- sync_items: per-item processing status within a run (idempotency/debugging).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_run_id UUID NOT NULL REFERENCES sync_runs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES content_sources(id) ON DELETE SET NULL,
  external_content_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processed','skipped','duplicate','error')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_items_run ON sync_items(sync_run_id);

ALTER TABLE sync_items ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only.

-- ------------------------------------------------------------
-- content_audit_log: who did what to which inbox item, and when.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  -- Safe metadata only. Never store secrets/tokens here.
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_audit_created ON content_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_audit_target ON content_audit_log(target_type, target_id);

ALTER TABLE content_audit_log ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only.

-- ------------------------------------------------------------
-- automation_rules: per-provider behavior (stub for later phases).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_provider ON automation_rules(provider);

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only.
