import { NextResponse } from 'next/server';
import { audit, currentAdmin } from '@/lib/admin/access';
import { erasePerson, findPerson } from '@/lib/admin/data';
import { workbook } from '@/lib/admin/excel';
import { LIMITS, hit, tooMany } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Data requests from the people the platform holds data about.
 *
 *   GET  ?email=...            everything held about that address, as .xlsx
 *                              (for a request to see their data)
 *   POST { email, confirm }    erase it all (for a request to delete it);
 *                              `confirm` must repeat the email exactly
 *
 * Administrators only, and both are written to the audit log first.
 */
export async function GET(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
  const limit = await hit(LIMITS.adminExport, admin.sub);
  if (!limit.ok) return tooMany(limit);

  const email = (new URL(request.url).searchParams.get('email') ?? '').trim().toLowerCase();
  if (!EMAIL.test(email)) return NextResponse.json({ ok: false, error: 'BAD_EMAIL' }, { status: 400 });

  const p = await findPerson(email);
  await audit(admin, 'person-export', { email, assessments: p.assessments.length, mentorship: p.mentorship.length, account: Boolean(p.account) });

  const file = await workbook({
    lang: 'en',
    assessments: p.assessments.map((a) => ({
      id: a.id, at: a.at, language: a.language, score: a.score, category: a.stage,
      firstName: p.account ? p.account.name.split(' ')[0] ?? '' : '',
      lastName: p.account ? p.account.name.split(' ').slice(1).join(' ') : '',
      email: p.account ? email : '',
      readable: a.readable,
    })),
    members: p.account
      ? [{ id: p.account.id, name: p.account.name, email, phone: p.account.phone, joined: p.account.joined, assessments: p.assessments.filter((a) => a.member).length, latestStage: p.assessments[0]?.stage ?? null }]
      : [],
    mentorship: p.mentorship,
  });
  return new NextResponse(new Uint8Array(file), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="strivers-hub_data-request_${email.replace(/[^a-z0-9@._-]/g, '_')}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
  const limit = await hit(LIMITS.adminExport, admin.sub);
  if (!limit.ok) return tooMany(limit);

  const body = (await request.json().catch(() => ({}))) as { email?: string; confirm?: string };
  const email = (body.email ?? '').trim().toLowerCase();
  if (!EMAIL.test(email)) return NextResponse.json({ ok: false, error: 'BAD_EMAIL' }, { status: 400 });
  if ((body.confirm ?? '').trim().toLowerCase() !== email) {
    return NextResponse.json({ ok: false, error: 'CONFIRM' }, { status: 400 });
  }
  if (email === admin.email.toLowerCase()) {
    return NextResponse.json({ ok: false, error: 'SELF' }, { status: 400 });
  }

  /* recorded before the erase, so a failure part-way still leaves a trace */
  await audit(admin, 'person-erase', { email });
  const removed = await erasePerson(email);
  await audit(admin, 'person-erased', { email, removed });
  return NextResponse.json({ ok: true, removed });
}
