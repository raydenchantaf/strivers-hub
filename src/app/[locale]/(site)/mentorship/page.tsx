import type { Metadata } from 'next';
import { alternates, localeOf } from '@/lib/i18n/routing';
import { MentorshipView } from './MentorshipView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: 'Mentorship',
  description:
    "Strivers' Hub connects women entrepreneurs with industry professionals for shared knowledge, collaboration and support that lasts.",
    alternates: alternates('/mentorship', localeOf(`/${locale}`)),
  };
}

export default function Page() {
  return <MentorshipView />;
}
