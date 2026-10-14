import 'server-only';
import { db, transaction } from '@/lib/db';

/**
 * Reads for the admin area: totals, the three lists (assessments, members,
 * mentorship sign-ups), the rows behind the Excel export, and a person's
 * complete record for data requests. All of it comes from the platform's own
 * tables in Neon. Dates are filtered in Malaysian time.
 */

export const PAGE_SIZE = 50;

export type Filters = {
  q?: string;
  from?: string; // yyyy-mm-dd, Malaysian time, inclusive
  to?: string;
  stage?: string;
  lang?: string;
  page?: number;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STAGES = ['Aspiring', 'Managing', 'Growing'];
const MY = `'Asia/Kuala_Lumpur'`;

/** Builds a WHERE clause from the filters that apply to a given list. */
function where(f: Filters, cols: { at: string; search: string[]; stage?: string; lang?: string }) {
  const parts: string[] = [];
  const args: unknown[] = [];
  const add = (sql: string, v: unknown) => {
    args.push(v);
    parts.push(sql.replace('?', `$${args.length}`));
  };
  if (f.from && DATE.test(f.from)) add(`(${cols.at} at time zone ${MY})::date >= ?::date`, f.from);
  if (f.to && DATE.test(f.to)) add(`(${cols.at} at time zone ${MY})::date <= ?::date`, f.to);
  if (cols.stage && f.stage && STAGES.includes(f.stage)) add(`${cols.stage} = ?`, f.stage);
  if (cols.lang && (f.lang === 'en' || f.lang === 'bm')) add(`${cols.lang} = ?`, f.lang);
  const q = (f.q ?? '').trim().slice(0, 100);
  if (q) {
    args.push(`%${q.replace(/[%_\\]/g, (m) => '\\' + m)}%`);
    parts.push('(' + cols.search.map((c) => `${c} ilike $${args.length}`).join(' or ') + ')');
  }
  return { sql: parts.length ? `where ${parts.join(' and ')}` : '', args };
}

const offset = (f: Filters) => Math.max(0, ((f.page ?? 1) - 1) * PAGE_SIZE);

/* ------------------------------------------------------------- overview */

export type Overview = {
  members: number;
  membersNew30: number;
  assessments: number;
  assessments30: number;
  mentorship: number;
  mentorship30: number;
  stages: { stage: string; n: number }[];
  deletedAccounts: number;
};

export async function overview(): Promise<Overview> {
  const c = db();
  const [row] = (
    await c.query(`
      select
        (select count(*) from users)::int as members,
        (select count(*) from users where created_at > now() - interval '30 days')::int as members_new30,
        (select count(*) from assessment_submissions)::int as assessments,
        (select count(*) from assessment_submissions where submitted_at > now() - interval '30 days')::int as assessments30,
        (select count(*) from mentorship_signups)::int as mentorship,
        (select count(*) from mentorship_signups where signed_up_at > now() - interval '30 days')::int as mentorship30,
        (select count(*) from account_events where event_type = 'deleted')::int as deleted`)
  ).rows;
  const stages = (
    await c.query<{ stage: string; n: number }>(
      `select category as stage, count(*)::int as n from assessment_submissions group by 1 order by 2 desc`,
    )
  ).rows;
  return {
    members: row.members,
    membersNew30: row.members_new30,
    assessments: row.assessments,
    assessments30: row.assessments30,
    mentorship: row.mentorship,
    mentorship30: row.mentorship30,
    stages,
    deletedAccounts: row.deleted,
  };
}

/* ---------------------------------------------------------------- lists */

export type AssessmentRow = {
  id: number;
  at: string | null;
  language: string;
  score: number;
  stage: string;
  name: string;
  email: string;
  phone: string;
  member: boolean;
};

/* name, email and phone: the account's where there is one, otherwise what
   was typed into the assessment's contact question */
const SUB_FIELDS = `
  s.id, s.submitted_at, s.language, s.score, s.category,
  coalesce(nullif(trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), ''),
           trim(coalesce(s.answers_readable->>'q5g', '') || ' ' || coalesce(s.answers_readable->>'q5h', ''))) as name,
  coalesce(u.email, s.answers_readable->>'q5i', '') as email,
  coalesce(u.phone, s.answers_readable->>'q5j', '') as phone,
  (s.user_id is not null) as member`;
const SUB_FROM = `from assessment_submissions s left join users u on u.id = s.user_id`;
const SUB_SEARCH = [
  `coalesce(u.email, s.answers_readable->>'q5i', '')`,
  `coalesce(u.first_name, s.answers_readable->>'q5g', '') || ' ' || coalesce(u.last_name, s.answers_readable->>'q5h', '')`,
];

type SubDb = {
  id: number; submitted_at: Date | null; language: string; score: number; category: string;
  name: string; email: string; phone: string; member: boolean;
};
const toAssessment = (r: SubDb): AssessmentRow => ({
  id: r.id, at: r.submitted_at?.toISOString() ?? null, language: r.language, score: Number(r.score),
  stage: r.category, name: r.name, email: r.email, phone: r.phone, member: r.member,
});

export async function listAssessments(f: Filters): Promise<{ rows: AssessmentRow[]; total: number }> {
  const w = where(f, { at: 's.submitted_at', search: SUB_SEARCH, stage: 's.category', lang: 's.language' });
  const c = db();
  const total = (await c.query<{ n: number }>(`select count(*)::int as n ${SUB_FROM} ${w.sql}`, w.args)).rows[0].n;
  const { rows } = await c.query<SubDb>(
    `select ${SUB_FIELDS} ${SUB_FROM} ${w.sql}
     order by s.submitted_at desc nulls last, s.id desc
     limit ${PAGE_SIZE} offset ${offset(f)}`,
    w.args,
  );
  return { rows: rows.map(toAssessment), total };
}

export type MemberRow = {
  id: number; name: string; email: string; phone: string; joined: string | null;
  assessments: number; latestStage: string | null;
};

export async function listMembers(f: Filters): Promise<{ rows: MemberRow[]; total: number }> {
  const w = where(f, { at: 'u.created_at', search: [`u.email`, `u.first_name || ' ' || u.last_name`] });
  const c = db();
  const total = (await c.query<{ n: number }>(`select count(*)::int as n from users u ${w.sql}`, w.args)).rows[0].n;
  const { rows } = await c.query<{
    id: number; name: string; email: string; phone: string | null; created_at: Date | null; n: number; latest: string | null;
  }>(
    `select u.id, trim(u.first_name || ' ' || u.last_name) as name, u.email, u.phone, u.created_at,
            (select count(*)::int from assessment_submissions s where s.user_id = u.id) as n,
            (select s.category from assessment_submissions s where s.user_id = u.id
              order by s.submitted_at desc nulls last limit 1) as latest
     from users u ${w.sql}
     order by u.created_at desc nulls last, u.id desc
     limit ${PAGE_SIZE} offset ${offset(f)}`,
    w.args,
  );
  return {
    rows: rows.map((r) => ({
      id: r.id, name: r.name, email: r.email, phone: r.phone ?? '', joined: r.created_at?.toISOString() ?? null,
      assessments: r.n, latestStage: r.latest,
    })),
    total,
  };
}

export type MentorshipRow = { id: number; name: string; email: string; phone: string; at: string | null };

export async function listMentorship(f: Filters): Promise<{ rows: MentorshipRow[]; total: number }> {
  const w = where(f, { at: 'm.signed_up_at', search: [`m.email`, `m.first_name || ' ' || m.last_name`] });
  const c = db();
  const total = (await c.query<{ n: number }>(`select count(*)::int as n from mentorship_signups m ${w.sql}`, w.args)).rows[0].n;
  const { rows } = await c.query<{ id: number; name: string; email: string; phone: string | null; signed_up_at: Date | null }>(
    `select m.id, trim(m.first_name || ' ' || m.last_name) as name, m.email, m.phone, m.signed_up_at
     from mentorship_signups m ${w.sql}
     order by m.signed_up_at desc nulls last, m.id desc
     limit ${PAGE_SIZE} offset ${offset(f)}`,
    w.args,
  );
  return {
    rows: rows.map((r) => ({ id: r.id, name: r.name, email: r.email, phone: r.phone ?? '', at: r.signed_up_at?.toISOString() ?? null })),
    total,
  };
}

/* --------------------------------------------------------------- export */

export type ExportSubmission = {
  id: number; at: string | null; language: string; score: number; category: string;
  firstName: string; lastName: string; email: string; readable: Record<string, string>;
};

/** Every assessment in the date range, for the Excel export: the same rows
 *  and joins the previous platform's export script read. */
export async function exportAssessments(f: Filters): Promise<ExportSubmission[]> {
  const w = where({ from: f.from, to: f.to }, { at: 's.submitted_at', search: [] });
  const { rows } = await db().query<{
    id: number; submitted_at: Date | null; language: string; score: number; category: string;
    first_name: string | null; last_name: string | null; email: string | null; answers_readable: Record<string, string> | null;
  }>(
    `select s.id, s.submitted_at, s.language, s.score, s.category, s.answers_readable,
            u.first_name, u.last_name, u.email
     from assessment_submissions s left join users u on u.id = s.user_id ${w.sql}
     order by s.submitted_at desc nulls last, s.id desc`,
    w.args,
  );
  return rows.map((r) => ({
    id: r.id, at: r.submitted_at?.toISOString() ?? null, language: r.language, score: Number(r.score), category: r.category,
    firstName: r.first_name ?? '', lastName: r.last_name ?? '', email: r.email ?? '', readable: r.answers_readable ?? {},
  }));
}

export async function exportMembers(f: Filters): Promise<MemberRow[]> {
  const w = where({ from: f.from, to: f.to }, { at: 'u.created_at', search: [] });
  const { rows } = await db().query<{
    id: number; name: string; email: string; phone: string | null; created_at: Date | null; n: number; latest: string | null;
  }>(
    `select u.id, trim(u.first_name || ' ' || u.last_name) as name, u.email, u.phone, u.created_at,
            (select count(*)::int from assessment_submissions s where s.user_id = u.id) as n,
            (select s.category from assessment_submissions s where s.user_id = u.id
              order by s.submitted_at desc nulls last limit 1) as latest
     from users u ${w.sql} order by u.created_at desc nulls last, u.id desc`,
    w.args,
  );
  return rows.map((r) => ({
    id: r.id, name: r.name, email: r.email, phone: r.phone ?? '', joined: r.created_at?.toISOString() ?? null,
    assessments: r.n, latestStage: r.latest,
  }));
}

export async function exportMentorship(f: Filters): Promise<MentorshipRow[]> {
  const w = where({ from: f.from, to: f.to }, { at: 'm.signed_up_at', search: [] });
  const { rows } = await db().query<{ id: number; name: string; email: string; phone: string | null; signed_up_at: Date | null }>(
    `select m.id, trim(m.first_name || ' ' || m.last_name) as name, m.email, m.phone, m.signed_up_at
     from mentorship_signups m ${w.sql} order by m.signed_up_at desc nulls last, m.id desc`,
    w.args,
  );
  return rows.map((r) => ({ id: r.id, name: r.name, email: r.email, phone: r.phone ?? '', at: r.signed_up_at?.toISOString() ?? null }));
}

/* -------------------------------------------------------- data requests */

export type PersonRecord = {
  email: string;
  account: { id: number; name: string; phone: string; joined: string | null } | null;
  assessments: (AssessmentRow & { readable: Record<string, string> })[];
  mentorship: MentorshipRow[];
  resetLinks: number;
};

/**
 * Everything held about one email address: the account, every assessment
 * linked to the account or carrying the email in its contact question, every
 * mentorship sign-up, and any outstanding reset links.
 */
export async function findPerson(email: string): Promise<PersonRecord> {
  const e = email.trim().toLowerCase();
  const c = db();
  const acc = (
    await c.query<{ id: number; name: string; phone: string | null; created_at: Date | null }>(
      `select id, trim(first_name || ' ' || last_name) as name, phone, created_at from users where email = $1`,
      [e],
    )
  ).rows[0];
  const subs = (
    await c.query<SubDb & { answers_readable: Record<string, string> | null }>(
      `select ${SUB_FIELDS}, s.answers_readable ${SUB_FROM}
       where ($1::int is not null and s.user_id = $1) or lower(trim(s.answers_readable->>'q5i')) = $2
       order by s.submitted_at desc nulls last`,
      [acc?.id ?? null, e],
    )
  ).rows;
  const ment = (
    await c.query<{ id: number; name: string; email: string; phone: string | null; signed_up_at: Date | null }>(
      `select id, trim(first_name || ' ' || last_name) as name, email, phone, signed_up_at
       from mentorship_signups where lower(email) = $1 order by signed_up_at desc nulls last`,
      [e],
    )
  ).rows;
  const resets = (await c.query<{ n: number }>(`select count(*)::int as n from password_resets where lower(email) = $1`, [e])).rows[0].n;
  return {
    email: e,
    account: acc ? { id: acc.id, name: acc.name, phone: acc.phone ?? '', joined: acc.created_at?.toISOString() ?? null } : null,
    assessments: subs.map((r) => ({ ...toAssessment(r), readable: r.answers_readable ?? {} })),
    mentorship: ment.map((r) => ({ id: r.id, name: r.name, email: r.email, phone: r.phone ?? '', at: r.signed_up_at?.toISOString() ?? null })),
    resetLinks: resets,
  };
}

/**
 * Erases everything held about one email address, for a deletion request:
 * the account, its assessments and any assessment carrying the email, the
 * mentorship sign-ups and the reset links. Unlike a member deleting their own
 * account, the assessments go too: this is the person asking for their data
 * to be removed.
 */
export async function erasePerson(email: string): Promise<{ account: number; assessments: number; mentorship: number; resets: number }> {
  const e = email.trim().toLowerCase();
  const out = await transaction(async (c) => {
    const acc = (await c.query<{ id: number }>(`select id from users where email = $1`, [e])).rows[0];
    const subs = await c.query(
      `delete from assessment_submissions
       where ($1::int is not null and user_id = $1) or lower(trim(answers_readable->>'q5i')) = $2`,
      [acc?.id ?? null, e],
    );
    const ment = await c.query(`delete from mentorship_signups where lower(email) = $1`, [e]);
    const resets = await c.query(`delete from password_resets where lower(email) = $1`, [e]);
    const user = acc ? await c.query(`delete from users where id = $1`, [acc.id]) : { rowCount: 0 };
    return { account: user.rowCount ?? 0, assessments: subs.rowCount ?? 0, mentorship: ment.rowCount ?? 0, resets: resets.rowCount ?? 0 };
  });
  if (out.account) {
    await db()
      .query(`insert into account_events (event_type) values ('deleted')`)
      .catch((err) => console.error('[account_events] not recorded', err.message));
  }
  return out;
}
