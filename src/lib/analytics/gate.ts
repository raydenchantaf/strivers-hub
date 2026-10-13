import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

/**
 * The lock on /insights. One shared password (INSIGHTS_PASSWORD) for the
 * people who read the dashboard, exchanged for a signed cookie that lasts
 * twelve hours, httpOnly and same-site strict. Separate from
 * member accounts on purpose: reading the platform's analytics is not
 * something a member account should ever be able to do.
 */

const COOKIE = 'sh_insights';
const MAX_AGE = 12 * 60 * 60;

function key(): Uint8Array | null {
  const s = process.env.AUTH_SECRET;
  return s ? new TextEncoder().encode(`insights:${s}`) : null;
}

export function configured(): boolean {
  return Boolean(process.env.INSIGHTS_PASSWORD && process.env.AUTH_SECRET);
}

export function passwordMatches(given: string): boolean {
  const want = process.env.INSIGHTS_PASSWORD ?? '';
  if (!want) return false;
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(want).digest();
  return timingSafeEqual(a, b);
}

export async function grant(): Promise<void> {
  const k = key();
  if (!k) return;
  const token = await new SignJWT({ scope: 'insights' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(k);
  /* path '/', not the dashboard's own paths: a response can carry only one
     cookie of a given name, and the dashboard needs it on both /insights and
     /api/insights. httpOnly and same-site strict, so it is inert elsewhere. */
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function revoke(): Promise<void> {
  (await cookies()).set(COOKIE, '', { path: '/', maxAge: 0 });
}

export async function allowed(): Promise<boolean> {
  const k = key();
  if (!k) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, k);
    return payload.scope === 'insights';
  } catch {
    return false;
  }
}
