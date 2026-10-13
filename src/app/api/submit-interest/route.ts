import { NextResponse } from 'next/server';
import { writeClient } from '@/sanity/client';

export const runtime = 'nodejs';

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mentorship waiting list. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
  }

  const email = str(body.email, 160).toLowerCase();
  if (!EMAIL.test(email)) {
    return NextResponse.json({ ok: false, error: 'BAD_EMAIL' }, { status: 400 });
  }

  try {
    await writeClient().create({
      _type: 'mentorshipInterest',
      submittedAt: new Date().toISOString(),
      firstName: str(body.firstName, 80),
      lastName: str(body.lastName, 80),
      email,
      phone: str(body.phone, 40),
      language: str(body.language, 4) || 'bm',
    });
  } catch (error) {
    console.error('interest write failed', error);
    return NextResponse.json({ ok: false, error: 'WRITE_FAILED' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
