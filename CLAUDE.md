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

## Deployment

Deploys to **Cloudflare Workers** via `wrangler.jsonc` — Astro builds `output: 'static'`
with the Cloudflare adapter, and the Worker serves `dist/` through the `ASSETS` binding.

`astro.config.mjs` pins `session.driver` to the in-memory unstorage driver on
purpose: the Cloudflare adapter otherwise wires an unprovisioned `SESSION` KV
binding and `wrangler deploy` fails trying to recreate the namespace. Don't remove it.

`netlify.toml` is also present (build + security headers) as a fallback host config.

## Notes

- Webfonts are **self-hosted** via Fontsource, imported in `src/layouts/Base.astro`'s
  frontmatter (DM Sans variable + IBM Plex Mono 400/500, latin & latin-ext). Nothing may
  reach `fonts.googleapis.com` / `fonts.gstatic.com` — that was a GDPR third-party
  transfer. Note the variable package registers the family as `'DM Sans Variable'`,
  which is why `--font-sans` lists that name first.
- `src/components/IntelligenceCanvas.astro` (seeded-PRNG background canvas) is currently
  unused — it is not imported by `index.astro`.
