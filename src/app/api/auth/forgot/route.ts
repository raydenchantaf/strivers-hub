import { NextResponse } from 'next/server';
import { resetMail, send } from '@/lib/email';
import { startReset } from '@/lib/auth/store';
import { LIMITS, clientIp, hit, tooMany } from '@/lib/ratelimit';

export const runtime = 'nodejs';

/**
 * Always answers `{ ok: true }`, whether or not the address has an account.
 * Anything else turns this form into a way of asking the platform who its
 * members are.
 *
 * The same goes for the per-account limit: past three requests an hour the
 * form still says it sent the email, and quietly does not, so it can neither
 * flood a member's inbox nor reveal anything by refusing.
 */
export async function POST(request: Request) {
  const { email, lang } = (await request.json().catch(() => ({}))) as {
    email?: string;
    lang?: string;
  };
  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'BAD_EMAIL' }, { status: 400 });
  }

  const byIp = await hit(LIMITS.forgotIp, clientIp(request));
  if (!byIp.ok) return tooMany(byIp);
  const byAccount = await hit(LIMITS.forgotEmail, email);
  if (!byAccount.ok) return NextResponse.json({ ok: true });

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
