import { groq } from 'next-sanity';

/**
 * The taxonomy decides which section a piece belongs to. It mirrors the
 * categories the editors already use, so nothing had to be re-tagged.
 */
export const EVENT_CATEGORIES = ['Event', 'Report', 'Community'];
export const FINANCE_CATEGORIES = ['Finance'];

const CARD_FIELDS = groq`
  "id": _id,
  "slug": slug.current,
  publishedAt,
  title_en, title_bm,
  excerpt_en, excerpt_bm,
  "image": coalesce(image_en, image_bm),
  "categories": category[]->{ "en": title_en, "bm": title_bm, value },
  featured
`;

const BODY_FIELDS = groq`
  body_en[]{
    ...,
    _type == "image" => { ..., "dimensions": asset->metadata.dimensions },
    markDefs[]{ ... }
  },
  body_bm[]{
    ...,
    _type == "image" => { ..., "dimensions": asset->metadata.dimensions },
    markDefs[]{ ... }
  }
`;

/** Everything, newest first. Pages slice this by kind. */
export const ALL_RESOURCES = groq`
  *[_type == "resource" && defined(slug.current)] | order(publishedAt desc) {
    ${CARD_FIELDS}
  }
`;

export const RESOURCE_BY_SLUG = groq`
  *[_type == "resource" && slug.current == $slug][0]{
    ${CARD_FIELDS},
    ${BODY_FIELDS}
  }
`;

/** Three more from the same section, preferring a shared category. */
export const RELATED_RESOURCES = groq`
  *[_type == "resource" && slug.current != $slug && defined(slug.current)]
    | order(count((category[]->value)[@ in $categoryValues]) desc, publishedAt desc)[0...12]{
      ${CARD_FIELDS}
    }
`;

export const ALL_SLUGS = groq`
  *[_type == "resource" && defined(slug.current)]{
    "slug": slug.current,
    "categories": category[]->value,
    _updatedAt
  }
`;

export const CATEGORIES = groq`
  *[_type == "category"] | order(title_en asc){
    "id": _id, "en": title_en, "bm": title_bm, value
  }
`;

export const SITE_SETTINGS = groq`
  *[_type == "siteSettings"][0]{
    ...,
    partners[]{ name, url, "logo": logo, "logoWhite": logoWhite }
  }
`;

export const LEGAL_PAGE = groq`
  *[_type == "legalPage" && slug.current == $slug][0]{
    title_en, title_bm, updatedAt,
    intro_en, intro_bm,
    sections[]{ heading_en, heading_bm, body_en, body_bm }
  }
`;

/** Grades are editable in the Studio; the code falls back to bundled copy.
 *
 *  The filter matters. `assessmentGrade` does two jobs: it is the band copy,
 *  and it is the taxonomy that tags a resource with the stage it suits. The
 *  live dataset's three documents are the second kind and carry no range, so
 *  selecting the type alone would return a set the loader cannot use. */
export const ASSESSMENT_GRADES = groq`
  *[_type == "assessmentGrade" && defined(min) && defined(max)] | order(min asc){
    min, max, color,
    key_en, key_bm, title_en, title_bm, desc_en, desc_bm,
    steps_en, steps_bm
  }
`;
