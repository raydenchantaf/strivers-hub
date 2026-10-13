import 'server-only';
import { groq } from 'next-sanity';
import { sanityFetch } from '@/sanity/client';
import { dimensionsOf, urlFor, type SanityImage } from '@/sanity/image';
import { dict } from '@/lib/i18n/dict';
import type { Lang } from '@/lib/i18n/types';

/**
 * The About page's copy, from the CMS where it exists and from the bundled
 * dictionary where it does not.
 *
 * The wireframe's content-model table has About "hard-coded, cannot be edited
 * by TAF". This closes that: every string on the page resolves through here,
 * field by field, so a document with two fields filled in overrides two
 * strings and leaves the rest alone. A page is never half-empty because an
 * editor started one and stopped.
 */

export type L = { en: string; bm: string };
export type Item = { title: L; body: L };

export type AboutContent = {
  eyebrow: L;
  headingHtml: L;
  lede: L;
  ctaLabel: L;
  image: { src: string; alt: L; width: number; height: number } | null;
  whyEyebrow: L;
  whyHeadingHtml: L;
  why: Item[];
  quote: L;
  quoteSub: L;
  rolesEyebrow: L;
  rolesHeadingHtml: L;
  roles: Item[];
};

const ABOUT = groq`*[_type == "page" && slug.current == $slug][0]{
  eyebrow_en, eyebrow_bm, headingLead_en, headingLead_bm,
  headingAccent_en, headingAccent_bm, lede_en, lede_bm,
  ctaLabel_en, ctaLabel_bm, image,
  whyEyebrow_en, whyEyebrow_bm, whyHeadingLead_en, whyHeadingLead_bm,
  whyHeadingAccent_en, whyHeadingAccent_bm,
  why[]{ title_en, title_bm, body_en, body_bm },
  quote_en, quote_bm, quoteSub_en, quoteSub_bm,
  rolesEyebrow_en, rolesEyebrow_bm, rolesHeadingLead_en, rolesHeadingLead_bm,
  rolesHeadingAccent_en, rolesHeadingAccent_bm,
  roles[]{ title_en, title_bm, body_en, body_bm }
}`;

type Row = Record<string, unknown> | null;

/** Dictionary value for a key, as the pair. */
function d(key: string): L {
  const entry = dict[key];
  return { en: entry?.en ?? key, bm: entry?.bm ?? entry?.en ?? key };
}

/** A CMS pair if either half is filled, otherwise the bundled one. Each half
 *  falls back on its own, so an editor may translate one language first. */
function pick(row: Row, name: string, key: string): L {
  const fb = d(key);
  const en = (row?.[`${name}_en`] as string | undefined)?.trim();
  const bm = (row?.[`${name}_bm`] as string | undefined)?.trim();
  if (!en && !bm) return fb;
  return { en: en || fb.en, bm: bm || en || fb.bm };
}

const ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPE[c]);

/**
 * Compose a heading. The CMS gives two plain strings and the markup is built
 * here with both halves escaped, so nothing an editor types can introduce an
 * element. Where the CMS has nothing, the bundled string already carries the
 * span and is ours, not theirs.
 */
function heading(row: Row, lead: string, accent: string, key: string): L {
  const fb = d(key);
  const out = {} as L;
  for (const lang of ['en', 'bm'] as Lang[]) {
    const l = (row?.[`${lead}_${lang}`] as string | undefined)?.trim();
    const a = (row?.[`${accent}_${lang}`] as string | undefined)?.trim();
    if (!l && !a) {
      out[lang] = fb[lang];
    } else if (!a) {
      out[lang] = esc(l as string);
    } else {
      out[lang] = `${l ? `${esc(l)} ` : ''}<span class="serif-i">${esc(a)}</span>`;
    }
  }
  return out;
}

function items(row: Row, field: string, keys: readonly string[][]): Item[] {
  const raw = row?.[field] as Array<Record<string, string>> | undefined;
  if (Array.isArray(raw) && raw.length) {
    return raw.map((r, i) => {
      const [tk, bk] = keys[Math.min(i, keys.length - 1)];
      return {
        title: pick(r, 'title', tk),
        body: pick(r, 'body', bk),
      };
    });
  }
  return keys.map(([tk, bk]) => ({ title: d(tk), body: d(bk) }));
}

export async function getAboutContent(): Promise<AboutContent> {
  const row = await sanityFetch<Row>(ABOUT, {
    params: { slug: 'about' },
    revalidate: 3600,
  }).catch(() => null);

  const img = row?.image as (SanityImage & { alt?: string }) | undefined;
  const dims = img ? dimensionsOf(img) : null;

  return {
    eyebrow: pick(row, 'eyebrow', 'ap.eyebrow'),
    headingHtml: heading(row, 'headingLead', 'headingAccent', 'ap.h1'),
    lede: pick(row, 'lede', 'ap.lede'),
    ctaLabel: pick(row, 'ctaLabel', 'ap.cta'),
    /* The portrait keeps its own proportions - the frame is built to take
       whatever shape the image is, the same way the article leads do. */
    image: img
      ? {
          src: urlFor(img, 760),
          alt: pick(img as unknown as Row, 'alt', 'ap.imgAlt'),
          width: dims?.width ?? 760,
          height: dims?.height ?? 940,
        }
      : null,
    whyEyebrow: pick(row, 'whyEyebrow', 'ap.whyEyebrow'),
    whyHeadingHtml: heading(row, 'whyHeadingLead', 'whyHeadingAccent', 'ap.whyH'),
    why: items(row, 'why', [
      ['ap.w1t', 'ap.w1'],
      ['ap.w2t', 'ap.w2'],
      ['ap.w3t', 'ap.w3'],
    ]),
    quote: pick(row, 'quote', 'ap.quote'),
    quoteSub: pick(row, 'quoteSub', 'ap.quoteSub'),
    rolesEyebrow: pick(row, 'rolesEyebrow', 'ap.howEyebrow'),
    rolesHeadingHtml: heading(row, 'rolesHeadingLead', 'rolesHeadingAccent', 'ap.howH'),
    roles: items(row, 'roles', [
      ['ap.p1t', 'ap.p1b'],
      ['ap.p2t', 'ap.p2b'],
      ['ap.p3t', 'ap.p3b'],
    ]),
  };
}
