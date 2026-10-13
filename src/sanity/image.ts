import { createImageUrlBuilder } from '@sanity/image-url';
import type { Image } from 'sanity';
import { dataset, projectId } from './env';

const builder = createImageUrlBuilder({ projectId, dataset });

/**
 * Sanity does the resizing and format negotiation on its own CDN, so we ask
 * for exactly the box we render and let it pick AVIF or WebP.
 */
export function urlFor(source: Image, width: number, height?: number) {
  let b = builder.image(source).width(width).auto('format').quality(78);
  if (height) b = b.height(height).fit('crop').crop('entropy');
  return b.url();
}

/**
 * A tiny, server-blurred copy of an image, used as the backdrop behind a
 * picture shown whole inside a fixed frame. Sanity does the blur on its CDN,
 * so it costs the phone one ~1 KB request and no filter work at all.
 */
export function blurFor(source: Image) {
  return builder.image(source).width(64).blur(40).auto('format').quality(50).url();
}

/** srcSet for a fluid image, capped at the widest box we ever render it in. */
export function srcSetFor(source: Image, widths: number[], ratio?: number) {
  return widths
    .map((w) => `${urlFor(source, w, ratio ? Math.round(w / ratio) : undefined)} ${w}w`)
    .join(', ');
}

export type SanityImage = Image & {
  alt?: string;
  asset?: { _ref?: string; _id?: string };
};

/** Sanity encodes the source dimensions in the asset id. */
export function dimensionsOf(source: SanityImage): { width: number; height: number } | null {
  const ref = source?.asset?._ref ?? source?.asset?._id;
  const match = typeof ref === 'string' ? ref.match(/-(\d+)x(\d+)-/) : null;
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}
