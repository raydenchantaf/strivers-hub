import type { Metadata } from 'next';
import { alternates, localeOf } from '@/lib/i18n/routing';
import { LegalView } from './LegalView';
import { sanityFetch } from '@/sanity/client';
import { LEGAL_PAGE } from '@/sanity/queries';
import { PRIVACY_FALLBACK } from './fallback';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: 'Privacy policy',
  description:
    "How Strivers' Hub collects, uses and protects your personal information under the Personal Data Protection Act 2010.",
    alternates: alternates('/privacy-policy', localeOf(`/${locale}`)),
  };
}

type Section = {
  heading_en?: string;
  heading_bm?: string;
  body_en?: unknown[];
  body_bm?: unknown[];
};

/**
 * The policy is TAF's legal text, so it lives in the CMS where their team can
 * revise it without a deploy. The bundled copy below is the structure the live
 * site publishes today; it renders if the CMS document has not been created
 * yet, so the page is never blank on a fresh environment.
 */
export default async function Page() {
  const doc = await sanityFetch<{
    title_en?: string;
    title_bm?: string;
    updatedAt?: string;
    intro_en?: string;
    intro_bm?: string;
    sections?: Section[];
  } | null>(LEGAL_PAGE, { params: { slug: 'privacy-policy' }, tags: ['legalPage'] }).catch(
    () => null,
  );

  const sections =
    doc?.sections?.length
      ? doc.sections.map((s) => ({
          heading: { en: s.heading_en ?? '', bm: s.heading_bm ?? s.heading_en ?? '' },
          body: {
            en: (s.body_en as never[]) ?? [],
            bm: ((s.body_bm ?? s.body_en) as never[]) ?? [],
          },
        }))
      : PRIVACY_FALLBACK;

  return (
    <LegalView
      updatedAt={doc?.updatedAt ?? '2025-04-01'}
      sections={sections}
      fromCms={Boolean(doc?.sections?.length)}
    />
  );
}
