import { NextResponse } from 'next/server';
import { configured, grant, passwordMatches } from '@/lib/analytics/gate';
import { LIMITS, clear, clientIp, hit, over, tooMany } from '@/lib/ratelimit';

export const runtime = 'nodejs';

/* ten wrong tries per connection per ten minutes: plenty for a person who
   mistyped, useless to anyone guessing */
export async function POST(request: Request) {
  if (!configured()) return NextResponse.json({ ok: false, error: 'NOT_CONFIGURED' }, { status: 503 });
  const ip = clientIp(request);
  const limit = await over(LIMITS.insightsIp, ip);
  if (!limit.ok) return tooMany(limit);

  let password = '';
  try {
    password = String(((await request.json()) as { password?: unknown }).password ?? '');
  } catch {
    /* empty */
  }
  if (!passwordMatches(password)) {
    await hit(LIMITS.insightsIp, ip);
    return NextResponse.json({ ok: false, error: 'WRONG' }, { status: 401 });
  }
  await clear(LIMITS.insightsIp, ip);
  await grant();
  return NextResponse.json({ ok: true });
}
