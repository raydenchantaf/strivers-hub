# Strivers' Hub

Production rebuild of [strivershub.com](https://www.strivershub.com) for the
Mastercard Strive Malaysia programme, delivered by UnBound Malaysia.

Built by **UnBound Malaysia** for **The Asia Foundation**.

---

## What this is

A complete, deployable Next.js application carrying every page the live
platform publishes, running on the same Sanity content the platform already
holds. Nothing here is a mockup: the assessment is the real 25-question
instrument, the articles are the real dataset, and the Studio at `/studio` is
the same editing surface the team uses today.

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| CMS | Sanity, embedded Studio at `/studio` |
| Hosting | Vercel (any Node 20+ host works) |
| Styling | One hand-written stylesheet, no UI framework |
| Fonts | Plus Jakarta Sans + Instrument Serif, self-hosted |

## Pages

| Route | What it does |
|---|---|
| `/` | Homepage, with the three-question opener that carries into the assessment |
| `/assessment` | The 25-question self-assessment, two branches, six question types |
| `/resources` | Filterable index of the knowledge hub |
| `/resources/[slug]` | Article reader |
| `/financing` | The four financing routes, plus the full guides |
| `/financing/[slug]` | Article reader |
| `/events` | Dated rail of workshops, forums and reports |
| `/events/[slug]` | Article reader |
| `/mentorship` | Programme page with the waiting-list form |
| `/about` | Programme background and the three pillars |
| `/privacy-policy` | PDPA notice, editable in the CMS |
| `/login`, `/register` | Accounts |
| `/dashboard` | Saved result and recommendations matched to the visitor's band |
| `/studio` | Sanity Studio |

Every page is bilingual (Bahasa Melayu default, English toggle) and every
public page is statically generated and revalidated hourly, or on demand via
the Sanity webhook.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open <http://localhost:3000>. The Studio is at
<http://localhost:3000/studio>.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run check` | Everything CI should run: typecheck then the translation guard |
| `npm run typecheck` | TypeScript, no emit |
| `npm run check:i18n` | Fail if any translation key is missing |
| `npm run check:i18n -- --unused` | List keys nothing reaches (add `--verbose` for where each one is reached) |
| `npm run seed` | Create the singleton CMS documents on a fresh dataset |

Two things about `typecheck` that will otherwise cost someone an afternoon:

`tsconfig.json` includes `.next/types/**`, which Next generates from the route
tree, so `tsc` typechecks your routes as well as your code. The cost is that
after you **delete or rename a route**, a stale generated file still refers to
it and `typecheck` fails on a module that no longer exists. Build first, then
typecheck. `npm run build` runs TypeScript itself, so CI that builds is fine.

There is no `lint` script. ESLint cannot run on this project: `eslint-config-next`
depends on `typescript-eslint`, which does not support TypeScript 7
([typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)).
`tsc --noEmit` and the translation guard are the static checks until that lands.

## How the code is arranged

```
src/
  app/
    [locale]/          the root layout, so each language sets its own <html lang>
      (site)/          every public page
      error.tsx        what a visitor sees when a page throws
      not-found.tsx    a notFound() raised inside a locale
    api/               assessment + interest submissions, auth, revalidation
    studio/            the embedded Sanity Studio
    not-found.tsx      a URL matching no route at all - supplies its own <html>
    global-error.tsx   a throw in the root layout itself
    globals.css        the whole design system, in reading order
  proxy.ts             locale redirects (Next 16's name for middleware)
  components/          shared UI, grouped by area
  lib/
    assessment/        the question bank, the bands, and the scoring model
    i18n/              the string dictionary and the language helpers
    auth/              sessions and the account store
    content.ts         server-side content fetching
    content-format.ts  the same shapes, safe to import from the client
  sanity/
    schemas/           document types
    structure.ts       how the Studio desk is organised
    queries.ts         GROQ
```

Two conventions worth knowing:

**`content.ts` versus `content-format.ts`.** Anything a client component needs
- types, date formatting, reading time - lives in `content-format.ts`, which
has no server import. `content.ts` marks itself `server-only` and holds the
fetching. Mixing them drags the Sanity client into the browser bundle.

**The dictionary is exhaustive.** No user-facing string is written inline.
`node scripts/check-i18n.mjs` fails the build if a key is referenced but not
defined, so a missing translation cannot reach production.

## Documentation

- [`docs/DEPLOY.md`](docs/DEPLOY.md) - deploying, environment, webhooks, DNS
- [`docs/HANDOVER.md`](docs/HANDOVER.md) - what TAF needs to provide, and when
- [`docs/CONTENT-GUIDE.md`](docs/CONTENT-GUIDE.md) - how editors publish
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - the decisions and why

## Licence

Delivered to The Asia Foundation for the Mastercard Strive Malaysia
programme. Not for redistribution.
