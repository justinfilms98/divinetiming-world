-- Rollback for 061_journal.sql
-- Destructive: deletes every Journal episode and video reference. Export both
-- tables before running in production. Drops nothing outside these two tables;
-- cover images stay in the Media Library and storage.

drop table if exists public.journal_episode_videos;
drop table if exists public.journal_episodes;
