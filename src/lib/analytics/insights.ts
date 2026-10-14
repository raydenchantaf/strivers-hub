import 'server-only';
import { ready } from './db';

/**
 * The numbers behind /insights, from the raw events table. Every query is a
 * plain aggregate over one table; at this platform's scale that is fast
 * enough to run on each page load, and it means nothing has to be kept in
 * step with anything else. `day` is the Malaysian calendar day the event
 * landed on, so "today" and "this week" mean what TAF's team means by them.
 */

export type Range = 7 | 30 | 90;
export const RANGES: Range[] = [7, 30, 90];

type Count = { key: string; n: number };

export type Insights = {
  range: Range;
  kpi: {
    visitors: number;
    pageviews: number;
    sessions: number;
    avgMs: number;
    started: number;
    finished: number;
    registered: number;
    guides: number;
    moods: number;
  };
  prev: { visitors: number; pageviews: number; finished: number; guides: number };
  daily: { day: string; visitors: number; pageviews: number }[];
  pages: { path: string; pageviews: number; visitors: number; avgMs: number }[];
  homeSessions: number;
  sections: Count[];
  funnel: Count[];
  quizSections: Count[];
  stages: Count[];
  guides: { slug: string; title: string; kind: string; n: number }[];
  guideCats: Count[];
  guideFrom: Count[];
  hivePicks: Count[];
  fieldHover: Count[];
  moodWeeks: { week: string; v1: number; v2: number; v3: number }[];
  trends: { kind: string; key: string; thisWeek: number; lastWeek: number }[];
  devices: Count[];
  langs: Count[];
  refs: Count[];
  /** first-page visits referred by Rakyat Digital, by referrer or campaign tag (tier 1) */
  rakyat: number;
  helper: Count[];
  partners: Count[];
  loader: number;
  heatPages: { key: string; n: number; d: number; m: number }[];
};

const WINDOW = `day >= (now() at time zone 'Asia/Kuala_Lumpur')::date - $1::int + 1`;
const PREV = `day >= (now() at time zone 'Asia/Kuala_Lumpur')::date - 2 * $1::int + 1
              and day <= (now() at time zone 'Asia/Kuala_Lumpur')::date - $1::int`;

const num = (v: unknown) => Number(v ?? 0) || 0;
const counts = (rows: { key: unknown; n: unknown }[]): Count[] =>
  rows.filter((r) => r.key !== null && r.key !== '').map((r) => ({ key: String(r.key), n: num(r.n) }));

