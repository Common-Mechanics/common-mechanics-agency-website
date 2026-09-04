/**
 * fetch-vendor-dpas.mjs
 *
 * Retains a copy of each sub-processor's own Data Processing Agreement.
 * Run with:  npm run fetch-dpas
 * Re-fetch everything: npm run fetch-dpas -- --force
 *
 * Why this exists
 * ---------------
 * We do not negotiate a bespoke DPA with any of these vendors — we accept the
 * one they publish. That published document *is* our Article 28(4) contract
 * with them, so "we rely on their standard DPA" is only a defensible answer if
 * we can produce the version we accepted. A URL is not a record: vendors edit
 * these pages in place, and several of them are JavaScript-rendered pages that
 * will not exist in this form in a year.
 *
 * So each one is rendered to a PDF here, alongside a manifest recording the
 * source URL, the retrieval date and a SHA-256 of the bytes. Re-running with
 * --force and diffing the manifest is therefore also the cheapest possible
 * change-detection for vendor terms: a changed hash means that vendor altered
 * its DPA, which is exactly the event Art. 28(2) expects us to notice.
 *
 * This is a records exercise, not a build step — it is deliberately NOT wired
 * into prebuild. Nothing under vendor-dpas/ is served: the directory sits
 * outside src/ and public/ so neither Vite nor the Cloudflare adapter can pick
 * it up. These are the vendors' documents, kept for our own compliance file.
 */

import puppeteer from 'puppeteer';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../vendor-dpas');
const MANIFEST = resolve(OUT_DIR, 'manifest.json');
const FORCE = process.argv.includes('--force');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * `entity` mirrors `legalEntity` in the current sub-processor list — the two
 * are meant to be read side by side, and a mismatch means one of them is stale.
 * `kind` is 'pdf' where the vendor publishes a real PDF (always prefer it: it
 * is the document itself, not our rendering of a web page) and 'page' where
 * the DPA only exists as HTML.
 */
const VENDORS = [
  { slug: 'vercel',    vendor: 'Vercel',    entity: 'Vercel, Inc.',                           kind: 'page', url: 'https://vercel.com/legal/dpa' },
  { slug: 'cloudflare',vendor: 'Cloudflare',entity: 'Cloudflare, Inc.',                       kind: 'page', url: 'https://www.cloudflare.com/cloudflare-customer-dpa/' },
  // GitHub's own DPA, not the docs.github.com index page that merely links to it.
  { slug: 'github',    vendor: 'GitHub',    entity: 'GitHub B.V.',                            kind: 'page', url: 'https://github.com/customer-terms/github-data-protection-agreement' },
  { slug: 'resend',    vendor: 'Resend',    entity: 'Plus Five Five, Inc.',                   kind: 'page', url: 'https://resend.com/legal/dpa' },
  // Google's English DPA is HTML-only and its body does not render for print —
  // the text is all in the source, so the source is what we keep. The Cloud Data
  // Processing Addendum is the one that covers Workspace as well as GCP.
  { slug: 'google',    vendor: 'Google',    entity: 'Google Ireland Limited',                 kind: 'html', url: 'https://cloud.google.com/terms/data-processing-addendum' },
  // notion.com/dpa is behind a sign-in wall; this is the public copy it gates.
  { slug: 'notion',    vendor: 'Notion',    entity: 'Notion Labs, Inc.',                      kind: 'page', url: 'https://www.notion.so/Data-Processing-Addendum-361b540101274b1fa7e16b90402b0d99' },
  { slug: 'linear',    vendor: 'Linear',    entity: 'Linear Orbit, Inc.',                     kind: 'page', url: 'https://linear.app/dpa' },
  // slack.com/terms-of-service/data-processing is a landing page whose only real
  // content is a link to the Salesforce DPA — that PDF is the actual agreement.
  { slug: 'slack',     vendor: 'Slack',     entity: 'Slack Technologies Limited',             kind: 'pdf',  url: 'https://www.salesforce.com/content/dam/web/en_us/www/documents/legal/Agreements/data-processing-addendum.pdf' },
  { slug: 'figma',     vendor: 'Figma',     entity: 'Figma, Inc.',                            kind: 'page', url: 'https://www.figma.com/legal/dpa/' },
  { slug: 'adobe',     vendor: 'Adobe',     entity: 'Adobe Systems Software Ireland Limited', kind: 'pdf',  url: 'https://www.adobe.com/cc-shared/assets/pdf/legal/terms/enterprise/pdfs/dpa-ww.pdf' },
  { slug: '1password', vendor: '1Password', entity: 'AgileBits Inc.',                         kind: 'pdf',  url: 'https://1password.com/files/legal-center/AgileBits-DPA-v4.6-02032025.pdf' },
  { slug: 'anthropic', vendor: 'Anthropic', entity: 'Anthropic Ireland, Limited',             kind: 'page', url: 'https://www.anthropic.com/legal/data-processing-addendum' },
  { slug: 'openai',    vendor: 'OpenAI',    entity: 'OpenAI Ireland Limited',                 kind: 'page', url: 'https://openai.com/policies/data-processing-addendum/' },
];

/**
 * Shortest plausible DPA, in characters of rendered text.
 *
 * This gate exists because the first run of this script "succeeded" on all
 * thirteen while four of them were junk: GitHub returned a navigation index,
 * Notion a sign-in wall, Slack a landing page and Google a cookie shell. Each
 * produced a valid, well-formed, entirely worthless PDF. A DPA that satisfies
 * Art. 28(3) cannot be 600 characters long, so anything under this is a wrong
 * URL rather than a terse vendor, and the run should fail loudly.
 */
