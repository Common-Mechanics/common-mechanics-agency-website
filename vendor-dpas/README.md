# Vendor DPAs

A retained copy of the Data Processing Agreement each sub-processor publishes,
as it stood on the date in `manifest.json`.

**Not published.** This directory sits outside `src/` and `public/`, so neither
Vite nor the Cloudflare adapter can reach it and nothing here is served. These
are the vendors' documents, kept for our own compliance file. The DPA *we*
publish — the one we offer clients — is the PDF in `public/dpa/`, which is a
different thing entirely.

## Why keep them

We do not negotiate a bespoke DPA with any of these vendors; we accept the one
they publish. That published document *is* our Article 28(4) contract with each
of them. "We rely on their standard DPA" is only a defensible answer if we can
produce the version we accepted — and vendors edit these pages in place, with no
version history and no notice.

## Refreshing

```bash
npm run fetch-dpas            # fills in anything missing
npm run fetch-dpas -- --force # re-fetch everything
```

A `--force` run prints `⚠ CHANGED` against any vendor whose bytes differ from
the last retrieval, which makes this the cheapest change-detection we have for
vendor terms. A changed hash is worth reading the diff for: it may be the
Art. 28(2) sub-processor change we are entitled to object to. Commit the new
copy either way — the old one stays in git history.

Worth running roughly quarterly, and before any client due-diligence review.

## What is stored, and how faithful it is

`manifest.json` records the source URL, retrieval date, byte count and SHA-256
for each file. Three levels of fidelity, recorded per entry as `source`:

| `source` | Meaning |
| --- | --- |
| `vendor PDF` | The vendor's own PDF, byte for byte. Adobe, 1Password, Slack. |
| `rendered from the vendor web page` | The vendor publishes HTML only; this is our print of it. Faithful to the text, not to their layout. |
| `HTML source of the vendor web page` | Google only — its DPA body does not render for print, so the page source is kept instead. Readable, and greppable. |

A rendering is evidence of what the page said on a date. It is not a signed
counterpart, and nobody should treat it as one.

## Sources that are easy to get wrong

Four of these have an obvious-looking URL that returns something other than the
agreement, and each one produced a perfectly valid, entirely worthless PDF on the
first run of the fetch script:

- **GitHub** — `docs.github.com/…/github-data-protection-agreement` is a nav
  index. The agreement is at `github.com/customer-terms/…`.
- **Notion** — `notion.com/dpa` is behind a sign-in wall. The public copy is the
  `notion.so` page.
- **Slack** — `slack.com/terms-of-service/data-processing` is a landing page
  whose real content is a link to the Salesforce DPA PDF.
- **Google** — `workspace.google.com/terms/dpa_terms.html` redirects to the
  Cloud DPA, which is correct (it covers Workspace too) but renders as a cookie
  shell.

The script now refuses anything under `MIN_DPA_CHARS` of text, which is what
catches this class of mistake. If a fetch starts failing that check, the vendor
moved the document — find the new URL rather than lowering the threshold.

## Known gaps

- **Anthropic and OpenAI** publish a DPA that is incorporated by reference into
  their commercial terms. The copies here are the public DPA text, not a
  countersigned version tied to our account.
- **Google's DPA** never names `Google Ireland Limited` in its own text; the
  contracting entity is fixed by the Cloud/Workspace terms and the billing
  address, not by the DPA. The entity recorded in the sub-processor list comes
  from those terms.
- Several vendors gate a *signable* DPA behind an account portal. Where a client
  needs a countersigned copy rather than published terms, it has to be requested
  through the account.
