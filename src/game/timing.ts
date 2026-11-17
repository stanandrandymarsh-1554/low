import type { Range, Timing } from './data/types';

/** Formats numbers without trailing zeros: 1 -> "1", 1.25 -> "1.25". */
function num(n: number): string {
  return String(Math.round(n * 100) / 100);
}

function span([lo, hi]: Range, unit: string): string {
  return lo === hi ? `${num(lo)} ${unit}` : `${num(lo)}-${num(hi)} ${unit}`;
}

export function formatMinutes(range: Range): string {
  if (range[0] >= 120) return span([range[0] / 60, range[1] / 60], 'h');
  return span(range, 'min');
}

export function formatHours(range: Range): string {
  if (range[1] < 1) return span([range[0] * 60, range[1] * 60], 'min');
  if (range[0] >= 48) return span([range[0] / 24, range[1] / 24], 'days');
  return span(range, 'h');
}

export function formatPercent([lo, hi]: Range): string {
  return lo === hi ? `${num(lo)}%` : `${num(lo)}-${num(hi)}%`;
}

export type DurationBucket = 'short' | 'medium' | 'long' | 'very long';

/** Rough length class from the middle of the range: short <2h, medium <6h, long <16h, else very long. */
export function durationBucket(totalHours: Range): DurationBucket {
  const mid = (totalHours[0] + totalHours[1]) / 2;
  if (mid < 2) return 'short';
  if (mid < 6) return 'medium';
  if (mid < 16) return 'long';
  return 'very long';
}

/**
 * A parsed duration search. Values are in hours (for `total`) or minutes (for `onset`).
 *  - bucket: "short", "long", ...
 *  - within: "4h", "4-6h" (matches if the ranges overlap)
 *  - under/over: "<4h", "over 8 hours" (compares the middle of the range)
 */
export type DurationQuery = { field: 'total' | 'onset' } & (
  | { type: 'bucket'; bucket: DurationBucket }
  | { type: 'within'; range: Range }
  | { type: 'under' | 'over'; value: number }
);

const UNITS: Record<string, number> = {
  m: 1 / 60,
  min: 1 / 60,
  mins: 1 / 60,
  minute: 1 / 60,
  minutes: 1 / 60,
  h: 1,
  hr: 1,
  hrs: 1,
  hour: 1,
  hours: 1,
  d: 24,
  day: 24,
  days: 24,
};

/** Parses e.g. "short", "4h", "2-3 hours", "<90m", "over 8h", "onset under 30 min". */
export function parseDurationQuery(raw: string): DurationQuery | null {
  let q = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  let field: 'total' | 'onset' = 'total';
  if (q.startsWith('onset')) {
    field = 'onset';
    q = q.slice(5).trim();
  }

  const bucket = q.replace(/[-_]/g, ' ');
  if (field === 'total' && ['short', 'medium', 'long', 'very long'].includes(bucket)) {
    return { field, type: 'bucket', bucket: bucket as DurationBucket };
  }

  const m =
    /^(<|>|under|over|less than|more than|below|above)?\s*(\d+(?:\.\d+)?)\s*(?:(?:-|to)\s*(\d+(?:\.\d+)?))?\s*([a-z]+)?$/.exec(
      q,
    );
  if (!m) return null;
  const [, op, a, b, unitText] = m;
  // Bare numbers mean hours for total duration and minutes for onset.
  const unit = unitText ? UNITS[unitText] : field === 'onset' ? 1 / 60 : 1;
  if (unit === undefined || a === undefined) return null;

  // Convert from hours to the field's own unit.
  const scale = field === 'onset' ? unit * 60 : unit;
  const lo = Number(a) * scale;
  if (b !== undefined) {
    if (op) return null;
    const hi = Number(b) * scale;
    return { field, type: 'within', range: [Math.min(lo, hi), Math.max(lo, hi)] };
  }
  if (!op) return { field, type: 'within', range: [lo, lo] };
  const under = op === '<' || op === 'under' || op === 'less than' || op === 'below';
  return { field, type: under ? 'under' : 'over', value: lo };
}

/** Does this timing match the query? */
export function matchesDuration(timing: Timing, q: DurationQuery): boolean {
  const range = q.field === 'onset' ? timing.onsetMinutes : timing.totalHours;
  if (!range) return false;
  const mid = (range[0] + range[1]) / 2;
  switch (q.type) {
    case 'bucket':
      return durationBucket(range) === q.bucket;
    case 'within':
      return range[0] <= q.range[1] && q.range[0] <= range[1];
    case 'under':
      return mid < q.value;
    case 'over':
      return mid > q.value;
  }
}

/** One-line description of how long something lasts, for search results. */
export function describeTiming(timing: Timing): string {
  const parts = [`lasts ${formatHours(timing.totalHours)}`];
  if (timing.onsetMinutes) parts.push(`onset ${formatMinutes(timing.onsetMinutes)}`);
  return parts.join(', ');
}
