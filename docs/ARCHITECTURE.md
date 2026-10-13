# Decisions

Why the build is shaped the way it is. Written for whoever inherits this.

---

## Extend the stack rather than replace it

The live platform is Next.js on Vercel with Sanity behind it. That is a good
stack for this job, the team already knows the Studio, and the content is
already in it. Replacing it would have meant a migration with nothing to show
for it.

So: same framework, same CMS, same project id, same Studio URL. The rebuild
reads the existing dataset without a single content edit. Everything that
changed is the part that needed to change — the interface, the information
architecture, the performance and the accessibility.

## Language is in the URL

Every public page is `/ms/...` or `/en/...`. Unprefixed URLs 308 to the right
one — the visitor's stored choice where there is one, Malay otherwise — so
every link that has ever been shared still works.

This is the change that makes the English content findable. The live platform
serves both languages from one URL, so a crawler can only index one of them
and half the site is invisible. Each locale now has its own address, its own
`<html lang>`, a canonical pointing at itself and an hreflang naming its
sibling, with `x-default` on Malay.

Two details worth keeping:

**The path segment is `ms`, not `bm`.** `bm` is how the team refers to the
language and stays the internal key on all 359 dictionary entries, but `bm` is
a real BCP 47 tag and it means Bambara. Emitting it would tell Google the page
is in a West African language. A two-line map converts at the boundary.

**The root layout sits under the locale segment**, not above it. A layout
above the segment cannot see which language it is rendering, and the
alternative — reading a header — would opt every page out of static
generation, which is the thing locale routing exists to protect. The Studio
has its own root layout for the same reason, since it sits outside the
segment.

Internal links are written unprefixed and go through `components/L.tsx`, which
puts the locale on. Doing it in one place rather than at each of the several
dozen call sites means a link cannot be added later that quietly drops the
reader back into Malay.

## `content.ts` versus `content-format.ts`

Client components need dates formatted and types to hold. They must not pull
in the Sanity client, which carries a write token path and is marked
`server-only`.

The split is the fix: pure shapes and formatting in `content-format.ts`, all
fetching in `content.ts`. This is not tidiness — importing across it breaks
the build, loudly, which is the behaviour you want.

## Categories decide the section

Resources, Events and Financing are one document type. Which section a piece
belongs to is derived from its categories, which editors already maintain.

The alternative — a separate "section" field — is a second source of truth
that drifts. This way there is nothing extra to remember and nothing to get
out of step.

The cost is that the mapping lives in code (`EVENT_CATEGORIES`,
`FINANCE_CATEGORIES` in `src/sanity/queries.ts`). If TAF invents a new
section, that is a one-line change and a deploy.

## Only three questions carry points

Carried forward from the live platform unchanged. q3a, q3b and q3c score 1-3,
4-12 and 1-3 respectively, for a total range of 6-18 that matches the three
bands exactly.

The four-selection rule on q3b is what bounds the top of that range. Without
it the maximum would be 33 and two of the three bands would be unreachable.
`src/lib/assessment/scoring.ts` says so in a comment, because it is the kind of
constraint that looks removable to someone who does not know why it is there.

## Embeds are cards, not iframes

A YouTube embed loads third-party tracking into the page. That is a
disclosure your privacy notice then has to carry, and it is a layout hazard in
a reading column. The editor still pastes a watch URL; the reader still gets
one tap to the video.

## Fonts are self-hosted

`next/font` inlines the font files into the deployment. No request leaves the
visitor's browser for a Google server, which removes a third party from the
PDPA conversation and a render-blocking round trip from the critical path.

## The design system is one stylesheet

`src/app/globals.css`, about 68 KB, in reading order with the reasoning in
comments. No Tailwind, no CSS-in-JS, no component library.

For a site this size that is the smaller, faster and more legible option:
there is exactly one place a colour or a spacing value can come from, and the
output ships as one cached file rather than being reconstructed per component.

The design tokens at the top are the whole palette. Everything below refers to
them.

## The word field is a drawing, not content

