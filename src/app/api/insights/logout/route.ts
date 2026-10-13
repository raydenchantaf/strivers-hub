import { NextResponse } from 'next/server';
import { revoke } from '@/lib/analytics/gate';

export async function POST() {
  await revoke();
  return NextResponse.json({ ok: true });
}
