import { NextResponse } from 'next/server';
import { SIGNED_IN_HINT, readSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Who is signed in, for the header. Called only when the page's signed-in
 * hint is present, so anonymous visitors never make this request. A hint
 * that outlived its session (expired, or a changed signing key) is removed
 * here, and the header falls back to Log In and Join Us.
 */
export async function GET() {
  const session = await readSession();
  const res = NextResponse.json(session ? { signedIn: true, name: session.name } : { signedIn: false }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
  if (!session) res.cookies.delete(SIGNED_IN_HINT);
  return res;
}
