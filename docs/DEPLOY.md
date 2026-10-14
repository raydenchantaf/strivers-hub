# Deployment

## Requirements

- Node 20 or newer
- A Sanity project (the existing one: `9znzy5bd`, dataset `production`)
- Any host that runs a Node server. Vercel is what this is tuned for.

## Environment

Copy `.env.example` to `.env.local` for development, and set the same keys on
the host for production.

| Key | Required | What it is |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | yes | `9znzy5bd` |
| `NEXT_PUBLIC_SANITY_DATASET` | yes | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | no | Defaults to `2024-10-01` |
| `SANITY_API_WRITE_TOKEN` | yes for forms | Editor token from sanity.io/manage. Server-side only. |
| `AUTH_SECRET` | yes for accounts | Session signing key, see below |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://www.strivershub.com` — used for canonicals, sitemap and Open Graph |
| `NEXT_PUBLIC_GA_ID` | no | Leave blank and no analytics script is loaded at all |
| `DATABASE_URL` | for analytics | Postgres (Neon). Holds the first-party analytics table, created on first use. Blank: nothing is recorded. |
| `INSIGHTS_PASSWORD` | for `/insights` | Password for the team's analytics dashboard. Blank: the dashboard stays closed. |
| `ADMIN_EMAILS` | for `/admin` | Comma-separated emails of site accounts allowed into the admin area (people data, Excel export, data requests). Blank: nobody can open it. |
| `REVALIDATE_SECRET` | no | Shared secret for the Sanity webhook |
| `RESEND_API_KEY` | no | Turns password-reset delivery on. Without it the reset still works and the message goes to the server log. |
| `MAIL_FROM` | with Resend | e.g. `Strivers' Hub <no-reply@strivershub.com>` |
| `SITE_NOINDEX` | **preview only** | `1` on anything that is not the live site. Leave blank in production. |

`SITE_NOINDEX` is the one to get right. A preview serves the same pages as the
real site, so a crawler that finds it has two copies of the platform to choose
between — a problem for the live site, not for the preview. Setting it to `1`
turns `robots.txt` into a blanket disallow, adds `X-Robots-Tag: noindex` to
every response, and flips the page's own robots meta. Leaving it set on
production would hide the real site from search entirely, so it is blank in
`.env.example` and has to be switched on deliberately.

One caveat if a preview sits behind Cloudflare: its managed `robots.txt`
feature prepends a `User-agent: * / Allow: /` block above whatever the origin
returns, and two `*` groups of equal path length resolve towards the allow. The
`X-Robots-Tag` header is unaffected and is what actually prevents indexing;
`robots.ts` also names the main search crawlers explicitly, because a crawler
with its own named group ignores `*`.

Generate the session key with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

The build works without `SANITY_API_WRITE_TOKEN` — reads are public. Only the
three write paths need it, and they fail loudly rather than silently if it is
missing.

## Deploying to Vercel

```bash
npm i -g vercel
vercel link
vercel env add SANITY_API_WRITE_TOKEN production
vercel env add AUTH_SECRET production
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add DATABASE_URL production
vercel env add INSIGHTS_PASSWORD production
vercel --prod
```

Or connect the Git repository in the Vercel dashboard and set the variables
there. No build configuration is needed; the defaults are correct.

### Region

Set the function region to **Singapore (`sin1`)**, beside the Neon database.
Vercel has no Malaysian region. The current live platform runs its
functions in US East (`iad1`) while serving the edge from Singapore, which adds
a trans-Pacific round trip to every uncached request.

This is set in `vercel.json` (`"regions": ["sin1"]`), so it travels with the
code. Project Settings → Functions shows the same choice.

### Branch builds

`vercel.json` also stops Vercel building the `rebuild` branch
(`git.deploymentEnabled`). The Vercel project currently serving
strivershub.com deploys every branch of its repository, and a preview of this
branch would run against the live site's environment variables, including its
database. Remove that entry once the project's Preview environment has its
own `DATABASE_URL` (a Neon branch, never production) and `SITE_NOINDEX=1`.

## Sanity

### First deploy against a fresh dataset

```bash
npm run seed
```

This creates the three singleton-ish documents — site settings, the privacy
page, and the three assessment bands — as editable CMS documents. It is
idempotent: running it twice will not duplicate anything. Against the existing
`production` dataset it only adds what is missing.

### CORS

Add the deployment origin in sanity.io/manage → API → CORS origins:

- `https://www.strivershub.com`
- the Vercel preview domain
- `http://localhost:3000` for development

Credentials are not required for reads.

### Instant publishing (optional but recommended)

Without this, published edits appear within an hour. With it, within seconds.

sanity.io/manage → API → Webhooks → Create webhook:

| Field | Value |
|---|---|
| URL | `https://www.strivershub.com/api/revalidate` |
| Dataset | `production` |
| Trigger on | Create, Update, Delete |
| Filter | `_type in ["resource", "category", "event", "page", "legalPage", "siteSettings", "assessmentGrade"]` |
| Projection | `{ slug }` |
| HTTP method | POST |
| HTTP header | `x-revalidate-secret: <your REVALIDATE_SECRET>` |

## DNS cutover

1. Deploy and confirm on the Vercel preview URL.
2. Add `www.strivershub.com` as a domain in the Vercel project.
3. Update the DNS record at the registrar to the CNAME Vercel gives you.
4. Keep the apex redirecting to `www`, as it does now.

TLS is issued automatically. Allow up to an hour for propagation.

The old deployment can stay running throughout — nothing about this cutover is
one-way, and reverting is a DNS change.

## Caching

| Content | Behaviour |
|---|---|
| Pages | Statically generated, revalidated hourly, or instantly by the webhook |
| Article pages | Prerendered at build for every published slug; new ones render on first request and are then cached |
| Images | Served by Sanity's CDN, converted to AVIF or WebP per browser |
| Fonts | Self-hosted, immutable, cached for a year |

## After deploying, check

- [ ] `/` and one article load, in both languages
- [ ] The assessment completes and the result appears
- [ ] A test submission arrives in Studio → Assessment responses
- [ ] The mentorship form arrives in Studio → Mentorship interest
- [ ] `/sitemap.xml` lists the article URLs
- [ ] `/studio` loads and your team can log in
- [ ] `/robots.txt` disallows `/studio`, `/dashboard` and `/api/`
- [ ] A mistyped URL — `/ms/nope` — shows the branded 404, not a black Next page
- [ ] `/` redirects to `/ms`, and `/penilaian` still reaches `/assessment`
- [ ] `npm run check` passes (typecheck + translation guard)
- [ ] On production only: `/robots.txt` does **not** say `Disallow: /`, and no
      response carries `X-Robots-Tag: noindex` — if it does, `SITE_NOINDEX` is
      still set from a preview environment

## Rolling back

Vercel keeps every deployment. Promote a previous one from the dashboard;
it takes effect in seconds and needs no rebuild.
