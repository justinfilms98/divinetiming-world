-- Rollback for 061_journal.sql
-- Destructive: deletes every Journal episode, video reference and the launch switch. Not for a
-- normal rollback (switch the Journal off or roll back the deploy instead). Export the tables
-- first. Drops nothing outside these three tables; cover images stay in the Media Library.

drop table if exists public.journal_episode_videos;
drop table if exists public.journal_episodes;
drop table if exists public.journal_settings;
