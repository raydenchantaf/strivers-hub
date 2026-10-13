/**
 * Creates TAF's people-data tables in a LOCAL Postgres, for development only.
 *
 *   node scripts/local-db.mjs
 *
 * Production already has these tables in TAF's Neon database, made by the
 * previous platform. The rebuild reads and writes them as they are and never
 * creates or alters them there. This script mirrors that layout so the site
 * can be built and tested without touching real data. It refuses to run
 * against anything but localhost.
 *
 * The layout is the end state of the previous platform's own migration
 * scripts, with one correction: `assessment_submissions.answers` is nullable,
 * because that platform's own insert never fills it, so the live column
 * cannot be NOT NULL.
 *
 * It also adds one account made the way the previous platform made them, so
 * signing in as an existing member can be tested:
 *   legacy.member@example.test / oldsite123
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const here = dirname(fileURLToPath(import.meta.url));

function databaseUrl() {
  try {
    const env = readFileSync(resolve(here, '../.env.local'), 'utf8');
    const m = env.match(/^DATABASE_URL=(.+)$/m);
    if (m) return m[1].trim().replace(/^"|"$/g, '');
  } catch {
    /* fall through */
  }
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  throw new Error('DATABASE_URL not found in .env.local or the environment');
}

const url = databaseUrl();
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  console.error('Refusing to run: DATABASE_URL is not a local database.');
  process.exit(1);
}

const SCHEMA = `
create table if not exists users (
  id            serial primary key,
  first_name    text not null,
  last_name     text not null,
  email         text unique not null,
  phone         text,
  password_hash text not null,
  created_at    timestamptz default now()
);

create table if not exists assessment_submissions (
  id               serial primary key,
  user_id          integer references users(id) on delete set null,
  language         text not null,
  score            integer not null,
  category         text not null,
  answers          jsonb,
  answers_readable jsonb,
  other_texts      jsonb,
  submitted_at     timestamptz default now()
);

create table if not exists mentorship_signups (
  id           serial primary key,
  first_name   text not null,
  last_name    text not null,
  email        text not null,
  phone        text,
  signed_up_at timestamptz default now()
);

create table if not exists password_resets (
  id         serial primary key,
  email      text not null,
  token      text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists feedback (
  id            uuid primary key default gen_random_uuid(),
  article_slug  text not null,
  article_title text not null,
  rating        integer not null check (rating between 1 and 5),
  notes         text,
  user_id       uuid,
  created_at    timestamptz not null default now()
);

create table if not exists account_events (
  id         serial primary key,
  event_type text not null check (event_type in ('registered', 'deleted')),
  created_at timestamptz not null default now()
);
create index if not exists idx_account_events_type_date on account_events (event_type, created_at);
`;

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(SCHEMA);
  console.log('tables ready: users, assessment_submissions, mentorship_signups, password_resets, feedback, account_events');

  const email = 'legacy.member@example.test';
  const hash = await bcrypt.hash('oldsite123', 12);
  const r = await client.query(
    `insert into users (first_name, last_name, email, phone, password_hash)
     values ('Legacy', 'Member', $1, '0123456789', $2)
     on conflict (email) do nothing`,
    [email, hash],
  );
  console.log(r.rowCount ? `added test account ${email}` : `test account ${email} already there`);

  const counts = await client.query(`
    select (select count(*) from users) as users,
           (select count(*) from assessment_submissions) as submissions,
           (select count(*) from mentorship_signups) as mentorship,
           (select count(*) from password_resets) as resets,
           (select count(*) from account_events) as account_events`);
  console.log(counts.rows[0]);
} finally {
  await client.end();
}
