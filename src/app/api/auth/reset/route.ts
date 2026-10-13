import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';
import { completeReset } from '@/lib/auth/store';
import { LIMITS, clientIp, hit, tooMany } from '@/lib/ratelimit';

export const runtime = 'nodejs';

/** Consumes the token, sets the password, and signs the visitor straight in -
 *  they have just proved control of the mailbox, so a second login form would
 *  be friction for nothing. */
export async function POST(request: Request) {
  const { token, password } = (await request.json().catch(() => ({}))) as {
    token?: string;
    password?: string;
  };
  if (!token || !password) {
    return NextResponse.json({ ok: false, error: 'MISSING' }, { status: 400 });
  }
  const limit = await hit(LIMITS.resetIp, clientIp(request));
  if (!limit.ok) return tooMany(limit);

  const result = await completeReset(token, password);
  if (!result.ok) {
    const status = result.error === 'BAD_TOKEN' || result.error === 'EXPIRED' ? 410 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  await createSession({
    sub: result.account.id,
    email: result.account.email,
    name: [result.account.firstName, result.account.lastName].filter(Boolean).join(' '),
  });
  return NextResponse.json({ ok: true });
}
