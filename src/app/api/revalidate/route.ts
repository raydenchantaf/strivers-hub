import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export const runtime = 'nodejs';

/**
 * Sanity webhook target. Point a webhook at POST /api/revalidate with the
 * secret in the `x-revalidate-secret` header and published edits appear
 * within seconds instead of waiting out the hourly revalidate.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { slug?: { current?: string } };
  // Next 16 wants an explicit cache-life profile; 'max' expires the entry
  // immediately on the next request rather than waiting out its own window.
  revalidateTag('sanity', 'max');
  revalidateTag('resource', 'max');
  if (body?.slug?.current) revalidateTag(`resource:${body.slug.current}`, 'max');

  return NextResponse.json({ ok: true, revalidated: Date.now() });
}
