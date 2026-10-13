import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db, transaction } from '@/lib/db';

/**
 * Accounts live in TAF's Neon database, in the `users` table the previous
 * platform created and filled. Nothing is migrated: existing members keep
 * their accounts and passwords (bcrypt, as before), and new ones are added
 * the same way, so the old export and statistics keep working.
 *
 * Everything above this module talks to the functions here, never to SQL.
 * Account ids are the table's integer ids, carried as strings in the session.
 */

export type Account = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type UserRow = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  password_hash: string;
  created_at: Date | null;
};

const ROUNDS = 12;

const norm = (email: string) => email.toLowerCase().trim();
const toAccount = (r: Pick<UserRow, 'id' | 'email' | 'first_name' | 'last_name'>): Account => ({
  id: String(r.id),
  email: r.email,
  firstName: r.first_name,
  lastName: r.last_name,
});
/** Session ids are strings. Anything that is not a positive integer (a stale
 *  session from an older build, say) matches no account. */
const idOf = (id: string): number | null => (/^\d{1,10}$/.test(id) ? Number(id) : null);

/** The sign-up and deletion log behind TAF's account statistics. It holds no
 *  personal data. A failure here is not worth failing the action over. */
async function logEvent(type: 'registered' | 'deleted') {
  await db()
    .query(`insert into account_events (event_type) values ($1)`, [type])
    .catch((err) => console.error('[account_events] not recorded', err.message));
}

export async function findByEmail(email: string): Promise<(Account & { passwordHash?: string }) | null> {
  const { rows } = await db().query<UserRow>(
    `select id, email, first_name, last_name, password_hash from users where email = $1 limit 1`,
    [norm(email)],
  );
  return rows[0] ? { ...toAccount(rows[0]), passwordHash: rows[0].password_hash } : null;
}

