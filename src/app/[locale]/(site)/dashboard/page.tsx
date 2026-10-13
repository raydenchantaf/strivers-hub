import type { Metadata } from 'next';
import { alternates, localeOf } from '@/lib/i18n/routing';
import { redirect } from 'next/navigation';
import { DashboardView } from './DashboardView';
import { readSession } from '@/lib/auth/session';
import { sanityFetch } from '@/sanity/client';
import { getAllArticles, toView } from '@/lib/content';
import { bandOf } from '@/lib/assessment/scoring';
import { getBands } from '@/lib/assessment/grades';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: 'My dashboard',
  robots: { index: false, follow: false },
    alternates: alternates('/dashboard', localeOf(`/${locale}`)),
  };
}

const LATEST_RESULT = `*[_type == "assessmentResponse" && email == $email]
  | order(submittedAt desc)[0]{ score, category, submittedAt }`;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await readSession();
  if (!session) redirect(`/${locale}/login`);

  const result = await sanityFetch<{
    score?: number;
    category?: string;
    submittedAt?: string;
  } | null>(LATEST_RESULT, { params: { email: session.email }, revalidate: 0 }).catch(() => null);

  const list = await getBands();
  const band =
    typeof result?.score === 'number'
      ? bandOf(result.score, list)
      : list.find((b) => b.key.en === result?.category) ?? null;

  /* Recommendations follow the band: an Aspiring founder is shown the
     foundational guides first, a Growing one the strategy and expansion
     pieces. Until someone has taken the assessment, the newest wins. */
  const all = (await getAllArticles()).filter((a) => a.kind === 'resource');
  const wanted: Record<string, string[]> = {
    Aspiring: ['Digital Skills', 'Digital Presence', 'Business Growth', 'Legal'],
    Managing: ['Operations & Productivity', 'Marketing & Branding', 'Customer Retention', 'Finance'],
    Growing: ['Strategic Growth', 'Partnership', 'ESG', 'Networking'],
  };
  const preferred = band ? (wanted[band.key.en] ?? []) : [];
  const ranked = [...all].sort((a, b) => {
    const sa = a.categories.filter((c) => preferred.includes(c.en)).length;
    const sb = b.categories.filter((c) => preferred.includes(c.en)).length;
    if (sa !== sb) return sb - sa;
    return (b.publishedAt || '').localeCompare(a.publishedAt || '');
  });

  return (
    <DashboardView
      name={session.name || session.email}
      score={typeof result?.score === 'number' ? result.score : null}
      band={band}
      takenAt={result?.submittedAt ?? null}
      recommended={ranked.slice(0, 4).map(toView)}
    />
  );
}
