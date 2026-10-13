/**
 * The drifting colour field behind every inner-page header.
 *
 * The homepage hero runs the same device at full strength; this is the quiet
 * version - larger blur, lower opacity, a heavier veil over the side the text
 * sits on. Blobs are sized as a percentage of the header box rather than the
 * viewport: at viewport scale a single blob is taller than a 330px header, so
 * only one of them is ever in frame and the whole thing collapses into a flat
 * wash. Every page rotates the field differently (see globals.css) so no two
 * headers resolve to the same picture.
 */
export function HeaderField() {
  return (
    <>
      <div className="ph-bg" aria-hidden="true">
        <span className="pb pb-1" />
        <span className="pb pb-2" />
        <span className="pb pb-3" />
        <span className="pb pb-4" />
        <span className="pb pb-5" />
        <span className="pb pb-6" />
        <span className="pb pb-7" />
      </div>
      <div className="ph-veil" aria-hidden="true" />
    </>
  );
}
