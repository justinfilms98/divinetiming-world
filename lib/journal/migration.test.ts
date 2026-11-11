import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'supabase/migrations');
const sql = readFileSync(join(dir, '061_journal.sql'), 'utf8').toLowerCase().replace(/\s+/g, ' ');
const down = readFileSync(join(dir, '061_journal.down.sql'), 'utf8').toLowerCase();

function policy(name: string): string {
  const start = sql.indexOf(`create policy "${name.toLowerCase()}"`);
  expect(start, name).toBeGreaterThan(-1);
  return sql.slice(start, sql.indexOf(';', start));
}

describe('migration 061 (Journal)', () => {
  it('creates the public switch switched off', () => {
    expect(sql).toContain('public_enabled boolean not null default false');
    expect(sql).toContain('insert into public.journal_settings (id, public_enabled) values (true, false)');
  });

  it('every visitor read of episodes and videos requires the switch to be on', () => {
    for (const name of [
      'Anon read public journal episodes',
      'Auth read public or admin journal episodes',
      'Anon read published journal videos',
      'Auth read published or admin journal videos',
    ]) {
      expect(policy(name), name).toContain('exists (select 1 from public.journal_settings s where s.public_enabled)');
    }
  });

  it('videos are readable only for published episodes; admins keep full access', () => {
    expect(policy('Anon read published journal videos')).toContain("e.status = 'published'");
    expect(policy('Anon read published journal videos')).not.toContain('coming_soon');
    expect(policy('Auth read public or admin journal episodes')).toContain('public.is_admin()');
    expect(policy('Auth read published or admin journal videos')).toContain('public.is_admin()');
  });

  it('visitors can never write, and nothing outside the three new tables is altered', () => {
    expect(sql).toContain('revoke insert, update, delete, truncate on public.journal_settings, public.journal_episodes, public.journal_episode_videos from anon, authenticated');
    expect(sql).not.toMatch(/create policy [^;]* for (insert|update|delete|all)/);
    // Every statement is one of these shapes, all on Journal tables; nothing drops, updates or deletes.
    const statements = readFileSync(join(dir, '061_journal.sql'), 'utf8')
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join(' ')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    const allowed = [
      /^create table if not exists public\.journal_(settings|episodes|episode_videos) \(/,
      /^insert into public\.journal_settings \(id, public_enabled\) values \(true, false\) on conflict \(id\) do nothing$/,
      /^create (unique )?index if not exists journal_\w+ on public\.journal_episodes /,
      /^create trigger journal_\w+ before update on public\.journal_\w+ for each row execute function public\.update_updated_at_column\(\)$/,
      /^alter table public\.journal_\w+ enable row level security$/,
      /^create policy "[^"]+" on public\.journal_\w+ for select to /,
      /^revoke insert, update, delete, truncate on public\.journal_settings, public\.journal_episodes, public\.journal_episode_videos from anon, authenticated$/,
    ];
    for (const statement of statements) {
      expect(allowed.some((re) => re.test(statement)), statement.slice(0, 80)).toBe(true);
    }
    expect(statements).toHaveLength(18);
  });

  it('the down script drops exactly the three Journal tables', () => {
    const drops = [...down.matchAll(/drop table if exists ([\w.]+)/g)].map((m) => m[1]);
    expect(drops.sort()).toEqual(['public.journal_episode_videos', 'public.journal_episodes', 'public.journal_settings']);
  });
});
