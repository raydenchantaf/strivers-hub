# Publishing guide

**Short answer to "do we need a custom dashboard?" — no, and you should not
want one.**

Strivers' Hub already runs on Sanity, and your team already has logins. Sanity
Studio *is* the dashboard: a real editing interface with drafts, revision
history, image cropping, role-based permissions and a mobile-friendly layout.
Building a bespoke admin panel would mean rebuilding all of that, badly, and
then maintaining it forever.

What we have done instead is **shape the Studio around how the site actually
works**, so publishing is obvious rather than merely possible.

---

## Where to go

<https://www.strivershub.com/studio> — the same address as today, the same
login as today.

## What you will see

The sidebar is organised the way the site is, not the way the database is:

```
Strivers' Hub
├── Resources              the knowledge hub
├── Events                 workshops, forums, reports
├── Financing              funding guides
├── ─────────
├── Categories             the tag vocabulary
├── Assessment bands       the three result descriptions
├── ─────────
├── Assessment responses   read-only, newest first
├── Mentorship interest    read-only, newest first
├── Accounts               read-only
├── ─────────
├── Legal pages            privacy policy
└── Site settings          footer, partners, social links
```

Resources, Events and Financing are the same kind of document. Which list a
piece appears in is decided by its categories — so you tag content the way you
already do, and it files itself.

## Publishing an article

1. Open **Resources**, **Events** or **Financing** and press **Create**.
2. Fill in the **English** tab: title, summary, cover image, body.
3. Switch to the **Bahasa Melayu** tab and do the same. The BM cover image is
   optional — leave it empty and the English one is reused.
4. Open the **Settings** tab:
   - **URL slug** — generated from the title. Set it once; changing it later
     breaks any link anyone has shared.
   - **Categories** — at least one, at most four. The first one is what
     appears on the card.
   - **Published on** — defaults to now. Events are sorted by this date, so
     for a past write-up set it to the date of the event.
   - **Feature at the top of its section** — optional. One per section.
5. Press **Publish**.

The site picks it up within an hour, or within seconds if the webhook in
`DEPLOY.md` is configured.

### Which section will it appear in?

| If the article carries this category | It appears under |
|---|---|
| Event, Report or Community | **Events** |
| Finance | **Financing** |
| anything else | **Resources** |

An article tagged both `Finance` and `Digital Skills` goes to Financing —
Finance wins.

## What you can put in a body

| Block | What it does on the page |
|---|---|
| Paragraph, Heading, Sub-heading, Quote | Standard prose. Quote is set in the display serif. |
| Bulleted / numbered list | Styled to the site's own list marks. |
| Bold, italic, link | Links to another site open in a new tab automatically. |
| Image | Full-width in the reading column. **Set alt text** — it is how the article reads to someone using a screen reader. |
| YouTube video | Paste the watch URL. It renders as a card that opens YouTube, rather than an embedded player — the player would load third-party tracking into the page, which your privacy notice would then have to declare. |
| File download | Attach a PDF and give it a label. |
| Callout | A short highlighted note. Three tones: note, tip, warning. |
| Table or embed (HTML) | For comparison tables. Renders as-is and scrolls sideways on a phone. Only paste HTML you wrote or trust. |

## Images

- **Cover images**: landscape, at least 1000 × 625.
- Use the **hotspot** tool (the crosshair when you open an image) to say what
  must stay in frame. The site crops covers three different ways — a wide lead,
  a card, a small thumbnail — and the hotspot is what keeps the subject
  centred in all three.
- Sanity resizes and converts formats on its own CDN. Upload the original;
  do not pre-shrink.

## Editing the assessment result text

**Assessment bands** holds the three results. You can rewrite the headline,
the description and the recommended next steps in both languages, and it goes
live without a deploy.

The **score range** on each band is deliberately separate. Changing it changes
what every result ever recorded means, so treat it as a programme decision
rather than an editing one.

The questions themselves live in code (`src/lib/assessment/questions.ts`) —
they are a research instrument, and a typo in a question invalidates
comparisons across everyone who answered before it. Send us changes and we
will version them properly.

## Reviewing submissions

**Assessment responses** and **Mentorship interest** are read-only lists,
newest first. Each response shows the name, the band, the score and every
answer in plain language — not option ids.

To export: open **Vision** (the top bar in the Studio), pick the `production`
dataset and run:

```groq
*[_type == "assessmentResponse"] | order(submittedAt desc) {
  submittedAt, firstName, lastName, email, phone, score, category, language
}
```

Press the download icon for CSV or JSON.

## Two things worth being careful about

**Slugs.** Changing a published slug breaks every existing link to it,
including ones shared on WhatsApp. If you must change it, tell us and we will
add a redirect.

**Deleting.** Deleting an article removes it from the site immediately.
Unpublishing (the ⋮ menu → Unpublish) keeps the document and its history while
taking it off the site — almost always what you actually want.

## If something looks wrong on the site

1. Check the document is **published**, not a draft.
2. Give it an hour, or ask us to trigger a rebuild.
3. If it still looks wrong, send us the article's URL and what you expected.
