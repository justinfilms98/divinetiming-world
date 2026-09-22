-- ============================================================
-- PHASE 2: CONNECTED ACCOUNTS (provider integrations, e.g. YouTube)
--
-- Additive only. Rollback: 039_connected_accounts.down.sql.
--
-- Security: ADMIN-ONLY, restrictive RLS (RLS on, no policies -> anon/authenticated
-- denied; service-role only). This table stores the *reference* to a credential
-- (an env var / vault key name), NEVER the secret itself. No token values here.
-- ============================================================

CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  -- Provider-native account/channel id (e.g. a YouTube channel UC... id).
  external_account_id TEXT,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected','needs_reconnect','disconnected','error')),
  -- Name of the env var / vault entry holding the credential. NEVER the secret.
  credential_ref TEXT,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  token_expiry TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  -- manual | approval_required | hybrid | automatic (spec §13).
  sync_mode TEXT NOT NULL DEFAULT 'approval_required'
    CHECK (sync_mode IN ('manual','approval_required','hybrid','automatic')),
  -- Incremental sync checkpoint (e.g. last processed publishedAt / page token).
  checkpoint TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_connected_accounts_provider_external
  ON connected_accounts(provider, external_account_id)
  WHERE external_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_connected_accounts_provider ON connected_accounts(provider);

ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only.
