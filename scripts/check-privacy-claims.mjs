#!/usr/bin/env node
/**
 * Fails the build when the site stops matching what /privacy says about it.
 *
 * The privacy notice makes two claims that are statements about this
 * repository rather than about the law, and both can be falsified by an
 * ordinary, well-meant change somewhere else:
 *
 *   1. "We keep no logs of our own."  True only while Workers observability is
 *      off in `wrangler.jsonc`. Turning it on is a one-line change that starts
 *      retaining request logs — client IPs included — in Cloudflare's pipeline.
 *   2. "No third-party embeds" / "Our typefaces are served from this site
 *      rather than from a third-party font CDN."  True only while nothing in
 *      `src/` or `public/` loads a subresource from another origin. A stray
 *      `<script src="https://…">` or a Google Fonts `<link>` makes the page a
 *      false statement and, in the font case, restores the third-party
 *      transfer the self-hosting was there to remove.
 *
 * Neither is visible from the privacy page itself, so nobody editing
 * `wrangler.jsonc` or a component has any reason to think of it. This script
 * is the reason they do not have to: it runs as `prebuild`/`predev`, alongside
 * the /data-processing manifest, and exits non-zero.
 *
 * A failure here is not "the check is broken". It means the site changed and
 * the notice has to change with it — see the message each check prints.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const failures = [];

function fail(claim, problem, remedy) {
  failures.push({ claim, problem, remedy });
}

/* ── 1. "We keep no logs of our own." ──────────────────────────────── */

/**
 * Strips `//` and block comments from JSONC, leaving string literals alone —
 * a naive strip would eat the `//` in any URL that ever lands in this file.
 */
function stripJsonComments(source) {
  let out = '';
  let inString = false;
  let inLine = false;
  let inBlock = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (inLine) {
      if (char === '\n') {
        inLine = false;
        out += char;
      }
      continue;
    }
    if (inBlock) {
      if (char === '*' && next === '/') {
        inBlock = false;
        i += 1;
      }
      continue;
    }
    if (inString) {
      out += char;
      if (char === '\\') {
        out += source[i + 1] ?? '';
        i += 1;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }
    if (char === '/' && next === '/') {
      inLine = true;
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlock = true;
      i += 1;
      continue;
    }
    out += char;
  }

  return out;
}

const wranglerPath = join(ROOT, 'wrangler.jsonc');
const wrangler = JSON.parse(stripJsonComments(readFileSync(wranglerPath, 'utf8')));

if (wrangler.observability?.enabled === true) {
  fail(
    '/privacy: "We keep no logs of our own, so we hold no per-visitor record we could look you up in."',
    'wrangler.jsonc sets observability.enabled to true, which retains request logs (client IPs included) in Cloudflare\'s pipeline.',
    'Either set it back to false, or keep it on and rewrite that sentence in src/pages/privacy.astro to describe the logs, why they are kept and for how long — then delete this check.',
  );
}

/* ── 2. "No third-party embeds", self-hosted typefaces. ─────────────── */

const SCAN_DIRS = ['src', 'public'];
const SCAN_EXTENSIONS = new Set(['.astro', '.css', '.html', '.js', '.mjs', '.ts', '.json', '.svg']);
const SKIP_DIRS = new Set(['node_modules', 'previews', 'dpa']);

/**
 * Subresource loads only. Anchors are deliberately not matched: the page links
 * out to LinkedIn, client sites and the ICO on purpose, and says so.
 */
const SUBRESOURCE_PATTERNS = [
  [/<script[^>]+src=["'{]*https?:/i, 'a script loaded from another origin'],
  [/<link[^>]+rel=["']?(?:stylesheet|preconnect|dns-prefetch|preload)/i, 'a stylesheet or connection hint to another origin'],
  [/@import\s+url\(\s*["']?https?:/i, 'a CSS @import from another origin'],
  [/<img[^>]+src=["'{]*https?:/i, 'an image loaded from another origin'],
  [/<iframe/i, 'an iframe'],
  [/fonts\.(?:googleapis|gstatic)\.com/i, 'a Google Fonts host'],
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else if (SCAN_EXTENSIONS.has(extname(entry))) {
      yield path;
    }
  }
}

for (const dir of SCAN_DIRS) {
  for (const path of walk(join(ROOT, dir))) {
    const source = readFileSync(path, 'utf8');
    for (const [pattern, description] of SUBRESOURCE_PATTERNS) {
      if (!pattern.test(source)) continue;
      fail(
        '/privacy: "No tag manager, no tracking pixels, no third-party embeds" and "Our typefaces are served from this site rather than from a third-party font CDN."',
        `${relative(ROOT, path)} contains ${description}.`,
        'A third party that receives a visitor\'s IP address is a recipient under UK GDPR Art. 13(1)(e). Remove it, self-host it, or add it to the notice and to the sub-processor list.',
      );
    }
  }
}

/* ── Report ────────────────────────────────────────────────────────── */

if (failures.length > 0) {
  console.error('\nThe site no longer matches its own privacy notice.\n');
  for (const { claim, problem, remedy } of failures) {
    console.error(`  Claim   ${claim}`);
    console.error(`  Problem ${problem}`);
    console.error(`  Fix     ${remedy}\n`);
  }
  process.exit(1);
}

console.log('privacy claims: ok');
