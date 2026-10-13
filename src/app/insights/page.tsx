import { allowed, configured } from '@/lib/analytics/gate';
import { load, RANGES, type Range } from '@/lib/analytics/insights';
import { InsightsLogin } from './InsightsLogin';
import { InsightsView } from './InsightsView';

export const dynamic = 'force-dynamic';

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  if (!configured()) return <InsightsLogin unconfigured />;
  if (!(await allowed())) return <InsightsLogin />;
  const r = Number((await searchParams).r);
  const range: Range = (RANGES as number[]).includes(r) ? (r as Range) : 30;
  let data = null;
  let error = '';
  try {
    data = await load(range);
  } catch (err) {
    error = (err as Error).message;
  }
  return <InsightsView data={data} range={range} error={error} />;
}
