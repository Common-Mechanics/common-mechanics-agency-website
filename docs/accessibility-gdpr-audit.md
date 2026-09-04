# Accessibility & UK GDPR review — commonmechanics.io

**Date:** 3 September 2026
**Commit reviewed:** `52f859f`
**Standard:** WCAG 2.2 AA · UK GDPR · PECR · Companies Act 2006 · E-Commerce Regs 2002

**Method:** source review of the Astro components and design tokens, verified against the
production build served locally to headless Chrome 148 — axe-core 4.10.2 (WCAG 2.0/2.1/2.2
A + AA + best-practice), contrast ratios computed per WCAG relative luminance and
cross-checked against axe on resolvable nodes, reflow measured at 320 / 375 / 390 / 1280 px,
tab order and computed focus styles walked over all focusable elements, target sizes measured
from layout boxes, and third-party origins captured from a network trace of a cold page load.

**Totals:** 4 critical · 7 high · 15 medium/low · ~10 quick wins (≈2 hrs)

---

## Remediation status — updated 3 September 2026

**All Part B (GDPR) findings have been addressed. Part A is now addressed too, with one
exception: A5, the five failing colour pairs.** Fixing A5 means changing the accent orange
and the muted grey, which is the one change on this list that alters the visual design, so
it is being held for a deliberate decision rather than shipped with the rest. Everything
else in Part A was implemented under a hard constraint of no visual change, and verified
that way: the built pages are pixel-identical to the previous build at 320 / 390 / 768 /
1280 px, on both routes.

### Part A