The homepage's platform-coverage section sets its vocabulary in the silhouette
of the Strivers' Hub mark: a pointy-top hexagon with a hexagonal void, the
section's heading in the void, and each word's hover colour taken off the
logo's own three ribbons by the word's angle about the centre.

Three files:

| File | What it is |
| --- | --- |
| `src/components/home/words.ts` | the vocabulary, drawn from assessment questions q2a/q3b/q4e/q4g and the live CMS category list |
| `src/components/home/hexlayout.ts` | generated — which word sits in which row, how wide each row is, and each word's lit colour |
| `src/components/home/WordHex.tsx` | renders it |

The outline is **the mark's own**, measured off `public/favicon.png` row by
row rather than idealised. It is not a regular hexagon: symmetric left to
right, but not top to bottom — the upper shoulders break at 90.2% of full
width, where the interlaced ribbons stop short of the sides, so the top taper
runs over 34% of the height in two slopes against the bottom's 24% in one,
and the full-width band is 42% rather than half. The mark's own notch is a
flat run of 13 rows in 188; held flat it quantised into three rows of equal
width, which read as rows that had failed to reach their edge, so the field
takes it as a change of slope instead. Width over height is 0.8723, the
mark's, against a regular hexagon's 0.8660.

There are two figures, because one cannot serve both a desktop window and a
phone column. The full one is 866 × 993 and carries the whole vocabulary with
the heading in its void; the compact one is 350 × 401 and carries a spread of
the same vocabulary, void left empty and heading above. Both are in the
markup and CSS displays one — which also takes the other out of the
accessibility tree, so neither is marked `aria-hidden`.

The words are justified across each row (`space-between`), so the hexagon is
exact whatever the words happen to measure — the generated packing only
decides how many words go in a row so the gaps come out even. Editing
`words.ts` therefore costs a little evenness in one row and nothing else; it
will not break the shape. The header of `hexlayout.ts` carries the geometry
and the colour derivation in full, for regenerating it properly.

Every number in a figure is a design pixel of its own drawing, and one custom
property (`--px`) supplies the scale, so each resizes as a unit and stays
exact at any size. The scale is bounded by two things: the column, and the
window. A hexagon taller than the viewport never reads as a hexagon — you
only ever see a band of it — so `--px` is capped against viewport height as
well, and below 760px of window the compact figure takes over from the full
one regardless of width. The mark is 15% taller than it is wide, so on
anything but a tall window that height cap is the term that binds — the
figure is narrower than a stretched one could have been, which is the price
of holding the proportion.

Colour is not a palette applied to the field — it is the mark, read at each
word's own position. The two outlines are the same, so a word on the left
edge lands on the mark's left edge. The mark's interlaced ribbons make five
zones (mauve across the top, plum right, orange lower right, peach bottom,
crimson left); the gaps between ribbons are filled with their nearest colour
and blurred before sampling, so the seams soften without the zones moving.
What is read is then pushed past the logo's own chroma and darkened only as
far as it must be to clear 4.5:1 on the shell.

This vocabulary is not CMS content and is not meant to be edited by the client
in the Studio. It is part of the design.

## The hive: the homepage game

A ninety-second game between the pathways and "How it works". It teaches the
thing the platform is built on — three stages, and what belongs to each — with
the assessment's own scoring as the answer key.

1. **Light up your field.** A field of bilingual words in a regular
   hexagon, the word field above made playable. It is a true hexagon - six
   equal sides, 0.866 wide to tall - not the logo's measured outline the word
   field uses, whose notched shoulders made six cells read as lopsided. The visitor lights up to
   three: trades from question q2a, and topics that are the CMS's own
   category titles.
2. **Build it from the ground up.** The field clears and the hexagon's ring
   is left in six cells, two per stage, filling from the bottom: Just Starting,
   Managing, Growing. The visitor places six skills from question q3b. Each
   q3b option scores 1, 2 or 3, and that score *is* the stage, so where a
   skill belongs is how the assessment already counts it. A wrong skill
   bounces and shows its stage; a right one lands with one line on why.
