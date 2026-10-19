import 'server-only';
import { getAllArticles, toView } from '@/lib/content';
import type { CardView } from '@/lib/content-format';

/**
 * Articles matched to an assessment stage: the ones whose categories suit the
 * stage come first, newest first within that. Used by the result screen at
 * the end of the assessment and by /results.
 *
 * The categories per stage are the CMS's own category titles, so an editor
 * who tags a new article with one of them sees it recommended without any
 * change here.
 */
const WANTED: Record<string, string[]> = {
  Aspiring: ['Digital Skills', 'Digital Presence', 'Business Growth', 'Legal'],
  Managing: ['Operations & Productivity', 'Marketing & Branding', 'Customer Retention', 'Finance'],
  Growing: ['Strategic Growth', 'Partnership', 'ESG', 'Networking'],
};

function rank(all: Awaited<ReturnType<typeof getAllArticles>>, stage: string, n: number): CardView[] {
  const preferred = WANTED[stage] ?? [];
  const score = (a: (typeof all)[number]) => a.categories.filter((c) => preferred.includes(c.en)).length;
  return all
    .filter((a) => a.kind === 'resource')
    .sort((a, b) => score(b) - score(a) || (b.publishedAt || '').localeCompare(a.publishedAt || ''))
    .slice(0, n)
    .map((a) => {
      /* lead with the category that made it a match, since the card shows the first */
      const v = toView(a);
      v.categories = [...v.categories].sort((x, y) => Number(preferred.includes(y.en)) - Number(preferred.includes(x.en)));
      return v;
    });
}

/** For one stage, by its English name (Aspiring, Managing, Growing). */
export async function recommendedFor(stage: string, n = 3): Promise<CardView[]> {
  return rank(await getAllArticles(), stage, n);
}

/** For every stage at once, so a static page can carry all three and pick on the client. */
export async function recommendedByStage(stages: string[], n = 3): Promise<Record<string, CardView[]>> {
  const all = await getAllArticles();
  return Object.fromEntries(stages.map((s) => [s, rank(all, s, n)]));
}
