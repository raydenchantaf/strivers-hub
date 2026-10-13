'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { L as Link } from '@/components/L';
import { useLang } from '@/components/LangProvider';
import { Reveal } from '@/components/Reveal';
import {
  FIELD,
  MAX_PICKS,
  TILE_BY_ID,
  WORD_BY_ID,
  dealTiles,
  guidesFor,
  type HiveGuide,
  type StageIx,
} from './hive/data';
import {
  CELL,
  HOLE,
  SEGS,
  SEG_RAMP,
  VB_H,
  VB_W,
  packField,
  pointsAttr,
  RATIO,
  vb,
  type Sized,
} from './hive/geometry';
import { renderCard } from './hive/card';

/**
 * The hive: a ninety-second game on the homepage.
 *
 * Act one lights up a field of words set in a regular hexagon - the word
 * field at the top of the page, made playable, on a true hexagon rather than
 * the logo's notched outline. Act two clears the field and leaves the
 * hexagon's ring in its place, cut into six cells, and the visitor fills it from the bottom with skills
 * from the assessment, two per stage. When the sixth lands the cells close
 * up, take the logo's colours and the mark itself appears in the void: the
 * hive was the brand all along. The ending is a card to share and a way into
 * the real assessment.
 *
 * It teaches the thing the platform is built on - three stages, and what
 * belongs to each - with the assessment's own scoring as the answer key.
 */

type Act = 'field' | 'leaving' | 'hive' | 'closing' | 'done';

/** Trades are set in the serif italic, a touch larger so they hold their own. */
const TRADE = 1.2;
const STAGE_FILL = ['#0E6F63', '#B12069', '#F5A524'];
const STAGE_INK = ['var(--jade)', 'var(--magenta)', 'var(--saffron-ink)'];
const STAGE_RAMP: [string, string][] = [
  ['#0B5F55', '#16907F'],
  ['#8E1A57', '#C8367E'],
  ['#E48E12', '#F7B84A'],
];

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function track(name: string, params: Record<string, unknown> = {}) {
  const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof g === 'function') g('event', name, params);
}

function fontVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