3. **The finish.** The cells close up, take the logo's colours and the mark
   appears in the void. The visitor gets a 1080 × 1350 share card drawn on a
   canvas in the browser (the phone's share sheet where there is one, a
   download where there is not), up to three guides filed under what they lit,
   and a way into the real assessment.

| File | What it is |
| --- | --- |
| `src/components/home/hive/data.ts` | the words, the twelve skills and their lines, and which guides a word finds |
| `src/components/home/hive/geometry.ts` | the outline, the six cells, the run-time word packer, the lit colours |
| `src/components/home/hive/card.ts` | the share card |
| `src/components/home/HiveGame.tsx` | the game |

Unlike the word field above, this one is packed **at run time**: it is
bilingual and has to fit a phone, so `geometry.ts` measures each word in the
page's own fonts and finds the largest type size at which every word fits the
ring. Words and skills can be edited in `data.ts` without regenerating
anything. Copy around the game is under `hv.*` in the dictionary.

It fires four GA events when `NEXT_PUBLIC_GA_ID` is set: `hive_start`,
`hive_build`, `hive_complete` (with the number of wrong placements) and
`hive_share` (share sheet or download). Nothing about the visitor's picks
leaves the browser otherwise; the card is drawn on the device.

It was built to the same rules as the rest of the homepage on a phone: the
ground is static gradients, words move by transform and opacity only, the
active cells pulse three times and stop, and nothing animates a height. On a
phone the step-two figure sizes itself so the hive and the whole tray share
one screen, down to a 375 × 667 window.

## Password reset is tokened, hashed and single-use

`/forgot-password` issues a 32-byte token, stores only its SHA-256 on the
account, and mails the raw value. `/reset-password` exchanges it for a new
password and clears it, so a link works once and expires after an hour. A
leaked dataset therefore contains no usable reset links.

The request form answers identically whether or not the address has an
account — otherwise it is a way of asking the platform who its members are —
and mail delivery sits behind one function in `src/lib/email.ts`, so swapping
Resend for SES or an SMTP relay is a single-file change. With no mail account
configured the flow still completes and writes the message to the server log,
which keeps a fresh environment from throwing a 500 at a form the visitor
cannot fix.

## /results is guarded

The live platform renders `/results` for anyone who asks. With no score in
hand the value falls back to zero, zero sits below the lowest band, and the
page tells a first-time visitor they are an Aspiring entrepreneur. Here the
route reads the signed-in member's latest result, or the score cookie the
tool writes on completion, range-checks it, and otherwise says there is no
result yet and links to the assessment.

## Events are a type, not a filter

`/events` was a category filter over articles, which is why the live platform
cannot tell a workshop held in 2024 from one taking place next month: an
article has a publish date and nothing else. The `event` type carries a start
and end, a venue, a format, a capacity and a registration link, and the index
splits upcoming from past on it.

The old article-based events still resolve. Their URLs have been shared, so
`/events/[slug]` answers an event document first and an article second, and
the index falls back to the article list while no event document exists.

## Three things TAF can now edit that were in code

- **The result bands.** `assessmentGrade` carries the headline, description
  and next-steps for each band. The bundled copy in `lib/assessment/bands.ts`
  is the fallback, not the source, and it is all-or-nothing: a half-filled set
  whose ranges no longer tile 6–18 would drop a score into a gap, so the
  loader checks the tiling and falls back whole if it does not hold.
- **The About page.** A `page` document, resolved field by field against the
  bundled dictionary, so a document with two fields filled in overrides two
  strings. Headings are split into a plain part and an italic part rather than
  asking an editor to type `<span>`; both halves are escaped.
- **The privacy policy**, which already was.

One trap worth recording. `assessmentGrade` does two jobs — the band copy, and
the taxonomy that tags a resource with the stage it suits. The live dataset's
three documents are the second kind, on auto-generated ids, carrying no range.
Seeding new ones beside them would have left six documents, of which three tag
nothing and three are tagged by nothing, and the site — seeing a set it could
not use — would have quietly served the bundled copy forever. The seed script
finds the existing document for each band and fills in what it is missing.

