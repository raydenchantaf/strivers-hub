import Image from 'next/image';
import { audit, currentAdmin, currentSession, recentAudit } from '@/lib/admin/access';
import {
  PAGE_SIZE,
  findPerson,
  listAssessments,
  listMembers,
  listMentorship,
  overview,
  type Filters,
} from '@/lib/admin/data';
import { QUESTION_LABELS, QUESTION_ORDER } from '@/lib/admin/columns';
import { AdminLogin, EraseForm, SignOut } from './AdminClient';

export const dynamic = 'force-dynamic';

/**
 * /admin: the programme team's view of the platform's people data, as TAF
 * asked for in place of the previous platform's export script. Overview,
 * the three lists with filters, the Excel export, data requests (see or
 * erase one person's data) and the audit log of everything done here.
 *
 * Server-rendered: filters, paging and exports are plain links and forms, so
 * the personal data never sits in client-side state. Access is checked here
 * and again in every /api/admin route (lib/admin/access.ts).
 */

const TABS = [
  ['overview', 'Overview'],
  ['assessments', 'Assessments'],
  ['members', 'Members'],
  ['mentorship', 'Mentorship'],
  ['requests', 'Data requests'],
  ['log', 'Audit log'],
] as const;
type Tab = (typeof TABS)[number][0];

type SP = Record<string, string | undefined>;

const nf = new Intl.NumberFormat('en-MY');
const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' }) : '—';

