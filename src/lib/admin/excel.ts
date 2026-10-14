import 'server-only';
import writeExcelFile from 'write-excel-file/node';
import { QUESTION_LABELS, QUESTION_ORDER } from './columns';
import type { ExportSubmission, MemberRow, MentorshipRow } from './data';

/**
 * The admin export as an .xlsx workbook.
 *
 * The Assessments sheet reproduces the previous platform's export script
 * (scripts/export.mjs): the same eight leading columns, then one column per
 * question in its question order, headed in English or Malay, with the
 * readable answers. Members and Mentorship sheets follow when asked for.
 *
 * Written with write-excel-file, which only writes; the previous export used
 * a spreadsheet library with unpatched advisories (D2, Appendix A).
 */

type Cell = { value: string | number | null; fontWeight?: 'bold' } | null;
type Sheet = { data: Cell[][]; sheet: string; columns: { width: number }[]; stickyRowsCount: number };

const head = (text: string): Cell => ({ value: text, fontWeight: 'bold' });
const val = (v: string | number | null | undefined): Cell => ({ value: v === undefined || v === null || v === '' ? null : v });

/* the timestamp format the old export wrote */
const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' }) : '';

function assessmentsSheet(rows: ExportSubmission[], lang: 'en' | 'bm'): Sheet {
  const meta = [
    'Submission ID',
    'Submitted At',
    'Response Language',
    'Score',
    'Category',
    'Registered User — First Name',
    'Registered User — Last Name',
    'Registered User — Email',
  ];
  const header = [...meta, ...QUESTION_ORDER.map((id) => QUESTION_LABELS[id]?.[lang] ?? id)].map(head);
  const body = rows.map((r) => [
    val(r.id),
    val(when(r.at)),
    val(r.language?.toUpperCase()),
    val(r.score),
    val(r.category),
    val(r.firstName),
    val(r.lastName),
    val(r.email),
    ...QUESTION_ORDER.map((id) => val(r.readable[id])),
  ]);
  return {
    sheet: 'Submissions',
    data: [header, ...body],
    columns: [14, 20, 10, 8, 14, 22, 22, 30, ...QUESTION_ORDER.map(() => 35)].map((width) => ({ width })),
    stickyRowsCount: 1,
  };
}

function membersSheet(rows: MemberRow[], lang: 'en' | 'bm'): Sheet {
  const h = lang === 'bm'
    ? ['ID', 'Nama', 'E-mel', 'Telefon', 'Mendaftar', 'Penilaian diambil', 'Tahap terkini']
    : ['ID', 'Name', 'Email', 'Phone', 'Joined', 'Assessments taken', 'Latest stage'];
  return {
    sheet: lang === 'bm' ? 'Ahli' : 'Members',
    data: [h.map(head), ...rows.map((r) => [val(r.id), val(r.name), val(r.email), val(r.phone), val(when(r.joined)), val(r.assessments), val(r.latestStage)])],
    columns: [8, 26, 32, 16, 20, 12, 14].map((width) => ({ width })),
    stickyRowsCount: 1,
  };
}

function mentorshipSheet(rows: MentorshipRow[], lang: 'en' | 'bm'): Sheet {
  const h = lang === 'bm'
    ? ['ID', 'Nama', 'E-mel', 'Telefon', 'Mendaftar minat']
    : ['ID', 'Name', 'Email', 'Phone', 'Signed up'];
  return {
    sheet: 'Mentorship',
    data: [h.map(head), ...rows.map((r) => [val(r.id), val(r.name), val(r.email), val(r.phone), val(when(r.at))])],
    columns: [8, 26, 32, 16, 20].map((width) => ({ width })),
    stickyRowsCount: 1,
  };
}

export async function workbook(parts: {
  lang: 'en' | 'bm';
  assessments?: ExportSubmission[];
  members?: MemberRow[];
  mentorship?: MentorshipRow[];
}): Promise<Buffer> {
  const sheets: Sheet[] = [];
  if (parts.assessments) sheets.push(assessmentsSheet(parts.assessments, parts.lang));
  if (parts.members) sheets.push(membersSheet(parts.members, parts.lang));
  if (parts.mentorship) sheets.push(mentorshipSheet(parts.mentorship, parts.lang));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the library's sheet type is wider than ours
  const out = await writeExcelFile(sheets as any).toBuffer();
  return Buffer.from(out);
}
