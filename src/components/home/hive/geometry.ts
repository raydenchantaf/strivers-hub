import type { StageIx } from './data';

/* The hive is a regular hexagon: pointy-top like the Strivers' Hub mark,
   with a hexagonal void at its centre, and six equal sides. It is
   deliberately not the mark's measured outline that the word field higher up
   the page uses (see hexlayout.ts) - that one has the logo's notched upper
   shoulders and a steeper foot, and as six cells of a hive it read as
   lopsided rather than as a hexagon.

   Points are [x, y] in percent of the figure's width and height. The figure
   is always drawn at a regular hexagon's proportion, so percent coordinates
   and pixels differ only by a scale per axis. */

export type Pt = [number, number];

/** Width over height of a regular pointy-top hexagon: sqrt(3) / 2. */
export const RATIO = Math.sqrt(3) / 2;

/** The void, as a fraction of the outline it is a scaled copy of. */
export const HOLE = 0.38;

/** Half-width at normalised height t, as a fraction of half the width. */
const PROFILE: Pt[] = [
  [0, 0],
  [0.25, 1],
  [0.75, 1],
  [1, 0],
];

export function halfWidth(t: number): number {
  if (t <= 0 || t >= 1) return 0;
  for (let i = 1; i < PROFILE.length; i++) {
    const [t1, w1] = PROFILE[i];
    if (t <= t1) {
      const [t0, w0] = PROFILE[i - 1];
      return w0 + ((t - t0) / (t1 - t0)) * (w1 - w0);
    }
  }
  return 0;
}

/** The widest the outline gets anywhere between two heights. */
function widestBetween(a: number, b: number): number {
  let w = Math.max(halfWidth(a), halfWidth(b));
  for (const [t, v] of PROFILE) if (t > a && t < b) w = Math.max(w, v);
  return w;
}

/** The outline, clockwise from the top. */
export const OUTLINE: Pt[] = [
  [50, 0],
  [100, 25],
  [100, 75],
  [50, 100],
  [0, 75],
  [0, 25],
];

const inner = ([x, y]: Pt): Pt => [50 + HOLE * (x - 50), 50 + HOLE * (y - 50)];
export const VOID: Pt[] = OUTLINE.map(inner);

function centroid(pts: Pt[]): Pt {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  return [cx / (3 * a), cy / (3 * a)];
}

export type Side = 'LL' | 'LR' | 'L' | 'R' | 'UL' | 'UR';

export type Seg = {
  side: Side;
  stage: StageIx;
  /** The ring between outline and void, cut at the hexagon's corners. */
  pts: Pt[];
  c: Pt;
};

/* Cut along the lines joining each outer corner to its inner one. The void
   is scaled about the centre, so those lines are radial and every cut is
   square to the ring.

   The order is the order the hive fills in: the bottom pair first, then the
   sides, then the top - a business built from the ground up. */
const O = OUTLINE;
const V = VOID;
const RAW: [Side, StageIx, Pt[]][] = [
  ['LL', 0, [O[3], O[4], V[4], V[3]]],
  ['LR', 0, [O[2], O[3], V[3], V[2]]],
  ['L', 1, [O[4], O[5], V[5], V[4]]],
  ['R', 1, [O[1], O[2], V[2], V[1]]],
  ['UL', 2, [O[5], O[0], V[0], V[5]]],
  ['UR', 2, [O[0], O[1], V[1], V[0]]],
];

export const SEGS: Seg[] = RAW.map(([side, stage, pts]) => ({ side, stage, pts, c: centroid(pts) }));

/** How far a cell is drawn in from its seamless shape while the hive is open. */
export const CELL = 0.9;

/* ------------------------------------------------------------ SVG space
   A viewBox 1000 wide at the hexagon's proportion, so percent maps straight on. */
export const VB_W = 1000;
export const VB_H = VB_W / RATIO;
export const vb = ([x, y]: Pt): Pt => [(x / 100) * VB_W, (y / 100) * VB_H];

export function pointsAttr(pts: Pt[], shrink = 1, about?: Pt): string {
  const c = about ?? centroid(pts);
  return pts
    .map(([x, y]) => vb([c[0] + shrink * (x - c[0]), c[1] + shrink * (y - c[1])]))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
}

/* ------------------------------------------------------------ colour
   The mark's ring read clockwise from the top: mauve, plum across the upper
   right, orange at the lower right, peach at the bottom, crimson up the left.
   These are the logo's own colours, for the finished hive. */
export const RING: Record<'top' | 'ur' | 'lr' | 'bottom' | 'll' | 'ul', string> = {
  top: '#965B81',
  ur: '#7D3269',
  lr: '#FE8B33',
  bottom: '#EFA07A',
  ll: '#D32B45',
  ul: '#B8456E',
};

/** Each cell of the finished mark runs from one corner's colour to the next. */
export const SEG_RAMP: Record<Side, [string, string, Pt, Pt]> = {
  LL: [RING.bottom, RING.ll, O[3], O[4]],
  LR: [RING.lr, RING.bottom, O[2], O[3]],
  L: [RING.ll, RING.ul, O[4], O[5]],
  R: [RING.ur, RING.lr, O[1], O[2]],
  UL: [RING.ul, RING.top, O[5], O[0]],
  UR: [RING.top, RING.ur, O[0], O[1]],
};

/* The lit colour of a word, read off the mark at the word's own angle about
   the centre, the way the word field above does it. These are the same hues
   darkened only as far as AA on --shell needs: the lightest clears 4.5:1. */
