/**
 * A picture shown whole inside a fixed frame.
 *
 * Grids need every card the same shape, and these images are not: many are
 * posters and infographics with a title, a date or a logo right at the edge,
 * and cropping them to the frame cut those off. So the picture is contained,
 * not cropped, and the space it leaves is filled with a blurred copy of the
 * same picture - which Sanity blurs on its own CDN, so the browser draws a
 * small image rather than running a filter. The parent carries `fit`.
 */
export function FitImg({
  src,
  blur,
  alt,
  width,
  height,
  priority,
}: {
  src: string;
  blur?: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  return (
    <>
      {blur ? <i className="fit-bg" aria-hidden="true" style={{ backgroundImage: `url("${blur}")` }} /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="fit-img"
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? undefined : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
      />
    </>
  );
}