function qs(base: SP, change: SP): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...change })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `/admin?${s}` : '/admin';
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await currentSession();
  if (!session) return <AdminLogin />;
  const admin = await currentAdmin();
  if (!admin) return <AdminLogin denied={session.email} />;

  const sp = await searchParams;
  const tab: Tab = (TABS.map((t) => t[0]) as string[]).includes(sp.tab ?? '') ? (sp.tab as Tab) : 'overview';
  const f: Filters = {
    q: sp.q, from: sp.from, to: sp.to, stage: sp.stage, lang: sp.lang,
    page: Math.max(1, Number(sp.page) || 1),
  };

  let body: React.ReactNode;
  try {
    body = await renderTab(tab, f, sp, admin);
  } catch (err) {
    body = <p className="ins-empty">The database could not be reached: {(err as Error).message}</p>;
  }

  return (
    <main className="ins">
      <header className="ins-top">
        <div className="ins-brand">
          <Image src="/img/logo.webp" alt="Strivers' Hub" width={440} height={131} priority />
          <span className="ins-title">
            Programme <span className="serif-i">admin</span>
          </span>
        </div>
        <nav className="ins-range adm-tabs" aria-label="Sections">
          {TABS.map(([k, label]) => (
            <a key={k} href={qs({}, { tab: k === 'overview' ? undefined : k })} aria-current={k === tab ? 'page' : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <div className="ins-right">
          <span className="adm-who">{admin.email}</span>
          <SignOut />
        </div>
      </header>
      <div className="ins-wrap">{body}</div>
    </main>
  );
}

async function renderTab(tab: Tab, f: Filters, sp: SP, admin: NonNullable<Awaited<ReturnType<typeof currentAdmin>>>) {
  if (tab === 'overview') {
    const o = await overview();
    return (
      <>
        <p className="ins-intro">
          Everyone who has taken the assessment, joined, or put their name down for mentoring. Personal data: every
          export and data request made here is recorded in the audit log.
        </p>
        <div className="ins-kpis adm-kpis">
          <Kpi label="Members" value={o.members} note={`${nf.format(o.membersNew30)} joined in the last 30 days`} />
          <Kpi label="Assessments" value={o.assessments} note={`${nf.format(o.assessments30)} in the last 30 days`} />
          <Kpi label="Mentorship sign-ups" value={o.mentorship} note={`${nf.format(o.mentorship30)} in the last 30 days`} />
          <Kpi label="Accounts deleted" value={o.deletedAccounts} note="By members, or on request" />
        </div>
        <div className="ins-grid">
          <section className="ins-panel">
            <header>
              <h2>Stages</h2>
              <p>Where every assessment so far placed people.</p>
            </header>
            <ul className="ins-bars">
              {o.stages.map((s) => (
                <li key={s.stage}>
                  <span className="ins-bars-l">{s.stage}</span>
                  <span className="ins-bars-t">
                    <span className="ins-bars-f" style={{ width: `${Math.max(1.5, (s.n / Math.max(1, o.assessments)) * 100)}%` }} />
                  </span>
                  <span className="ins-bars-v tnum">
                    {nf.format(s.n)}
                    <em>{Math.round((s.n / Math.max(1, o.assessments)) * 100)}%</em>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <ExportPanel />
        </div>
      </>
    );
  }

  if (tab === 'assessments') {
    const { rows, total } = await listAssessments(f);
    return (
      <section className="ins-panel">
        <Filter sp={sp} tab="assessments" stage lang />
        <Count total={total} f={f} />
        <div className="adm-scroll">
          <table className="ins-list adm-table">
            <thead>
              <tr>
                <th>Taken</th><th>Name</th><th>Email</th><th>Phone</th><th>Stage</th><th className="r">Score</th><th>Lang</th><th>Member</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="nowrap">{when(r.at)}</td>
                  <td>{r.name || '—'}</td>
                  <td>{r.email || '—'}</td>
                  <td className="nowrap">{r.phone || '—'}</td>
                  <td>{r.stage}</td>
                  <td className="r tnum">{r.score}</td>
                  <td>{r.language.toUpperCase()}</td>
                  <td>{r.member ? 'Yes' : 'No'}</td>
                  <td>{r.email ? <a href={qs({}, { tab: 'requests', email: r.email })}>Open</a> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager sp={sp} total={total} f={f} />
      </section>
    );
  }

  if (tab === 'members') {
    const { rows, total } = await listMembers(f);
    return (
      <section className="ins-panel">
        <Filter sp={sp} tab="members" />
        <Count total={total} f={f} />
        <div className="adm-scroll">
          <table className="ins-list adm-table">
            <thead>
              <tr>
                <th>Joined</th><th>Name</th><th>Email</th><th>Phone</th><th className="r">Assessments</th><th>Latest stage</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="nowrap">{when(r.joined)}</td>
                  <td>{r.name || '—'}</td>
                  <td>{r.email}</td>
                  <td className="nowrap">{r.phone || '—'}</td>
                  <td className="r tnum">{r.assessments}</td>
                  <td>{r.latestStage ?? '—'}</td>
                  <td><a href={qs({}, { tab: 'requests', email: r.email })}>Open</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager sp={sp} total={total} f={f} />
      </section>
    );
  }

  if (tab === 'mentorship') {
    const { rows, total } = await listMentorship(f);
    return (
      <section className="ins-panel">
        <Filter sp={sp} tab="mentorship" />
        <Count total={total} f={f} />
        <div className="adm-scroll">
          <table className="ins-list adm-table">
            <thead>
              <tr><th>Signed up</th><th>Name</th><th>Email</th><th>Phone</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="nowrap">{when(r.at)}</td>
                  <td>{r.name || '—'}</td>
                  <td>{r.email}</td>
                  <td className="nowrap">{r.phone || '—'}</td>
                  <td><a href={qs({}, { tab: 'requests', email: r.email })}>Open</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager sp={sp} total={total} f={f} />
      </section>
    );
  }

  if (tab === 'requests') {
    const email = (sp.email ?? '').trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const person = valid ? await findPerson(email) : null;
    if (person) await audit(admin, 'person-view', { email, found: Boolean(person.account) || person.assessments.length + person.mentorship.length > 0 });
    return (
      <>
        <section className="ins-panel">
          <header>
            <h2>Data requests</h2>
            <p>
              When someone asks to see or delete the data held about them: look them up by email, download it for them,
              or erase it. Each look-up, download and erasure is recorded in the audit log.
            </p>
          </header>
          <form className="adm-filter" method="get" action="/admin">
            <input type="hidden" name="tab" value="requests" />
            <label>
              Email
              <input name="email" type="email" defaultValue={email} required placeholder="name@example.com" />
            </label>
            <button className="btn btn-solid btn-sm" type="submit">Look up</button>
          </form>
        </section>
        {person ? <PersonView p={person} adminEmail={admin.email} /> : null}
      </>
    );
  }

  const log = await recentAudit(100);
  return (
    <section className="ins-panel">
      <header>
        <h2>Audit log</h2>
        <p>The last 100 exports, look-ups and erasures made in this admin area.</p>
      </header>
      {log.length ? (
        <table className="ins-list adm-table">
          <thead>
            <tr><th>When</th><th>Who</th><th>What</th><th>Details</th></tr>
          </thead>
          <tbody>
            {log.map((r, i) => (
              <tr key={i}>
                <td className="nowrap">{when(r.at)}</td>
                <td>{r.admin}</td>
                <td>{r.action}</td>
                <td><code>{JSON.stringify(r.detail)}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="ins-empty">Nothing recorded yet.</p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ bits */

function Kpi({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="ins-kpi">
      <span className="ins-kpi-l">{label}</span>
      <b className="tnum">{nf.format(value)}</b>
      <span className="ins-kpi-n">{note}</span>
    </div>
  );
}

function ExportPanel() {
  return (
    <section className="ins-panel">
      <header>
        <h2>Download the data</h2>
        <p>
          An Excel workbook. The assessments sheet has the same columns as the previous platform&rsquo;s export, so it
          lines up with the spreadsheets you already have. Leave the dates empty for everything.
        </p>
      </header>
      <form className="adm-export" method="get" action="/api/admin/export">
        <label>
          What
          <select name="kind" defaultValue="all">
            <option value="all">Everything (three sheets)</option>
            <option value="assessments">Assessments</option>
            <option value="members">Members</option>
            <option value="mentorship">Mentorship sign-ups</option>
          </select>
        </label>
        <label>
          From
          <input type="date" name="from" />
        </label>
        <label>
          To
          <input type="date" name="to" />
        </label>
        <label>
          Question headings
          <select name="lang" defaultValue="en">
            <option value="en">English</option>
            <option value="bm">Bahasa Melayu</option>
          </select>
        </label>
        <button className="btn btn-solid btn-sm" type="submit">Download .xlsx</button>
      </form>
    </section>
  );
}

function Filter({ sp, tab, stage, lang }: { sp: SP; tab: string; stage?: boolean; lang?: boolean }) {
  return (
    <form className="adm-filter" method="get" action="/admin">
      <input type="hidden" name="tab" value={tab} />
      <label>
        Search
        <input name="q" defaultValue={sp.q ?? ''} placeholder="Name or email" />
      </label>
      <label>
        From
        <input type="date" name="from" defaultValue={sp.from ?? ''} />
      </label>
      <label>
        To
        <input type="date" name="to" defaultValue={sp.to ?? ''} />
      </label>
      {stage ? (
        <label>
          Stage
          <select name="stage" defaultValue={sp.stage ?? ''}>
            <option value="">All</option>
            <option>Aspiring</option>
            <option>Managing</option>
            <option>Growing</option>
          </select>
        </label>
      ) : null}
      {lang ? (
        <label>
          Language
          <select name="lang" defaultValue={sp.lang ?? ''}>
            <option value="">Both</option>
            <option value="bm">BM</option>
            <option value="en">EN</option>
          </select>
        </label>
      ) : null}
      <button className="btn btn-solid btn-sm" type="submit">Filter</button>
      <a className="adm-clear" href={qs({}, { tab })}>Clear</a>
      <a className="adm-dl" href={`/api/admin/export?${new URLSearchParams({ kind: tab, ...(sp.from ? { from: sp.from } : {}), ...(sp.to ? { to: sp.to } : {}) })}`}>
        Download these dates as .xlsx
      </a>
    </form>
  );
}

function Count({ total, f }: { total: number; f: Filters }) {
  const page = f.page ?? 1;
  const first = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(total, page * PAGE_SIZE);
  return <p className="adm-count">{total ? `${nf.format(first)}–${nf.format(last)} of ${nf.format(total)}` : 'Nothing matches.'}</p>;
}

function Pager({ sp, total, f }: { sp: SP; total: number; f: Filters }) {
  const page = f.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  return (
    <nav className="adm-pager" aria-label="Pages">
      {page > 1 ? <a href={qs(sp, { page: String(page - 1) })}>&larr; Newer</a> : <span />}
      <span>
        Page {page} of {pages}
      </span>
      {page < pages ? <a href={qs(sp, { page: String(page + 1) })}>Older &rarr;</a> : <span />}
    </nav>
  );
}

function PersonView({ p, adminEmail }: { p: Awaited<ReturnType<typeof findPerson>>; adminEmail: string }) {
  const nothing = !p.account && !p.assessments.length && !p.mentorship.length && !p.resetLinks;
  return (
    <section className="ins-panel">
      <header>
        <h2>{p.email}</h2>
        <p>
          {nothing
            ? 'Nothing is held about this email address.'
            : `Account: ${p.account ? 'yes' : 'no'} · ${p.assessments.length} assessment(s) · ${p.mentorship.length} mentorship sign-up(s) · ${p.resetLinks} reset link(s)`}
        </p>
      </header>
      {nothing ? null : (
        <>
          <p>
            <a className="btn btn-ghost btn-sm" href={`/api/admin/person?email=${encodeURIComponent(p.email)}`}>
              Download their data (.xlsx)
            </a>
          </p>
          {p.account ? (
            <dl className="adm-dl-list">
              <dt>Name</dt><dd>{p.account.name}</dd>
              <dt>Phone</dt><dd>{p.account.phone || '—'}</dd>
              <dt>Joined</dt><dd>{when(p.account.joined)}</dd>
            </dl>
          ) : null}
          {p.assessments.map((a) => (
            <details key={a.id} className="adm-answers">
              <summary>
                Assessment of {when(a.at)}: {a.stage}, {a.score}/18, {a.language.toUpperCase()}
                {a.member ? ', linked to the account' : ''}
              </summary>
              <dl className="adm-dl-list">
                {QUESTION_ORDER.filter((id) => a.readable[id]).map((id) => (
                  <div key={id} className="adm-qa">
                    <dt>{QUESTION_LABELS[id]?.en ?? id}</dt>
                    <dd>{a.readable[id]}</dd>
                  </div>
                ))}
              </dl>
            </details>
          ))}
          {p.mentorship.length ? (
            <p className="ins-small">
              Mentorship sign-ups: {p.mentorship.map((m) => `${m.name} (${m.phone || 'no phone'}), ${when(m.at)}`).join(' · ')}
            </p>
          ) : null}
          {p.email !== adminEmail.toLowerCase() ? <EraseForm email={p.email} /> : null}
        </>
      )}
    </section>
  );
}
