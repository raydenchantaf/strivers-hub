import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { changePassword } from '@/lib/auth/store';
import { LIMITS, hit, tooMany } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'UNAUTH' }, { status: 401 });

  const { current, next } = (await request.json().catch(() => ({}))) as {
    current?: string;
    next?: string;
  };
  if (!current || !next) {
    return NextResponse.json({ ok: false, error: 'MISSING' }, { status: 400 });
  }
  const limit = await hit(LIMITS.accountAction, session.sub);
  if (!limit.ok) return tooMany(limit);

  const result = await changePassword(session.sub, current, next);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
