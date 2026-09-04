/**
 * Renders an ISO `YYYY-MM-DD` date the way the rest of the site writes dates
 * ("4 September 2026"). Parsed and formatted in UTC on purpose: `new Date('…')`
 * reads a bare date as midnight UTC, so formatting it in the build machine's
 * local zone would render the previous day anywhere west of Greenwich.
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** Newest ISO date of the ones given, or `null` if there are none. */
export function latestDate(isoDates: string[]): string | null {
  return isoDates.length ? isoDates.reduce((a, b) => (a > b ? a : b)) : null;
}
