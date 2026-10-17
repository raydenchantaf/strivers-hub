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
| `SANITY_API_WRITE_TOKEN` | no, seed only | Editor token for `npm run seed`, run once from a developer's machine. Never set on the host. |
| `AUTH_SECRET` | yes | Session signing key, see below |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://www.strivershub.com` — used for canonicals, sitemap and Open Graph |
| `NEXT_PUBLIC_GA_ID` | no | Leave blank and no analytics script is loaded at all |
| `DATABASE_URL` | yes | TAF's Neon Postgres: members, assessment results and mentorship sign-ups in the previous platform's tables, plus the site's own analytics, rate-limit and admin-audit tables, created on first use. Production on the live site, a Neon branch on previews. |
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

The site never writes to Sanity, so the host needs no Sanity token at all:
content reads are public, and people data goes to Postgres.

## Deploying to Vercel

```bash
npm i -g vercel
vercel link
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add INSIGHTS_PASSWORD production
vercel env add ADMIN_EMAILS production
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

### Previews

`main` is production. Every other branch builds a preview, and previews use
the project's Preview environment, so set it up before the first push of any
other branch:

- `DATABASE_URL`: a Neon **branch** of production (for example `staging`),
  never production itself. Previews are where test accounts and test
  submissions are made.
- `SITE_NOINDEX=1`, so a preview never competes with the live site in search.
- `NEXT_PUBLIC_SITE_URL`: the preview branch's own fixed address
  (`<project>-git-<branch>-<team>.vercel.app`), so password-reset links in its
  emails open the preview rather than the live site.
- A different `AUTH_SECRET` from production's.

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

In sanity.io/manage → API → CORS origins. The project already has
`https://*.strivershub.com` with credentials, which covers the live site and its
Studio.

- For the Studio on a preview, add that preview branch's exact address, with
  credentials. Never add `https://*.vercel.app` with credentials: it would let
  any site on vercel.app make requests as a signed-in editor.
- `http://localhost:3000` for development.

Credentials are not required for the site's own reads.

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

DNS for strivershub.com is on Cloudflare (registrar GoDaddy), with every record
set to **DNS only**, not proxied. `www` is the canonical host. The apex answers
with a 308 redirect to it.

If the domain is attached to a project in another Vercel team, as it was before
this launch, the move is:

1. Deploy production and check it on its `*.vercel.app` address.
2. Note the current Cloudflare values for `www` (CNAME) and the apex (A), for
   rolling back.
3. In this project, add `www.strivershub.com`, then `strivershub.com` set to
   redirect to `www` (308).
4. Vercel reports the domain is in use elsewhere and shows a `_vercel` TXT
   value. Add it in Cloudflare beside the existing TXT records.
5. Set the `www` CNAME and the apex A records to the values this project shows.
   Keep them DNS only (grey cloud).
6. Wait for Valid Configuration and the certificate, usually minutes.

To roll back, add the domains back to the old project and restore the Cloudflare
values from step 2. Keep the old project untouched until the new site is
accepted.

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
- [ ] A test submission appears in `/admin` → Assessments
- [ ] A mentorship sign-up appears in `/admin` → Mentorship
- [ ] Register, sign in, and a password-reset email arrives and its link works
      (then erase the test account in `/admin` → Data requests)
- [ ] `/insights` opens with its password
- [ ] `/sitemap.xml` lists the article URLs
- [ ] `/studio` loads and your team can log in
- [ ] `/robots.txt` disallows `/studio`, `/dashboard`, `/admin`, `/insights` and `/api/`
- [ ] A mistyped URL — `/ms/nope` — shows the branded 404, not a black Next page
- [ ] `/` redirects to `/ms`, and `/penilaian` still reaches `/assessment`
- [ ] `npm run check` passes (typecheck + translation guard)
- [ ] On production only: `/robots.txt` does **not** say `Disallow: /`, and no
      response carries `X-Robots-Tag: noindex` — if it does, `SITE_NOINDEX` is
      still set from a preview environment

## Rolling back

Vercel keeps every deployment. Promote a previous one from the dashboard;
it takes effect in seconds and needs no rebuild.
