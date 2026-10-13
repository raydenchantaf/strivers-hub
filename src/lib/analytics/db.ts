import 'server-only';
import { Pool } from 'pg';

/**
 * First-party analytics, storage.
 *
 * One Postgres table of raw events, written by /api/track and read by
 * /insights. Postgres because it is what the platform's people data is
 * recommended to live in (D2, §07): in production DATABASE_URL points at TAF's
 * Neon database, on the review environment at a local one. With no
 * DATABASE_URL, tracking is a no-op and /insights says so.
 *
 * What is stored, and what is not: a random per-tab session id; a visitor id
 * that is a hash of the IP address and browser with a salt that changes every
 * day, so the same person cannot be followed from one day to the next and the
 * address itself is never kept; the page path, language and device class; and
 * the event's own small payload. No names, emails, answers or IP addresses.
 */

const url = process.env.DATABASE_URL;

type G = { __shPool?: Pool; __shSchema?: Promise<void> };
const g = globalThis as unknown as G;

export function pool(): Pool | null {
  if (!url) return null;
  if (!g.__shPool) {
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    g.__shPool = new Pool({
      connectionString: url,
      max: 4,
      idleTimeoutMillis: 30_000,
      ssl: local ? undefined : { rejectUnauthorized: true },
    });
    g.__shPool.on('error', (err) => console.error('analytics pool error', err.message));
  }
  return g.__shPool;
}

const SCHEMA = `
create table if not exists analytics_events (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  day     date not null default (now() at time zone 'Asia/Kuala_Lumpur')::date,
  vid     text not null,
  sid     text not null,
  type    text not null,
  path    text not null,
  lang    text not null default '',
  dev     text not null default '',
  data    jsonb not null default '{}'::jsonb
);
create index if not exists analytics_events_day on analytics_events (day);
create index if not exists analytics_events_type_day on analytics_events (type, day);
create index if not exists analytics_events_path on analytics_events (path, type);
`;

export async function ready(): Promise<Pool | null> {
  const p = pool();
  if (!p) return null;
  if (!g.__shSchema) {
    g.__shSchema = p
      .query(SCHEMA)
      .then(() => undefined)
      .catch((err) => {
        g.__shSchema = undefined;
        throw err;
      });
  }
  await g.__shSchema;
  return p;
}

export type Row = {
  vid: string;
  sid: string;
  type: string;
  path: string;
  lang: string;
  dev: string;
  data: Record<string, unknown>;
};

export async function insert(rows: Row[]): Promise<void> {
  if (!rows.length) return;
  const p = await ready();
  if (!p) return;
  const values: unknown[] = [];
  const tuples = rows.map((r, i) => {
    values.push(r.vid, r.sid, r.type, r.path, r.lang, r.dev, JSON.stringify(r.data));
    const b = i * 7;
    return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7}::jsonb)`;
  });
  await p.query(
    `insert into analytics_events (vid, sid, type, path, lang, dev, data) values ${tuples.join(',')}`,
    values,
  );
}
