import { HOLE, RATIO, SEGS, SEG_RAMP, type Pt } from './geometry';

/* The share card: 1080 x 1350, the 4:5 portrait that Instagram, WhatsApp and
   a phone's gallery all show uncropped. Drawn on a canvas in the browser, so
   nothing about the visitor's picks leaves the device unless they share it.

   It is the finished hive on the hero's colour field, the same blooms the
   registration dialog wears, with the visitor's three words under it and the
   address to build their own. */

export type CardText = {
  eyebrow: string;
  line1: string;
  /** set in the serif italic, in magenta */
  line2: string;
  fieldLabel: string;
  field: string[];
  stages: [string, string, string];
  badge: string | null;
  foot: string;
  host: string;
};

const W = 1080;
const H = 1350;
const PAD = 88;

const INK = '#1A0B15';
const INK_2 = '#4A3542';
const MAGENTA = '#B12069';
const PLUM = '#822B62';
const STAGE = ['#0E6F63', '#B12069', '#F5A524'];

function load(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function bloom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgba: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba);
  g.addColorStop(1, 'rgba(255,246,241,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Letter-spacing where the canvas supports it; plain where it does not. */
function spaced(ctx: CanvasRenderingContext2D, px: number) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ('letterSpacing' in c) c.letterSpacing = `${px}px`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderCard(text: CardText, fonts: { sans: string; serif: string }): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const [mark, logo] = await Promise.all([load('/img/logo-mark.webp'), load('/img/logo.webp')]);
  const sans = (weight: number, size: number) => `${weight} ${size}px ${fonts.sans}`;
  const serif = (size: number) => `italic 400 ${size}px ${fonts.serif}`;

  /* ground */
  ctx.fillStyle = '#FFF6F1';
  ctx.fillRect(0, 0, W, H);
  bloom(ctx, W * 0.08, H * 0.12, W * 0.95, 'rgba(255,112,0,0.20)');
  bloom(ctx, W * 0.94, H * 0.06, W * 0.85, 'rgba(177,32,105,0.17)');
  bloom(ctx, W * 0.62, H * 1.02, W * 1.0, 'rgba(245,165,36,0.22)');
  bloom(ctx, W * 0.2, H * 0.9, W * 0.7, 'rgba(255,96,144,0.13)');

  /* eyebrow */
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = MAGENTA;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(PAD, 124, 34, 2.5);
  ctx.globalAlpha = 1;
  ctx.font = sans(700, 24);
  spaced(ctx, 3.6);
  ctx.fillText(text.eyebrow.toUpperCase(), PAD + 48, 134);
  spaced(ctx, 0);

  /* badge, top right */
  if (text.badge) {
    ctx.font = sans(800, 21);
    spaced(ctx, 2);
    const label = text.badge.toUpperCase();
    const bw = ctx.measureText(label).width + 44;
    const bx = W - PAD - bw;
    ctx.fillStyle = '#0E6F63';
    ctx.beginPath();
    ctx.roundRect(bx, 98, bw, 50, 25);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label, bx + 22, 131);
    spaced(ctx, 0);
  }

  /* headline */
  ctx.fillStyle = INK;
  ctx.font = sans(800, 70);
  spaced(ctx, -2);
  ctx.fillText(text.line1, PAD, 232);
  spaced(ctx, 0);
  ctx.fillStyle = MAGENTA;
  ctx.font = serif(84);
  ctx.fillText(text.line2, PAD, 312);

  /* the finished hive */
  const mw = 440;
  const mh = mw / RATIO;
  const mx = (W - mw) / 2;
  const my = 364;
  const at = ([x, y]: Pt): Pt => [mx + (x / 100) * mw, my + (y / 100) * mh];

  ctx.save();
  ctx.shadowColor = 'rgba(107,16,64,0.22)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  for (const seg of SEGS) {
    const [c0, c1, p0, p1] = SEG_RAMP[seg.side];
    const [x0, y0] = at(p0);
    const [x1, y1] = at(p1);
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.beginPath();
    seg.pts.forEach((p, i) => {
      const [x, y] = at(p);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  /* hairline seams where the six cells meet, so it reads as built, not cast */
  ctx.strokeStyle = 'rgba(255,246,241,0.55)';
  ctx.lineWidth = 3;
  for (const seg of SEGS) {
    ctx.beginPath();
    seg.pts.forEach((p, i) => {
      const [x, y] = at(p);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  /* the mark itself in the void */
  if (mark) {
    const vw = mw * HOLE * 0.78;
    const vh = vw * (mark.naturalHeight / mark.naturalWidth);
    ctx.drawImage(mark, W / 2 - vw / 2, my + mh / 2 - vh / 2, vw, vh);
  }

  /* The visitor's field. One line if it can be had at a size that still
     reads as a headline; two at a slightly larger one if not. Three Malay
     phrases run well past the width at full size, and a line that wrapped
     unplanned ran straight into the stage row below it. */
  let y = my + mh + 76;
  ctx.textAlign = 'center';
  ctx.fillStyle = INK_2;
  ctx.font = sans(700, 22);
  spaced(ctx, 3.2);
  ctx.fillText(text.fieldLabel.toUpperCase(), W / 2, y);
  spaced(ctx, 0);
  ctx.fillStyle = INK;
  const field = text.field.join('  ·  ');
  const room = W - PAD * 2;
  ctx.font = serif(58);
  const size = Math.min(58, Math.floor((58 * room) / ctx.measureText(field).width));
  let lines = [field];
  let lead = 0;
  if (size >= 44) {
    ctx.font = serif(size);
    lead = size + 8;
  } else {
    ctx.font = serif(50);
    lines = wrap(ctx, field, room).slice(0, 2);
    lead = 58;
  }
  for (const line of lines) {
    y += lead;
    ctx.fillText(line, W / 2, y);
  }

  /* the three stages, in the order they were built - under the field, and
     never into the foot */
  y = Math.min(y + 76, H - 186);
  ctx.font = sans(700, 25);
  const arrow = '  →  ';
  const parts = text.stages;
  const widths = parts.map((p) => ctx.measureText(p).width + 28);
  const arrowW = ctx.measureText(arrow).width;
  let x = W / 2 - (widths.reduce((a, b) => a + b, 0) + arrowW * 2) / 2;
  ctx.textAlign = 'left';
  parts.forEach((p, i) => {
    ctx.fillStyle = STAGE[i];
    ctx.beginPath();
    ctx.arc(x + 8, y - 9, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillText(p, x + 28, y);
    x += widths[i];
    if (i < 2) {
      ctx.fillStyle = INK_2;
      ctx.fillText(arrow, x, y);
      x += arrowW;
    }
  });

  /* foot */
  ctx.fillStyle = 'rgba(130,43,98,0.16)';
  ctx.fillRect(PAD, H - 150, W - PAD * 2, 2);
  if (logo) {
    const lh = 62;
    const lw = lh * (logo.naturalWidth / logo.naturalHeight);
    ctx.drawImage(logo, PAD - 6, H - 118, lw, lh);
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = INK_2;
  ctx.font = sans(600, 22);
  ctx.fillText(text.foot, W - PAD, H - 92);
  ctx.fillStyle = PLUM;
  ctx.font = sans(800, 28);
  ctx.fillText(text.host, W - PAD, H - 56);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