const MIN_DPA_CHARS = 8_000;

/** Phrases any Art. 28 processor agreement will contain at least one of. */
const DPA_SIGNALS = ['sub-processor', 'subprocessor', 'personal data', 'data protection'];

const sha256 = (buffer) => `sha256-${createHash('sha256').update(buffer).digest('hex')}`;

/** Scroll the whole page so lazy-loaded clauses render before we print. */
async function revealLazyContent(page) {
  await page.evaluate(async () => {
    await new Promise((done) => {
      let y = 0;
      const step = () => {
        window.scrollBy(0, window.innerHeight);
        y += window.innerHeight;
        if (y < document.body.scrollHeight && y < 200_000) setTimeout(step, 60);
        else {
          window.scrollTo(0, 0);
          done();
        }
      };
      step();
    });
  });
}

/**
 * Saves a page's HTML source. Used where a vendor publishes the DPA as a web
 * page that will not render for print — the text is all there in the source,
 * and a source file we can grep is a better record than a blank PDF.
 */
async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length < MIN_DPA_CHARS) {
    throw new Error(`only ${text.length} chars of text in the HTML source`);
  }
  if (!DPA_SIGNALS.some((signal) => text.toLowerCase().includes(signal))) {
    throw new Error('none of the expected DPA phrases appear in the HTML source');
  }
  return Buffer.from(html, 'utf8');
}

async function fetchPdf(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/pdf,*/*' },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function renderPage(browser, url) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90_000 });
    await revealLazyContent(page);
    // Let webfonts settle so the print does not fall back mid-render.
    await new Promise((r) => setTimeout(r, 1500));

    // Check what a reader would actually see, before committing it to a PDF.
    const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
    if (text.length < MIN_DPA_CHARS) {
      throw new Error(
        `only ${text.length} chars of text — expected at least ${MIN_DPA_CHARS}; ` +
          'this is almost certainly a nav page, sign-in wall or cookie shell',
      );
    }
    if (!DPA_SIGNALS.some((signal) => text.toLowerCase().includes(signal))) {
      throw new Error('none of the expected DPA phrases appear in the text');
    }
    // page.pdf() resolves to a Uint8Array, not a Buffer — and Uint8Array's
    // toString() joins the bytes as decimal numbers, so the %PDF- magic check
    // below silently fails on the raw value. Wrap it here, once.
    return Buffer.from(
      await page.pdf({
        format: 'A4',
        printBackground: false,
        margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
      }),
    );
  } finally {
    await page.close();
  }
}

mkdirSync(OUT_DIR, { recursive: true });

const manifest = existsSync(MANIFEST)
  ? JSON.parse(readFileSync(MANIFEST, 'utf8'))
  : { _comment: '', retrieved: {} };

console.log(`Retaining ${VENDORS.length} vendor DPAs → ${OUT_DIR}\n`);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

let ok = 0;
let skipped = 0;
const failures = [];

for (const { slug, vendor, entity, url, kind } of VENDORS) {
  const filename = `${slug}-dpa.${kind === 'html' ? 'html' : 'pdf'}`;
  const outPath = resolve(OUT_DIR, filename);

  if (!FORCE && existsSync(outPath)) {
    console.log(`  skip   ${filename}  (already retained — use --force to re-fetch)`);
    skipped++;
    continue;
  }

  process.stdout.write(`  fetch  ${vendor.padEnd(11)} ${kind.padEnd(4)} … `);

  try {
    const buffer =
      kind === 'pdf' ? await fetchPdf(url)
      : kind === 'html' ? await fetchHtml(url)
      : await renderPage(browser, url);

    if (kind !== 'html' && buffer.subarray(0, 5).toString() !== '%PDF-') {
      throw new Error('response is not a PDF');
    }

    writeFileSync(outPath, buffer);
    const previous = manifest.retrieved[slug];
    manifest.retrieved[slug] = {
      vendor,
      entity,
      url,
      source:
        kind === 'pdf' ? 'vendor PDF'
        : kind === 'html' ? 'HTML source of the vendor web page'
        : 'rendered from the vendor web page',
      retrievedAt: new Date().toISOString().slice(0, 10),
      file: filename,
      bytes: buffer.length,
      sha256: sha256(buffer),
    };

    const changed = previous && previous.sha256 !== manifest.retrieved[slug].sha256;
    console.log(`ok  ${(buffer.length / 1024).toFixed(0)} KB${changed ? '  ⚠ CHANGED since last retrieval' : ''}`);
    ok++;
  } catch (error) {
    console.log(`FAILED — ${error.message}`);
    failures.push({ vendor, url, reason: error.message });
  }
}

await browser.close();

manifest._comment =
  'Copies of each sub-processor\'s own published DPA, retained as our Art. 28(4) record. ' +
  'Written by scripts/fetch-vendor-dpas.mjs — see vendor-dpas/README.md. A changed sha256 ' +
  'on re-fetch means that vendor altered its DPA.';
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`\n${ok} retained, ${skipped} skipped, ${failures.length} failed.`);
for (const { vendor, url, reason } of failures) {
  console.log(`  ✗ ${vendor}: ${reason}\n    ${url}`);
}
if (failures.length) process.exitCode = 1;
