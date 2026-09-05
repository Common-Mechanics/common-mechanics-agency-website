#!/usr/bin/env node
/**
 * Builds the data behind /data-processing, and enforces its two guarantees.
 *
 *   1. Agreement PDFs are found by scanning `public/dpa/` — no list to keep in
 *      sync. Version and publish date come out of the filename.
 *   2. Every published sub-processor list version is immutable, pinned by
 *      SHA-256 in `src/data/subprocessors.lock.json`.
 *
 * This runs as `prebuild`/`predev` rather than inside the Astro page, and that
 * is deliberate on both counts:
 *
 *   - `node:fs` does not exist in the environment the Cloudflare adapter
 *     prerenders in, so the directory scan cannot happen in page frontmatter.
 *   - More importantly, a `throw` in page frontmatter does NOT fail the build.
 *     Astro logs the error, writes a zero-byte HTML file and still exits 0 —
 *     so an integrity check that lives there silently ships a broken page
 *     instead of stopping the deploy. Here, a non-zero exit aborts
 *     `npm run build` before Astro starts.
 *
 * Output is written to `src/data/data-processing.generated.json` (gitignored);
 * `src/data/data-processing.ts` types it and adds the display formatting.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AGREEMENTS_DIR = join(ROOT, 'public', 'dpa');
const VERSIONS_DIR = join(ROOT, 'src', 'data', 'subprocessors');
const LOCK_FILE = join(ROOT, 'src', 'data', 'subprocessors.lock.json');
const OUT_FILE = join(ROOT, 'src', 'data', 'data-processing.generated.json');

/** `dpa-v<major>.<minor>-<YYYY-MM-DD>.pdf` */
const PDF_PATTERN = /^dpa-v(\d+\.\d+)-(\d{4}-\d{2}-\d{2})\.pdf$/;

/**
 * Fields every sub-processor entry must carry, and what each one is for.
 *
 * The set is deliberately short. Each field is here because something obliges
 * us to hold it — see src/data/subprocessors/README.md for which instrument
 * asks for which. A field that no instrument requires is a field that can be
 * wrong for no benefit, so it does not go in this list and does not go in the
 * JSON.
 *
 * `registeredAddress` is required here but is not rendered by the page: the
 * obligation is to have it available to a controller, not to publish it.
 */
const REQUIRED_STRING_FIELDS = [
  ['name', 'the name the sub-processor is commonly known by'],
  ['legalEntity', 'the contracting legal entity, e.g. "Google Ireland Limited"'],
  ['registeredAddress', 'the registered office of that entity'],
  ['function', 'what they do for us'],
];

const REQUIRED_LIST_FIELDS = [
  ['processingLocations', 'countries or regions where they process or store the data'],
];

/**
 * Lowest version the field check above applies to. Every published version
 * currently meets it, so this is a no-op today — it exists because a schema
 * change cannot be applied retroactively to an immutable published version.
 * Rolling one out means publishing the new version and then raising this floor
 * to it, leaving the older versions validated against the shape they were
 * actually published with.
 */
const RICH_SCHEMA_FROM = '1.0';

const problems = [];

/** Numeric compare on `major.minor`, so v1.10 sorts above v1.9. */
function compareVersions(a, b) {
  const [aMajor, aMinor] = a.split('.').map(Number);
  const [bMajor, bMinor] = b.split('.').map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}

/**
 * Checks one entry of a sub-processor list. Returns a list of human-readable
 * problems; an empty list means the entry is publishable.
 *
 * A missing field here is not a cosmetic defect: this page is what a client's
 * counsel reads to decide whether our processing chain is acceptable, so an
 * entry that names a sub-processor without saying where it processes the data
 * is worse than no entry at all. Hence a build error rather than a blank cell.
 */
function validateSubprocessor(entry, file, index) {
  const found = [];
  const label = entry?.name ? `"${entry.name}"` : `entry ${index + 1}`;

  if (typeof entry !== 'object' || entry === null) {
    return [`${file}: entry ${index + 1} is not an object.`];
  }

  for (const [field, purpose] of REQUIRED_STRING_FIELDS) {
    if (typeof entry[field] !== 'string' || !entry[field].trim()) {
      found.push(`${file}: ${label} is missing "${field}" — ${purpose}.`);
    }
  }

  for (const [field, purpose] of REQUIRED_LIST_FIELDS) {
    const value = entry[field];
    if (!Array.isArray(value) || !value.length) {
      found.push(`${file}: ${label} is missing "${field}" — ${purpose}.`);
    } else if (value.some((item) => typeof item !== 'string' || !item.trim())) {
      found.push(`${file}: ${label} has a blank value in "${field}".`);
    }
  }

  return found;
}

function listFiles(dir, extension) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => !file.startsWith('.'))
    .filter((file) => file.endsWith(extension));
}

