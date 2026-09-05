/**
 * Typed view of the data behind /data-processing.
 *
 * The JSON this reads is generated and verified by
 * `scripts/data-processing-manifest.mjs`, which runs as `prebuild`/`predev`.
 * That script — not this module — is what enforces the immutability of
 * published sub-processor versions and the agreement filename convention; a
 * `throw` in Astro page frontmatter does not fail a build (Astro logs it,
 * writes an empty HTML file and exits 0), so the checks have to happen before
 * Astro starts. If the import below fails, run `npm run dpa-manifest`.
 */
import manifest from './data-processing.generated.json';

import { formatDate, latestDate } from './format-date';

export interface Subprocessor {
  /** Company name, as written in the agreement. */
  name: string;
  /** What they do for us — the "[sub-processor] – [function]" right-hand side. */
  function: string;
  /** Contracting legal entity, e.g. "Google Ireland Limited". */
  legalEntity: string;
  /**
   * Registered office of that entity.
   *
   * Maintained but NOT rendered. EDPB Opinion 22/2024 requires a controller to
   * be able to have the name, address and contact person of every processor
   * and sub-processor readily available; it does not require any of it to be
   * published. The page therefore says the address is available on request,
   * and this field is the record that answers such a request. Deleting it
   * because nothing reads it would leave that promise unbacked.
   */
  registeredAddress: string;
  /** Countries or regions where they process or store the data. */
  processingLocations: string[];
}

export interface Agreement {
  /** `major.minor`, e.g. "1.0". */
  version: string;
  /** ISO `YYYY-MM-DD`. */
  publishedDate: string;
  publishedDateLabel: string;
  /** Site-root-relative, served verbatim out of `public/dpa/`. */
  href: string;
}

export interface SubprocessorVersion {
  /** `major.minor`, e.g. "1.0". */
  version: string;
  /** ISO `YYYY-MM-DD`. */
  effectiveDate: string;
  effectiveDateLabel: string;
  subprocessors: Subprocessor[];
}

/** Newest version first. */
export const agreements: Agreement[] = manifest.agreements.map((agreement) => ({
  ...agreement,
  publishedDateLabel: formatDate(agreement.publishedDate),
}));

/** Newest version first. */
export const subprocessorVersions: SubprocessorVersion[] = manifest.subprocessorVersions.map(
  (version) => ({
    ...version,
    effectiveDateLabel: formatDate(version.effectiveDate),
  }),
);

/** The list currently in force. */
export const currentSubprocessors: SubprocessorVersion = subprocessorVersions[0];

/** Everything the current version superseded, newest first. */
export const supersededSubprocessors: SubprocessorVersion[] = subprocessorVersions.slice(1);

/**
 * Date of the most recent change to anything on the page, for the standing
 * "check this page periodically" notice. Derived rather than hand-maintained —
 * a date typed by hand goes stale the first time someone adds a PDF and
 * forgets it.
 */
export const lastUpdated: string = latestDate([
  ...agreements.map((agreement) => agreement.publishedDate),
  ...subprocessorVersions.map((version) => version.effectiveDate),
])!;
