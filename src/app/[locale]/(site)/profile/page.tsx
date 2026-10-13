import type { Metadata } from 'next';
import { alternates, localeOf } from '@/lib/i18n/routing';
import { redirect } from 'next/navigation';
import { ProfileView } from './ProfileView';
import { readSession } from '@/lib/auth/session';
import { findById } from '@/lib/auth/store';
import { sanityFetch } from '@/sanity/client';
import { bandOf } from '@/lib/assessment/scoring';
import { getBands } from '@/lib/assessment/grades';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: 'My account',
  robots: { index: false, follow: false },
    alternates: alternates('/profile', localeOf(`/${locale}`)),
  };
}

const LATEST_RESULT = `*[_type == "assessmentResponse" && email == $email]
  | order(submittedAt desc)[0]{ score, category, submittedAt }`;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await readSession();
  if (!session) redirect(`/${locale}/login`);

  const [account, result] = await Promise.all([
    findById(session.sub).catch(() => null),
    sanityFetch<{ score?: number; category?: string; submittedAt?: string } | null>(LATEST_RESULT, {
      params: { email: session.email },
      revalidate: 0,
    }).catch(() => null),
  ]);

  /* The session is the source of truth for identity; the account row fills in
     what the token does not carry. If the row has gone, the session is stale. */
  if (!account) redirect(`/${locale}/login`);

  const score = typeof result?.score === 'number' ? result.score : null;
  const list = await getBands();

  return (
    <ProfileView
      data={{
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        phone: account.phone,
        createdAt: account.createdAt,
        score,
        band: score !== null ? bandOf(score, list).key.en : (result?.category ?? null),
        takenAt: result?.submittedAt ?? null,
      }}
    />
  );
}
