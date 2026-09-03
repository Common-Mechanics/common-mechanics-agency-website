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
content as a typed const array in its frontmatter. There is no CMS, no content
collection, no data directory. To change site copy, edit the arrays:

- `Portfolio.astro` — `projects: Project[]` (title, url, year, roles, team, preview path)
- `Team.astro` — `members: Member[]`
- `Services.astro` — `services: Service[]`
- `FAQ.astro` — `faqs: QA[]`
- `LogoScroller.astro` — `logos` (client logos, files in `public/logos/`)

**Design tokens live in `src/styles/global.css`** and are the only global styles
(tokens, reset, `.section`, `.section-label`, the entrance animation, a few
utilities). Component styles must be written against the `--color-*`, `--space-*`,
`--font-size-*`, `--tracking-*`, and `--duration-*` variables rather than literal
values — the whole visual system is a warm off-white ground with one orange accent.

Two mechanisms in `global.css` are non-obvious and easy to break:

- **The "technical drawing" frame.** `.section::before` paints dotted hairline
  rails as background gradients on a single pseudo-element, inset from the corners
  by `--frame-gap` so lines never meet. Left/right rails always draw; top and bottom
  are opted into per section with `data-rule="top bottom"` so adjacent sections
  don't double up an edge. When adding or reordering sections, check the
  `data-rule` chain still has exactly one owner per shared edge.
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
`.github/workflows/refresh-previews.yml` reruns the capture and commits the images
back to `main` whenever `Portfolio.astro` or the script changes.

`HoverPreview.astro` renders the preview surfaces once per page and binds delegated
listeners for anything carrying `data-preview`: a cursor-following floating image on
fine pointers, a tap-to-open modal on `(pointer: coarse)`. Portfolio links supply
`data-preview` in `PortfolioItem.astro`; any new hoverable link just needs that attribute.

## Deployment

Deploys to **Cloudflare Workers** via `wrangler.jsonc` — Astro builds `output: 'static'`
with the Cloudflare adapter, and the Worker serves `dist/` through the `ASSETS` binding.

`astro.config.mjs` pins `session.driver` to the in-memory unstorage driver on
purpose: the Cloudflare adapter otherwise wires an unprovisioned `SESSION` KV
binding and `wrangler deploy` fails trying to recreate the namespace. Don't remove it.

`netlify.toml` is also present (build + security headers) as a fallback host config.

## Notes

- `src/pages/fonts.astro` is an internal typeface comparison page, not part of the site.
- `src/components/IntelligenceCanvas.astro` (seeded-PRNG background canvas) is currently
  unused — it is not imported by `index.astro`.
