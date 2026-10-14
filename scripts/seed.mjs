/**
 * Creates the documents the site expects to exist but that no editor would
 * think to create from scratch: site settings, the privacy page, and the
 * three assessment bands.
 *
 * Idempotent - it uses `createIfNotExists`, so running it against the live
 * dataset only fills in what is missing and never overwrites editor changes.
 *
 *   SANITY_API_WRITE_TOKEN=... npm run seed
 */
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/* .env.local is not loaded outside Next, so read it here */
try {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {
  /* fine - the variables may come from the shell */
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error(
    'Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN before seeding.',
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-10-01',
  useCdn: false,
});

const key = (n) => `k${n.toString(36)}`;

function block(text, i) {
  return {
    _type: 'block',
    _key: key(i * 7919 + text.length),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: key(i * 104729 + text.length), text, marks: [] }],
  };
}

/* ---------------- the three bands ---------------- */

const bands = require('../src/lib/assessment/bands.json');

/* ---------------- run ---------------- */

const docs = [];

docs.push({
  _id: 'siteSettings',
  _type: 'siteSettings',
  footerBlurb_en:
    'Strivers’ Hub empowers Malaysian women entrepreneurs by closing the digitalisation gap.',
  footerBlurb_bm:
    'Strivers’ Hub memperkasakan usahawanita Malaysia dengan merapatkan jurang digitalisasi.',
  partners: [
    { _key: 'p1', name: 'The Asia Foundation', url: 'https://asiafoundation.org' },
    {
      _key: 'p2',
      name: 'Mastercard Center for Inclusive Growth',
      url: 'https://www.mastercardcenter.org',
    },
    { _key: 'p3', name: 'MyDIGITAL Corporation', url: 'https://mydigital.gov.my' },
  ],
  social: [
    /* the links the footer has shown since the rebuild began */
    { _key: 's1', platform: 'Facebook', url: 'https://www.facebook.com/strivershub/' },
    { _key: 's2', platform: 'Instagram', url: 'https://www.instagram.com/strivers.hub/' },
    { _key: 's3', platform: 'YouTube', url: 'https://www.youtube.com/@StriversHUB' },
    { _key: 's4', platform: 'LinkedIn', url: 'https://www.linkedin.com/company/the-asia-foundation' },
  ],
});

const privacy = require('../src/app/(site)/privacy-policy/privacy.seed.json');
docs.push({
  _id: 'legalPage.privacy',
  _type: 'legalPage',
  title_en: 'Privacy Policy',
  title_bm: 'Dasar Privasi',
  slug: { _type: 'slug', current: 'privacy-policy' },
  updatedAt: '2025-04-01',
  sections: privacy.map((s, i) => ({
    _key: key(i + 1),
    heading_en: s.heading.en,
    heading_bm: s.heading.bm,
    body_en: [block(s.text.en, i * 2)],
    body_bm: [block(s.text.bm, i * 2 + 1)],
  })),
});

/* The three bands need care. `assessmentGrade` already exists in the live
   dataset as the taxonomy that tags a resource with the stage it suits, on
   auto-generated ids and carrying only `grade` and a title. Creating our own
   documents beside them would leave six, of which three tag nothing and
   three are tagged by nothing - and the site, seeing a set it cannot use,
   would quietly keep serving the bundled copy forever.

   So: find the existing document for each band and fill in what it is
   missing. `setIfMissing` means an editor's own wording is never overwritten,
   and a dataset that has no grade documents at all still gets three. */
const gradeKey = (b) => b.key.en.toLowerCase();

const existingGrades = await client.fetch(
  '*[_type == "assessmentGrade"]{ _id, grade, key_en, min }',
);

const gradePatches = [];
for (const b of bands) {
  const key = gradeKey(b);
  const match = existingGrades.find(
    (g) => (g.grade ?? '').toLowerCase() === key || (g.key_en ?? '').toLowerCase() === key,
  );
  const copy = {
    grade: key,
    key_en: b.key.en,
    key_bm: b.key.bm,
    title_en: b.title.en,
    title_bm: b.title.bm,
    desc_en: b.desc.en,
    desc_bm: b.desc.bm,
    steps_en: b.steps.en,
    steps_bm: b.steps.bm,
    min: b.min,
    max: b.max,
    color: b.color,
  };
  if (match) {
    gradePatches.push({ id: match._id, set: copy, had: typeof match.min === 'number' });
  } else {
    docs.push({ _id: `assessmentGrade.${key}`, _type: 'assessmentGrade', ...copy });
  }
}

let tx = docs.reduce((t, doc) => t.createIfNotExists(doc), client.transaction());
for (const p of gradePatches) {
  tx = tx.patch(p.id, (patch) => patch.setIfMissing(p.set));
}

try {
  await tx.commit();
  console.log(`Seeded ${docs.length} documents into ${projectId}/${dataset}.`);
  if (gradePatches.length) {
    const filled = gradePatches.filter((p) => !p.had).length;
    console.log(
      `Completed ${gradePatches.length} existing assessment band document(s)` +
        (filled ? `; ${filled} gained a score range and copy.` : '; all already had a range.'),
    );
  }
  console.log('Nothing already written was overwritten.');
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}
