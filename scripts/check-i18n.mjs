/**
 * Translation-dictionary guard. Run it in CI.
 *
 * Fails if:
 *   - the code asks for a key the dictionary does not define, or
 *   - a string that carries markup is rendered as plain text, which after the
 *     entity decode would show the visitor a literal <span> tag.
 *
 * `--unused` additionally lists keys nothing appears to reach.
 *
 * Finding a reference is harder than grepping for t('key'), because plenty of
 * live keys are never written that way: a lookup table maps a value to a key
 * name, a ternary picks between two, a template literal builds one, and a
 * server module reads the dictionary object directly. An earlier version only
 * matched the literal form and reported 102 unused keys of which 78 were
 * live - a list nobody could act on. This one classifies every key by how it
 * is reached and only calls a key dead when nothing in the source mentions it
 * at all.
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'src';
const DICT = 'src/lib/i18n/dict.ts';

/**
 * Keys kept on purpose with nothing reaching them yet, so `--unused` can stay
 * a list of things to act on rather than a list to learn to ignore. Add a
 * reason, or delete the key instead.
 */
const RESERVED = new Map([
  ['up.or', 'social sign-in divider - copy approved, feature not built yet'],
  ['up.google', 'social sign-in - see up.or; the MyDigital SSO decision may land here'],
]);

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(e.name) && !p.includes('dict.ts')) files.push(p);
  }
})(SRC);

const source = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));

/* ---------- what the dictionary defines ---------- */

const have = new Set();
const markup = new Set();
for (const line of fs.readFileSync(DICT, 'utf8').split('\n')) {
  const m = line.match(/^ {2}"([^"]+)":/);
  if (!m) continue;
  have.add(m[1]);
  if (line.includes('<span') || line.includes('<b>') || line.includes('<i>')) markup.add(m[1]);
}

/* ---------- what the code reaches, and how ---------- */

/** t('key') - the direct form, and the only one that can be MISSING, because
 *  every other form is resolved against keys that already exist. */
const direct = new Set();
for (const s of source.values()) {
  for (const m of s.matchAll(/\bt\(\s*['"]([a-zA-Z0-9._]+)['"]/g)) direct.add(m[1]);
}

/** Any bare string literal in the source that happens to name a key. Catches
 *  `t(ERRORS[code])` via the table that defines ERRORS, `t(cond ? 'a' : 'b')`,
 *  a key passed down as a prop, and `dict['ap.h1']` in a server module. */
const indirect = new Map(); // key -> [file, line]
for (const [f, s] of source) {
  for (const [i, line] of s.split('\n').entries()) {
    for (const m of line.matchAll(/['"]([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)['"]/g)) {
      const k = m[1];
      if (have.has(k) && !direct.has(k) && !indirect.has(k)) indirect.set(k, [f, i + 1]);
    }
  }
}

/** t(`group.${expr}suffix`) - expanded against the dictionary rather than a
 *  hardcoded list of suffixes, so adding path.4t needs no edit here. The
 *  substitution deliberately excludes dots: `as.${f.key}t` should reach
 *  as.f1t, not as.hint.likert. */
const built = new Map(); // key -> template
const templates = [];
for (const [f, s] of source) {
  for (const m of s.matchAll(/\bt\(\s*`([^`]+)`/g)) {
    const tpl = m[1];
    if (!tpl.includes('${')) continue;
    templates.push([f, tpl]);
    const rx = new RegExp('^' + tpl.replace(/[.]/g, '\\.').replace(/\$\{[^}]*\}/g, '[a-zA-Z0-9]+') + '$');
    for (const k of have) {
      if (!direct.has(k) && !indirect.has(k) && rx.test(k) && !built.has(k)) built.set(k, `${f}  t(\`${tpl}\`)`);
    }
  }
}

const used = new Set([...direct, ...indirect.keys(), ...built.keys()]);

/* ---------- failures ---------- */

const missing = [...direct].filter((k) => !have.has(k)).sort();

/* A markup string reached through t() must land in dangerouslySetInnerHTML.
   Read against a small window rather than the single line the call sits on: a
   conditional inside the attribute puts `__html` two or three lines above its
   own `t(...)`, and a one-line read called that a violation. A real violation
   almost never has `__html` within a few lines of it. */
const raw = [];
const WINDOW = 3;
for (const [f, s] of source) {
  const lines = s.split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/\bt\(\s*['"]([a-zA-Z0-9._]+)['"]\s*\)/g)) {
      if (!markup.has(m[1])) continue;
      const near = lines.slice(Math.max(0, i - WINDOW), i + WINDOW + 1).join('\n');
      if (!near.includes('__html')) raw.push(`${f}:${i + 1}  ${m[1]}`);
    }
  });
}

console.log(`dictionary: ${have.size} keys (${markup.size} carry markup)`);
console.log(
  `reached: ${used.size} = ${direct.size} direct + ${indirect.size} indirect + ${built.size} built` +
    ` | ${templates.length} template literals`,
);

if (missing.length) {
  console.log(`\nMISSING (${missing.length}):`);
  for (const k of missing) console.log('  ' + k);
}
if (raw.length) {
  console.log(`\nRENDERED AS TEXT (${raw.length}) - the visitor would see the tag:`);
  for (const r of raw) console.log('  ' + r);
}

if (process.argv.includes('--unused')) {
  const dead = [...have].filter((k) => !used.has(k) && !RESERVED.has(k)).sort();
  console.log(`\nno reference found (${dead.length})` + (dead.length ? ':' : ' - the dictionary is clean'));
  for (const k of dead) console.log('  ' + k);

  const stale = [...RESERVED.keys()].filter((k) => !have.has(k));
  console.log(`\nreserved (${RESERVED.size}) - kept deliberately:`);
  for (const [k, why] of RESERVED) console.log(`  ${k}  - ${why}`);
  if (stale.length) {
    console.log(`\n  note: ${stale.join(', ')} no longer exist - drop them from RESERVED`);
  }

  if (process.argv.includes('--verbose')) {
    console.log(`\nreached indirectly (${indirect.size}) - a table, a ternary, a prop, a direct dict read:`);
    for (const [k, [f, n]] of [...indirect].sort()) console.log(`  ${k}  <- ${f}:${n}`);
    console.log(`\nbuilt by a template literal (${built.size}):`);
    for (const [k, where] of [...built].sort()) console.log(`  ${k}  <- ${where}`);
  } else {
    console.log('\n(add --verbose to see where the indirect and template-built keys are reached)');
  }
}

process.exit(missing.length || raw.length ? 1 : 0);
