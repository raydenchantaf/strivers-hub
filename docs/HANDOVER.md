# Handover checklist

Everything in this repository is finished and building. What follows is the
short list of things only The Asia Foundation can provide, in the order they
are needed.

---

## 1. Before we can deploy

| # | What we need | Where it comes from | Why |
|---|---|---|---|
| 1 | **Sanity project access** — an Administrator invite for the UnBound deploy account on project `9znzy5bd` | sanity.io/manage → Members | To read the existing content and add the new document types |
| 2 | **Sanity write token** — Editor role, created under the same project | sanity.io/manage → API → Tokens | Assessment submissions, mentorship enquiries and account creation write through this |
| 3 | **Hosting account** — Vercel team, or confirmation that we should host it | Your choice | The build has to live somewhere |
| 4 | **Domain control** — ability to point `www.strivershub.com` at the new deployment | Your registrar / DNS provider | Cutover |

That is the whole blocking list. Items 1 and 2 take about five minutes each.

## 2. Before launch

| # | What we need | Notes |
|---|---|---|
| 5 | **Google Analytics property ID** | Optional. Leave it blank and no analytics script loads at all. The existing property is `G-2NDNHCZ1DB`; say the word and we carry it over so history is continuous. |
| 6 | **Final privacy policy text** | The page renders from the CMS. We have loaded the current structure so the page is never blank, but the definitive wording is yours — see §4 below. |
| 7 | **Social media URLs** | The footer currently points at the handles we could find. Confirm or correct them. |
| 8 | **Partner logo files** | We are using the versions from the live site. If you have higher-resolution or updated marks, send them. |
| 9 | **A decision on data residency** | See §3. |

## 3. Decisions we need from you

### Where the data lives

The platform's current privacy policy tells users their data is held in
Singapore, and with the recommendation below it stays true. None of the
services this platform uses offers a Malaysian region:

| Service | Holds | Region |
|---|---|---|
| Neon | Accounts, assessment results, mentorship sign-ups | AWS Singapore |
| Vercel | Nothing stored; runs the server code | Functions pinned to Singapore (`sin1`) |
| Sanity | Articles, events, pages, images | Google Cloud, Belgium; Sanity offers no choice of region |

Since 1 April 2025 the PDPA allows personal data to go abroad where the
destination's protection is equivalent, an assessment TAF makes and keeps on
file. If TAF's assessment requires personal data to stay onshore, the platform
needs different hosting and the estimate changes, so we need the answer early.
The technical review (D2, §08) sets this out in full.

### Where accounts live

The review build stores accounts in the same Sanity dataset as the content, as
a document type that is read-only in the Studio with the password field
hidden. We did that to keep the number of services you own at one.

**We now recommend Neon instead** (D2, §07). Your existing users already live
in the Neon database the current platform uses, so moving there strands
nobody; it keeps personal data in Singapore and out of the content system;
and it avoids Sanity's document limits, which count every account and every
assessment response (10,000 on the free plan, 25,000 on Growth).
`src/lib/auth/store.ts` is the only file that changes, because everything
above it talks to four functions. About two days including a migration
rehearsal on a copy of production.

### Whether we keep the assessment scoring as it is

We are carrying the existing model forward unchanged. Separately, we noted
that the band is driven mainly by what a respondent says she *wants to learn*
rather than what she can already do — worth a conversation, but not a blocker,
and not something we would change without your say-so.

## 4. What happens on handover day

1. We add your write token and analytics ID to the deployment.
2. We run `npm run seed` once, which creates the site settings, the privacy
   page and the three assessment bands as editable documents.
3. Your team logs into `/studio` with their existing Sanity accounts. Nothing
   about their login changes.
4. We deploy to a preview URL and walk through it with you.
5. On your go-ahead, DNS is repointed. The old and new sites can run in
   parallel for as long as you want.

## 5. What you do **not** need to provide

- **A separate CMS.** You already have Sanity and the team already uses it.
- **A custom admin dashboard.** See `CONTENT-GUIDE.md` — the Studio is the
  dashboard, and we have rearranged it around how the site is organised.
- **Design files.** The design system is the stylesheet.
- **Content migration.** The rebuild reads the live dataset as-is. Every
  article, category and image carries over with no re-entry.

## 6. After handover

Nothing in this build carries a recurring licence fee. The costs are:

| Item | Typical cost | Notes |
|---|---|---|
| Vercel | USD 20/month (Pro, one seat) | The free Hobby plan is for personal, non-commercial use only |
| Neon | Usage-based, expected under USD 20/month | The free plan works but suspends after five minutes idle |
| Sanity | Free tier is sufficient | You are already on it; 20 seats, 10,000 documents |
| Resend | Free tier is sufficient | 3,000 emails a month, 100 a day |
| Domain | Existing | Unchanged |

Prices as published by each provider in October 2026. See D2, §10.

Everything else — the framework, the fonts, the libraries — is open source.
There is no seat licence, no per-editor charge, and no component we rent.
