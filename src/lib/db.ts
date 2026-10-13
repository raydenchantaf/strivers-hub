import 'server-only';
import { Pool, type PoolClient } from 'pg';

/**
 * The one Postgres connection pool for the whole site.
 *
 * In production DATABASE_URL is TAF's Neon database, the same one the
 * previous platform used, and the rebuild reads and writes its existing
 * tables as they are: users, assessment_submissions, mentorship_signups,
 * password_resets and account_events. Locally it is a Postgres made by
 * scripts/local-db.mjs with the same layout.
 *
 * Kept on globalThis so development hot reloads do not open a new pool each
 * time. On Vercel use Neon's pooled connection string.
 */

const url = process.env.DATABASE_URL;

type G = { __shPool?: Pool };
const g = globalThis as unknown as G;

export function pool(): Pool | null {
  if (!url) return null;
  if (!g.__shPool) {
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    g.__shPool = new Pool({
      /* Neon hands out `sslmode=require`; spell out the full certificate check
         it already gets today, before pg's next major version weakens it */
      connectionString: url.replace(/sslmode=require/, 'sslmode=verify-full'),
      max: 4,
      idleTimeoutMillis: 30_000,
      ssl: local ? undefined : { rejectUnauthorized: true },
    });
    g.__shPool.on('error', (err) => console.error('database pool error', err.message));
  }
  return g.__shPool;
}

/** The pool, or an error that says plainly what is missing. People data has
 *  nowhere else to go, so unlike analytics this cannot quietly do nothing. */
export function db(): Pool {
  const p = pool();
  if (!p) throw new Error('DATABASE_URL is not set: accounts and assessment results cannot be stored.');
  return p;
}

/** Runs `fn` in a transaction, rolling back if it throws. */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db().connect();
  try {
    await client.query('begin');
    const out = await fn(client);
    await client.query('commit');
    return out;
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
