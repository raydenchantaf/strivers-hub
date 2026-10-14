import 'server-only';
import { readSession, type Session } from '@/lib/auth/session';
import { pool } from '@/lib/db';

/**
 * Who may use /admin, and the record of what they did there.
 *
 * An administrator is someone with an ordinary site account whose email is on
 * the ADMIN_EMAILS list (comma-separated, set on the server). They sign in the
 * usual way; nothing about the account itself is special, so access is given
 * or taken away by editing one setting, with no code change.
 *
 * Every page and route under /admin checks this on the server. Because the
 * admin area shows people's personal data, every look-up, export and deletion
 * is written to the `admin_audit` table: who, when, what. The table is
 * created on first use, beside the platform's own tables.
 */

export type Admin = Session;

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** The signed-in administrator, or null. */
export async function currentAdmin(): Promise<Admin | null> {
  const session = await readSession();
  if (!session) return null;
  return adminEmails().includes(session.email.toLowerCase()) ? session : null;
}

/** Signed in at all, whether or not an administrator. */
export async function currentSession(): Promise<Session | null> {
  return readSession();
}

type G = { __shAuditSchema?: Promise<void> };
const g = globalThis as unknown as G;

const SCHEMA = `
create table if not exists admin_audit (
  id     bigserial primary key,
  at     timestamptz not null default now(),
  admin  text not null,
  action text not null,
  detail jsonb not null default '{}'::jsonb
);
create index if not exists admin_audit_at on admin_audit (at);
`;

async function ready() {
  const p = pool();
  if (!p) return null;
  if (!g.__shAuditSchema) {
    g.__shAuditSchema = p
      .query(SCHEMA)
      .then(() => undefined)
      .catch((err) => {
        g.__shAuditSchema = undefined;
        throw err;
      });
  }
  await g.__shAuditSchema;
  return p;
}

/**
 * Records an administrator's action. Unlike analytics this is not optional:
 * if the record cannot be written, the caller should not go ahead.
 */
export async function audit(admin: Admin, action: string, detail: Record<string, unknown> = {}): Promise<void> {
  const p = await ready();
  if (!p) throw new Error('DATABASE_URL is not set: admin actions cannot be recorded.');
  await p.query(`insert into admin_audit (admin, action, detail) values ($1, $2, $3::jsonb)`, [
    admin.email,
    action,
    JSON.stringify(detail),
  ]);
}

export type AuditRow = { at: string; admin: string; action: string; detail: Record<string, unknown> };

export async function recentAudit(limit = 50): Promise<AuditRow[]> {
  const p = await ready();
  if (!p) return [];
  const { rows } = await p.query<{ at: Date; admin: string; action: string; detail: Record<string, unknown> }>(
    `select at, admin, action, detail from admin_audit order by id desc limit $1`,
    [limit],
  );
  return rows.map((r) => ({ at: r.at.toISOString(), admin: r.admin, action: r.action, detail: r.detail }));
}