const LIT: [number, string][] = [
  [-180, '#D6004A'],
  [-135, '#C0297E'],
  [-90, '#AB4492'],
  [-30, '#A80072'],
  [10, '#AB0062'],
  [50, '#B85400'],
  [90, '#BF4D1E'],
  [135, '#D02E1A'],
  [180, '#D6004A'],
];

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

export function litColour(dx: number, dy: number): string {
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  for (let i = 1; i < LIT.length; i++) {
    const [d1, c1] = LIT[i];
    if (deg <= d1) {
      const [d0, c0] = LIT[i - 1];
      const f = (deg - d0) / (d1 - d0);
      const a = hex(c0);
      const b = hex(c1);
      const mix = a.map((v, k) => Math.round(v + f * (b[k] - v)));
      return `#${mix.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    }
  }
  return LIT[0][1];
}

/* ------------------------------------------------------------ the field
   Words are packed into the ring between the outline and the void, one row
   at a time, and justified across each row so the silhouette is exact
   whatever the words measure - the same construction as WordHex, done at
   run time because this field is bilingual and has to fit a phone.

   Widths are measured once per language at a 100px font, and scale linearly
   from there. The type size is then the largest at which every word fits:
   widest rows are filled first, longest words first, so the long words go
   where there is room and the short ones settle into the tapering ends. */

export type Sized = { id: string; w100: number };
export type Placed = { id: string; x: number; y: number; w: number; c: string };
export type FieldLayout = { s: number; rowH: number; items: Placed[] };

/** Row height as a multiple of the type size - also the tap target. */
const ROW = 2;
/* 8.5 is a floor for a figure squeezed into a landscape phone, not a size
   anything is designed at: a phone held upright packs at 11.5 to 13. */
const MIN_S = 8.5;
const MAX_S = 21;

type Slot = { x: number; w: number; y: number; words: { id: string; w: number }[] };

function slotsFor(W: number, H: number, s: number): Slot[] {
  const rowH = s * ROW;
  const rows = Math.floor(H / rowH);
  const top = (H - rows * rowH) / 2;
  const margin = Math.max(5, W * 0.024);
  const slots: Slot[] = [];
  const v0 = 0.5 - HOLE / 2;
  for (let i = 0; i < rows; i++) {
    const y = top + i * rowH;
    const t0 = y / H;
    const t1 = (y + rowH) / H;
    const half = Math.min(halfWidth(t0), halfWidth(t1)) * (W / 2);
    const left = W / 2 - half + margin;
    const right = W / 2 + half - margin;
    if (right - left <= 0) continue;
    const u0 = (t0 - v0) / HOLE;
    const u1 = (t1 - v0) / HOLE;
    if (u1 > 0 && u0 < 1) {
      const vh = widestBetween(Math.max(0, u0), Math.min(1, u1)) * HOLE * (W / 2);
      const vl = W / 2 - vh - margin;
      const vr = W / 2 + vh + margin;
      slots.push({ x: left, w: vl - left, y, words: [] });
      slots.push({ x: vr, w: right - vr, y, words: [] });
    } else {
      slots.push({ x: left, w: right - left, y, words: [] });
    }
  }
  return slots.filter((sl) => sl.w > 0);
}

function tryPack(W: number, H: number, s: number, words: Sized[]): Slot[] | null {
  const slots = slotsFor(W, H, s);
  const gap = s * 0.9;
  let left = words
    .map((w) => ({ id: w.id, w: (w.w100 * s) / 100 }))
    .sort((a, b) => b.w - a.w);
  for (const slot of [...slots].sort((a, b) => b.w - a.w)) {
    let used = 0;
    for (const word of left) {
      const need = word.w + (slot.words.length ? gap : 0);
      if (used + need <= slot.w) {
        slot.words.push(word);
        used += need;
      }
    }
    if (slot.words.length) left = left.filter((w) => !slot.words.includes(w));
    if (!left.length) break;
  }
  return left.length ? null : slots;
}

/** A fixed shuffle, so a row reads the same on every render. */
function scramble(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function packField(W: number, words: Sized[]): FieldLayout | null {
  if (!W || !words.length) return null;
  const H = W / RATIO;
  let lo = MIN_S;
  let hi = MAX_S;
  let best: Slot[] | null = tryPack(W, H, lo, words);
  if (!best) return null;
  for (let k = 0; k < 9; k++) {
    const mid = (lo + hi) / 2;
    const got = tryPack(W, H, mid, words);
    if (got) {
      lo = mid;
      best = got;
    } else {
      hi = mid;
    }
  }
  const s = lo;
  const rowH = s * ROW;
  const items: Placed[] = [];
  for (const slot of best) {
    const n = slot.words.length;
    if (!n) continue;
    const row = slot.words.slice().sort((a, b) => scramble(a.id) - scramble(b.id));
    const total = row.reduce((sum, w) => sum + w.w, 0);
    let gap = n > 1 ? (slot.w - total) / (n - 1) : 0;
    let x = slot.x;
    /* a thinly filled row is set as a group rather than stretched thin -
       an exact edge is not worth a word stranded at each end of it */
    if (n === 1 || gap > s * 4) {
      gap = n > 1 ? s * 2 : 0;
      x = slot.x + (slot.w - total - gap * (n - 1)) / 2;
    }
    for (const w of row) {
      const cx = x + w.w / 2 - W / 2;
      const cy = slot.y + rowH / 2 - H / 2;
      items.push({ id: w.id, x, y: slot.y, w: w.w, c: litColour(cx, cy) });
      x += w.w + gap;
    }
  }
  return { s, rowH, items };
}
