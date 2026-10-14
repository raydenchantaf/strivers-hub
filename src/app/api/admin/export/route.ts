import { NextResponse } from 'next/server';
import { audit, currentAdmin } from '@/lib/admin/access';
import { exportAssessments, exportMembers, exportMentorship } from '@/lib/admin/data';
import { workbook } from '@/lib/admin/excel';
import { LIMITS, hit, tooMany } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = ['all', 'assessments', 'members', 'mentorship'] as const;
type Kind = (typeof KINDS)[number];

/**
 * GET /api/admin/export?kind=all|assessments|members|mentorship&from=&to=&lang=en|bm
 * An .xlsx download for administrators only. Every export is recorded in the
 * audit log before the file is sent.
 */
export async function GET(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
  const limit = await hit(LIMITS.adminExport, admin.sub);
  if (!limit.ok) return tooMany(limit);

  const u = new URL(request.url);
  const kind = (KINDS as readonly string[]).includes(u.searchParams.get('kind') ?? '') ? (u.searchParams.get('kind') as Kind) : 'all';
  const lang = u.searchParams.get('lang') === 'bm' ? 'bm' : 'en';
  const from = DATE.test(u.searchParams.get('from') ?? '') ? (u.searchParams.get('from') as string) : undefined;
  const to = DATE.test(u.searchParams.get('to') ?? '') ? (u.searchParams.get('to') as string) : undefined;
  const f = { from, to };

  const [assessments, members, mentorship] = await Promise.all([
    kind === 'all' || kind === 'assessments' ? exportAssessments(f) : undefined,
    kind === 'all' || kind === 'members' ? exportMembers(f) : undefined,
    kind === 'all' || kind === 'mentorship' ? exportMentorship(f) : undefined,
  ]);

  await audit(admin, 'export', {
    kind, lang, from: from ?? null, to: to ?? null,
    rows: { assessments: assessments?.length ?? 0, members: members?.length ?? 0, mentorship: mentorship?.length ?? 0 },
  });

  const file = await workbook({ lang, assessments, members, mentorship });
  const stamp = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
  return new NextResponse(new Uint8Array(file), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="strivers-hub_${kind}_${stamp}_${lang}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}
