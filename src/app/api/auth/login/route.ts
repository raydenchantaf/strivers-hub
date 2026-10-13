import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';
import { verify } from '@/lib/auth/store';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { email, password } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'MISSING' }, { status: 400 });
  }

  const account = await verify(email, password);
  // one message for both cases, so the form cannot be used to enumerate accounts
  if (!account) {
    return NextResponse.json({ ok: false, error: 'INVALID' }, { status: 401 });
  }

  await createSession({
    sub: account.id,
    email: account.email,
    name: [account.firstName, account.lastName].filter(Boolean).join(' '),
  });
  return NextResponse.json({ ok: true });
}