## Accounts are in the CMS, behind an interface

`src/lib/auth/store.ts` is four functions: find, create, verify, and a
password rule. Today they talk to Sanity. Swapping in Supabase or a managed
Postgres means rewriting that one file.

Storing password hashes in a content dataset is a reasonable default for a
platform of this size — the document type is read-only in the Studio and the
hash field is hidden — but it is a decision the client should make knowingly,
which is why it appears in `HANDOVER.md`.

**Since revised.** The codebase handover from TAF's consultant showed that the
platform's existing users live in a Neon Postgres database, and Sanity's plans
count every account and every assessment response as a document (10,000 free,
25,000 on Growth). The technical review (D2, §07) therefore recommends moving
accounts, assessment results and mentorship sign-ups to Neon. The interface
above is what keeps that change to one file.

## What is deliberately not here

- **No custom admin panel.** The Studio is better than anything we would
  build, and it is already paid for. See `CONTENT-GUIDE.md`.
- **No UI framework.** Nothing in the design needed one.
- **No analytics beyond GA4, and only if configured.** Leave the variable
  blank and no script loads at all.
- **No cookie banner.** Nothing sets a cookie without the visitor acting:
  the language cookie follows a click, the session cookie follows a login. If
  GA4 is enabled, that changes, and a banner becomes necessary.

## Both error boundaries exist, and they are not the same file

Four files cover the ways a request can end badly, and they are easy to
confuse because three of them are named for the same two conditions:

| File | Catches |
|---|---|
| `app/not-found.tsx` | a URL matching no route at all |
| `app/[locale]/not-found.tsx` | `notFound()` raised inside a locale — an unknown slug, a locale that is not ours |
| `app/[locale]/error.tsx` | a page that throws |
| `app/global-error.tsx` | a throw in the root layout itself |

The first one is the one that was missing, and nothing in the code pointed at
it: every mistyped address on the site was served Next's own unstyled black
`404: This page could not be found`. The locale-level file looks like it
should have caught those, but a URL that matches nothing never enters the
locale segment — Next renders the root `/_not-found` instead, and because
this project has no `app/layout.tsx` (the root layout lives under `[locale]`
so each language can set its own `<html lang>`) there was nothing there.

That is also why `app/not-found.tsx` and `app/global-error.tsx` render their
own `<html>` and `<body>`: there is no root layout above either of them.
`global-error.tsx` goes further and styles itself inline, because a failure in
the root layout may well be the stylesheet not loading.

Both root-level files are bilingual rather than localised. The URL matched
nothing, so there is no locale to read a language from, and guessing wrong on
the one page whose whole job is to help someone already lost is a poor trade
for a tidier line of text.

## `proxy.ts`, not `middleware.ts`

Next 16 renamed the convention and warns on the old name at build time. Same
runtime, same matcher, same edge. The export is `proxy` rather than
`middleware`; nothing else changed.

Its pass-through rule is worth knowing about. It used to name the static
prefixes it should ignore — `_next`, `api`, `favicon` and so on — which meant
anything later dropped into `public/` got locale-redirected into a 404. It now
also passes anything with a dot in its final segment, because that is a file,
not a page, and no route on this site has one. A PDF, a domain-verification
file or `.well-known` will work without an edit here.

## The translation guard reports what it can prove

`scripts/check-i18n.mjs` fails the build on a missing key. Its `--unused` list
used to be unusable: it only recognised `t('literal')`, so a key reached
through a lookup table, a ternary, a template literal, or a direct read of the
dictionary in a server module all looked dead. It reported 102 unused keys of
which 78 were live, which is worse than reporting nothing — a list nobody can
act on gets ignored, and the dead entries in it stay forever.

It now classifies each key by how it is reached and only calls one dead when
nothing in the source mentions it at all. Keys kept deliberately with nothing
reaching them yet go in `RESERVED` at the top of the script, with a reason, so
the list stays actionable rather than something to learn to ignore.

## What actually made a phone stutter

