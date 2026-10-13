import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';
import { claimByEmail, verify } from '@/lib/auth/store';
import { LIMITS, clear, clientIp, hit, over, tooMany } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { email, password } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'MISSING' }, { status: 400 });
  }

  /* every attempt counts against the connection; only wrong passwords count
     against the account, so a member who types it right is never held up */
  const byIp = await hit(LIMITS.loginIp, clientIp(request));
  if (!byIp.ok) return tooMany(byIp);
  const byAccount = await over(LIMITS.loginFailEmail, email);
  if (!byAccount.ok) return tooMany(byAccount);

  const account = await verify(email, password);
  // one message for both cases, so the form cannot be used to enumerate accounts
  if (!account) {
    await hit(LIMITS.loginFailEmail, email);
    return NextResponse.json({ ok: false, error: 'INVALID' }, { status: 401 });
  }
  await clear(LIMITS.loginFailEmail, email);

  await createSession({
    sub: account.id,
    email: account.email,
    name: [account.firstName, account.lastName].filter(Boolean).join(' '),
  });

  /* results taken anonymously with this email become the member's, as on the
     previous platform; worth logging if it fails, not worth failing sign-in */
  await claimByEmail(account.id, account.email).catch((err) =>
    console.error('could not claim earlier results', err.message),
  );
  return NextResponse.json({ ok: true });
}
