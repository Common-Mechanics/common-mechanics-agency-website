# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single-page marketing site for Common Mechanics (a design/web studio for AI-safety
and high-impact nonprofits). Astro 6, no UI framework, no CSS framework, no tests.
Everything renders from `src/pages/index.astro`, which composes one `.astro`
component per page section.

## Commands

```bash
npm run dev              # astro dev on :4321
npm run build            # astro build → dist/
npm run preview          # build, then serve through wrangler dev (Workers runtime)
npm run deploy           # build + wrangler deploy
npm run generate-types   # wrangler types → worker-configuration.d.ts (gitignored)
npm run capture-previews # re-screenshot portfolio sites (add -- --force to redo existing)
npm run dpa-manifest     # rebuild + verify the /data-processing data (runs as pre-dev/pre-build)
npm run check-privacy    # verify the site still matches /privacy (runs as pre-dev/pre-build)
```

There is no test suite and no linter. `npm run build` (Astro's type/template check)
is the only verification step.

## Architecture

**Section components own their own markup, styles, and data.** Each file in
`src/components/` is one page band: it renders a `<section class="section">`, scopes
its CSS in a `<style>` block, and — where it has repeated content — declares that
content as a typed const array in its frontmatter. Each band's label is an
`<h2 class="section-label">` carrying an `id`, and the `<section>` points at it with
`aria-labelledby` — that is what makes the five bands real landmarks and gives the
page a clean `h1 → h2 → h3` outline. A new section needs both halves; a `<span>`
label would silently drop the band out of the document structure. `index.astro`
wraps the bands (but not the header or footer) in `<main>`. There is no CMS, no content
collection, no data directory. To change site copy, edit the arrays:

- `Portfolio.astro` — `projects: Project[]` (title, url, year, roles, team, preview path)
- `Team.astro` — `members: Member[]`
- `Services.astro` — `services: Service[]`
- `FAQ.astro` — `faqs: QA[]`
- `LogoScroller.astro` — `logos` (client logos, files in `public/logos/`)

**Design tokens live in `src/styles/global.css`** and are the only global styles
(tokens, reset, `.section`, `.section-label`, the entrance animation, the
`:focus-visible` ring, `.sr-only`, a few utilities). Component styles must be
written against the `--color-*`, `--space-*`,
`--font-size-*`, `--tracking-*`, and `--duration-*` variables rather than literal
values — the whole visual system is a warm off-white ground with one orange accent.

Four mechanisms in `global.css` are non-obvious and easy to break:

- **The "technical drawing" frame.** `.section::before` paints dotted hairline
  rails as background gradients on a single pseudo-element, inset from the corners
  by `--frame-gap` so lines never meet. Left/right rails always draw; top and bottom
  are opted into per section with `data-rule="top bottom"` so adjacent sections
  don't double up an edge. When adding or reordering sections, check the
  `data-rule` chain still has exactly one owner per shared edge.
- **`html { font-size: 100% }`.** Every size in the system is a rem off the root, so
  this must stay a percentage — a literal `16px` here reads identically on a default
  browser but silently discards the font size a low-vision visitor has set
  (WCAG 1.4.4). Anything holding a long unbroken string therefore needs
  `overflow-wrap: anywhere` so enlarged text breaks instead of widening the page;
  the team email addresses and the footer contact row already do.
- **Focus states.** `:focus-visible` gets a 2px accent ring globally. Components
  that invest in a `:hover` affordance mirror it onto `:focus-visible` — keyboard
  users should see what mouse users see.
- **Staggered entrance.** Elements opt in with `data-animate` and
  `style="--stagger: N"`, where N is their index in the top-to-bottom sequence
  (currently Header 0–1, About 2–4). Delay is `--stagger * --stagger-step`, and the
  animation is wrapped in `prefers-reduced-motion: no-preference`.

**Portfolio previews are generated artefacts.** `scripts/capture-previews.mjs`
holds its own `PROJECTS` list of filename→URL pairs and screenshots each live site
with Puppeteer into `public/previews/*.jpg` (skipping ones that exist unless
`--force`). That list is *separate* from the `projects` array in
`Portfolio.astro` — adding a portfolio entry means updating both, keeping the
`preview:` path and the script's `filename` in sync.
Capture is manual: run `npm run capture-previews` yourself after adding an entry
and commit the JPEG alongside it. (A GitHub Action used to do this on push; it never
succeeded — its apt step asked for `libasound2`, which Ubuntu 24.04 renamed to
`libasound2t64` — so it was removed rather than fixed.)

`HoverPreview.astro` renders the preview surfaces once per page and binds delegated
listeners for anything carrying `data-preview`: a floating image that follows the
cursor on hover and anchors beside the link on keyboard focus, and a tap-to-open
native `<dialog>` on touch. Portfolio links supply `data-preview` in
`PortfolioItem.astro`; any new hoverable link just needs that attribute.

Three things there are deliberate and easy to undo by accident. The touch path is
gated on `(hover: none) and (pointer: coarse)`, not bare `(pointer: coarse)` — the
bare query also matches touchscreen laptops and 2-in-1s, and since that path calls
`preventDefault()` on the link, widening it stops those visitors reaching the
portfolio sites at all. The modal is a real `<dialog>` opened with `showModal()`,
which is where its focus trapping, focus restore, `Esc`-to-close and background
inerting come from; a `role="dialog"` div provides none of that. And neither `<img>`
ships a `src` attribute — an empty `src=""` resolves against the document URL, so the
browser refetches the page as an image on every load.

`LogoScroller.astro`'s marquee is covered by WCAG 2.2.2, so it carries a pause
control that is `.sr-only` until focused, pauses under the pointer, and is replaced
by a wrapped static grid under `prefers-reduced-motion: reduce` (without that the
non-animating track would strand most of the logos outside the clip).

## The /data-processing page

`src/pages/data-processing.astro` publishes the Data Processing Agreement PDFs and
the sub-processor list (COM-106). Its data is prepared and *validated* by
`scripts/data-processing-manifest.mjs`, wired as npm `prebuild` and `predev`, which
writes the gitignored `src/data/data-processing.generated.json` that the page reads
through `src/data/data-processing.ts`.

That indirection exists for two reasons, and collapsing it back into the page
frontmatter breaks both:

- **`node:fs` does not work in page frontmatter here.** The Cloudflare adapter
  prerenders inside workerd, so a directory scan in an `.astro` file fails with
  `No such module "node:fs"`.
- **A `throw` in page frontmatter does not fail the build.** Astro logs the error,
  writes a *zero-byte* `index.html` and still exits 0 — so a validity check that
  lives there silently ships a blank compliance page instead of stopping the
  deploy. The script runs before Astro and exits non-zero, which actually aborts
  `npm run build`.

**Agreement PDFs are found by scanning `public/dpa/`.** There is no list to
maintain: drop the PDF in, named `dpa-v<major>.<minor>-<YYYY-MM-DD>.pdf`, and the
page reads the version and publish date out of the filename. Anything in that
directory not matching the pattern is a build error rather than a silent omission.
They stay in `public/` (not `src/assets/`) on purpose — a signed legal document
needs a stable, citable `/dpa/…` URL, not a content hash that moves when the file is
re-saved. For the same reason the script scans with `fs` rather than
`import.meta.glob`: the glob pulls each PDF into Vite's module graph and emits a
second, hashed copy into `_astro/`.

**Each sub-processor list version is immutable.** A version is one file in
`src/data/subprocessors/`, named `v<major>.<minor>.json`, and
`src/data/subprocessors.lock.json` pins its SHA-256. Changing who processes personal
data means adding a *new* version file plus the hash the failing build prints —
never editing a published one. The build also fails if a published version is
deleted, or if a file's name disagrees with the `version` inside it. The newest
version renders in full; superseded ones stay on the page inside `<details>`, which
is the point: a reader has to be able to see what the list said on a given date.

The "last updated" line the page is required to carry is derived from the newest
agreement and sub-processor date, never hand-written, so it cannot go stale when
someone adds a PDF and forgets it.

## The /privacy page

`src/pages/privacy.astro` is plain hand-written copy — no manifest, no generated
data. What it does have is `scripts/check-privacy-claims.mjs`, wired as `prebuild`
and `predev` next to the DPA manifest.

The notice is drafted to avoid promising anything the studio does not actually
enforce: it gives retention *criteria* rather than durations (UK GDPR Art. 13(2)(a)
allows either, and a clock nobody runs is a false statement), and it names
**categories** of recipient — "our hosting provider", "our email provider" —
pointing at `/data-processing` for the legal entity, function and processing
locations. Art. 13(1)(e) permits categories, and the sub-processor list is
version-controlled and immutable, so a change of supplier lands in one place
instead of silently falsifying a company name in prose. Keep it that way: naming a
vendor here creates a second source of truth that will drift.

Two claims on the page are statements about *this repository*, and both can be
falsified by an ordinary change somewhere else with no reason to think of the
notice. That is what the check script is for, and a failure means the page needs
editing, not the check:

- **"We keep no logs of our own"** holds only while `wrangler.jsonc` has
  `observability.enabled: false`. Flipping it starts retaining request logs,
  client IPs included.
- **"no third-party embeds" / self-hosted typefaces** holds only while nothing in
  `src/` or `public/` loads a cross-origin subresource. The script matches
  subresource loads only — `<script src>`, stylesheet/preconnect/preload links,
  CSS `@import`, `<img src>`, `<iframe>`, and the Google Fonts hosts. Anchors are
  deliberately not matched; the page links out to LinkedIn, client sites and the
  ICO on purpose and says so.

Do **not** add a "check this page periodically" line here, even though
`/data-processing` carries one. WP29/EDPB WP260 rev.01 (¶29) calls telling data
subjects to re-read a privacy notice for changes "not only insufficient but also
unfair" under Art. 5(1)(a). A material change — new purpose, new category of
recipient, a new third-country transfer, a change to how rights are exercised —
has to be actively communicated to people we already correspond with, in advance.
Git history is the record of what the notice said and when; there is no obligation
to publish an archive of past versions, so the DPA page's versioning machinery is
not needed here.

## Deployment

Deploys to **Cloudflare Workers** via `wrangler.jsonc` — Astro builds `output: 'static'`
with the Cloudflare adapter, and the Worker serves `dist/` through the `ASSETS` binding.

`astro.config.mjs` pins `session.driver` to the in-memory unstorage driver on
purpose: the Cloudflare adapter otherwise wires an unprovisioned `SESSION` KV
binding and `wrangler deploy` fails trying to recreate the namespace. Don't remove it.

It also sets `vite.build.assetsInlineLimit: 0`, which is what keeps component
`<script>`s as separate files. `public/_headers` sends
`Content-Security-Policy: … script-src 'self'`, so an inlined script bundle is
blocked in production while still working in `astro dev` — the failure mode is a
build where the hover previews and the marquee pause control simply do nothing.
Both files carry the note; change either and check the other.

## SEO metadata

`src/layouts/Base.astro` owns every head tag search engines and share cards read:
title, description, `<link rel="canonical">`, Open Graph, Twitter Card, and an
`Organization` JSON-LD block. Title and description are prop defaults on that
layout — the homepage takes them, `privacy.astro` overrides both. Canonical and
`og:image` are built with `new URL(..., Astro.site)`, so `site` in
`astro.config.mjs` must stay correct or both silently go relative.

Two things there are easy to get wrong:

- **JSON-LD is not blocked by the CSP.** `script-src 'self'` looks like it should
  kill `<script type="application/ld+json">`, and given the history in this repo
  that is the natural assumption — but a non-JavaScript `type` makes it a *data
  block* that is never executed, so the CSP execution check never applies. This
  was verified against a production build served through `wrangler dev` (which
  reads `public/_headers`): the blocks parse in Chrome and raise no violation.
  No hashes needed. Do not "fix" this by loosening `script-src`.
- **`public/og.jpg` is a placeholder and its dimensions are hard-coded.** It is a
  2400×1260 (2× of 1200×630) render of the header band, made by screenshotting a
  throwaway HTML card with the site's own tokens and Fontsource files. It is meant
  to be replaced by a properly designed card. When it is, update the
  `og:image:width` / `og:image:height` values in `Base.astro` to match — several
  scrapers trust those over the file.

`FAQ.astro` additionally emits a `FAQPage` block generated from its own `faqs`
array, so the two cannot drift. Google restricts FAQ *rich results* to a narrow
set of authoritative sites, so this does not change the SERP appearance; it is
there to make the answers legible to search and AI assistants.

`@astrojs/sitemap` emits `/sitemap-index.xml` + `/sitemap-0.xml` at build time
from the built routes; `public/robots.txt` points at the index. A new page is
picked up automatically — nothing to maintain.

## Notes

- Webfonts are **self-hosted** via Fontsource, imported in `src/layouts/Base.astro`'s
  frontmatter (DM Sans variable + IBM Plex Mono 400/500, latin & latin-ext). Nothing may
  reach `fonts.googleapis.com` / `fonts.gstatic.com` — that was a GDPR third-party
  transfer. Note the variable package registers the family as `'DM Sans Variable'`,
  which is why `--font-sans` lists that name first.
- Search Console / Bing Webmaster verification is not tracked in this repo. If a
  verification method is ever added, prefer a DNS TXT record in Cloudflare over a
  file or meta tag, so it survives rebuilds and stays out of the markup.
- `src/components/IntelligenceCanvas.astro` (seeded-PRNG background canvas) is currently
  unused — it is not imported by `index.astro`.