export function HiveGame({ guides }: { guides: HiveGuide[] }) {
  const { t, p, lang, locale } = useLang();

  const [act, setAct] = useState<Act>('field');
  const [picks, setPicks] = useState<string[]>([]);
  const [full, setFull] = useState(false);
  const [hand, setHand] = useState<string[]>([]);
  /** seg index -> tile id, in fill order */
  const [cells, setCells] = useState<(string | null)[]>(() => SEGS.map(() => null));
  const [mistakes, setMistakes] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [note, setNote] = useState<{ ok: boolean; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState<{ url: string; file: File } | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [coarse, setCoarse] = useState(false);

  const [width, setWidth] = useState(0);
  const [sized, setSized] = useState<Sized[] | null>(null);
  const [seen, setSeen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const figRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const tileRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const hiveHeadRef = useRef<HTMLHeadingElement>(null);
  const doneHeadRef = useRef<HTMLHeadingElement>(null);
  const firstTileRef = useRef<string | null>(null);
  const dragged = useRef(false);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, reduced() ? 0 : ms));
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* ------------------------------------------------ measuring the field */

  useEffect(() => {
    setCoarse(window.matchMedia('(hover: none)').matches);
  }, []);

  useEffect(() => {
    const fig = figRef.current;
    if (!fig) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      setWidth((prev) => (Math.abs(prev - w) > 1 ? w : prev));
    });
    ro.observe(fig);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -15% 0px', threshold: 0.2 },
    );
    io.observe(fig);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  /* Widths come off a canvas in the page's own fonts, once they have loaded:
     measured against the fallback, every word would be packed a little wrong
     and the silhouette would only be exact until the real face arrived. */
  useEffect(() => {
    let live = true;
    const measure = () => {
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx || !live) return;
      const sans = fontVar('--font-sans', 'system-ui, sans-serif');
      const serif = fontVar('--font-serif', 'Georgia, serif');
      setSized(
        FIELD.map((w) => {
          const size = w.kind === 'trade' ? 100 * TRADE : 100;
          ctx.font = w.kind === 'trade' ? `italic 400 ${size}px ${serif}` : `600 ${size}px ${sans}`;
          /* plus the word's own .1em of padding either side */
          return { id: w.id, w100: ctx.measureText(p(w.label)).width + size * 0.2 };
        }),
      );
    };
    measure();
    document.fonts?.ready.then(measure);
    return () => {
      live = false;
    };
  }, [lang, p]);

  const layout = useMemo(() => (sized && width ? packField(width, sized) : null), [sized, width]);
  const pos = useMemo(() => new Map(layout?.items.map((it) => [it.id, it]) ?? []), [layout]);

  /* ------------------------------------------------ the pointer glow
     The word field's signature, carried over: words brighten as the pointer
     nears them. Positions are known from the layout, so a move costs one
     rect read, not one per word. */
  useEffect(() => {
    const fig = figRef.current;
    if (!fig || !layout || act !== 'field' || coarse || reduced()) return;
    let raf = 0;
    let px = -1e5;
    let py = -1e5;
    const paint = () => {
      raf = 0;
      const r = fig.getBoundingClientRect();
      const R = Math.max(110, Math.min(210, r.width * 0.3));
      for (const it of layout.items) {
        const el = wordRefs.current[it.id];
        if (!el) continue;
        const d = Math.hypot(r.left + it.x + it.w / 2 - px, r.top + it.y + layout.rowH / 2 - py);
        const k = Math.max(0, 1 - d / R);
        el.style.setProperty('--h', (k * k * (3 - 2 * k)).toFixed(3));
      }
    };
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const leave = () => {
      px = py = -1e5;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    fig.addEventListener('pointermove', move);
    fig.addEventListener('pointerleave', leave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      fig.removeEventListener('pointermove', move);
      fig.removeEventListener('pointerleave', leave);
      for (const el of Object.values(wordRefs.current)) el?.style.removeProperty('--h');
    };
  }, [layout, act, coarse]);

  /* ------------------------------------------------ act one */

  function toggle(id: string) {
    if (act !== 'field') return;
    if (!picks.length) track('hive_start');
    if (picks.includes(id)) {
      setPicks(picks.filter((x) => x !== id));
      setFull(false);
      return;
    }
    if (picks.length >= MAX_PICKS) {
      setFull(true);
      wordRefs.current[id]?.animate(
        [{ translate: '0 0' }, { translate: '-4px 0' }, { translate: '3px 0' }, { translate: '0 0' }],
        { duration: reduced() ? 0 : 320, easing: 'ease-out' },
      );
      return;
    }
    setFull(false);
    setPicks([...picks, id]);
  }

  /* Bring the game back under the nav bar after an act changes. It runs
     after the new act has laid out, not in the handler that asked for it:
     measured before, the target is stale - on a phone act two drops the
     heading above the hive - and the browser's scroll anchoring then moves
     the page again underneath a scroll already in flight. */
  const scrollTo = useRef<'fig' | 'root' | null>(null);
  useEffect(() => {
    const which = scrollTo.current;
    if (!which) return;
    scrollTo.current = null;
    const raf = requestAnimationFrame(() => {
      const el = which === 'fig' ? figRef.current : rootRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 92;
      if (Math.abs(window.scrollY - top) > 24) {
        window.scrollTo({ top, behavior: reduced() ? 'auto' : 'smooth' });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [act]);

  function build() {
    if (!picks.length || act !== 'field') return;
    const dealt = dealTiles(picks);
    firstTileRef.current = dealt[0];
    setHand(dealt);
    setAct('leaving');
    setFull(false);
    track('hive_build', { words: picks.length });
    later(() => {
      scrollTo.current = 'fig';
      setAct('hive');
      /* focus follows the game, without the browser's own jump - the scroll
         above is the one that knows where the nav bar is */
      later(() => {
        const first = firstTileRef.current ? tileRefs.current[firstTileRef.current] : null;
        (first ?? hiveHeadRef.current)?.focus({ preventScroll: true });
      }, 60);
    }, 820);
  }

  /* ------------------------------------------------ act two */

  const stage: StageIx | 3 = useMemo(() => {
    for (let s = 0; s < 3; s++) if (!cells[s * 2] || !cells[s * 2 + 1]) return s as StageIx;
    return 3;
  }, [cells]);
  const placed = useMemo(() => new Set(cells.filter(Boolean) as string[]), [cells]);

  function finish(nextMistakes: number) {
    later(() => {
      setAct('closing');
      track('hive_complete', { mistakes: nextMistakes });
      later(() => {
        setAct('done');
        later(() => doneHeadRef.current?.focus({ preventScroll: true }), 60);
      }, 1500);
    }, 750);
  }

  function place(id: string, drag?: { dx: number; dy: number }) {
    if (busy || act !== 'hive' || stage === 3 || placed.has(id)) return;
    const tile = TILE_BY_ID[id];
    const el = tileRefs.current[id];
    const fig = figRef.current;

    if (tile.stage !== stage) {
      const next = mistakes + 1;
      setMistakes(next);
      if (!missed.includes(id)) setMissed([...missed, id]);
      setNote({ ok: false, id });
      if (el) {
        const back = drag
          ? el.animate([{ transform: `translate(${drag.dx}px,${drag.dy}px)` }, { transform: 'none' }], {
              duration: reduced() ? 0 : 260,
              easing: 'cubic-bezier(.16,1,.3,1)',
            })
          : null;
        el.style.transform = '';
        const shake = () =>
          el.animate(
            [
              { transform: 'translateX(0)' },
              { transform: 'translateX(-8px)' },
              { transform: 'translateX(7px)' },
              { transform: 'translateX(-4px)' },
              { transform: 'translateX(0)' },
            ],
            { duration: reduced() ? 0 : 380, easing: 'ease-out' },
          );
        if (back) back.finished.then(shake, shake);
        else shake();
      }
      return;
    }

    const segIx = cells[stage * 2] ? stage * 2 + 1 : stage * 2;
    const commit = () => {
      const next = cells.slice();
      next[segIx] = id;
      setCells(next);
      setNote({ ok: true, id });
      setBusy(false);
      if (el) el.style.transform = '';
      if (next.every(Boolean)) finish(mistakes);
      else {
        /* keep the keyboard somewhere useful once the tile it was on has gone */
        const rest = hand.find((h) => h !== id && !next.includes(h));
        if (rest && document.activeElement === el) tileRefs.current[rest]?.focus({ preventScroll: true });
      }
    };

    if (!el || !fig || reduced()) {
      commit();
      return;
    }
    setBusy(true);
    const r = el.getBoundingClientRect();
    const f = fig.getBoundingClientRect();
    const [cx, cy] = SEGS[segIx].c;
    const tx = f.left + (cx / 100) * f.width - (r.left + r.width / 2);
    const ty = f.top + (cy / 100) * f.height - (r.top + r.height / 2);
    const ox = drag?.dx ?? 0;
    const oy = drag?.dy ?? 0;
    const fly = el.animate(
      [
        { transform: `translate(${ox}px,${oy}px)`, opacity: 1 },
        { transform: `translate(${ox + tx}px,${oy + ty}px) scale(.5)`, opacity: 0 },
      ],
      { duration: 440, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' },
    );
    fly.finished.then(
      () => {
        commit();
        fly.cancel();
      },
      commit,
    );
  }

  /* Mouse and pen can drag a skill onto the hive. Touch taps: a drag that
     starts on a tile would have to claim the gesture from the page's own
     scroll, and on a phone the tray is half the screen. */
  function grab(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (e.pointerType === 'touch' || e.button !== 0 || busy || act !== 'hive') return;
    const el = e.currentTarget;
    const fig = figRef.current;
    const sx = e.clientX;
    const sy = e.clientY;
    let dragging = false;
    const over = (x: number, y: number) => {
      const r = fig?.getBoundingClientRect();
      return !!r && x > r.left && x < r.right && y > r.top && y < r.bottom;
    };
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!dragging && Math.hypot(dx, dy) > 6) {
        dragging = true;
        el.classList.add('drag');
        fig?.classList.add('is-drop');
      }
      if (dragging) {
        el.style.transform = `translate(${dx}px,${dy}px)`;
        fig?.classList.toggle('is-over', over(ev.clientX, ev.clientY));
      }
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!dragging) return;
      dragged.current = true;
      el.classList.remove('drag');
      fig?.classList.remove('is-drop', 'is-over');
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (ev.type === 'pointerup' && over(ev.clientX, ev.clientY)) {
        place(id, { dx, dy });
      } else {
        el.style.transform = '';
        el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], {
          duration: reduced() ? 0 : 300,
          easing: 'cubic-bezier(.16,1,.3,1)',
        });
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  /* ------------------------------------------------ the ending */

  const lit = picks.map((id) => p(WORD_BY_ID[id].label));
  const picked = useMemo(() => guidesFor(picks, guides), [picks, guides]);

  useEffect(() => {
    if (act !== 'done') return;
    let url = '';
    let live = true;
    renderCard(
      {
        eyebrow: t('hv.card.eyebrow'),
        line1: t('hv.card.l1'),
        line2: t('hv.card.l2'),
        fieldLabel: t('hv.card.field'),
        field: lit,
        stages: [t('path.1t'), t('path.2t'), t('path.3t')],
        badge: mistakes === 0 ? t('hv.card.perfect') : null,
        foot: t('hv.card.foot'),
        host: window.location.host.replace(/^www\./, ''),
      },
      { sans: fontVar('--font-sans', 'system-ui, sans-serif'), serif: fontVar('--font-serif', 'Georgia, serif') },
    ).then((blob) => {
      if (!blob || !live) return;
      url = URL.createObjectURL(blob);
      const file = new File([blob], 'strivers-hub-hive.png', { type: 'image/png' });
      setCard({ url, file });
      setCanShare(typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }));
    });
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
    // the card is drawn once per finish; its inputs are fixed by then
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act]);

  async function share() {
    if (!card) return;
    try {
      await navigator.share({
        files: [card.file],
        title: "Strivers' Hub",
        text: `${t('hv.shareText')} ${window.location.origin}/${locale}#hive`,
      });
      track('hive_share', { method: 'share' });
    } catch {
      /* dismissed the share sheet - nothing to do */
    }
  }

  function save() {
    if (!card) return;
    const a = document.createElement('a');
    a.href = card.url;
    a.download = card.file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    track('hive_share', { method: 'download' });
  }

  function again() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setAct('field');
    setPicks([]);
    setHand([]);
    setCells(SEGS.map(() => null));
    setMistakes(0);
    setMissed([]);
    setNote(null);
    setBusy(false);
    setCard(null);
    scrollTo.current = 'root';
  }

  /* ------------------------------------------------ render */

  const isHive = act === 'hive' || act === 'closing' || act === 'done';
  const isClosed = act === 'closing' || act === 'done';
  const figClass = [
    'hv-fig',
    layout && seen ? 'is-live' : '',
    isHive ? 'is-hive' : '',
    isClosed ? 'is-closed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const W = width;
  const H = width / RATIO;
  const stageName = (s: number) => t(`path.${s + 1}t`);
  const [askA, askB] = t('hv.a2.ask').split('{stage}');

  return (
    <section className="band hv-band" id="hive" aria-labelledby="hv-h">
      <div className="shell">
        <Reveal className="sec-head mid">
          <span className="eyebrow">{t('hv.eyebrow')}</span>
          <h2 id="hv-h" className="sec-h" dangerouslySetInnerHTML={{ __html: t('hv.h2') }} />
          <p className="sec-sub">{t('hv.sub')}</p>
        </Reveal>

        <div className="hv" ref={rootRef} data-act={act}>
          {/* -------- the figure -------- */}
          <div className={figClass} ref={figRef} data-act={act}>
            <i className="hv-glow" aria-hidden="true" />

            <svg className="hv-svg" viewBox={`0 0 ${VB_W} ${VB_H.toFixed(1)}`} aria-hidden="true">
              <defs>
                {STAGE_RAMP.map(([a, b], i) => (
                  <linearGradient key={i} id={`hv-g${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={a} />
                    <stop offset="1" stopColor={b} />
                  </linearGradient>
                ))}
                {SEGS.map((seg) => {
                  const [c0, c1, p0, p1] = SEG_RAMP[seg.side];
                  const [x1, y1] = vb(p0);
                  const [x2, y2] = vb(p1);
                  return (
                    <linearGradient
                      key={seg.side}
                      id={`hv-r-${seg.side}`}
                      gradientUnits="userSpaceOnUse"
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                    >
                      <stop offset="0" stopColor={c0} />
                      <stop offset="1" stopColor={c1} />
                    </linearGradient>
                  );
                })}
              </defs>
              {SEGS.map((seg, i) => {
                const [ox, oy] = vb(seg.c);
                const origin = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
                const pts = pointsAttr(seg.pts, CELL, seg.c);
                const state = cells[i] ? ' full' : stage === seg.stage && act === 'hive' ? ' now' : '';
                return (
                  <g
                    key={seg.side}
                    className={`hv-cell${state}`}
                    style={{
                      transformOrigin: origin,
                      ['--i' as string]: i,
                      ['--sc' as string]: STAGE_FILL[seg.stage],
                    }}
                  >
                    <polygon className="hv-sock" points={pts} />
                    <polygon
                      className="hv-fill"
                      points={pts}
                      fill={`url(#hv-g${seg.stage})`}
                      style={{ transformOrigin: origin }}
                    />
                    <polygon className="hv-mark" points={pts} fill={`url(#hv-r-${seg.side})`} />
                  </g>
                );
              })}
            </svg>

            {/* the field: real buttons, set where the packer put them */}
            <div className="hv-words" role="group" aria-label={t('hv.a1.group')}>
              {FIELD.map((w) => {
                const at = pos.get(w.id);
                const on = picks.includes(w.id);
                const style: Record<string, string | number> = {};
                if (at && layout) {
                  const cx = at.x + at.w / 2;
                  const cy = at.y + layout.rowH / 2;
                  const dist = Math.hypot(cx - W / 2, cy - H / 2) / (H / 2);
                  Object.assign(style, {
                    left: at.x,
                    top: at.y,
                    height: layout.rowH,
                    lineHeight: `${layout.rowH}px`,
                    fontSize: w.kind === 'trade' ? layout.s * TRADE : layout.s,
                    '--c': at.c,
                    '--dx': (W / 2 - cx).toFixed(1),
                    '--dy': (H / 2 - cy).toFixed(1),
                    /* the field draws outward from the void, and folds back inward */
                    '--r': Math.round(dist * 420),
                    '--lv': Math.round((1 - Math.min(1, dist)) * 60 + Math.min(1, dist) * 220),
                  });
                }
                return (
                  <button
                    key={w.id}
                    ref={(el) => {
                      wordRefs.current[w.id] = el;
                    }}
                    type="button"
                    className={`hv-w${w.kind === 'trade' ? ' is-trade' : ''}${on ? ' on' : ''}`}
                    aria-pressed={on}
                    tabIndex={act === 'field' ? 0 : -1}
                    style={style}
                    onClick={() => toggle(w.id)}
                  >
                    {p(w.label)}
                  </button>
                );
              })}
            </div>

            {/* what each cell holds, set over the SVG where text can wrap */}
            <div className="hv-labs" aria-hidden="true">
              {SEGS.map((seg, i) => {
                const id = cells[i];
                return (
                  <span
                    key={seg.side}
                    className={`hv-lab${id ? ` full s${seg.stage}` : ''}`}
                    style={{
                      left: `${seg.c[0]}%`,
                      top: `${seg.c[1]}%`,
                      ['--lc' as string]: STAGE_INK[seg.stage],
                    }}
                  >
                    {id ? p(TILE_BY_ID[id].label) : <small>{stageName(seg.stage)}</small>}
                  </span>
                );
              })}
            </div>

            <div className="hv-void" aria-hidden="true" style={{ ['--hole' as string]: HOLE }}>
              <span className="hv-v hv-v-count">
                <b className="tnum">
                  {picks.length}
                  <span>/{MAX_PICKS}</span>
                </b>
                <small>{t('hv.void.field')}</small>
              </span>
              <span className="hv-v hv-v-stage" style={{ ['--lc' as string]: STAGE_INK[stage === 3 ? 2 : stage] }}>
                <small>{t('hv.void.now')}</small>
                <em className="serif-i">{stageName(stage === 3 ? 2 : stage)}</em>
                <span className="tnum">
                  {stage === 3 ? 2 : Number(!!cells[stage * 2]) + Number(!!cells[stage * 2 + 1])}/2
                </span>
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="hv-v hv-v-mark" src="/img/logo-mark.webp" alt="" width={160} height={185} />
            </div>
          </div>

          {/* -------- act one -------- */}
          {act === 'field' || act === 'leaving' ? (
            <>
              <div className="hv-head hv-enter" key="h1">
                <span className="eyebrow hv-step">{t('hv.a1.step')}</span>
                <h3 dangerouslySetInnerHTML={{ __html: t('hv.a1.h') }} />
                <p>{t('hv.a1.p')}</p>
              </div>
              <div className="hv-ctl hv-enter" key="c1">
                <div className="hv-picked">
                  <span className="hv-picked-l">{t('hv.a1.yours')}</span>
                  {picks.length ? (
                    picks.map((id) => {
                      const label = p(WORD_BY_ID[id].label);
                      return (
                        <button
                          key={id}
                          type="button"
                          className="hv-chip"
                          style={{ ['--c' as string]: pos.get(id)?.c ?? 'var(--plum)' }}
                          aria-label={t('hv.a1.remove', { w: label })}
                          onClick={() => toggle(id)}
                        >
                          {label}
                          <span aria-hidden="true">&times;</span>
                        </button>
                      );
                    })
                  ) : (
                    <span className="hv-picked-none">{t('hv.a1.none')}</span>
                  )}
                </div>
                <button
                  className="btn btn-solid hv-go"
                  type="button"
                  onClick={build}
                  disabled={!picks.length || act !== 'field'}
                >
                  <span>{t('hv.a1.go')}</span> <span className="arw">&#8594;</span>
                </button>
                <p className="hv-limit" aria-live="polite">
                  {full ? t('hv.a1.full') : ''}
                </p>
              </div>
            </>
          ) : null}

          {/* -------- act two -------- */}
          {act === 'hive' || act === 'closing' ? (
            <>
              <div className="hv-head hv-enter" key="h2">
                <span className="eyebrow hv-step">{t('hv.a2.step')}</span>
                <h3 ref={hiveHeadRef} tabIndex={-1} dangerouslySetInnerHTML={{ __html: t('hv.a2.h') }} />
                <p className="hv-p-long">{t('hv.a2.p')}</p>
              </div>
              <div className="hv-ctl hv-enter" key="c2">
                <ol className="hv-stages" aria-label={t('hv.a2.stages')}>
                  {[0, 1, 2].map((s) => (
                    <li
                      key={s}
                      className={s < stage ? 'done' : s === stage ? 'now' : undefined}
                      style={{ ['--sc' as string]: STAGE_FILL[s] }}
                    >
                      <i aria-hidden="true" />
                      {stageName(s)}
                    </li>
                  ))}
                </ol>

                <div className="hv-say" aria-live="polite">
                  {stage < 3 ? (
                    <p className="hv-ask">
                      {askA}
                      <b style={{ color: STAGE_INK[stage] }}>{stageName(stage)}</b>
                      {askB}
                    </p>
                  ) : null}
                  {note ? (
                    <p className={`hv-note ${note.ok ? 'ok' : 'no'}`} key={`${note.id}-${mistakes}`}>
                      <b>{p(TILE_BY_ID[note.id].label)}.</b>{' '}
                      {note.ok
                        ? p(TILE_BY_ID[note.id].why)
                        : t('hv.a2.no', { stage: stageName(TILE_BY_ID[note.id].stage) })}
                    </p>
                  ) : (
                    <p className="hv-note">{coarse ? t('hv.a2.hintTouch') : t('hv.a2.hintPointer')}</p>
                  )}
                </div>

                <div className="hv-tray" role="group" aria-label={t('hv.a2.tray')}>
                  {hand.map((id) => {
                    const tile = TILE_BY_ID[id];
                    const gone = placed.has(id);
                    return (
                      <button
                        key={id}
                        ref={(el) => {
                          tileRefs.current[id] = el;
                        }}
                        type="button"
                        className={`hv-tile${gone ? ' gone' : ''}`}
                        aria-hidden={gone || undefined}
                        tabIndex={gone ? -1 : 0}
                        disabled={act !== 'hive'}
                        style={{ ['--sc' as string]: STAGE_INK[tile.stage] }}
                        onPointerDown={(e) => grab(e, id)}
                        onClick={() => {
                          if (dragged.current) {
                            dragged.current = false;
                            return;
                          }
                          place(id);
                        }}
                      >
                        <i className="hv-hx" aria-hidden="true" />
                        <span className="hv-tl">
                          {p(tile.label)}
                          {missed.includes(id) ? <em>{stageName(tile.stage)}</em> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          {/* -------- the ending -------- */}
          {act === 'done' ? (
            <>
              <div className="hv-head hv-enter" key="h3">
                <span className="eyebrow hv-step">{t('hv.done.eyebrow')}</span>
                <h3 ref={doneHeadRef} tabIndex={-1} dangerouslySetInnerHTML={{ __html: t('hv.done.h') }} />
                <p>{mistakes === 0 ? t('hv.done.perfect') : t('hv.done.moves', { n: 6 + mistakes })}</p>
              </div>
              <div className="hv-ctl hv-enter" key="c3">
                <div className="hv-card">
                  <div className="hv-thumb">
                    {card ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={card.url} alt={t('hv.card.alt', { w: lit.join(', ') })} width={1080} height={1350} />
                    ) : null}
                  </div>
                  <div className="hv-card-in">
                    <b>{t('hv.done.cardH')}</b>
                    <span>{t('hv.done.cardP')}</span>
                    <div className="hv-card-acts">
                      {canShare ? (
                        <button className="btn btn-light btn-sm" type="button" onClick={share} disabled={!card}>
                          <span>{t('hv.share')}</span>
                        </button>
                      ) : null}
                      <button
                        className={canShare ? 'hv-link' : 'btn btn-light btn-sm'}
                        type="button"
                        onClick={save}
                        disabled={!card}
                      >
                        {t('hv.save')}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="hv-next">{t('hv.done.p')}</p>
                <Link className="btn btn-solid" href="/assessment">
                  <span>{t('hv.done.cta')}</span> <span className="arw">&#8594;</span>
                </Link>

                {picked.length ? (
                  <div className="hv-guides">
                    <span>{t('hv.done.guides')}</span>
                    <ul>
                      {picked.map((g) => (
                        <li key={g.href}>
                          <Link href={g.href}>
                            {p(g.title)} <span className="arw">&#8594;</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <button className="hv-link hv-again" type="button" onClick={again}>
                  {t('hv.done.again')}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
