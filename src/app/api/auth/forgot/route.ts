import { NextResponse } from 'next/server';
import { resetMail, send } from '@/lib/email';
import { startReset } from '@/lib/auth/store';

export const runtime = 'nodejs';

/**
 * Always answers `{ ok: true }`, whether or not the address has an account.
 * Anything else turns this form into a way of asking the platform who its
 * members are.
 */
export async function POST(request: Request) {
  const { email, lang } = (await request.json().catch(() => ({}))) as {
    email?: string;
    lang?: string;
  };
  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'BAD_EMAIL' }, { status: 400 });
  }

  const issued = await startReset(email).catch((err) => {
    console.error('[auth] reset could not be issued', err);
    return null;
  });

  if (issued) {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.strivershub.com';
    const link = `${base.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(issued.token)}`;
    await send({ to: issued.account.email, ...resetMail(link, lang === 'en' ? 'en' : 'bm') });
  }

  return NextResponse.json({ ok: true });
}