export async function load(range: Range): Promise<Insights | null> {
  const db = await ready();
  if (!db) return null;
  const q = async <T = Record<string, unknown>>(sql: string, params: unknown[] = [range]) =>
    (await db.query(sql, params)).rows as T[];

  const [kpi] = await q(`
    select count(distinct vid) filter (where type = 'pv') as visitors,
           count(*) filter (where type = 'pv') as pageviews,
           count(distinct sid) filter (where type = 'pv') as sessions,
           coalesce(avg((data->>'ms')::numeric) filter (where type = 'dwell'), 0) as avg_ms,
           count(distinct sid) filter (where type = 'quiz' and data->>'s' = 'start') as started,
           count(*) filter (where type = 'quiz' and data->>'s' = 'done') as finished,
           count(*) filter (where type = 'quiz' and data->>'s' = 'reg') as registered,
           count(*) filter (where type = 'guide') as guides,
           count(*) filter (where type = 'mood') as moods
    from analytics_events where ${WINDOW}`);
  const [prev] = await q(`
    select count(distinct vid) filter (where type = 'pv') as visitors,
           count(*) filter (where type = 'pv') as pageviews,
           count(*) filter (where type = 'quiz' and data->>'s' = 'done') as finished,
           count(*) filter (where type = 'guide') as guides
    from analytics_events where ${PREV}`);

  /* dates leave the database as text: a JS Date would be midnight in the
     server's own time zone, which shifts the day once it is turned to UTC */
  const dailyRows = await q<{ day: string; visitors: unknown; pageviews: unknown }>(`
    select day::text as day, count(distinct vid) as visitors, count(*) as pageviews
    from analytics_events where type = 'pv' and ${WINDOW} group by day order by day`);
  const byDay = new Map(dailyRows.map((r) => [r.day, { visitors: num(r.visitors), pageviews: num(r.pageviews) }]));
  const [{ today }] = await q<{ today: string }>(
    `select ((now() at time zone 'Asia/Kuala_Lumpur')::date)::text as today`,
    [],
  );
  const end = new Date(today + 'T00:00:00Z');
  const daily: Insights['daily'] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 86400000).toISOString().slice(0, 10);
    daily.push({ day: d, ...(byDay.get(d) ?? { visitors: 0, pageviews: 0 }) });
  }

  const pageRows = await q<{ path: string; pageviews: unknown; visitors: unknown }>(`
    select path, count(*) as pageviews, count(distinct vid) as visitors
    from analytics_events where type = 'pv' and ${WINDOW}
    group by path order by pageviews desc limit 12`);
  const dwellRows = await q<{ path: string; ms: unknown }>(`
    select path, avg((data->>'ms')::numeric) as ms
    from analytics_events where type = 'dwell' and ${WINDOW} group by path`);
  const dwell = new Map(dwellRows.map((r) => [r.path, num(r.ms)]));

  const [{ n: homeSessions }] = await q<{ n: unknown }>(`
    select count(distinct sid) as n from analytics_events
    where type = 'pv' and path = '/' and ${WINDOW}`);
  const c = (sql: string, params?: unknown[]) => q<{ key: unknown; n: unknown }>(sql, params).then(counts);

  const [
    sections, funnel, quizSections, stages, guideCats, guideFrom, hivePicks, fieldHover,
    devices, langs, refs, helper, partners,
  ] = await Promise.all([
    c(`select data->>'id' as key, count(distinct sid) as n from analytics_events
       where type = 'sec' and path = '/' and ${WINDOW} group by 1 order by n desc`),
    c(`select data->>'s' as key, count(distinct sid) as n from analytics_events
       where type = 'quiz' and ${WINDOW} group by 1`),
    c(`select data->>'n' as key, count(distinct sid) as n from analytics_events
       where type = 'quiz' and data->>'s' = 'sec' and ${WINDOW} group by 1`),
    c(`select data->>'band' as key, count(*) as n from analytics_events
       where type = 'quiz' and data->>'s' = 'done' and ${WINDOW} group by 1 order by n desc`),
    c(`select nullif(data->>'cat', '') as key, count(*) as n from analytics_events
       where type = 'guide' and ${WINDOW} group by 1 order by n desc limit 10`),
    c(`select path as key, count(*) as n from analytics_events
       where type = 'guide' and ${WINDOW} group by 1 order by n desc limit 8`),
    c(`select coalesce(data->>'label', data->>'w') as key, count(*) as n from analytics_events
       where type = 'field' and data->>'src' = 'hive' and ${WINDOW} group by 1 order by n desc limit 12`),
    c(`select data->>'w' as key, count(*) as n from analytics_events
       where type = 'field' and data->>'src' = 'field' and ${WINDOW} group by 1 order by n desc limit 12`),
    c(`select dev as key, count(distinct vid) as n from analytics_events
       where type = 'pv' and ${WINDOW} group by 1 order by n desc`),
    c(`select lang as key, count(distinct vid) as n from analytics_events
       where type = 'pv' and ${WINDOW} group by 1 order by n desc`),
    c(`select coalesce(nullif(data->>'src', ''), data->>'ref') as key, count(*) as n from analytics_events
       where type = 'pv' and (data ? 'ref' or data ? 'src') and ${WINDOW} group by 1 order by n desc limit 8`),
    c(`select data->>'a' as key, count(*) as n from analytics_events
       where type = 'mascot' and ${WINDOW} group by 1`),
    c(`select data->>'label' as key, count(*) as n from analytics_events
       where type = 'partner' and ${WINDOW} group by 1 order by n desc`),
  ]);

  /* pages with clicks, split by device so the heatmap can open on the one
     that has them */
  const heatPages = (
    await q<{ key: string; d: unknown; m: unknown }>(`
      select path as key,
             count(*) filter (where data->>'dv' = 'd') as d,
             count(*) filter (where data->>'dv' = 'm') as m
      from analytics_events where type = 'click' and ${WINDOW}
      group by 1 order by count(*) desc limit 8`)
  ).map((r) => ({ key: r.key, n: num(r.d) + num(r.m), d: num(r.d), m: num(r.m) }));

  const guides = (
    await q<{ slug: string; title: string; kind: string; n: unknown }>(`
      select data->>'slug' as slug, max(data->>'title') as title, max(data->>'kind') as kind, count(*) as n
      from analytics_events where type = 'guide' and ${WINDOW}
      group by 1 order by n desc limit 10`)
  ).map((r) => ({ slug: r.slug, title: r.title ?? '', kind: r.kind ?? '', n: num(r.n) }));

  /* the weekly pulse is always the last eight weeks, whatever the range */
  const moodWeeks = (
    await q<{ week: string; v1: unknown; v2: unknown; v3: unknown }>(
      `select data->>'w' as week,
              count(*) filter (where data->>'v' = '1') as v1,
              count(*) filter (where data->>'v' = '2') as v2,
              count(*) filter (where data->>'v' = '3') as v3
       from analytics_events where type = 'mood' and at > now() - interval '8 weeks'
       group by 1 order by 1`,
      [],
    )
  ).map((r) => ({ week: r.week, v1: num(r.v1), v2: num(r.v2), v3: num(r.v3) }));

  /* this week against last, Monday to Sunday, Malaysian time */
  const trends = (
    await q<{ kind: string; key: string; this_week: unknown; last_week: unknown }>(
      `with w as (
         select date_trunc('week', (now() at time zone 'Asia/Kuala_Lumpur'))::date as this_start
       ), e as (
         select case
                  when type = 'guide' then 'topic'
                  when type = 'field' and data->>'src' = 'hive' then 'business'
                  when type = 'quiz' and data->>'s' = 'done' then 'stage'
                end as kind,
                case
                  when type = 'guide' then nullif(data->>'cat', '')
                  when type = 'field' then coalesce(data->>'label', data->>'w')
                  else data->>'band'
                end as key,
                day >= (select this_start from w) as is_this
         from analytics_events
         where day >= (select this_start from w) - 7
           and (type = 'guide' or (type = 'field' and data->>'src' = 'hive') or (type = 'quiz' and data->>'s' = 'done'))
       )
       select kind, key,
              count(*) filter (where is_this) as this_week,
              count(*) filter (where not is_this) as last_week
       from e where kind is not null and key is not null
       group by kind, key
       order by kind, this_week desc, last_week desc`,
      [],
    )
  ).map((r) => ({ kind: r.kind, key: r.key, thisWeek: num(r.this_week), lastWeek: num(r.last_week) }));

  const [{ n: loader }] = await q<{ n: unknown }>(`
    select count(*) as n from analytics_events where type = 'loader' and ${WINDOW}`);
  const [{ n: rakyat }] = await q<{ n: unknown }>(`
    select count(*) as n from analytics_events
    where type = 'pv' and ${WINDOW}
      and (data->>'ref' ilike '%rakyatdigital%' or data->>'src' ilike '%rakyat%')`);

  return {
    range,
    kpi: {
      visitors: num(kpi.visitors),
      pageviews: num(kpi.pageviews),
      sessions: num(kpi.sessions),
      avgMs: num(kpi.avg_ms),
      started: num(kpi.started),
      finished: num(kpi.finished),
      registered: num(kpi.registered),
      guides: num(kpi.guides),
      moods: num(kpi.moods),
    },
    prev: {
      visitors: num(prev.visitors),
      pageviews: num(prev.pageviews),
      finished: num(prev.finished),
      guides: num(prev.guides),
    },
    daily,
    pages: pageRows.map((r) => ({
      path: r.path,
      pageviews: num(r.pageviews),
      visitors: num(r.visitors),
      avgMs: dwell.get(r.path) ?? 0,
    })),
    homeSessions: num(homeSessions),
    sections,
    funnel,
    quizSections,
    stages,
    guides,
    guideCats,
    guideFrom,
    hivePicks,
    fieldHover,
    moodWeeks,
    trends,
    devices,
    langs,
    refs,
    helper,
    partners,
    loader: num(loader),
    rakyat: num(rakyat),
    heatPages,
  };
}

