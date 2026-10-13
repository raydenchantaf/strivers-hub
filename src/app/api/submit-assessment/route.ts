import { NextResponse } from 'next/server';
import { writeClient } from '@/sanity/client';
import { readSession } from '@/lib/auth/session';
import { attachResult } from '@/lib/auth/store';

export const runtime = 'nodejs';

type Payload = {
  language?: string;
  score?: number;
  category?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  consent?: boolean;
  answers?: Record<string, string>;
};

const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * Records one completed assessment. The response is deliberately thin: the
 * visitor's result is computed in the browser and shown whether or not this
 * write succeeds, so a CMS outage never costs someone their result.
 */
export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
  }

  const score = Number(body.score);
  if (!Number.isFinite(score) || score < 0 || score > 18) {
    return NextResponse.json({ ok: false, error: 'BAD_SCORE' }, { status: 400 });
  }

  const answers = Object.entries(body.answers ?? {})
    .slice(0, 40)
    .map(([question, answer]) => ({
      _type: 'object',
      _key: Math.random().toString(36).slice(2, 10),
      question: str(question, 300),
      answer: str(answer, 1000),
    }));

  /* Someone who is already signed in should not have to do anything for
     their result to be kept - it is attached on the way in. Anonymous
     visitors get the id back instead, and the result screen offers to create
     an account around it. */
  const session = await readSession();

  let id: string;
  try {
    const doc = await writeClient().create({
      _type: 'assessmentResponse',
      submittedAt: new Date().toISOString(),
      language: str(body.language, 4) || 'bm',
      score,
      category: str(body.category, 40),
      firstName: str(body.firstName, 80),
      lastName: str(body.lastName, 80),
      email: str(body.email, 160).toLowerCase(),
      phone: str(body.phone, 40),
      consent: body.consent === true,
      answers,
      ...(session ? { account: { _type: 'reference', _ref: session.sub } } : {}),
    });
    id = doc._id;
  } catch (error) {
    console.error('assessment write failed', error);
    return NextResponse.json({ ok: false, error: 'WRITE_FAILED' }, { status: 502 });
  }

  /* The back-reference is a second write, and a failure here is not worth
     losing the response over: the result document already carries the link.
     Logged, not thrown. */
  if (session) {
    try {
      await attachResult(session.sub, id);
    } catch (error) {
      console.error('could not point the account at its new result', error);
    }
  }

  return NextResponse.json({ ok: true, id, saved: Boolean(session) });
}
