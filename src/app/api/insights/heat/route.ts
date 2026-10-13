import { NextResponse } from 'next/server';
import { allowed } from '@/lib/analytics/gate';
import { heat, RANGES, type Range } from '@/lib/analytics/insights';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await allowed())) return NextResponse.json({ error: 'UNAUTHORISED' }, { status: 401 });
  const url = new URL(request.url);
  const path = (url.searchParams.get('path') ?? '/').slice(0, 160);
  const dev = url.searchParams.get('dev') === 'm' ? 'm' : 'd';
  const r = Number(url.searchParams.get('r'));
  const range: Range = (RANGES as number[]).includes(r) ? (r as Range) : 30;
  const data = await heat(path.startsWith('/') ? path : '/', dev, range);
  return NextResponse.json(data ?? { points: [], vw: 0, h: 0, clicks: 0 }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
