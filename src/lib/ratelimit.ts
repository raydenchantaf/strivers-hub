import 'server-only';
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

/**
 * Rate limits for the forms that take a password or send email.
 *
 * On Vercel each request may land on a different short-lived instance, so a
 * counter held in memory would be trivial to get around. Counts live in one
 * small table in the site's own database instead, created on first use beside
 * the platform's tables, never touching them. A row is a key and a fixed
 * window: how many hits, and when the window ends.
 *
 * Keys are hashed before they are stored, so the table holds no email or IP
 * address, only `<scope>:<sha256>`.
 *
 * If the database cannot be reached the limiter lets the request through: an
 * outage should not lock everyone out, and the request will meet the same
 * outage a moment later anyway.
 */

type G = { __shRlSchema?: Promise<void> };
const g = globalThis as unknown as G;

const SCHEMA = `
create table if not exists rate_limits (
  key      text primary key,
  hits     integer not null,
  reset_at timestamptz not null
);
create index if not exists rate_limits_reset_at on rate_limits (reset_at);
`;

async function ready() {
  const p = pool();
  if (!p) return null;
  if (!g.__shRlSchema) {
    g.__shRlSchema = p
      .query(SCHEMA)
      .then(() => undefined)
      .catch((err) => {
        g.__shRlSchema = undefined;
        throw err;
      });
  }
  await g.__shRlSchema;
  return p;
}

const keyOf = (scope: string, value: string) =>
  `${scope}:${createHash('sha256').update(value.toLowerCase().trim()).digest('hex').slice(0, 32)}`;

export type Rule = { scope: string; max: number; windowSec: number };

export type Verdict = { ok: boolean; retryAfter: number };

const ALLOW: Verdict = { ok: true, retryAfter: 0 };

/** Counts one hit against `value` under `rule`, and says whether it is within the limit. */
export async function hit(rule: Rule, value: string): Promise<Verdict> {
  try {
    const p = await ready();
    if (!p) return ALLOW;
    const { rows } = await p.query<{ hits: number; reset_at: Date }>(
      `insert into rate_limits (key, hits, reset_at) values ($1, 1, now() + make_interval(secs => $2))
       on conflict (key) do update set
         hits     = case when rate_limits.reset_at <= now() then 1 else rate_limits.hits + 1 end,
         reset_at = case when rate_limits.reset_at <= now() then now() + make_interval(secs => $2)
                         else rate_limits.reset_at end
       returning hits, reset_at`,
      [keyOf(rule.scope, value), rule.windowSec],
    );
    /* now and then, clear out windows that ended more than a day ago */
    if (Math.random() < 0.01) {
      p.query(`delete from rate_limits where reset_at < now() - interval '1 day'`).catch(() => {});
    }
    const r = rows[0];
    return {
      ok: r.hits <= rule.max,
      retryAfter: Math.max(1, Math.ceil((r.reset_at.getTime() - Date.now()) / 1000)),
    };
  } catch (err) {
    console.error('[ratelimit] failing open', (err as Error).message);
    return ALLOW;
  }
}

/** Whether `value` is already over the limit, without counting a hit. For
 *  limits on failures only: check before, `hit` after a failure. */
export async function over(rule: Rule, value: string): Promise<Verdict> {
  try {
    const p = await ready();
    if (!p) return ALLOW;
    const { rows } = await p.query<{ hits: number; reset_at: Date }>(
      `select hits, reset_at from rate_limits where key = $1 and reset_at > now()`,
      [keyOf(rule.scope, value)],
    );
    const r = rows[0];
    if (!r || r.hits < rule.max) return ALLOW;
    return { ok: false, retryAfter: Math.max(1, Math.ceil((r.reset_at.getTime() - Date.now()) / 1000)) };
  } catch (err) {
    console.error('[ratelimit] failing open', (err as Error).message);
    return ALLOW;
  }
}

/** Forgets `value`'s count, e.g. after a successful sign-in. */
export async function clear(rule: Rule, value: string): Promise<void> {
  const p = pool();
  if (!p) return;
  await p.query(`delete from rate_limits where key = $1`, [keyOf(rule.scope, value)]).catch(() => {});
}

/**
 * The visitor's address, for per-connection limits. Vercel sets
 * `x-real-ip` and `x-forwarded-for` itself; Cloudflare, when it proxies,
 * sets `cf-connecting-ip`. A spoofed header can only dodge the per-connection
 * limits, never the per-account ones, which are what protect a password.
 */
export function clientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    'unknown'
  );
}

/** The answer every limited route gives. */
export function tooMany(v: Verdict) {
  return NextResponse.json(
    { ok: false, error: 'TOO_MANY' },
    { status: 429, headers: { 'Retry-After': String(v.retryAfter) } },
  );
}

/* ------------------------------------------------------------- the limits */

const MIN = 60;
const HOUR = 60 * MIN;

export const LIMITS = {
  /** wrong passwords for one account: enough for honest typos, useless for guessing */
  loginFailEmail: { scope: 'login-fail-email', max: 5, windowSec: 15 * MIN },
  /** sign-in attempts from one connection, right or wrong */
  loginIp: { scope: 'login-ip', max: 30, windowSec: 15 * MIN },
  registerIp: { scope: 'register-ip', max: 10, windowSec: HOUR },
  /** reset emails for one account: stops anyone using the form to flood an inbox */
  forgotEmail: { scope: 'forgot-email', max: 3, windowSec: HOUR },
  forgotIp: { scope: 'forgot-ip', max: 10, windowSec: HOUR },
  resetIp: { scope: 'reset-ip', max: 20, windowSec: 15 * MIN },
  /** password checks made by a signed-in member: change password, delete account */
  accountAction: { scope: 'account-action', max: 10, windowSec: 15 * MIN },
  assessmentIp: { scope: 'assessment-ip', max: 30, windowSec: HOUR },
  interestIp: { scope: 'interest-ip', max: 10, windowSec: HOUR },
  insightsIp: { scope: 'insights-ip', max: 10, windowSec: 10 * MIN },
} satisfies Record<string, Rule>;
