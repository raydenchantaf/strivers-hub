'use client';

import { useEffect, useRef } from 'react';
import { useLang } from '../LangProvider';
import { Reveal } from '../Reveal';
import { HEX, HEX_ROWS, HEX_ROWS_S, type HexRow, type HexSeg } from './hexlayout';
import { WORDS_EN } from './words';
import { track } from '@/lib/analytics/client';

/**
 * Platform vocabulary set in the silhouette of the Strivers' Hub mark.
 *
 * The mark is a pointy-top hexagon with a hexagonal void at its centre, so
 * the field is too, and the section's heading sits in the void.
 *
 * Each row is a flex line whose width is the hexagon's chord at that row's
 * height, with the words justified across it; rows that cross the void are
 * split into a left and a right segment with the void's chord as a spacer
 * between them. The silhouette is therefore exact by construction - it does
 * not depend on how wide any particular word turns out to be, so a changed
 * word costs a little evenness in one row and nothing else.
 *
 * The outline is the mark's own, measured off favicon.png row by row rather
 * than idealised: symmetric left to right, and not top to bottom - the
 * upper shoulders break at 90.2% width where the interlaced ribbons stop
 * short of the sides, so the top taper runs over 34% of the height in two
 * slopes against the bottom's 24% in one. The mark's own notch is a flat run
 * there; held flat it quantised into three rows of equal width, which read
 * as rows that had failed to reach their edge, so it is a change of slope
 * instead. The envelope and the asymmetry are the mark's.
 *
 * There are two figures, because one cannot serve both a desktop window and
 * a phone column. The full one is 866 x 993 and carries the whole
 * vocabulary with the heading in its void; the compact one is 350 x 401 and
 * carries a spread of it, void empty and heading above. Only one is ever displayed
 * - the other is display:none, and so is out of the accessibility tree too,
 * which is why neither is marked aria-hidden.
 *
 * Every number in hexlayout.ts is a design pixel of its own drawing; the
 * stylesheet turns them into real ones with a container-query scale, and
 * caps both against the viewport height as well, so the whole hexagon is on
 * screen at once rather than running off the bottom. The mark is 15% taller
 * than it is wide, so on a short window that cap is what binds, and the
 * figure is narrower than a stretched one would have been. Widths,
 * the packing and each word's lit colour all come from there: see the header
 * for the geometry and for how the colours are taken off the logo. Changing
 * words.ts means regenerating it.
 *
 * Two things carry over from the earlier flat field and still matter. Size
 * changes go through transform, never font-size or weight, so lighting a word
 * never reflows its neighbours. And the resting tone clears 4.5:1 on its own
 * - nothing in here is decorative-only text.
 */

const MID = (HEX.rows - 1) / 2;

/* Widths come out of the generator as design pixels of whichever drawing the
   row belongs to; --px, set per figure by the stylesheet, turns them into
   real ones. */
const px = (n: number) => `calc(${n} * var(--px))`;

function Seg({ seg, side }: { seg: HexSeg; side: 's' | 'l' | 'r' }) {
  const { lang } = useLang();
  return (
    <span className="hxs" data-side={side} style={{ width: px(seg.w) }}>
      {seg.words.map((word, i) => (
        <span
          key={`${word.t}-${i}`}
          className={`w t${word.k}`}
          style={{ ['--c' as string]: word.c }}
          /* the Malay word is the key analytics counts, in either language */
          data-w={word.t}
        >
          {lang === 'en' ? (WORDS_EN[word.t] ?? word.t) : word.t}
        </span>
      ))}
    </span>
  );
}

function Row({ row, i, mid }: { row: HexRow; i: number; mid: number }) {
  return (
    <span
      className="hxr"
      /* the figure draws outward from its middle row, not top-down */
      style={{ ['--i' as string]: Math.abs(i - mid).toFixed(1) }}
    >
      {row.s ? (
        <Seg seg={row.s} side="s" />
      ) : (
        <>
          {/* which side a segment is on decides where a lone word sits: on
              the silhouette, with its slack falling inward */}
          <Seg seg={row.l as HexSeg} side="l" />
          <i className="hxg" style={{ width: px(row.g as number) }} aria-hidden="true" />
          <Seg seg={row.r as HexSeg} side="r" />
        </>
      )}
    </span>
  );
}

