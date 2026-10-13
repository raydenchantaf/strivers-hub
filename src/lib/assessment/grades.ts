import 'server-only';
import { sanityFetch } from '@/sanity/client';
import { ASSESSMENT_GRADES } from '@/sanity/queries';
import { bands as bundled } from './bands';
import type { Band } from './types';

/**
 * The three result bands, from the CMS.
 *
 * The wireframe asks for the band copy and next-steps to move into the
 * content system so TAF can revise them without a deploy, and the
 * `assessmentGrade` type carries them. The bundled `bands.ts` stays as the
 * fallback rather than the source: a fresh dataset, a failed request or a
 * half-filled document must not leave a visitor looking at a result page
 * with no words on it.
 *
 * The fallback is all-or-nothing on purpose. Mixing three CMS bands with one
 * bundled one would produce a set whose ranges no longer tile 6-18, and a
 * score would fall into a gap.
 */

type Row = {
  min?: number;
  max?: number;
  color?: string;
  key_en?: string;
  key_bm?: string;
  title_en?: string;
  title_bm?: string;
  desc_en?: string;
  desc_bm?: string;
  steps_en?: string[];
  steps_bm?: string[];
};

function usable(rows: Row[] | null): rows is Row[] {
  if (!rows || rows.length !== bundled.length) return false;
  return rows.every(
    (r) =>
      typeof r.min === 'number' &&
      typeof r.max === 'number' &&
      !!r.key_en &&
      !!r.title_en &&
      !!r.desc_en,
  );
}

export async function getBands(): Promise<Band[]> {
  const rows = await sanityFetch<Row[] | null>(ASSESSMENT_GRADES, { revalidate: 3600 }).catch(
    () => null,
  );
  if (!usable(rows)) return bundled;

  /* Ranges have to tile the reachable score with no gap and no overlap, or a
     score lands nowhere. If the edited set does not, the bundled one wins. */
  const sorted = [...rows].sort((a, b) => (a.min ?? 0) - (b.min ?? 0));
  let expect = bundled[0].min;
  for (const r of sorted) {
    if (r.min !== expect || (r.max ?? 0) < (r.min ?? 0)) return bundled;
    expect = (r.max ?? 0) + 1;
  }
  if (expect - 1 !== bundled[bundled.length - 1].max) return bundled;

  return sorted.map((r, i) => {
    const fb = bundled[i];
    return {
      key: { en: r.key_en ?? fb.key.en, bm: r.key_bm || (r.key_en ?? fb.key.bm) },
      title: { en: r.title_en ?? fb.title.en, bm: r.title_bm || (r.title_en ?? fb.title.bm) },
      desc: { en: r.desc_en ?? fb.desc.en, bm: r.desc_bm || (r.desc_en ?? fb.desc.bm) },
      steps: {
        en: r.steps_en?.length ? r.steps_en : fb.steps.en,
        bm: r.steps_bm?.length ? r.steps_bm : r.steps_en?.length ? r.steps_en : fb.steps.bm,
      },
      color: r.color || fb.color,
      min: r.min as number,
      max: r.max as number,
    };
  });
}
