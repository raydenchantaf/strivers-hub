import { NextResponse } from 'next/server';
import { clearSession, readSession } from '@/lib/auth/session';
import { deleteAccount, verify } from '@/lib/auth/store';
import { LIMITS, hit, tooMany } from '@/lib/ratelimit';

export const runtime = 'nodejs';

/**
 * Deletes the signed-in member's account, as the previous platform allowed.
 * The password is asked for again, so a session left open on a shared phone
 * cannot be used to delete someone's account.
 */
export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'UNAUTH' }, { status: 401 });

  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  if (!password) return NextResponse.json({ ok: false, error: 'MISSING' }, { status: 400 });
  const limit = await hit(LIMITS.accountAction, session.sub);
  if (!limit.ok) return tooMany(limit);

  const account = await verify(session.email, password);
  if (!account || account.id !== session.sub) {
    return NextResponse.json({ ok: false, error: 'INVALID' }, { status: 400 });
  }

  try {
    await deleteAccount(account.id);
  } catch (error) {
    console.error('account deletion failed', error);
    return NextResponse.json({ ok: false, error: 'FAILED' }, { status: 502 });
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