export async function createAccount(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<Account> {
  const email = norm(input.email);
  const phone = input.phone ? input.phone.replace(/[^\d+]/g, '') || null : null;
  try {
    const { rows } = await db().query<UserRow>(
      `insert into users (first_name, last_name, email, phone, password_hash)
       values ($1, $2, $3, $4, $5)
       returning id, email, first_name, last_name`,
      [input.firstName.trim(), input.lastName.trim(), email, phone, await bcrypt.hash(input.password, ROUNDS)],
    );
    await logEvent('registered');
    return toAccount(rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === '23505') throw new Error('ACCOUNT_EXISTS');
    throw error;
  }
}

export async function verify(email: string, password: string): Promise<Account | null> {
  const row = await findByEmail(email);
  if (!row?.passwordHash) return null;
  const ok = await bcrypt.compare(password, row.passwordHash);
  if (!ok) return null;
  return { id: row.id, email: row.email, firstName: row.firstName, lastName: row.lastName };
}

/** Basic strength rule, matched by the client-side hint on the form. Applies
 *  to new passwords only: existing members sign in with whatever they set. */
export function passwordProblem(password: string): string | null {
  if (password.length < 10) return 'TOO_SHORT';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return 'TOO_SIMPLE';
  return null;
}

/* ---------------------------------------------------------------- reset ---
   A reset token is a 32-byte random value. The `password_resets.token` column
   only ever holds its SHA-256, so a leaked copy of the table cannot be used to
   take an account over (the previous platform stored the token itself). The
   token exists only in the email. One hour, single use. */

const RESET_TTL_MS = 60 * 60 * 1000;

const digest = (token: string) => createHash('sha256').update(token).digest('hex');

/**
 * Issues a token for an account, or returns null when there is no such
 * account. Callers must answer the visitor identically either way - a form
 * that says "no such account" is an account-enumeration oracle.
 */
export async function startReset(email: string): Promise<{ token: string; account: Account } | null> {
  const row = await findByEmail(email);
  if (!row) return null;

  const token = randomBytes(32).toString('base64url');
  await transaction(async (c) => {
    // one live link per account: a newer request replaces any older one
    await c.query(`delete from password_resets where email = $1`, [row.email]);
    await c.query(`insert into password_resets (email, token, expires_at) values ($1, $2, $3)`, [
      row.email,
      digest(token),
      new Date(Date.now() + RESET_TTL_MS),
    ]);
  });

  return {
    token,
    account: { id: row.id, email: row.email, firstName: row.firstName, lastName: row.lastName },
  };
}

export type ResetFailure = 'BAD_TOKEN' | 'EXPIRED' | 'TOO_SHORT' | 'TOO_SIMPLE';

/** Consumes a token and sets the new password. The token is removed either
 *  way it ends, so a link cannot be replayed. */
export async function completeReset(
  token: string,
  password: string,
): Promise<{ ok: true; account: Account } | { ok: false; error: ResetFailure }> {
  const problem = passwordProblem(password);
  if (problem) return { ok: false, error: problem as ResetFailure };

  const hash = await bcrypt.hash(password, ROUNDS);
  return transaction(async (c) => {
    const reset = await c.query<{ email: string; expires_at: Date }>(
      `delete from password_resets where token = $1 returning email, expires_at`,
      [digest(token)],
    );
    const row = reset.rows[0];
    if (!row) return { ok: false as const, error: 'BAD_TOKEN' as const };
    if (row.expires_at.getTime() < Date.now()) return { ok: false as const, error: 'EXPIRED' as const };

    const user = await c.query<UserRow>(
      `update users set password_hash = $1 where email = $2 returning id, email, first_name, last_name`,
      [hash, row.email],
    );
    if (!user.rows[0]) return { ok: false as const, error: 'BAD_TOKEN' as const };
    await c.query(`delete from password_resets where email = $1`, [row.email]);
    return { ok: true as const, account: toAccount(user.rows[0]) };
  });
}

/** Used by the profile page, where the visitor is already signed in. */
export async function changePassword(
  id: string,
  current: string,
  next: string,
): Promise<{ ok: true } | { ok: false; error: 'INVALID' | 'TOO_SHORT' | 'TOO_SIMPLE' }> {
  const problem = passwordProblem(next);
  if (problem) return { ok: false, error: problem as 'TOO_SHORT' | 'TOO_SIMPLE' };

  const uid = idOf(id);
  if (uid === null) return { ok: false, error: 'INVALID' };
  const { rows } = await db().query<UserRow>(`select password_hash from users where id = $1`, [uid]);
  if (!rows[0] || !(await bcrypt.compare(current, rows[0].password_hash))) {
    return { ok: false, error: 'INVALID' };
  }

  await db().query(`update users set password_hash = $1 where id = $2`, [await bcrypt.hash(next, ROUNDS), uid]);
  return { ok: true };
}

/** The account behind a session, for the profile page. */
export async function findById(id: string): Promise<(Account & { phone?: string; createdAt?: string }) | null> {
  const uid = idOf(id);
  if (uid === null) return null;
  const { rows } = await db().query<UserRow>(
    `select id, email, first_name, last_name, phone, created_at from users where id = $1`,
    [uid],
  );
  const r = rows[0];
  if (!r) return null;
  return { ...toAccount(r), phone: r.phone ?? undefined, createdAt: r.created_at?.toISOString() };
}

/**
 * Give an account a result it has just earned anonymously. Only an unowned
 * result can be claimed, so an id sent from the browser cannot take over
 * someone else's.
 */
export async function attachResult(accountId: string, responseId: string): Promise<void> {
  const uid = idOf(accountId);
  const rid = idOf(responseId);
  if (uid === null || rid === null) return;
  await db().query(`update assessment_submissions set user_id = $1 where id = $2 and user_id is null`, [uid, rid]);
}

/**
 * On sign-in, adopt any earlier anonymous results that carry the member's
 * email in the contact question (q5i), as the previous platform did.
 */
export async function claimByEmail(accountId: string, email: string): Promise<void> {
  const uid = idOf(accountId);
  if (uid === null) return;
  await db().query(
    `update assessment_submissions set user_id = $1
     where user_id is null and answers_readable->>'q5i' = $2`,
    [uid, norm(email)],
  );
}

/**
 * Deletes an account, as the previous platform allowed. Its assessment
 * results are kept for the programme's reporting but no longer linked to
 * anyone, its reset links go, and the deletion is logged without personal
 * data.
 */
export async function deleteAccount(id: string): Promise<boolean> {
  const uid = idOf(id);
  if (uid === null) return false;
  const deleted = await transaction(async (c) => {
    const user = await c.query<{ email: string }>(`select email from users where id = $1`, [uid]);
    if (!user.rows[0]) return false;
    await c.query(`update assessment_submissions set user_id = null where user_id = $1`, [uid]);
    await c.query(`delete from password_resets where email = $1`, [user.rows[0].email]);
    await c.query(`delete from users where id = $1`, [uid]);
    return true;
  });
  if (deleted) await logEvent('deleted');
  return deleted;
}