/** Click positions for one page and device class, binned for the heatmap. */
export async function heat(path: string, dev: 'm' | 'd', range: Range) {
  const db = await ready();
  if (!db) return null;
  const rows = (
    await db.query(
      `select round((data->>'x')::numeric / 8) * 8 as x, round((data->>'y')::numeric / 12) * 12 as y, count(*) as n
       from analytics_events
       where type = 'click' and path = $2 and data->>'dv' = $3 and ${WINDOW}
       group by 1, 2 order by n desc limit 6000`,
      [range, path, dev],
    )
  ).rows as { x: unknown; y: unknown; n: unknown }[];
  const [meta] = (
    await db.query(
      `select percentile_disc(0.5) within group (order by (data->>'vw')::int) as vw,
              max((data->>'h')::int) as h, count(*) as clicks
       from analytics_events where type = 'click' and path = $2 and data->>'dv' = $3 and ${WINDOW}`,
      [range, path, dev],
    )
  ).rows as { vw: unknown; h: unknown; clicks: unknown }[];
  return {
    points: rows.map((r) => [num(r.x), num(r.y), num(r.n)] as [number, number, number]),
    vw: num(meta?.vw) || (dev === 'm' ? 390 : 1440),
    h: num(meta?.h),
    clicks: num(meta?.clicks),
  };
}
