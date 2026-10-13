import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { writeClient, sanityFetch } from '@/sanity/client';

/**
 * Accounts live in the same Sanity dataset as the content, in a document type
 * that is read-only in the Studio and whose password field is hidden. That
 * keeps the number of services TAF has to own at one.
 *
 * If they would rather keep identity out of the CMS entirely, this module is
 * the only thing that has to change - everything above it talks to these four
 * functions. See docs/HANDOVER.md.
 */

export type Account = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

const BY_EMAIL = `*[_type == "user" && email == $email][0]{
  "id": _id, email, firstName, lastName, passwordHash
}`;

const BY_RESET = `*[_type == "user" && resetHash == $hash][0]{
  "id": _id, email, firstName, lastName, resetExpires
}`;

const ROUNDS = 12;

export async function findByEmail(
  email: string,
): Promise<(Account & { passwordHash?: string }) | null> {
  return sanityFetch(BY_EMAIL, {
    params: { email: email.toLowerCase().trim() },
    revalidate: 0,
  });
}

export async function createAccount(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<Account> {
  const email = input.email.toLowerCase().trim();
  const existing = await findByEmail(email);
  if (existing) throw new Error('ACCOUNT_EXISTS');

  const doc = await writeClient().create({
    _type: 'user',
    email,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone?.trim() ?? '',
    passwordHash: await bcrypt.hash(input.password, ROUNDS),
    createdAt: new Date().toISOString(),
  });

  return {
    id: doc._id,
    email,
    firstName: input.firstName,
    lastName: input.lastName,
  };
}

export async function verify(email: string, password: string): Promise<Account | null> {
  const row = await findByEmail(email);
  if (!row?.passwordHash) return null;
  const ok = await bcrypt.compare(password, row.passwordHash);
  if (!ok) return null;
  return { id: row.id, email: row.email, firstName: row.firstName, lastName: row.lastName };
}

/** Basic strength rule, matched by the client-side hint on the form. */
export function passwordProblem(password: string): string | null {
  if (password.length < 10) return 'TOO_SHORT';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return 'TOO_SIMPLE';
  return null;
}

/* ---------------------------------------------------------------- reset ---
   A reset token is a 32-byte random value. The dataset only ever holds its
   SHA-256, so a leaked export cannot be used to take an account over, and the
   token itself exists only in the email. One hour, single use. */

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
  await writeClient()
    .patch(row.id)
    .set({
      resetHash: digest(token),
      resetExpires: new Date(Date.now() + RESET_TTL_MS).toISOString(),
    })
    .commit();

  return {
    token,
    account: { id: row.id, email: row.email, firstName: row.firstName, lastName: row.lastName },
  };
}

export type ResetFailure = 'BAD_TOKEN' | 'EXPIRED' | 'TOO_SHORT' | 'TOO_SIMPLE';

/** Consumes a token and sets the new password. The token is cleared either
 *  way it ends, so a link cannot be replayed. */
export async function completeReset(
  token: string,
  password: string,
): Promise<{ ok: true; account: Account } | { ok: false; error: ResetFailure }> {
  const problem = passwordProblem(password);
  if (problem) return { ok: false, error: problem as ResetFailure };

  const row = await sanityFetch<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    resetExpires?: string;
  } | null>(BY_RESET, { params: { hash: digest(token) }, revalidate: 0 });

  if (!row) return { ok: false, error: 'BAD_TOKEN' };

  const expired = !row.resetExpires || Date.parse(row.resetExpires) < Date.now();
  if (expired) {
    await writeClient().patch(row.id).unset(['resetHash', 'resetExpires']).commit();
    return { ok: false, error: 'EXPIRED' };
  }

  await writeClient()
    .patch(row.id)
    .set({ passwordHash: await bcrypt.hash(password, ROUNDS) })
    .unset(['resetHash', 'resetExpires'])
    .commit();

  return {
    ok: true,
    account: { id: row.id, email: row.email, firstName: row.firstName, lastName: row.lastName },
  };
}

/** Used by the profile page, where the visitor is already signed in. */
export async function changePassword(
  id: string,
  current: string,
  next: string,
): Promise<{ ok: true } | { ok: false; error: 'INVALID' | 'TOO_SHORT' | 'TOO_SIMPLE' }> {
  const problem = passwordProblem(next);
  if (problem) return { ok: false, error: problem as 'TOO_SHORT' | 'TOO_SIMPLE' };

  const row = await sanityFetch<{ passwordHash?: string } | null>(
    `*[_type == "user" && _id == $id][0]{ passwordHash }`,
    { params: { id }, revalidate: 0 },
  );
  if (!row?.passwordHash || !(await bcrypt.compare(current, row.passwordHash))) {
    return { ok: false, error: 'INVALID' };
  }

  await writeClient().patch(id).set({ passwordHash: await bcrypt.hash(next, ROUNDS) }).commit();
  return { ok: true };
}

/** The account behind a session, for the profile page. */
export async function findById(id: string): Promise<(Account & { phone?: string; createdAt?: string }) | null> {
  return sanityFetch(
    `*[_type == "user" && _id == $id][0]{ "id": _id, email, firstName, lastName, phone, createdAt }`,
    { params: { id }, revalidate: 0 },
  );
}

/**
 * Point an account at an assessment response, and the response back at the
 * account.
 *
 * Two writes rather than one because the link is stored on both documents:
 * the account carries `lastResult` so the dashboard can show a score without
 * a second query, and the response carries `account` so TAF can go the other
 * way in the Studio - open a submission and see whose it is. Keeping only one
 * direction would make one of those a scan of every document.
 *
 * `setIfMissing` is deliberately not used on `lastResult`: taking the
 * assessment again should move the pointer to the new result, which is what
 * "latest assessment" means in the schema.
 */
export async function attachResult(accountId: string, responseId: string): Promise<void> {
  const client = writeClient();
  await client
    .patch(accountId)
    .set({ lastResult: { _type: 'reference', _ref: responseId } })
    .commit();
  await client
    .patch(responseId)
    .set({ account: { _type: 'reference', _ref: accountId } })
    .commit();
}
