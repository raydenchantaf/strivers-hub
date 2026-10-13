import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';
import { attachResult, createAccount, passwordProblem } from '@/lib/auth/store';

export const runtime = 'nodejs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, string>;
  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  const name = (body.name ?? '').trim();

  if (!EMAIL.test(email)) {
    return NextResponse.json({ ok: false, error: 'BAD_EMAIL' }, { status: 400 });
  }
  const weak = passwordProblem(password);
  if (weak) return NextResponse.json({ ok: false, error: weak }, { status: 400 });

  const [firstName, ...rest] = name.split(/\s+/);
  try {
    const account = await createAccount({
      email,
      password,
      firstName: firstName ?? '',
      lastName: rest.join(' '),
      phone: body.phone,
    });
    await createSession({ sub: account.id, email, name });

    /* Registering from the result screen carries the response the visitor has
       just earned, so the account adopts it. Anything else - the ordinary
       /register page - sends no id and this does nothing.

       A failure here must not fail the registration: the account exists, the
       session is set, and the visitor is signed in. Losing the link is worth
       reporting, not worth telling them their sign-up failed when it did not.

       `_id` is checked rather than trusted: it arrives from the browser, and
       it addresses a document we are about to write to. Sanity ids from
       `create()` are of the form `<uuid>` or `drafts.<uuid>`; nothing else is
       accepted, so this cannot be pointed at another document type. */
    const resultId = typeof body.resultId === 'string' ? body.resultId.trim() : '';
    if (resultId && /^[A-Za-z0-9._-]{8,64}$/.test(resultId) && !resultId.startsWith('drafts.')) {
      try {
        await attachResult(account.id, resultId);
      } catch (error) {
        console.error('could not attach the assessment result to the new account', error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'ACCOUNT_EXISTS') {
      return NextResponse.json({ ok: false, error: 'ACCOUNT_EXISTS' }, { status: 409 });
    }
    console.error('register failed', error);
    return NextResponse.json({ ok: false, error: 'FAILED' }, { status: 502 });
  }
}