// ─── Agreements ──────────────────────────────────────────────────────────────
// A file that does not match the pattern is an error, not a silent omission:
// on a compliance page an agreement quietly missing from the list is a worse
// failure than a stopped build.
const strayFiles = listFiles(AGREEMENTS_DIR, '').filter((file) => !PDF_PATTERN.test(file));
for (const file of strayFiles) {
  problems.push(
    `public/dpa/${file} does not match the expected filename pattern.\n` +
      `  Agreements are named dpa-v<major>.<minor>-<YYYY-MM-DD>.pdf, e.g.\n` +
      `  dpa-v1.0-2026-09-04.pdf — the page reads the version and the publish\n` +
      `  date straight out of the filename.`,
  );
}

const agreements = listFiles(AGREEMENTS_DIR, '.pdf')
  .map((file) => PDF_PATTERN.exec(file))
  .filter(Boolean)
  .map(([file, version, publishedDate]) => ({
    version,
    publishedDate,
    // Served verbatim out of public/, so the URL of a signed document is
    // stable and citable — not a content hash that moves if it is re-saved.
    href: `/dpa/${file}`,
  }))
  .sort((a, b) => compareVersions(b.version, a.version));

// ─── Sub-processor list versions ─────────────────────────────────────────────
const lock = existsSync(LOCK_FILE)
  ? Object.fromEntries(
      Object.entries(JSON.parse(readFileSync(LOCK_FILE, 'utf8'))).filter(
        ([key]) => !key.startsWith('_'),
      ),
    )
  : {};

const versions = [];

for (const file of listFiles(VERSIONS_DIR, '.json')) {
  // Hash the committed bytes: re-serialising parsed JSON would not reproduce them.
  const raw = readFileSync(join(VERSIONS_DIR, file), 'utf8');
  const actual = `sha256-${createHash('sha256').update(raw).digest('hex')}`;
  const pinned = lock[file];

  if (!pinned) {
    problems.push(
      `Sub-processor version ${file} is not pinned in src/data/subprocessors.lock.json.\n` +
        `  If this is a newly published version, add:\n` +
        `      "${file}": "${actual}"\n` +
        `  If you meant to change the current list, add a new version file instead —\n` +
        `  published versions are immutable.`,
    );
    continue;
  }

  if (actual !== pinned) {
    problems.push(
      `Sub-processor version ${file} has changed since it was published.\n` +
        `      pinned: ${pinned}\n` +
        `      actual: ${actual}\n` +
        `  Published versions are immutable — a reader has to be able to see what the\n` +
        `  list said on a given date. Revert this file and publish a new version instead.`,
    );
    continue;
  }

  const parsed = JSON.parse(raw);

  if (file !== `v${parsed.version}.json`) {
    problems.push(
      `Sub-processor version file ${file} declares version "${parsed.version}";\n` +
        `  it should be named v${parsed.version}.json.`,
    );
    continue;
  }

  if (!Array.isArray(parsed.subprocessors) || !parsed.subprocessors.length) {
    problems.push(`Sub-processor version ${file} has no "subprocessors" array.`);
    continue;
  }

  if (compareVersions(parsed.version, RICH_SCHEMA_FROM) >= 0) {
    const shapeProblems = parsed.subprocessors.flatMap((entry, index) =>
      validateSubprocessor(entry, file, index),
    );
    if (shapeProblems.length) {
      problems.push(...shapeProblems);
      continue;
    }
  }

  versions.push({
    version: parsed.version,
    effectiveDate: parsed.effectiveDate,
    subprocessors: parsed.subprocessors,
  });
}

// A published version staying published is part of the same guarantee.
const missing = Object.keys(lock).filter(
  (file) => !existsSync(join(VERSIONS_DIR, file)),
);
if (missing.length) {
  problems.push(
    `Published sub-processor version(s) missing from src/data/subprocessors/: ${missing.join(', ')}.\n` +
      `  Restore the file rather than dropping it from the lockfile — the page has to be\n` +
      `  able to show what the list said on a given date.`,
  );
}

if (!versions.length && !problems.length) {
  problems.push(
    `No sub-processor list versions found in src/data/subprocessors/.\n` +
      `  /data-processing cannot be published without one.`,
  );
}

// ─── Report or write ─────────────────────────────────────────────────────────
if (problems.length) {
  console.error(`\n✗ /data-processing data is not publishable:\n`);
  for (const problem of problems) console.error(`  • ${problem}\n`);
  process.exit(1);
}

versions.sort((a, b) => compareVersions(b.version, a.version));

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(
  OUT_FILE,
  `${JSON.stringify(
    {
      _generated: 'Written by scripts/data-processing-manifest.mjs — do not edit.',
      agreements,
      subprocessorVersions: versions,
    },
    null,
    2,
  )}\n`,
);

console.log(
  `✓ /data-processing: ${agreements.length} agreement PDF(s), ` +
    `${versions.length} sub-processor version(s) verified.`,
);