Reported as frame drops while scrolling on mobile, worst at the top of a
page, plus the assessment appearing to "update its frames" between questions.
None of it was the server: a page that has already rendered does not repaint
because of the network.

**The colour fields were the whole problem.** `HeaderField` puts seven
circles behind every inner-page header, each carrying `filter: blur(72px)`,
each drifting on an infinite 19-30 second loop; the hero runs five more of
the same at `blur(74px)`. While any one of them moves, the compositor has to
re-blend the entire overlapping stack, and a blur is the most expensive thing
it can be asked to re-blend. Measured by rAF pacing while scrolling the top of
`/ms/assessment`, three interleaved runs each:

| | median frame |
|---|---|
| seven blobs drifting, as built | 175.3ms |
| only two of the seven drifting | 153.4ms |
| field held still | 16.7ms |

Two blobs cost almost what seven do, because the expense is re-blending the
stack rather than moving any one circle — so there is no middle setting, and
`@media(hover:none)` holds both fields still. Nothing is lost but the drift:
same blobs, same colours, same blur, same opacities, and the motion given up
is a 10% translate over twenty-odd seconds. Desktop keeps it.

That one change took the top of `/ms/assessment` from 156.8ms per frame to
16.5ms, and it is also what the assessment's "flashing" was — the page
smooth-scrolls on every Next, straight through the region where the field is
still on screen.

Two further notes for anyone measuring this again.

**Put the override after what it overrides.** The first attempt set
`@media(hover:none){.blob,.pb{animation:none}}` beside the hero blobs, which
is about 1,200 lines above `.pb-1` through `.pb-7`. Equal specificity, so
source order decided: the hero field stopped and every inner header carried
on drifting. It reads as the media query not matching, and it is not.

**Headless Chromium is not a phone.** It rasterises in software, so absolute
figures there are far worse than real hardware, and its compositor runs at
roughly a third of a phone's frame rate. Only interleaved A/B ratios in one
session mean anything. A first pass at the nav's backdrop-filter gave 36ms
against 22ms and a second gave no difference at all, because they ran in
sequence and the first was cold — and a whole round of "fixes" was built on
that noise and then reverted. Ratios, interleaved, or do not bother.

**One thing was worth keeping from that round.** `.msheet` carried
`backdrop-filter: blur(30px) saturate(1.8)` over `background: var(--paper)` —
`#FFFFFF`, fully opaque. A filter on what sits behind an opaque surface cannot
reach the screen: rendering the open menu with and without it differed by no
pixel at all, the largest channel difference across the viewport being 1,
which is encoder noise. The browser was still snapshotting the page behind the
sheet and blurring it on every frame of the open and the close. That one is
removed, and it is the only finding here that is certain rather than measured.
The nav's own glass and the question's fade-in were reverted: both were paid
for and neither was the problem.


## The assessment transition, and high refresh rates

A 120Hz screen asks for a frame every 8.3ms, so a transition has half the
budget it has at 60Hz and twice as many chances to be caught short. Three
things were costing the Next transition frames it did not need to spend.

**The crossfade the comment always claimed.** The note on `qin` said the new
step animates in "over the top of it", but `key={currentId}` replaces the
node: the old question was gone the instant the new one mounted, and for the
first frames of every Next the panel held no question at all. What showed
through was the panel's own ground, which is lighter than the text on it —
the white flash. The outgoing question now stays mounted, out of flow, fading
under the arriving one. Brightness swing over the panel through a Next:

| | swing |
|---|---|
| no crossfade (old behaviour) | 14.7 |
| crossfade | 5.2 |

Both halves are `opacity` and `transform`, which the compositor runs without
the main thread. It is `inert`, not merely `aria-hidden`, because it still
holds real controls for the ~220ms it lingers and a keyboard should not reach
into a question on its way out. Under `prefers-reduced-motion` the handover
never happens — otherwise the copy would be hidden by CSS and its
`animationend` would never fire to clear the state.