| Ref | Status | Where |
|---|---|---|
| A1 Scroller never stops | **Fixed** — `prefers-reduced-motion` guard, pointer pause, and a pause/resume control that is `.sr-only` until focused; under reduced motion the track wraps to a static grid so no logo is stranded | `src/components/LogoScroller.astro` |
| A2 No `<main>`, no `<h2>` | **Fixed** — `<main>` added, all five `.section-label`s are `<h2>` with `aria-labelledby` on their section. `<main>` 0→1, `<h2>` 0→5, unnamed sections 5→0, axe `region` 45 nodes→0, the `h1→h3` skip is gone | `src/pages/index.astro`, the five section components, `src/styles/global.css` |
| A3 Modal in name only | **Fixed** — rebuilt on native `<dialog>` + `showModal()`. Verified under iPhone emulation: `:modal` true, per-project accessible name, focus moved in, `Esc` closes, focus restored to the opening link, plus a visible close button (84×50) | `src/components/HoverPreview.astro` |
| A4 Links unfollowable on touch | **Fixed** — interception gated on `(hover: none) and (pointer: coarse)`. Verified that a coarse-pointer-but-hover-capable profile follows the link and still gets the hover preview | `src/components/HoverPreview.astro` |
| A5 Five failing colour pairs | **Open — needs a design decision.** The only fix changes the look of the site. The diff is two token values and one deleted line, written out under A5 below. This is the last axe violation on the page (4 nodes) | `src/styles/global.css:14–18`, `src/components/Footer.astro` |
| A6 12×12 targets | **Fixed** — LinkedIn links 12×12→24×24, email links 18px→24px tall, both via padding cancelled by an equal negative margin so no glyph moves | `src/components/Team.astro` |
| A7 `font-size: 16px` | **Fixed** — `100%`. A 24px browser default now yields a 24px root (it did nothing before). This also exposed a latent overflow at 320px, fixed with `overflow-wrap: anywhere` on the addresses | `src/styles/global.css`, `Team.astro`, `Footer.astro` |
| A8 No focus styling | **Fixed** — global `:focus-visible` ring in the accent (2px, clears 1.4.11's 3:1), and the portfolio underline, FAQ row highlight and LinkedIn colour shift are all mirrored onto `:focus-visible` | `src/styles/global.css` and components |
| A9 FAQ headings, unguarded motion | **Fixed** — questions are `<h3>` (inside the `<summary>`, wrapping the icon, so the content model stays valid); the `::details-content` and modal animations moved under `prefers-reduced-motion: no-preference` | `src/components/FAQ.astro`, `HoverPreview.astro` |
| A10 Two `<img src="">` | **Fixed** — attribute omitted, set on first use. 2→0 in the built page | `src/components/HoverPreview.astro` |
| A11 New-tab links | **Fixed** — all 17 `target="_blank"` links now say so in their accessible name | `PortfolioItem.astro`, `Team.astro`, `HoverPreview.astro` |
| A12 Preview is mouse-only | **Fixed** — shown on `:focus-visible`, anchored beside the link rather than over it, dismissable with `Esc` per 1.4.13. Suppressed entirely when neither side has room | `src/components/HoverPreview.astro` |
| A13 Scroller has no label | **Fixed** — `role="group"` + "Organisations our team has worked with"; the duplicated set drops its `alt` | `src/components/LogoScroller.astro` |
| A14 Three one-liners | **Fixed** — `lang="en-GB"`, the LinkedIn `<svg>` is `aria-hidden focusable="false"`, the "↗" is wrapped `aria-hidden` | `Base.astro`, `Team.astro`, `HoverPreview.astro` |
| A15 Reflow | **Was over-stated; now actually true.** The document-level `scrollWidth === clientWidth` check missed that at 320px the team email addresses overflowed their section and were clipped at the viewport edge — the overflow sat inside the body's padding gutter, so the page never gained a scrollbar. Fixed alongside A7; the team block at 320px is the one place the rendering deliberately differs from the previous build | `src/components/Team.astro` |

The same axe run (4.13.0, WCAG 2.0/2.1/2.2 A+AA + best-practice) over the finished page
reports **one** rule violated — A5's `color-contrast`, 4 nodes — where over the previous
build it reported four: `color-contrast`, `heading-order`, `landmark-one-main` and
`region` (45 nodes). The caveat below still applies: the true contrast count is five
colour pairs, not four nodes.

### Part B

| Ref | Status | Where |
|---|---|---|
| G1 Google Fonts | **Fixed** — self-hosted via Fontsource; zero requests to Google verified by network trace | `src/layouts/Base.astro`, `src/styles/global.css` |
| G2 No privacy notice | **Fixed** — Art. 13 notice published | `src/pages/privacy.astro`, linked from the footer |
| G3 `/fonts` deployed | **Fixed** — page deleted, `robots.txt` added | `public/robots.txt` |
| G4 Workers observability | **Fixed** — disabled (data minimisation) | `wrangler.jsonc` |
| G5 No security headers | **Fixed** — CSP locked to `'self'`, HSTS, Permissions-Policy | `public/_headers` |
| G6 Place of registration | **Fixed** — "Registered in England and Wales" | `src/components/Footer.astro` |
| G7 Contact / VAT | **Fixed** — `privacy@commonmechanics.io` published; VAT line pre-written and commented out pending the number | `src/components/Footer.astro` |
| G8 Cookieless position | **Documented** — written policy on what analytics may be added | `docs/data-protection.md` §3 |
| G9 Staff data | **Documented** — internal notice + 30-day leavers removal | `docs/staff-privacy-notice.md` |
| G10 ICO fee | **Open action** — self-assessment still to run | `docs/data-protection.md` §4 |
| G11 Equality Act | **Nearly closed** — the Part A work is done bar A5; the site's remaining WCAG 2.2 AA gap is the contrast decision | — |

Ten open actions remain, all of them facts we don't have yet rather than code: see
`docs/data-protection.md` §4. G11 now turns solely on A5.

---

## Read this first: your audit tools are under-reporting

The technical-drawing frame in `global.css:106` paints the dotted rails as background
gradients on `.section::before` with `inset: 0` — a background-image layer covering every
section edge to edge. axe-core cannot resolve a text colour against a pseudo-element
background, so it moves nearly every text node on the page from *violations* into
*incomplete*.

A stock axe run on this page reports **2** contrast violations. The real count is **five
distinct failing colour pairs** across dozens of nodes. Lighthouse, PageSpeed and most CI
accessibility gates all wrap axe, so all of them will hand this site a contrast score it has
not earned. Worth knowing before a Lighthouse screenshot goes into a pitch deck.

---

# Part A — Accessibility

Benchmarked against WCAG 2.2 AA, the standard your nonprofit clients will be procuring
against. Four Level A failures, then the AA set.

## A1 · CRITICAL — Logo scroller never stops, and ignores reduced-motion

**File:** `src/components/LogoScroller.astro:43`
**SC:** 2.2.2 Pause, Stop, Hide — Level A

`animation: logo-scroll 80s linear infinite`. Content that moves automatically, runs longer
than five seconds, and is presented alongside other content must offer a way to pause, stop
or hide it. There is none — no control, no hover-pause, and no `prefers-reduced-motion`
guard. For a vestibular-disorder visitor this is continuous motion they cannot switch off.

The irony is that the entrance animation *is* correctly wrapped in
`prefers-reduced-motion: no-preference` at `global.css:141`. The one animation that runs
forever is the one that isn't.

```css
.scroller-track { animation: none; }
@media (prefers-reduced-motion: no-preference) {
  .scroller-track { animation: logo-scroll 80s linear infinite; }
}
.scroller-wrap:hover .scroller-track,
.scroller-wrap:focus-within .scroller-track { animation-play-state: paused; }
```

## A2 · CRITICAL — No `<main>`, no `<h2>` anywhere, and the section headings aren't headings

**Files:** `src/styles/global.css:126`, `src/pages/index.astro`
**SC:** 1.3.1 Info and Relationships — Level A

Measured on the built page: `main` elements **0**, `h2` elements **0**, unnamed `<section>`
elements **5**. axe reports **45 nodes** of content sitting outside any landmark.

"About", "Services", "Work", "Team" and "FAQ" are visually unmistakable section headings, but
each is a `<span class="section-label">`. That structure exists for sighted users and for
nobody else, which is precisely what 1.3.1 prohibits. A screen-reader user pressing `H` to
move through the page goes from the tagline `h1` straight to four `h3` service names —
skipping a level on the way — and finds nothing else on the page. A `<section>` without an
accessible name isn't exposed as a landmark either, so the five sections are invisible to
landmark navigation too.

**Fix:** change `.section-label` from `<span>` to `<h2>` — the class already sets
`display: block` and an explicit font size, so nothing moves visually. Wrap the body content
in `<main>` in `index.astro`, and give each section `aria-labelledby` pointing at its new
`h2`. That one change also resolves the `h1 → h3` skip, because the service names become
correctly-nested `h3`s.

## A3 · CRITICAL — The mobile preview modal is a dialog in name only

**File:** `src/components/HoverPreview.astro:7, 163–176`
**SC:** 2.4.3 Focus Order — Level A · 4.1.2 Name, Role, Value — Level A

It declares `role="dialog" aria-modal="true"` and then does none of what that promises:

- **No accessible name.** Verified `aria-label` and `aria-labelledby` are both null — a
  screen reader announces "dialog" and nothing more.
- **Focus is never moved into it, never trapped, and never restored** to the link that
  opened it. A keyboard user opens the dialog and their focus is still out on the page behind
  it.
- **There is no close button.** The only exits are a precise tap on the backdrop or the `Esc`
  key — and this code path only runs on `(pointer: coarse)` devices, which typically have no
  `Esc` key at all.
- **The background isn't inert.** `document.body.style.overflow = 'hidden'` stops scrolling
  but assistive tech can still walk the whole page behind the overlay.

**Fix:** swap the `<div>` for a native `<dialog>` and open it with `.showModal()`. That gives
you focus trapping, focus restore, `Esc`-to-close, background inerting and top-layer stacking
for free. Add a visible close button and an `aria-label` naming the project.

## A4 · CRITICAL — On touch-capable devices, portfolio links cannot be followed at all

**File:** `src/components/HoverPreview.astro:178–187`
**Type:** functional defect

When `(pointer: coarse)` matches, a delegated click handler calls `e.preventDefault()` on
*every* `[data-preview]` link and opens the modal instead. `pointer: coarse` is not "is a
phone" — it also matches touchscreen laptops, 2-in-1s in tablet mode, and any device whose
primary pointer the browser considers imprecise. Those visitors can never reach a portfolio
site directly; the "Visit website ↗" link inside the modal is the only route through.

Compounded with A3, a keyboard user on a hybrid device can tab to a project, press `Enter`,
and land in a dialog their focus never entered and that has no close control. That's a dead
end.

**Fix:** never intercept the primary action of a link. Let the click through and attach the
preview to a separate affordance, or gate the interception on
`(hover: none) and (pointer: coarse)` so it stops catching hybrid devices — and only after A3
makes the dialog escapable.

## A5 · HIGH — Five colour pairs fail minimum contrast

**File:** `src/styles/global.css:14–18`
**SC:** 1.4.3 Contrast (Minimum) — Level AA

Every non-primary text colour in the system falls short. Ratios computed from the tokens and
cross-checked against axe's own arithmetic on the two nodes it could resolve.

| Where | Foreground on ground | Size | Ratio | Needs |
|---|---|---|---|---|
| Portfolio year & roles, team locations, modal link | `#8a8073` on `#faf7f1` | 11px | **3.63** | 4.50 |
| Every section label; "Work" section description | `#e2580e` on `#faf7f1` | 11px | **3.48** | 4.50 |
| Wordmark badge, top left | `#faf7f1` on `#e2580e` | 15px bold | **3.48** | 4.50 |
| Footer legal line | `#faf7f1` on `#e2580e` | 11px | **3.48** | 4.50 |
| Footer registered address (`opacity: .8`) | `#f5d7c4` on `#e2580e` | 11px | **2.73** | 4.50 |
| Body copy — for reference | `#2d3339` on `#faf7f1` | 15px | 11.94 ✓ | 4.50 |

Note on the wordmark: 15px bold sits below the 18.66px threshold for "large text", so it
needs the full 4.5:1, not 3:1.

**Fix — two token values and one deleted line:**

```css
--color-muted:  #6b6257;   /* was #8a8073 — 3.63 → 5.60 */
--color-accent: #c24a0b;   /* was #e2580e — 3.48 → 4.59 */
```

That accent is deliberately chosen to clear 4.59:1 in *both* directions — as text on the
off-white ground, and as a badge ground behind the off-white — so the wordmark and footer are
fixed by the same value. Then delete `.footer-address { opacity: 0.8 }` in `Footer.astro:44`.

If `#c24a0b` reads too muted for the brand, keep `#e2580e` for non-text use only (rules,
fills, the badge background) and add a separate `--color-accent-text: #b8460a` at 5.01:1.

## A6 · HIGH — LinkedIn icons are 12×12px targets

**File:** `src/components/Team.astro:102–105`
**SC:** 2.5.8 Target Size (Minimum) — Level AA, WCAG 2.2

Measured in the browser: three targets at **12×12 CSS px** against a 24×24 minimum.
`.linkedin-link` is an `inline-flex` with no padding, so the hit area is exactly the glyph.

Also worth padding: the three email links measure 18px tall (`165×18`, `152×18`, `145×18`) —
the SC's inline-text exception is arguable there since they aren't set in a sentence.

```css
.linkedin-link { padding: 6px; margin: -6px; }  /* 24×24 hit area, glyph unmoved */
```

## A7 · HIGH — `html { font-size: 16px }` overrides the visitor's browser font setting

**File:** `src/styles/global.css:63`
**SC:** 1.4.4 Resize Text — Level AA

Every size on the site is a rem derived from this root value, so a visitor who has raised
their browser's default font size — the single most common accommodation low-vision users
make, and one that doesn't involve zoom — gets no effect whatsoever. It also locks
`--font-size-xs` at a literal 11px for everyone, permanently, which is where most of the A5
contrast failures live.

**Fix:** `html { font-size: 100%; }`. One value. Everything else scales from it, and the
layout is fluid enough to absorb it.

## A8 · HIGH — There is no focus styling anywhere in the codebase

**Files:** `src/styles/global.css`, all components

To be precise: this currently *passes* 2.4.7. Nothing sets `outline: none`, so the browser
default ring survives — verified as `outline: auto 1px rgb(0, 95, 204)` on all sixteen
focusable elements. But there is no `:focus` or `:focus-visible` rule in the project at all,
and that has two consequences.

The ring is browser-blue on a warm off-white ground, which is the one colour in the palette
that doesn't belong to it. And every hover affordance the design invests in has no focus
equivalent: the portfolio underline (`PortfolioItem.astro:66`), the FAQ row highlight
(`FAQ.astro:122`), the LinkedIn colour shift (`Team.astro:98`). Mouse users get a designed
state; keyboard users get a default.

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
```

Then change each `:hover` rule to `:hover, :focus-visible`.

## A9 · MEDIUM — FAQ questions aren't headings; two animations skip the reduced-motion guard

**Files:** `src/components/FAQ.astro:58, 89–99` · `src/components/HoverPreview.astro:99–107`

The ten questions are `<span class="faq-question">` inside the `<summary>`. Putting an `<h3>`
in each summary is valid and makes the FAQ navigable by heading — which is how most
screen-reader users read an FAQ.

Separately, the `::details-content` block-size transition and the modal's `fade-in` /
`fade-scale-in` keyframes sit outside any `prefers-reduced-motion` guard, unlike the entrance
animation.

## A10 · MEDIUM — Two `<img src="">` ship in the initial HTML

**File:** `src/components/HoverPreview.astro:3, 10`

Confirmed in the build output: two images with an empty `src` attribute. An empty `src`
resolves against the document URL, so several browsers will request the HTML page a second
time as an image on every load. Omit the attribute entirely and set it on first use.

## A11 · MEDIUM — Sixteen links open in a new tab without saying so

**Files:** `src/components/PortfolioItem.astro:20` · `src/components/Team.astro:41`
**SC:** 3.2.5 Change on Request — Level AAA

Thirteen portfolio links, three LinkedIn links, plus the modal link, all `target="_blank"`.
`rel="noopener noreferrer"` is correctly set on every one of them — good. This is AAA rather
than an AA failure, but a visually-hidden "(opens in a new tab)" appended to each accessible
name costs nothing and is exactly the detail a client's accessibility reviewer looks for.

## A12 · LOW — The hover preview is mouse-only

**File:** `src/components/HoverPreview.astro:136–155`

Bound to `mouseover` / `mouseout` only, so keyboard users never see a preview. Not an SC
failure — the link text names the project, so nothing is lost — but it's an unequal
experience. If you do add focus support, 1.4.13 Content on Hover or Focus then applies: the
preview must be dismissable with `Esc` and must not obscure the content it describes.

## A13 · LOW — The logo scroller has no label

**File:** `src/components/LogoScroller.astro:20–25`

Fourteen organisation names are read out in sequence with nothing establishing what the list
is. Give the wrapper `role="group"` and
`aria-label="Organisations our team has worked with"`. The duplicated second set correctly
carries `aria-hidden="true"` — that part is right — though those copies could drop their
`alt` text for clarity.

## A14 · LOW — Three one-line items

- `lang="en"` → `lang="en-GB"` (`Base.astro:15`). The copy is UK English throughout
  ("organisations", "£10,000") and the pronunciation differs.
- The inline LinkedIn `<svg>` (`Team.astro:45`) needs `aria-hidden="true" focusable="false"` —
  the parent link's `aria-label` already carries the name.
- The "↗" in "Visit website ↗" (`HoverPreview.astro:12`) is announced as "north east arrow"
  by several screen readers. Wrap it in `<span aria-hidden="true">`.

## A15 · PASS — Reflow passes cleanly

**SC:** 1.4.10 Reflow — Level AA

Measured at 320, 375, 390 and 1280px: `scrollWidth === clientWidth` at every width, no
horizontal scrolling, no clipped content. 320px is the width a 1280px viewport reaches at
400% zoom, so this covers the SC. The scroller track overflows by design and is correctly
clipped by `overflow: hidden` on its wrapper.

---

# Part B — UK GDPR and related obligations

The good news up front: no cookies, no analytics, no tag manager, no pixels, no embeds.
That's a genuinely better starting position than most agency sites, and it means no cookie
banner is required. The gaps are a third-party font host and the complete absence of a
privacy notice.

## G1 · CRITICAL — Google Fonts is loaded from Google's CDN on every page view

**File:** `src/layouts/Base.astro:24–29`
**Law:** UK GDPR Art. 6, 13, 44

A network trace of a plain page load confirms the browser contacts `fonts.googleapis.com` and
`fonts.gstatic.com` before anything is rendered, with no notice and no choice. Each request
carries the visitor's **IP address, User-Agent and referring page** to Google LLC in the
United States.

- IP addresses are personal data — *Breyer* (CJEU C-582/14), and the ICO's own guidance
  treats them the same way.
- You need an Art. 6 lawful basis. Realistically that's legitimate interests, which requires a
  documented balancing assessment you don't currently have — and there is no privacy notice
  telling anyone it happens (see G2).
- It is a restricted transfer to the US, so it needs a transfer mechanism. Google *is*
  certified under the EU–US Data Privacy Framework including the UK Extension, so the UK–US
  data bridge does cover it — but you have to identify and record that reliance, and it
  doesn't cure the missing notice.

The commercial exposure is sharper than the legal one. *LG München I, 3 O 17493/20* (Jan 2022)
awarded damages against a site operator for exactly this pattern and triggered a large wave of
German warning letters. Two of your three team members are based in Germany, and you sell to
European nonprofits who will have heard of that case.

**Fix — the single highest-value change on this list:**

```
npm i @fontsource-variable/dm-sans @fontsource/ibm-plex-mono
```

Import them in `Base.astro` and delete all three `<link>` tags. That removes the transfer
entirely, removes two cross-origin DNS + TLS handshakes and a render-blocking stylesheet from
the critical path, and eliminates the flash of fallback text that `display=swap` currently
causes. One commit, and it's simultaneously the compliance fix, the performance fix and the
privacy fix.

## G2 · CRITICAL — There is no privacy notice

**Status:** no `/privacy` route exists
**Law:** UK GDPR Art. 13

The build emits exactly two pages, `/` and `/fonts`. Article 13 requires that at the point
personal data is collected you tell people who the controller is, what you collect, why, on
what lawful basis, who receives it, whether it leaves the UK and under what mechanism, how
long you keep it, and their rights — access, rectification, erasure, objection, and the right
to complain to the ICO.

"We have no forms" isn't an answer, because the site already processes personal data three
ways: IP and request metadata logged at Cloudflare's edge (G4), IP and User-Agent sent to
Google (G1), and the content of any email sent to `taylor@`, `alex@` or `max@`. This is the
largest single compliance gap on the site and the one a client's legal team will notice first.

**Fix:** add `src/pages/privacy.astro` using the existing section components, and link it from
the footer. Fixing G1 first makes it a much shorter document to write.

## G3 · HIGH — `/fonts` is publicly deployed and loads ten more Google font families

**File:** `src/pages/fonts.astro`

CLAUDE.md describes this as an internal typeface comparison page, but `astro build` emits
`dist/client/fonts/index.html` and the Workers ASSETS binding will serve it at
`commonmechanics.io/fonts`. It requests **ten** families from Google — a larger version of G1
— and it is crawlable and indexable, since there's no `robots.txt` in `public/` either.

**Fix:** delete it, move it outside `src/pages/`, or wrap the route in `import.meta.env.DEV`.
While you're there, add a `robots.txt` and a sitemap.

## G4 · HIGH — Cloudflare Workers observability is enabled

**File:** `wrangler.jsonc:10–12`
**Law:** UK GDPR Art. 28, 30

`"observability": { "enabled": true }` retains request logs in Cloudflare's pipeline. You are
the controller and Cloudflare is your processor, which means you need their DPA on record
(it's incorporated into their standard terms, but record that you rely on it), an entry in
your Article 30 record of processing, a stated retention period, and a line in the privacy
notice.

For a purely static marketing site you may simply not need it. Turning it off is a perfectly
legitimate data-minimisation answer and removes the obligation rather than documenting it.

## G5 · HIGH — Production sends no security headers; the ones you wrote are dead config

**File:** `netlify.toml:8–13`
**Law:** UK GDPR Art. 32

`netlify.toml` sets `X-Frame-Options`, `X-Content-Type-Options` and `Referrer-Policy`. But
Netlify is the documented *fallback* host — you deploy to Cloudflare Workers
(`package.json:11`, `wrangler.jsonc`), which reads none of that file. Production is therefore
bare: no framing protection, no MIME-sniffing protection, no referrer policy, no HSTS, no CSP.

**Fix — add `public/_headers`.** Workers Static Assets reads `_headers` the same way Pages
does, and since this is a fully static build every response is an asset response.

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), camera=(), microphone=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

Two notes. Astro emits the scoped component styles as an external stylesheet, so
`style-src 'self'` is fine — `'unsafe-inline'` is still needed only because of the
`style="--stagger: N"` attributes; if you move those to classes you can drop it. And this CSP
assumes G1 is fixed; until the fonts are self-hosted you'd have to allow the two Google
origins, which is a good reason to do G1 first. Leave `preload` off the HSTS header until
you're sure — the preload list is difficult to leave.

## G6 · MEDIUM — Company disclosure is missing the place of registration

**File:** `src/components/Footer.astro:2–7`
**Law:** Companies Act 2006 s.82; Company, LLP and Business (Names and Trading Disclosures) Regulations 2015

The footer gives the registered name, the company number and the registered office address.
The regulations also require the **part of the United Kingdom in which the company is
registered**. Add "Registered in England and Wales" to the existing line.

## G7 · MEDIUM — No general contact address, and no VAT number if you're registered

**File:** `src/components/Footer.astro`
**Law:** Electronic Commerce (EC Directive) Regulations 2002, reg. 6

Reg. 6 requires a service provider to make available, in a form that is easily, directly and
permanently accessible, its name, geographic address and **an email address** — plus its VAT
number where it is VAT-registered. The three team addresses in the Team section arguably
satisfy the email limb, but a `hello@commonmechanics.io` in the footer beside the company
details is the clean answer. It also gives you the route for data-subject requests that the
privacy notice will need anyway.

## G8 · KEEP — No cookies or trackers; protect this position deliberately

**File:** `src/components/FAQ.astro:14`
**Law:** PECR reg. 6

Verified across the whole page load: no `Set-Cookie`, no `localStorage`, no tag manager, no
YouTube or Vimeo embed, no LinkedIn or Meta pixel. The only third-party origins touched are
the two Google Fonts hosts. PECR reg. 6 is therefore not engaged and **no cookie banner is
required**. Fixing G1 takes the third-party count to zero.

Two things will threaten it. FAQ item 2 promises clients "your own analytics access" — when
you add analytics to *this* site, PECR consent applies unless the tool sets nothing on the
device. Cloudflare Web Analytics, or self-hosted Plausible or Umami in cookieless mode, keep
you banner-free; a default GA4 install does not. Write that down as a policy now, before the
first client asks for GA4.

## G9 · MEDIUM — Three named individuals published with work email, LinkedIn and city

**File:** `src/components/Team.astro:9–28`
**Law:** UK GDPR Art. 6(1)(f), 17, 21

Lawful on legitimate interests and entirely standard for an agency — but it needs two things
behind it. Tell the team, in an internal privacy notice, that this is published and on what
basis. And put a removal step in your leavers process: a former colleague asking to come off
the site is an erasure or objection request with a statutory clock on it, and finding out
about that obligation on day 29 is unpleasant.

Published `mailto:` addresses also get scraped, so inbound mail to those boxes is itself a
processing activity your retention policy should cover.

## G10 · MEDIUM — Check whether you owe the ICO data protection fee

**Law:** Data Protection (Charges and Information) Regulations 2018

Every UK controller must pay the annual fee unless exempt. The exemptions cover processing
only for staff administration, marketing and PR of your own business, and accounts and records
— a brochure site plus your own client list might fall inside that. But the moment you hold
client end-user data during a build, or run analytics and platforms on clients' behalf as the
FAQ describes, you won't.

Run the ICO's self-assessment. Tier 1 is £52 a year and non-payment carries a fixed penalty,
so this is cheap certainty rather than a judgement call worth agonising over.

## G11 · HIGH — Accessibility is a legal duty for you too, and a sales question

**Law:** Equality Act 2010 s.29

The Public Sector Bodies Accessibility Regulations don't reach a private site, and the
European Accessibility Act is EU law rather than UK. But s.29 of the Equality Act places a
duty on service providers to make reasonable adjustments, and websites are in scope; the
practical benchmark courts and procurement teams reach for is WCAG 2.2 AA.

Two things follow. Your own site currently fails that benchmark in the ways set out in Part A.
And since June 2025 the EAA does bind e-commerce and several other categories of site inside
the EU — which is a question your European nonprofit clients are going to start putting to
their web partner. An agency whose own site passes AA has a far easier version of that
conversation, and Part A's fix list is genuinely about two hours of work.

---

# Part C — What's already right

Worth recording, because several of these are things agencies routinely get wrong and they're
already correct here.

- **Zero trackers, cookies or third-party embeds.** The rarest item on this list, and the
  reason you need no cookie banner.
- **`rel="noopener noreferrer"` on every external link** — all sixteen, without exception.
- **The entrance animation respects `prefers-reduced-motion`** (`global.css:141`), and uses
  `backwards` fill so nothing flashes in early.
- **All fourteen client logos carry real alt text**, and the duplicated marquee set is
  correctly `aria-hidden`.
- **The FAQ uses native `<details>`** rather than a hand-rolled JS accordion, so keyboard and
  screen-reader behaviour comes free.
- **Reflow is clean at every width tested**, including 320px (A15).
- **Body text sits at 11.94:1** — well past AAA. The contrast problem is confined to the
  secondary palette.
- **The FAQ icon is `aria-hidden`**, `loading="lazy"` is used sensibly, and `lang` is set.

---

# Part D — What to do, in order

## This week — ten changes, roughly two hours, no decisions required

| # | Change | Refs | Time |
|---|---|---|---|
| 1 | Self-host the fonts — removes the only third-party transfer and speeds up first paint | G1, G3 | 20 min |
| 2 | Fix the five contrast failures — two token values, one deleted `opacity` | A5 | 15 min |
| 3 | Section labels become `<h2>`; wrap the page in `<main>` | A2 | 15 min |
| 4 | Guard and hover-pause the logo scroller | A1 | 10 min |
| 5 | Add `public/_headers` — do it after step 1 so the CSP can stay tight | G5 | 10 min |
| 6 | Add a `:focus-visible` rule and mirror the hover states | A8 | 10 min |
| 7 | Pad the LinkedIn links to 24×24 | A6 | 5 min |
| 8 | Delete or dev-gate `/fonts`; add `robots.txt` | G3 | 5 min |
| 9 | Footer: "Registered in England and Wales" + a `hello@` address | G6, G7 | 5 min |
| 10 | `font-size: 100%`; drop the two empty `src=""`; `lang="en-GB"` | A7, A10, A14 | 5 min |

## Next — half a day of real work

| # | Change | Refs | Time |
|---|---|---|---|
| 11 | Rebuild the preview modal on native `<dialog>` — stop intercepting link clicks, add a close button and an accessible name, get focus trapping and `Esc` for free | A3, A4, A12 | 3–4 hrs |
| 12 | Write and publish the privacy notice — controller identity, what's collected, lawful basis per purpose, processors, transfers, retention, rights, ICO complaint route | G2 | half day |
| 13 | Sweep the remaining Part A items — FAQ headings, new-tab announcements, scroller label, SVG attributes | A9, A11, A13, A14 | 1 hr |

## Then — paperwork, not code

| # | Action | Refs |
|---|---|---|
| 14 | Article 30 record of processing. One spreadsheet. Cloudflare and your mail provider are the processors | — |
| 15 | Cloudflare DPA on file; decide whether observability stays on | G4 |
| 16 | ICO fee self-assessment | G10 |
| 17 | Internal staff privacy notice + a leavers removal step | G9 |
| 18 | Written "cookieless analytics only" rule, so the banner-free position survives contact with clients | G8 |

---

*This is an engineering review, not legal advice. The Part B items marked Critical and High
are well-established positions worth acting on immediately; G6, G7 and G10 are worth a short
conversation with your accountant or solicitor to confirm against your actual VAT and
registration status.*