export function WordHex() {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* listeners live on the wrapper, not on the rows: Reveal owns its own
       ref, and a slightly larger hit area lets words light as the pointer
       approaches the figure rather than only once it is inside it. */
    const field = ref.current;
    if (!field) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* both figures are in the DOM; the hidden one measures zero and is
       skipped, or every one of its words would sit at the origin and light
       up whenever the pointer neared the top-left of the page */
    const words = Array.from(field.querySelectorAll<HTMLElement>('.w'));
    let boxes: { x: number; y: number; on: boolean }[] = [];
    let raf = 0;
    let ptrX = -1e5;
    let ptrY = -1e5;

    const measure = () => {
      boxes = words.map((el) => {
        const b = el.getBoundingClientRect();
        return { x: b.left + b.width / 2, y: b.top + b.height / 2, on: b.width > 0 };
      });
    };

    const paint = () => {
      raf = 0;
      const R = Math.max(200, Math.min(320, field.clientWidth * 0.3));
      for (let i = 0; i < words.length; i++) {
        if (!boxes[i].on) continue;
        const dx = boxes[i].x - ptrX;
        const dy = boxes[i].y - ptrY;
        const d = Math.hypot(dx, dy);
        const tt = Math.max(0, 1 - d / R);
        const e = tt * tt * (3 - 2 * tt); // smoothstep
        words[i].style.setProperty('--t', e.toFixed(3));
        // scaled words overlap their neighbours; the brightest sits on top
        words[i].style.zIndex = e > 0.04 ? String(Math.round(e * 20)) : '';
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const onMove = (e: PointerEvent) => {
      ptrX = e.clientX;
      ptrY = e.clientY;
      schedule();
    };
    const onLeave = () => {
      ptrX = -1e5;
      ptrY = -1e5;
      schedule();
    };
    const onScroll = () => {
      measure();
      schedule();
    };

    measure();
    field.addEventListener('pointermove', onMove);
    field.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      field.removeEventListener('pointermove', onMove);
      field.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  /* "Find your field" interest, for the insights page. A word counts when the
     pointer rests on it for most of a second - long enough that it was read,
     not just crossed on the way somewhere else - and once per word per visit.
     Pointer devices only: on a phone these words are not interactive. */
  useEffect(() => {
    const field = ref.current;
    if (!field || !window.matchMedia('(hover: hover)').matches) return;
    const counted = new Set<string>();
    let timer = 0;
    let over: HTMLElement | null = null;
    const onOver = (e: PointerEvent) => {
      const w = (e.target as Element | null)?.closest<HTMLElement>('.w') ?? null;
      if (w === over) return;
      window.clearTimeout(timer);
      over = w;
      if (!w) return;
      timer = window.setTimeout(() => {
        const word = (w.dataset.w ?? w.textContent ?? '').trim();
        if (!word || counted.has(word)) return;
        counted.add(word);
        track('field', { src: 'field', w: word });
      }, 900);
    };
    const onOut = () => {
      window.clearTimeout(timer);
      over = null;
    };
    field.addEventListener('pointerover', onOver);
    field.addEventListener('pointerleave', onOut);
    return () => {
      window.clearTimeout(timer);
      field.removeEventListener('pointerover', onOver);
      field.removeEventListener('pointerleave', onOut);
    };
  }, []);

  return (
    <div className="hexwrap" ref={ref}>
      {/* The heading comes first in the source: it is the section's heading,
          and in the collapsed layout it belongs above the words. In the
          hexagon it is lifted out of flow into the void. */}
      <div className="hxcore">
        <Reveal className="sec-head mid hxcore-in">
          <span className="eyebrow">{t('cov.eyebrow')}</span>
          <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('cov.h2') }} />
          <p className="sec-sub">{t('cov.sub')}</p>
        </Reveal>
      </div>

      <Reveal className="hexfield">
        {HEX_ROWS.map((row, i) => (
          <Row row={row} key={i} i={i} mid={MID} />
        ))}
      </Reveal>

      <Reveal className="hexfield hexfield-s">
        {/* the light behind the void; on the full figure .hxcore casts its own */}
        <i className="hxvoid" aria-hidden="true" />
        {/* The heading again, in this figure's void.

            It is the same heading as the one in .hxcore, written twice rather
            than moved, because only one figure is ever displayed and the
            other is display:none - out of the accessibility tree with it, the
            same reason neither figure is marked aria-hidden. A single element
            could not be in both places: the void's centre is inside this
            figure, and on a phone the eyebrow and the lede have to stay above
            it in flow, so there is no common ancestor whose box could put it
            in the middle of the hexagon. */}
        <div className="hxs-core">
          <h2 className="sec-h hxs-h" dangerouslySetInnerHTML={{ __html: t('cov.h2') }} />
        </div>
        {HEX_ROWS_S.map((row, i) => (
          <Row row={row} key={i} i={i} mid={(HEX_ROWS_S.length - 1) / 2} />
        ))}
      </Reveal>
    </div>
  );
}