**React was re-rendering in the middle of it.** `useFlowHeight` kept the
measured height in `useState`, so every ResizeObserver observation
reconciled the whole tool — question, options, nav — during the transition
those observations belong to. A height transition already asks the main
thread for a layout on every frame; asking it to reconcile React as well, on
the frame the new question mounts, is how a transition loses one. The height
is written straight to the element now. Nothing renders from it, so nothing
needs to know it changed.

**The layout is contained.** `.qflow` carries `contain: layout paint`, so the
per-frame layout the height transition asks for cannot escape into the rest
of the page. It also makes `.qflow` the containing block the outgoing step
positions against.

What is *not* fixed: `height` is not a compositable property, so the panel
still asks for a layout every frame while it resizes. Containment scopes that
work; it does not remove it. Eliminating it would mean not animating height
at all, or moving to the View Transition API, and neither is worth it while
the panel is this cheap to lay out.

None of the 120Hz behaviour here was verified locally — headless Chromium
caps at 60Hz, and every variant of this transition measured an identical
16.6ms, which is vsync and not the page. The crossfade and the render
removal are argued from what the browser must do per frame, and the 14.7
against 5.2 is the one number that is measured.


## What two phone recordings showed, and what they cost

Neither round of guessing found this; the recordings did. Both were analysed
frame by frame — luminance, saturation, and how much of the viewport was flat
`--shell` rather than a gradient — with frame pairs filtered by whether the
page had actually scrolled, so content arriving during a scroll was not
mistaken for an artefact.

**First recording.** During a Next, the page alternated frame by frame between
drawing its gradients and drawing flat background: 26% of the viewport flat on
one frame, 53% on the next, for about half a second. No scroll between them,
and the panel body, option fills and text were pixel-identical throughout. The
masthead read `RGB(251,208,218)` on one frame and `RGB(254,245,239)` — plain
`--shell` — on the next.

The cause was structural: the quiz panel lives *inside* `as-hero phead`, the
header that carries `HeaderField`. Seven 72px-blurred circles, a mask and a
veil sat behind a panel whose height animates on every Next. Holding the blobs
still had not been enough, because they were not moving on their own — the
panel was moving over them. On a phone the panel occupies 47% to 96% of that
header's height and the field's mask ran to 95%, so the fade now ends at 44%
and the field is entirely above the panel. Saturation in the strip beside the
panel went from 15.4% to 5.5%; the headline keeps its wash.

**Second recording.** Better, but not gone. The remaining artefact was tighter
and easier to read: for about five frames after each question change, the
panel's own card and masthead alternated between painted and not painted —
sampled inside the card, `(247,245,255)` on one frame and `(239,244,255)`, the
page background, on the next, while the text on top stayed put.

That window is exactly the `height` transition. `height` is a layout
property, so it cannot run on the compositor: every frame re-runs layout and
repaints the panel, and the panel is expensive to repaint — a gradient ground,
a 20px rounded clip, a 64px-blur shadow, a gradient masthead.

Turning the glide off on touch fixed the flicker and read as abrupt, which is
the useful result: it confirmed the glide was the trigger without being the
answer. So the glide is back at `.2s` instead of `.36s`, and the expensive
half of the repaint goes instead. The 64px shadow is tightened to 26px on
touch — a blur that wide is recomputed across the whole footprint every frame
the box changes size, and at 26px it covers roughly a sixth of the area. The
decorative corner wash (`.quiz::before`) goes with it.

Measured over six question changes: 17 resize frames before, 10 now. The
shadow swap moves 11.9% of the viewport's pixels but by at most 13 levels out
of 255 — a change in the shadow's spread, not in whether there is one.

**What this cost, and what it did not.** Desktop is untouched throughout —
glide, colour field, full mask. On a phone the panel snaps to its new height
under a crossfade that is still running, and the assessment header's colour
field stops above the panel instead of behind it. Nothing else changed.

**Two earlier "fixes" were reverted before either recording**: the nav's glass
and the question's fade-in. Both were paid for out of the design and neither
was the problem. The lesson is in the measuring, not the CSS — see the note
above about interleaving, and about headless Chromium capping at 60Hz while
the phone in question runs at 120.
