/**
 * Minimal in-memory stand-in for the Supabase query builder, for route-handler tests.
 * Supports the chains the admin routes use: select/update/insert/delete + eq + in + order +
 * single/maybeSingle, awaited directly. Never talks to a real database.
 */

type Row = Record<string, unknown>;
type Op = 'select' | 'update' | 'insert' | 'delete';
export type FakeError = { message: string; code?: string };

export interface FakeDb {
  tables: Record<string, Row[]>;
  /** Return an error to make one operation fail (checked per matching row for update/delete). */
  failOn?: (op: Op, table: string, row?: Row) => FakeError | null;
  calls: { op: Op; table: string; payload?: unknown; filters: [string, unknown][] }[];
}

class Query implements PromiseLike<{ data: unknown; error: FakeError | null }> {
  private op: Op = 'select';
  private payload: Row | null = null;
  private filters: [string, unknown][] = [];
  private inFilters: [string, readonly unknown[]][] = [];
  private returnRows = false;
  private mode: 'many' | 'single' | 'maybe' = 'many';

  constructor(
    private db: FakeDb,
    private table: string
  ) {}

  select() {
    this.returnRows = true;
    return this;
  }
  update(values: Row) {
    this.op = 'update';
    this.payload = values;
    return this;
  }
  insert(values: Row) {
    this.op = 'insert';
    this.payload = values;
    return this;
  }
  delete() {
    this.op = 'delete';
    return this;
  }
  eq(col: string, value: unknown) {
    this.filters.push([col, value]);
    return this;
  }
  in(col: string, values: readonly unknown[]) {
    this.inFilters.push([col, values]);
    return this;
  }
  order() {
    return this;
  }
  limit() {
    return this;
  }
  single() {
    this.mode = 'single';
    return this;
  }
  maybeSingle() {
    this.mode = 'maybe';
    return this;
  }

  private run(): { data: unknown; error: FakeError | null } {
    const rows = (this.db.tables[this.table] ??= []);
    this.db.calls.push({ op: this.op, table: this.table, payload: this.payload ?? undefined, filters: [...this.filters] });
    const matches = (r: Row) =>
      this.filters.every(([c, v]) => r[c] === v) && this.inFilters.every(([c, vs]) => vs.includes(r[c]));
    let out: Row[] = [];

    if (this.op === 'select') {
      const err = this.db.failOn?.('select', this.table);
      if (err) return { data: null, error: err };
      out = rows.filter(matches).map((r) => ({ ...r }));
    } else if (this.op === 'insert') {
      const err = this.db.failOn?.('insert', this.table, this.payload ?? undefined);
      if (err) return { data: null, error: err };
      const row = { id: `fake-${rows.length + 1}`, ...this.payload };
      rows.push(row);
      out = [{ ...row }];
    } else if (this.op === 'update') {
      for (const r of rows.filter(matches)) {
        const err = this.db.failOn?.('update', this.table, r);
        if (err) return { data: null, error: err };
        Object.assign(r, this.payload);
        out.push({ ...r });
      }
    } else {
      for (const r of rows.filter(matches)) {
        const err = this.db.failOn?.('delete', this.table, r);
        if (err) return { data: null, error: err };
      }
      this.db.tables[this.table] = rows.filter((r) => !matches(r));
    }

    if (this.mode === 'single') {
      if (out.length !== 1) return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } };
      return { data: out[0], error: null };
    }
    if (this.mode === 'maybe') return { data: out[0] ?? null, error: null };
    return { data: this.returnRows || this.op === 'select' ? out : null, error: null };
  }

  then<A = { data: unknown; error: FakeError | null }, B = never>(
    onfulfilled?: ((value: { data: unknown; error: FakeError | null }) => A | PromiseLike<A>) | null,
    onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null
  ): PromiseLike<A | B> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }
}

export function createFakeDb(tables: Record<string, Row[]>, failOn?: FakeDb['failOn']): FakeDb {
  return { tables: structuredClone(tables), failOn, calls: [] };
}

export function fakeSupabase(db: FakeDb) {
  return { from: (table: string) => new Query(db, table) };
}
