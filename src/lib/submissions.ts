import 'server-only';
import { db } from '@/lib/db';

/**
 * Assessment results and mentorship sign-ups, in TAF's Neon database, in the
 * tables the previous platform created: `assessment_submissions` and
 * `mentorship_signups`. Rows are written in the same shape that platform
 * wrote, so TAF's Excel export (scripts/export.mjs in the old repository)
 * keeps working on old and new rows alike.
 */

export type Submission = {
  userId: string | null;
  language: 'en' | 'bm';
  score: number;
  category: string;
  /** option ids as given, keyed by question id */
  answers: Record<string, string | string[]>;
  /** readable text keyed by question id; see readableById() */
  answersReadable: Record<string, string>;
  otherTexts: Record<string, string>;
};

const idOf = (id: string | null): number | null => (id && /^\d{1,10}$/.test(id) ? Number(id) : null);

/** Stores one completed assessment and returns its row id. */
export async function saveSubmission(s: Submission): Promise<string> {
  const { rows } = await db().query<{ id: number }>(
    `insert into assessment_submissions
       (user_id, language, score, category, answers, answers_readable, other_texts)
     values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb)
     returning id`,
    [
      idOf(s.userId),
      s.language,
      s.score,
      s.category,
      JSON.stringify(s.answers),
      JSON.stringify(s.answersReadable),
      Object.keys(s.otherTexts).length ? JSON.stringify(s.otherTexts) : null,
    ],
  );
  return String(rows[0].id);
}

export type LatestResult = { score: number; category: string; submittedAt: string | null };

/** A member's most recent result, as the previous platform's dashboard read it. */
export async function latestResult(userId: string): Promise<LatestResult | null> {
  const uid = idOf(userId);
  if (uid === null) return null;
  const { rows } = await db().query<{ score: number; category: string; submitted_at: Date | null }>(
    `select score, category, submitted_at from assessment_submissions
     where user_id = $1 order by submitted_at desc nulls last, id desc limit 1`,
    [uid],
  );
  const r = rows[0];
  return r ? { score: Number(r.score), category: r.category, submittedAt: r.submitted_at?.toISOString() ?? null } : null;
}

/** The mentorship waiting list. */
export async function saveMentorship(m: { firstName: string; lastName: string; email: string; phone: string }) {
  await db().query(
    `insert into mentorship_signups (first_name, last_name, email, phone) values ($1, $2, $3, $4)`,
    [m.firstName, m.lastName, m.email, m.phone ? m.phone.replace(/[^\d+]/g, '') || null : null],
  );
}
