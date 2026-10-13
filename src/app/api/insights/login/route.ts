import { NextResponse } from 'next/server';
import { configured, grant, passwordMatches } from '@/lib/analytics/gate';

export const runtime = 'nodejs';

/* ten tries per address per ten minutes: plenty for a person who mistyped,
   useless to anyone guessing */
const tries = new Map<string, { n: number; at: number }>();

export async function POST(request: Request) {
  if (!configured()) return NextResponse.json({ ok: false, error: 'NOT_CONFIGURED' }, { status: 503 });
  const ip =
    request.headers.get('cf-connecting-ip') ||
    (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    'local';
  const now = Date.now();
  const t = tries.get(ip);
  if (t && now - t.at < 10 * 60_000 && t.n >= 10) {
    return NextResponse.json({ ok: false, error: 'TOO_MANY' }, { status: 429 });
  }
  let password = '';
  try {
    password = String(((await request.json()) as { password?: unknown }).password ?? '');
  } catch {
    /* empty */
  }
  if (!passwordMatches(password)) {
    tries.set(ip, t && now - t.at < 10 * 60_000 ? { n: t.n + 1, at: t.at } : { n: 1, at: now });
    return NextResponse.json({ ok: false, error: 'WRONG' }, { status: 401 });
  }
  tries.delete(ip);
  await grant();
  return NextResponse.json({ ok: true });
}
