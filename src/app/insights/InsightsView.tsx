'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Insights, Range } from '@/lib/analytics/insights';

/**
 * The insights dashboard. Every chart is plain SVG drawn here - no charting
 * library - and follows the same rules: one hue for a single series, labels
 * on the marks rather than a colour key wherever possible, a tooltip on
 * hover, and a table behind the two time-series charts.
 */

type Count = { key: string; n: number };

const nf = new Intl.NumberFormat('en-MY');
const fmt = (n: number) => nf.format(Math.round(n));
function dur(ms: number) {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`;
}
function pct(a: number, b: number) {
  return b ? `${Math.round((a / b) * 100)}%` : '—';
}
function dayLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

const SECTION: Record<string, string> = {
  hero: 'Hero and quick quiz',
  field: 'Find your field',
  pathways: 'The three pathways',
  hive: 'The hive game',
  steps: 'How it works',
  mentor: 'Mentoring',
  guides: 'Free guides',
  rakyat: 'Rakyat Digital',
};
const SECTION_ORDER = ['hero', 'field', 'pathways', 'hive', 'steps', 'mentor', 'guides', 'rakyat'];
const FUNNEL: [string, string][] = [
  ['hero', 'Answered the homepage quiz'],
  ['start', 'Started the assessment'],
  ['done', 'Finished it'],
  ['offer', 'Were offered an account'],
  ['reg', 'Created an account'],
];
const QUIZ_SECTIONS: [string, string][] = [
  ['Business Status', 'Business status'],
  ['Business Info', 'About your business'],
  ['Categorisation', 'Where you are now'],
  ['Baseline', 'Digital confidence'],
  ['Demographic', 'About you'],
];
const STAGE_COLOUR: Record<string, string> = { Aspiring: '#0E6F63', Managing: '#B12069', Growing: '#F5A524' };
const HELPER: [string, string][] = [
  ['show', 'Appeared'],
  ['open', 'Opened by a visitor'],
  ['cta', 'Sent to the assessment'],
  ['dismiss', '"Not now"'],
];
/* the mood scale is diverging: two poles and a grey middle, checked for
   colour-blind separation - see the dataviz notes in the handover */
const MOOD = [
  { k: 'v1' as const, label: 'Tough', colour: '#C2410C' },
  { k: 'v2' as const, label: 'Steady', colour: '#9C8F98' },
  { k: 'v3' as const, label: 'Good', colour: '#2E6FB0' },
];
const ACCENT = '#822B62';

const get = (rows: Count[], key: string) => rows.find((r) => r.key === key)?.n ?? 0;

/** The drawn width of a chart, so its viewBox matches the screen one to one
 *  and axis text stays at its set size however wide the panel is. */
function useWidth<T extends Element>(fallback: number) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/* ------------------------------------------------------------------ bits */

function Panel({
  title,
  sub,
  wide,
  children,
}: {
  title: string;
  sub?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`ins-panel${wide ? ' wide' : ''}`}>
      <header>
        <h2>{title}</h2>
        {sub ? <p>{sub}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Empty({ children = 'Nothing recorded in this period yet.' }: { children?: React.ReactNode }) {
  return <p className="ins-empty">{children}</p>;
}

function Kpi({ label, value, prev, note }: { label: string; value: string; prev?: [number, number]; note?: string }) {
  let delta: React.ReactNode = null;
  if (prev) {
    const [now, before] = prev;
    if (before > 0) {
      const d = Math.round(((now - before) / before) * 100);
      delta = (
        <span className={`ins-delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}`}>
          {d > 0 ? '▲' : d < 0 ? '▼' : '■'} {Math.abs(d)}% <em>vs previous period</em>
        </span>
      );
    } else if (now > 0) {
      delta = <span className="ins-delta">new this period</span>;
    }
  }
  return (
    <div className="ins-kpi">
      <span className="ins-kpi-l">{label}</span>
      <b className="tnum">{value}</b>
      {delta}
      {note ? <span className="ins-kpi-n">{note}</span> : null}
    </div>
  );
}

/** Horizontal bars, labelled on the mark. One hue: this is magnitude, not identity. */
function Bars({
  rows,
  of,
  unit = '',
  marker,
}: {
  rows: { label: string; n: number; note?: string }[];
  of?: number;
  unit?: string;
  marker?: (label: string) => string | undefined;
}) {
  const [hover, setHover] = useState(-1);
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length || rows.every((r) => !r.n)) return <Empty />;
  return (
    <ul className="ins-bars">
      {rows.map((r, i) => (
        <li
          key={r.label}
          className={hover === i ? 'hot' : undefined}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(-1)}
        >
          <span className="ins-bars-l">
            {marker?.(r.label) ? <i style={{ background: marker(r.label) }} aria-hidden="true" /> : null}
            {r.label}
          </span>
          <span className="ins-bars-t">
            <span className="ins-bars-f" style={{ width: `${Math.max(1.5, (r.n / max) * 100)}%` }} />
          </span>
          <span className="ins-bars-v tnum">
            {fmt(r.n)}
            {unit}
            {of ? <em>{pct(r.n, of)}</em> : null}
          </span>
          {hover === i && r.note ? <span className="ins-tip">{r.note}</span> : null}
        </li>
      ))}
    </ul>
  );
}

/** Visitors per day: one series, so no key; hover shows the day. */
function Line({ data }: { data: Insights['daily'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const [box, W] = useWidth<HTMLDivElement>(640);
  const H = 230;
  const P = { l: 34, r: 12, t: 14, b: 26 };
  const max = Math.max(4, ...data.map((d) => d.visitors));
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const x = (i: number) => P.l + (i / Math.max(1, data.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - v / top) * (H - P.t - P.b);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.visitors).toFixed(1)}`).join('');
  const area = `${path}L${x(data.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
  const ticks = W < 520 ? [0, data.length - 1] : [0, Math.floor((data.length - 1) / 2), data.length - 1];

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - P.l) / (W - P.l - P.r)) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, i)));
  };

  if (data.every((d) => !d.visitors)) return <Empty />;
  const h = hover !== null ? data[hover] : null;
  return (
    <div className="ins-line" ref={box}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Visitors per day"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {[0, 1, 2, 3, 4].map((g) => (
          <g key={g}>
            <line x1={P.l} x2={W - P.r} y1={y(g * step)} y2={y(g * step)} className="ins-gl" />
            <text x={P.l - 8} y={y(g * step) + 3.5} className="ins-ax" textAnchor="end">
              {g * step}
            </text>
          </g>
        ))}
        {ticks.map((i) => (
          <text key={i} x={x(i)} y={H - 6} className="ins-ax" textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}>
            {dayLabel(data[i].day)}
          </text>
        ))}
        <path d={area} fill={ACCENT} opacity=".08" />
        <path d={path} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {h && hover !== null ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={y(0)} className="ins-cross" />
            <circle cx={x(hover)} cy={y(h.visitors)} r="4.5" fill={ACCENT} stroke="#fff" strokeWidth="2" />
          </g>
        ) : null}
      </svg>
      {h && hover !== null ? (
        <div className="ins-tip ins-tip-line" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <b>{dayLabel(h.day)}</b>
          {fmt(h.visitors)} visitors · {fmt(h.pageviews)} page views
        </div>
      ) : null}
    </div>
  );
}

/** The weekly pulse: stacked share per week, diverging colours, labelled key. */
function MoodWeeks({ weeks }: { weeks: Insights['moodWeeks'] }) {
  const [hover, setHover] = useState(-1);
  const [box, W] = useWidth<HTMLDivElement>(560);
  const H = 190;
  const P = { l: 8, r: 8, t: 22, b: 26 };
  const slot = (W - P.l - P.r) / weeks.length;
  const bw = Math.min(46, slot * 0.6);
  const ih = H - P.t - P.b;
  if (!weeks.length) return <Empty>No answers to the weekly mood check yet.</Empty>;
  const last = weeks[weeks.length - 1];
  const lastN = last.v1 + last.v2 + last.v3;
  return (
    <div className="ins-mood">
      <div className="ins-mood-now">
        <span className="ins-mood-wk">
          Latest, week {last.week.replace(/^\d{4}-W/, '')}
          <b className="tnum">
            {fmt(lastN)} answer{lastN === 1 ? '' : 's'}
          </b>
        </span>
        {MOOD.map((m) => (
          <span key={m.k}>
            <span className="ins-mood-l">
              <i style={{ background: m.colour }} aria-hidden="true" />
              {m.label}
            </span>
            <b className="tnum">{pct(last[m.k], lastN)}</b>
          </span>
        ))}
      </div>
      <ul className="ins-key">
        {MOOD.map((m) => (
          <li key={m.k}>
            <i style={{ background: m.colour }} aria-hidden="true" />
            {m.label}
          </li>
        ))}
      </ul>
      <div className="ins-line" ref={box}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weekly mood check, share of answers per week">
          {weeks.map((w, i) => {
            const total = w.v1 + w.v2 + w.v3;
            const cx = P.l + slot * i + slot / 2;
            let yy = P.t + ih;
            return (
              <g key={w.week} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)}>
                <rect x={cx - slot / 2} y={P.t} width={slot} height={ih} fill="transparent" />
                {MOOD.map((m) => {
                  const hgt = total ? (w[m.k] / total) * ih : 0;
                  yy -= hgt;
                  return hgt > 0 ? (
                    <rect
                      key={m.k}
                      x={cx - bw / 2}
                      y={yy + 1}
                      width={bw}
                      height={Math.max(0, hgt - 2)}
                      rx="3"
                      fill={m.colour}
                      opacity={hover === -1 || hover === i ? 1 : 0.45}
                    />
                  ) : null;
                })}
                <text x={cx} y={P.t - 7} className="ins-ax" textAnchor="middle">
                  {total}
                </text>
                <text x={cx} y={H - 7} className="ins-ax" textAnchor="middle">
                  {w.week.replace(/^\d{4}-/, '')}
                </text>
              </g>
            );
          })}
        </svg>
        {hover >= 0 ? (
          <div className="ins-tip ins-tip-line" style={{ left: `${((P.l + slot * hover + slot / 2) / W) * 100}%` }}>
            <b>Week {weeks[hover].week.replace(/^\d{4}-W/, '')}</b>
            {MOOD.map((m) => `${m.label} ${weeks[hover][m.k]}`).join(' · ')}
          </div>
        ) : null}
      </div>
      <details className="ins-table">
        <summary>Show as a table</summary>
        <table>
          <thead>
            <tr>
              <th>Week</th>
              {MOOD.map((m) => (
                <th key={m.k}>{m.label}</th>
              ))}
              <th>Answers</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.week}>
                <td>{w.week}</td>
                <td>{w.v1}</td>
                <td>{w.v2}</td>
                <td>{w.v3}</td>
                <td>{w.v1 + w.v2 + w.v3}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/* ------------------------------------------------------------------ heatmap */

type HeatPage = Insights['heatPages'][number];
/* open on whichever device class actually has clicks on the page */
const busier = (p?: HeatPage): 'd' | 'm' => (p && p.m > p.d ? 'm' : 'd');

function Heatmap({ pages, range }: { pages: HeatPage[]; range: Range }) {
  const [path, setPath] = useState(pages[0]?.key ?? '/');
  const [dev, setDev] = useState<'d' | 'm'>(busier(pages[0]));
  const pick = (key: string) => {
    setPath(key);
    const p = pages.find((x) => x.key === key);
    if (p && !p[dev]) setDev(busier(p));
  };
  const [data, setData] = useState<{ points: [number, number, number][]; vw: number; h: number; clicks: number } | null>(null);
  const [docH, setDocH] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [boxW, setBoxW] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBoxW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let live = true;
    setData(null);
    fetch(`/api/insights/heat?path=${encodeURIComponent(path)}&dev=${dev}&r=${range}`)
      .then((r) => r.json())
      .then((d) => live && setData(d))
      .catch(() => live && setData({ points: [], vw: 0, h: 0, clicks: 0 }));
    return () => {
      live = false;
    };
  }, [path, dev, range]);

  const vw = Math.min(1600, Math.max(360, data?.vw || (dev === 'm' ? 390 : 1440)));
  const height = Math.max(docH, data?.h ?? 0, 900);
  const scale = boxW ? Math.min(1, boxW / vw) : 0.5;

  const onLoad = useCallback(() => {
    try {
      const doc = frame.current?.contentDocument;
      if (doc) setDocH(doc.documentElement.scrollHeight);
    } catch {
      /* cross-origin: keep the recorded height */
    }
  }, []);

  /* density on an alpha canvas, then coloured with one hue: light to dark */
  useEffect(() => {
    const c = canvas.current;
    if (!c || !data) return;
    c.width = vw;
    c.height = height;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, vw, height);
    if (!data.points.length) return;
    const max = Math.max(...data.points.map((p) => p[2]));
    const r = dev === 'm' ? 22 : 30;
    for (const [px, py, n] of data.points) {
      const x = (px / 1000) * vw;
      const g = ctx.createRadialGradient(x, py, 0, x, py, r);
      const a = 0.18 + 0.82 * Math.sqrt(n / max);
      g.addColorStop(0, `rgba(0,0,0,${a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, py - r, r * 2, r * 2);
    }
    const img = ctx.getImageData(0, 0, vw, height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3] / 255;
      if (!a) continue;
      /* #F7C6DA (light) to #822B62 (plum): one hue, light to dark */
      d[i] = Math.round(247 + (130 - 247) * a);
      d[i + 1] = Math.round(198 + (43 - 198) * a);
      d[i + 2] = Math.round(218 + (98 - 218) * a);
      d[i + 3] = Math.round(Math.min(1, a * 1.25) * 215);
    }
    ctx.putImageData(img, 0, 0);
  }, [data, vw, height, dev]);

  if (!pages.length) return <Empty>No clicks recorded in this period yet.</Empty>;
  const src = `/en${path === '/' ? '' : path}`;
  return (
    <div className="ins-heat">
      <div className="ins-heat-bar">
        <label>
          Page
          <select value={path} onChange={(e) => pick(e.target.value)}>
            {pages.map((p) => (
              <option key={p.key} value={p.key}>
                {p.key} ({fmt(p.d)} desktop · {fmt(p.m)} phone)
              </option>
            ))}
          </select>
        </label>
        <div className="ins-seg" role="group" aria-label="Device">
          <button type="button" aria-pressed={dev === 'd'} onClick={() => setDev('d')}>
            Desktop
          </button>
          <button type="button" aria-pressed={dev === 'm'} onClick={() => setDev('m')}>
            Phone
          </button>
        </div>
        <span className="ins-heat-n">{data ? `${fmt(data.clicks)} clicks` : 'Loading…'}</span>
      </div>
      <div className="ins-heat-box" ref={box}>
        <div className="ins-heat-scroll" style={{ height: Math.min(720, height * scale) }}>
          <div
            className="ins-heat-stage"
            style={{ width: vw, height, transform: `scale(${scale})`, marginLeft: Math.max(0, (boxW - vw * scale) / 2) }}
          >
            <iframe
              ref={frame}
              key={`${src}-${vw}`}
              src={src}
              title={`Preview of ${path}`}
              width={vw}
              height={height}
              onLoad={onLoad}
              tabIndex={-1}
              aria-hidden="true"
            />
            <canvas ref={canvas} aria-hidden="true" />
          </div>
        </div>
        {data && !data.points.length ? <p className="ins-heat-none">No {dev === 'm' ? 'phone' : 'desktop'} clicks on this page yet.</p> : null}
      </div>
      <p className="ins-foot-note">
        Darker means more clicks. Positions are recorded relative to the width of the visitor&rsquo;s screen, so the
        preview is drawn at the most common width for this device class; on pages whose layout changes with width the
        dots are approximate.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ view */

export function InsightsView({ data, range, error }: { data: Insights | null; range: Range; error: string }) {
  const logout = async () => {
    await fetch('/api/insights/logout', { method: 'POST' }).catch(() => null);
    window.location.reload();
  };

  const header = (
    <header className="ins-top">
      <div className="ins-brand">
        <Image src="/img/logo.webp" alt="Strivers' Hub" width={440} height={131} priority />
        <span className="ins-title">
          Insights <span className="serif-i">dashboard</span>
        </span>
      </div>
      <nav className="ins-range" aria-label="Period">
        {([7, 30, 90] as Range[]).map((r) => (
          <a key={r} href={`/insights?r=${r}`} aria-current={r === range ? 'page' : undefined}>
            {r} days
          </a>
        ))}
      </nav>
      <div className="ins-right">
        <span className="ins-by">
          <span>Powered by</span>
          <Image src="/img/unbound.webp" alt="UnBound" width={480} height={117} />
        </span>
        <button type="button" className="ins-out" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );

  if (!data) {
    return (
      <main className="ins">
        {header}
        <div className="ins-wrap">
          <Panel title="No data source" wide>
            <Empty>
              {error
                ? `The analytics database could not be reached: ${error}`
                : 'Set DATABASE_URL on the server to start collecting. Nothing is recorded until then.'}
            </Empty>
          </Panel>
        </div>
      </main>
    );
  }

  const k = data.kpi;
  const funnelBase = Math.max(get(data.funnel, 'hero'), get(data.funnel, 'start'), 1);
  const sections = SECTION_ORDER.filter((s) => SECTION[s]).map((s) => ({
    label: SECTION[s],
    n: get(data.sections, s),
    note: `${fmt(get(data.sections, s))} of ${fmt(data.homeSessions)} homepage visits reached it`,
  }));
  /* a guide's page reads better by its title, known from clicks into it */
  const titles = new Map(data.guides.filter((g) => g.title).map((g) => [`/${g.kind}/${g.slug}`, g.title]));
  const kinds: [string, string][] = [
    ['topic', 'Guide topics opened'],
    ['business', 'Businesses described in the hive'],
    ['stage', 'Assessment stages'],
  ];

  return (
    <main className="ins">
      {header}
      <div className="ins-wrap">
        <p className="ins-intro">
          The last {range} days on Strivers&rsquo; Hub, counted by the site itself: no cookies, no third parties, and no
          names, emails or IP addresses stored. Times are Malaysian. Compared, where shown, with the {range} days before.
        </p>

        <div className="ins-kpis">
          <Kpi label="Visitors" value={fmt(k.visitors)} prev={[k.visitors, data.prev.visitors]} note="Counted once a day each" />
          <Kpi label="Page views" value={fmt(k.pageviews)} prev={[k.pageviews, data.prev.pageviews]} />
          <Kpi label="Average time on a page" value={dur(k.avgMs)} />
          <Kpi
            label="Assessments finished"
            value={fmt(k.finished)}
            prev={[k.finished, data.prev.finished]}
            note={`${pct(k.finished, k.started)} of the ${fmt(k.started)} started`}
          />
          <Kpi label="Clicks into free guides" value={fmt(k.guides)} prev={[k.guides, data.prev.guides]} />
          <Kpi label="Mood check answers" value={fmt(k.moods)} note="The helper's weekly question" />
        </div>

        <div className="ins-grid">
          <Panel title="Visitors per day" sub="Unique visitors each day." wide>
            <Line data={data.daily} />
            <details className="ins-table">
              <summary>Show as a table</summary>
              <table>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Visitors</th>
                    <th>Page views</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily.map((d) => (
                    <tr key={d.day}>
                      <td>{d.day}</td>
                      <td>{d.visitors}</td>
                      <td>{d.pageviews}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </Panel>

          <Panel title="Engagement on the homepage" sub={`How far down people get: share of the ${fmt(data.homeSessions)} homepage visits that reached each section.`}>
            <Bars rows={sections} of={data.homeSessions} />
          </Panel>

          <Panel title="Most visited pages" sub="Page views, and the average time spent on each.">
            {data.pages.length ? (
              <table className="ins-list">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th className="r">Views</th>
                    <th className="r">Visitors</th>
                    <th className="r">Avg. time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pages.map((pg) => (
                    <tr key={pg.path}>
                      <td>
                        {titles.get(pg.path) ? <span className="ins-page-t">{titles.get(pg.path)}</span> : null}
                        <code>{pg.path}</code>
                      </td>
                      <td className="r tnum">{fmt(pg.pageviews)}</td>
                      <td className="r tnum">{fmt(pg.visitors)}</td>
                      <td className="r tnum">{dur(pg.avgMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Empty />
            )}
          </Panel>

          <Panel title="The weekly pulse" sub="Answers to the helper's “How is business this week?”, last eight weeks, as a share of each week's answers.">
            <MoodWeeks weeks={data.moodWeeks} />
          </Panel>

          <Panel title="Interest this week" sub="Monday to today against the whole of last week.">
            {data.trends.length ? (
              <div className="ins-trends">
                {kinds.map(([kind, label]) => {
                  const rows = data.trends.filter((t) => t.kind === kind).slice(0, 5);
                  if (!rows.length) return null;
                  return (
                    <div key={kind}>
                      <h3>{label}</h3>
                      <table className="ins-list ins-fixed">
                        <colgroup>
                          <col />
                          <col className="ins-c-n" />
                          <col className="ins-c-n" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th></th>
                            <th className="r">This week</th>
                            <th className="r">Last week</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr key={r.key}>
                              <td>{r.key}</td>
                              <td className="r tnum">
                                {fmt(r.thisWeek)}{' '}
                                {r.thisWeek > r.lastWeek ? (
                                  <span className="ins-arrow up" aria-label="up">▲</span>
                                ) : r.thisWeek < r.lastWeek ? (
                                  <span className="ins-arrow down" aria-label="down">▼</span>
                                ) : null}
                              </td>
                              <td className="r tnum">{fmt(r.lastWeek)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty>Nothing yet this week or last.</Empty>
            )}
          </Panel>

          <Panel title="The assessment funnel" sub="Visits at each step, as a share of the first.">
            <Bars rows={FUNNEL.map(([key, label]) => ({ label, n: get(data.funnel, key) }))} of={funnelBase} />
            <p className="ins-small">
              Skipped the account offer: <b>{fmt(get(data.funnel, 'skip'))}</b> · Retook it:{' '}
              <b>{fmt(get(data.funnel, 'retake'))}</b>
            </p>
          </Panel>

          <Panel title="Where people stop" sub="Visits that reached each of the assessment's five sections.">
            <Bars
              rows={QUIZ_SECTIONS.map(([key, label]) => ({ label, n: get(data.quizSections, key) }))}
              of={Math.max(1, get(data.quizSections, 'Business Status'))}
            />
          </Panel>

          <Panel title="Stages" sub="Where finished assessments placed people.">
            <Bars
              rows={['Aspiring', 'Managing', 'Growing'].map((s) => ({ label: s, n: get(data.stages, s) }))}
              of={Math.max(1, k.finished)}
              marker={(l) => STAGE_COLOUR[l]}
            />
          </Panel>

          <Panel title="The helper and the partners" sub="The corner character, the pre-assessment loader, and clicks on partner marks.">
            <Bars rows={HELPER.map(([key, label]) => ({ label, n: get(data.helper, key) }))} />
            <p className="ins-small">
              Loading screen shown: <b>{fmt(data.loader)}</b>
              {data.partners.length ? (
                <>
                  {' '}
                  · Partner clicks:{' '}
                  {data.partners.map((pp, i) => (
                    <span key={pp.key}>
                      {i ? ' · ' : ''}
                      {pp.key} <b>{fmt(pp.n)}</b>
                    </span>
                  ))}
                </>
              ) : null}
            </p>
          </Panel>

          <Panel title="Free guides people opened" sub="Clicks into guides and financing pages, from anywhere on the site.">
            {data.guides.length ? (
              <table className="ins-list">
                <thead>
                  <tr>
                    <th>Guide</th>
                    <th className="r">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.guides.map((g) => (
                    <tr key={g.slug}>
                      <td>{g.title || g.slug}</td>
                      <td className="r tnum">{fmt(g.n)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Empty />
            )}
          </Panel>

          <Panel title="Guide topics" sub="The first category of each guide clicked.">
            <Bars rows={data.guideCats.map((c) => ({ label: c.key, n: c.n }))} />
            {data.guideFrom.length ? (
              <p className="ins-small">
                Clicked from:{' '}
                {data.guideFrom.map((f, i) => (
                  <span key={f.key}>
                    {i ? ' · ' : ''}
                    <code>{f.key}</code> {fmt(f.n)}
                  </span>
                ))}
              </p>
            ) : null}
          </Panel>

          <Panel title="Find your field: what businesses are about" sub="Words visitors lit up in the hive game - a deliberate choice, up to three each.">
            <Bars rows={data.hivePicks.map((c) => ({ label: c.key, n: c.n }))} />
          </Panel>

          <Panel title="Find your field: what catches the eye" sub="Words in the homepage topics field that a pointer rested on for most of a second. Desktop only.">
            <Bars rows={data.fieldHover.map((c) => ({ label: c.key, n: c.n }))} />
          </Panel>

          <Panel title="Click heatmap" sub="Where people click, drawn over the page itself." wide>
            <Heatmap pages={data.heatPages} range={range} />
          </Panel>

          <Panel title="Devices and languages" sub="Visitors in this period.">
            <Bars
              rows={[
                { label: 'Phone', n: get(data.devices, 'm') },
                { label: 'Desktop', n: get(data.devices, 'd') },
              ]}
              of={Math.max(1, k.visitors)}
            />
            <Bars
              rows={[
                { label: 'Bahasa Melayu', n: get(data.langs, 'ms') },
                { label: 'English', n: get(data.langs, 'en') },
              ]}
              of={Math.max(1, k.visitors)}
            />
          </Panel>

          <Panel title="Where visitors come from" sub="Other websites that sent people here.">
            <Bars rows={data.refs.map((r) => ({ label: r.key, n: r.n }))} />
          </Panel>
        </div>

        <footer className="ins-foot">
          <span>
            First-party analytics for Strivers&rsquo; Hub. Visitors are counted with an identifier that changes every
            day; nothing personal is stored. Where Google Analytics is configured, the same events are sent there too.
          </span>
          <span className="ins-by">
            <span>Powered by</span>
            <Image src="/img/unbound.webp" alt="UnBound" width={480} height={117} />
          </span>
        </footer>
      </div>
    </main>
  );
}
