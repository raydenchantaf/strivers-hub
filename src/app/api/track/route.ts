import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { insert, type Row } from '@/lib/analytics/db';

/**
 * Receives batches of first-party analytics events from the browser
 * (src/lib/analytics/client.ts) and stores them (src/lib/analytics/db.ts).
 *
 * Every field is checked and clipped; anything unexpected is dropped rather
 * than rejected, so a malformed event never costs the rest of its batch.
 * Crawlers and headless browsers are not counted. The IP address is used
 * once, to make a visitor id that changes every day, and is never stored.
 */

export const runtime = 'nodejs';

const TYPES = new Set([
  'pv', 'dwell', 'sec', 'click', 'guide', 'partner', 'field', 'quiz', 'hive', 'mood', 'mascot', 'loader',
]);
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless|python-requests|curl|wget/i;
const MAX_BATCH = 40;
const PER_MINUTE = 240;

/* a small in-memory ceiling per visitor; enough to stop a runaway script
   flooding the table, not meant as security */
const seen = new Map<string, { n: number; at: number }>();

function salt(): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${process.env.AUTH_SECRET ?? 'sh'}:${day}`).digest('hex');
}

function clip(v: unknown, n: number): string {
  return typeof v === 'string' ? v.slice(0, n) : '';
}

/** Keep only short scalar values: nothing nested, nothing long. */
function cleanData(d: unknown): Record<string, unknown> {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d as Record<string, unknown>).slice(0, 12)) {
    if (!/^[a-z]{1,12}$/i.test(k)) continue;
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = Math.round(v * 1000) / 1000;
    else if (typeof v === 'string') out[k] = v.slice(0, 120);
    else if (typeof v === 'boolean') out[k] = v;
  }
  return out;
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return new NextResponse(null, { status: 204 });
  const ua = request.headers.get('user-agent') ?? '';
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });

  let body: { s?: unknown; l?: unknown; v?: unknown; e?: unknown };
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const events = Array.isArray(body.e) ? body.e.slice(0, MAX_BATCH) : [];
  if (!events.length) return new NextResponse(null, { status: 204 });

  const ip =
    /* only the headers Vercel sets itself: a client-sent cf-connecting-ip
       (the site is not behind Cloudflare's proxy) would let one browser pose
       as many visitors */
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    'unknown';
  const vid = createHash('sha256').update(`${salt()}:${ip}:${ua}`).digest('hex').slice(0, 20);

  const now = Date.now();
  const bucket = seen.get(vid);
  if (bucket && now - bucket.at < 60_000) {
    if (bucket.n > PER_MINUTE) return new NextResponse(null, { status: 204 });
    bucket.n += events.length;
  } else {
    seen.set(vid, { n: events.length, at: now });
    if (seen.size > 5000) seen.clear();
  }

  const sid = clip(body.s, 24) || 'none';
  const lang = ['en', 'ms'].includes(String(body.l)) ? String(body.l) : '';
  const dev = ['m', 'd'].includes(String(body.v)) ? String(body.v) : '';

  const rows: Row[] = [];
  for (const raw of events) {
    if (!raw || typeof raw !== 'object') continue;
    const e = raw as { t?: unknown; p?: unknown; d?: unknown };
    const type = String(e.t);
    if (!TYPES.has(type)) continue;
    const path = clip(e.p, 160);
    if (!path.startsWith('/')) continue;
    rows.push({ vid, sid, type, path, lang, dev, data: cleanData(e.d) });
  }

  try {
    await insert(rows);
  } catch (err) {
    /* analytics must never break the site; log and move on */
    console.error('analytics insert failed', (err as Error).message);
  }
  return new NextResponse(null, { status: 204 });
}
