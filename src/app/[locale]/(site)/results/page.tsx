import type { Metadata } from 'next';
import { alternates, localeOf } from '@/lib/i18n/routing';
import { cookies } from 'next/headers';
import { ResultsView } from './ResultsView';
import { readSession } from '@/lib/auth/session';
import { latestResult } from '@/lib/submissions';
import { recommendedFor } from '@/lib/recommend';
import { bandOf, MAX_SCORE } from '@/lib/assessment/scoring';
import { getBands } from '@/lib/assessment/grades';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: 'Your assessment result',
  // Nothing here is the same for two visitors, and half of it is personal.
  robots: { index: false, follow: false },
    alternates: alternates('/results', localeOf(`/${locale}`)),
  };
}

/**
 * The result as its own page, so it can be returned to, linked from the
 * dashboard, and read after the tool has been closed.
 *
 * It is guarded. The live platform renders this route for anyone who asks:
 * with no score in hand the value falls back to zero, zero sits below the
 * lowest band, and the page confidently tells a first-time visitor they are
 * an Aspiring entrepreneur. Here, no score means no result - the page says
 * so and points at the assessment instead.
 */
export default async function Page() {
  const session = await readSession();

  let score: number | null = null;
  let takenAt: string | null = null;

  if (session) {
    const row = await latestResult(session.sub).catch((err) => {
      console.error('[results] latest result unavailable', err.message);
      return null;
    });
    if (typeof row?.score === 'number') {
      score = row.score;
      takenAt = row.submittedAt ?? null;
    }
  }

  /* Anyone who has just finished the tool without registering has the score
     in a cookie. Range-checked rather than trusted: it is a client value. */
  if (score === null) {
    const raw = (await cookies()).get('sh_result')?.value;
    const parsed = raw === undefined ? NaN : Number(raw);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= MAX_SCORE) {
      score = parsed;
    }
  }

  if (score === null) {
    return <ResultsView band={null} score={null} takenAt={null} recommended={[]} />;
  }

  const list = await getBands();
  const band = bandOf(score, list);
  const recommended = await recommendedFor(band.key.en, 3);

  return (
    <ResultsView
      band={band}
      score={score}
      takenAt={takenAt}
      recommended={recommended}
    />
  );
}
