/**
 * The public Journal switch (journal_settings.public_enabled, migration 061), read on the server.
 * It is the only launch switch: database rules use the same value, so while it's off no visitor
 * query returns Journal content, whatever a page or API asks for.
 */
import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/** False unless the switch is on; also false if the table is missing or can't be read. */
export const isJournalPublic = cache(async (): Promise<boolean> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('journal_settings').select('public_enabled').maybeSingle();
    return !error && data?.public_enabled === true;
  } catch {
    return false;
  }
});
