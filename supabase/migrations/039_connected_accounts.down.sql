-- ============================================================
-- ROLLBACK for 039_connected_accounts.sql
-- Drops only connected_accounts. Touches no existing table or data.
-- ============================================================

DROP TABLE IF EXISTS connected_accounts CASCADE;
