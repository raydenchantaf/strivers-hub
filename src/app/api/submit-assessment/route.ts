import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { questions } from '@/lib/assessment/questions';
import { bandOf, readableById, scoreOf } from '@/lib/assessment/scoring';
import { getBands } from '@/lib/assessment/grades';
import type { Answers } from '@/lib/assessment/types';
import { saveSubmission } from '@/lib/submissions';

export const runtime = 'nodejs';

type Payload = {
  language?: string;
  answers?: unknown;
  otherTexts?: unknown;
};

/* every id the form can send: the questions, plus the contact sub-fields */
const KNOWN = new Set<string>(
  Object.values(questions).flatMap((q) => [q.id, ...(q.fields ?? []).map((f) => f.id)]),
);

const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Only known question ids, with short string or string-list values. */
function cleanAnswers(raw: unknown): Answers {
  const out: Answers = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!KNOWN.has(id)) continue;
    if (Array.isArray(v)) out[id] = v.slice(0, 20).map((x) => clip(x, 200)).filter(Boolean);
    else if (typeof v === 'string') out[id] = clip(v, 500);
  }
  return out;
}

function cleanTexts(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (KNOWN.has(id) && typeof v === 'string' && v.trim()) out[id] = clip(v, 300);
  }
  return out;
}

/**
 * Records one completed assessment in `assessment_submissions`. The visitor's
 * result is computed in the browser and shown whether or not this write
 * succeeds, so a database outage never costs someone their result. The score
 * and stage stored here are worked out again from the answers, not taken from
 * the browser.
 */
export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: 'BAD_JSON' }, { status: 400 });
  }

  const answers = cleanAnswers(body.answers);
  const otherTexts = cleanTexts(body.otherTexts);
  if (!answers.q1) return NextResponse.json({ ok: false, error: 'NO_ANSWERS' }, { status: 400 });

  const language = body.language === 'en' ? 'en' : 'bm';
  const score = scoreOf(answers);
  const band = bandOf(score, await getBands());

  /* Someone who is already signed in should not have to do anything for
     their result to be kept - it is attached on the way in. Anonymous
     visitors get the id back instead, and the result screen offers to create
     an account around it. */
  const session = await readSession();

  try {
    const id = await saveSubmission({
      userId: session?.sub ?? null,
      language,
      score,
      category: band.key.en,
      answersReadable: readableById(answers, language, otherTexts),
    });
    return NextResponse.json({ ok: true, id, saved: Boolean(session) });
  } catch (error) {
    console.error('assessment write failed', error);
    return NextResponse.json({ ok: false, error: 'WRITE_FAILED' }, { status: 502 });
  }
}
