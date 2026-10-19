import type { Metadata } from 'next';
import { alternates, localeOf } from '@/lib/i18n/routing';
import { AssessmentView } from './AssessmentView';
import { getBands } from '@/lib/assessment/grades';
import { recommendedByStage } from '@/lib/recommend';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: 'Self-assessment',
  description:
    'Twenty-four questions about your business, your digital skills and the support you need. Five minutes, free, and no account required to see your result.',
    alternates: alternates('/assessment', localeOf(`/${locale}`)),
  };
}

export default async function Page() {
  const bands = await getBands();
  /* all three stages' picks travel with the page, which stays static; the
     result screen shows the ones for the stage the visitor lands on */
  const recommended = await recommendedByStage(bands.map((b) => b.key.en));
  return <AssessmentView bands={bands} recommended={recommended} />;
}
