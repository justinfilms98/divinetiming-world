-- ============================================================
-- ROLLBACK for 038_content_engine.sql
--
-- Drops ONLY the Phase 1 content-engine tables. Touches no existing
-- table or data. Safe to run to fully revert Phase 1 schema.
-- Order respects FK dependencies (children first); CASCADE covers indexes/policies.
-- ============================================================

DROP TABLE IF EXISTS sync_items CASCADE;
DROP TABLE IF EXISTS sync_runs CASCADE;
DROP TABLE IF EXISTS content_source_links CASCADE;
DROP TABLE IF EXISTS content_drafts CASCADE;
DROP TABLE IF EXISTS content_audit_log CASCADE;
DROP TABLE IF EXISTS automation_rules CASCADE;
DROP TABLE IF EXISTS content_sources CASCADE;
