import 'server-only';
import { sanityFetch } from '@/sanity/client';
import { SITE_SETTINGS } from '@/sanity/queries';
import { dimensionsOf, urlFor, type SanityImage } from '@/sanity/image';

/**
 * Site settings from the Studio (Site settings): the footer blurb, an
 * optional announcement bar, the partner band and the social links. Every
 * field falls back to what is built in when the editor has not set it, so an
 * empty or missing settings document changes nothing.
 */

export type Partner = { name: string; url: string; logo: { src: string; width: number; height: number } | null };
export type Settings = {
  blurb: { en: string; bm: string } | null;
  announcement: { en: string; bm: string; href: string } | null;
  partners: Partner[] | null;
  social: { platform: string; url: string }[] | null;
};

type Raw = {
  footerBlurb_en?: string;
  footerBlurb_bm?: string;
  announcement_en?: string;
  announcement_bm?: string;
  announcementHref?: string;
  partners?: { name?: string; url?: string; logo?: SanityImage; logoWhite?: SanityImage }[];
  social?: { platform?: string; url?: string }[];
} | null;

const EMPTY: Settings = { blurb: null, announcement: null, partners: null, social: null };
const httpish = (u?: string) => (u && /^https?:\/\//.test(u) ? u : '');

export async function getSettings(): Promise<Settings> {
  const raw = await sanityFetch<Raw>(SITE_SETTINGS, { tags: ['settings'] }).catch(() => null);
  if (!raw) return EMPTY;

  const blurbEn = raw.footerBlurb_en?.trim();
  const ann = raw.announcement_en?.trim() || raw.announcement_bm?.trim();
  const partners = (raw.partners ?? [])
    .filter((p) => p.name?.trim())
    .map((p) => {
      /* the band is dark, so the white version is preferred */
      const img = p.logoWhite?.asset ? p.logoWhite : p.logo?.asset ? p.logo : null;
      const dims = img ? dimensionsOf(img) : null;
      return {
        name: p.name!.trim(),
        url: httpish(p.url),
        logo: img && dims ? { src: urlFor(img, 600), width: dims.width, height: dims.height } : null,
      };
    });
  const social = (raw.social ?? [])
    .filter((s) => s.platform && httpish(s.url))
    .map((s) => ({ platform: s.platform!, url: s.url! }));

  return {
    blurb: blurbEn ? { en: blurbEn, bm: raw.footerBlurb_bm?.trim() || blurbEn } : null,
    announcement: ann
      ? {
          en: raw.announcement_en?.trim() || raw.announcement_bm!.trim(),
          bm: raw.announcement_bm?.trim() || raw.announcement_en!.trim(),
          href: raw.announcementHref?.trim() ?? '',
        }
      : null,
    partners: partners.length ? partners : null,
    social: social.length ? social : null,
  };
}
