import type { Entry } from './data/types';
import { describeTiming, formatPercent, matchesDuration, parseDurationQuery } from './timing';

export type SearchMode = 'all' | 'name' | 'compound' | 'effect' | 'duration';

export const SEARCH_MODES: readonly SearchMode[] = [
  'all',
  'name',
  'compound',
  'effect',
  'duration',
];

export interface SearchHit {
  entry: Entry;
  score: number;
  /** Why it matched, e.g. "contains Caffeine 1-1.5%". */
  reason: string;
}

/** Lowercase, strip accents and punctuation, collapse spaces. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9%.]+/g, ' ')
    .trim();
}

interface Field {
  text: string;
  weight: number;
  reason: string;
}

function fieldsFor(entry: Entry, mode: SearchMode): Field[] {
  const fields: Field[] = [];
  const add = (text: string | undefined, weight: number, reason: string) => {
    if (text) fields.push({ text: normalize(text), weight, reason });
  };
  const wants = (m: SearchMode) => mode === 'all' || mode === m;

  if (wants('name')) {
    add(entry.name, 10, '');
    for (const aka of entry.aka ?? []) add(aka, 8, `aka ${aka}`);
    if (entry.kind === 'botanical') add(entry.latin, 8, entry.latin);
  }

  if (wants('compound')) {
    if (entry.kind === 'botanical') {
      for (const c of entry.compounds) {
        const pct = c.percent ? ` ${formatPercent(c.percent)}` : '';
        const part = c.part ? ` (${c.part})` : '';
        add(c.name, 9, `contains ${c.name}${pct}${part}`);
      }
    } else {
      // A synthetic *is* a compound, so its own names count here too.
      if (mode === 'compound') {
        add(entry.name, 10, '');
        for (const aka of entry.aka ?? []) add(aka, 8, `aka ${aka}`);
      }
      add(entry.chemicalClass, 5, `class: ${entry.chemicalClass}`);
    }
  }

  if (wants('effect')) {
    for (const effect of entry.effects) add(effect, 9, `effect: ${effect}`);
    add(entry.summary, 2, '');
  }

  if (mode === 'all') {
    add(entry.aisle, 6, `aisle: ${entry.aisle}`);
    if (entry.kind === 'botanical') {
      add(entry.family, 4, `family ${entry.family}`);
      add(entry.region, 2, entry.region ?? '');
    }
    for (const risk of entry.risks) add(risk, 3, `risk: ${risk}`);
    for (const route of entry.routes ?? []) add(route, 4, `route: ${route}`);
    if (entry.myth)
      add(`myth busted ${entry.myth.reputation}`, 4, `myth: ${entry.myth.reputation}`);
  }
  return fields;
}

/** How well `q` matches `text`, 0..1. */
function matchQuality(text: string, q: string): number {
  if (text === q) return 1;
  if (text.startsWith(q)) return 0.8;
  if (` ${text}`.includes(` ${q}`)) return 0.6;
  if (text.includes(q)) return 0.4;
  return 0;
}

function scoreEntry(entry: Entry, q: string, mode: SearchMode): SearchHit | null {
  const fields = fieldsFor(entry, mode);

  // Whole-query match against a single field.
  let best: SearchHit | null = null;
  for (const f of fields) {
    const score = matchQuality(f.text, q) * f.weight;
    if (score > (best?.score ?? 0)) best = { entry, score, reason: f.reason };
  }
  if (best) return best;

  // Otherwise every word must appear somewhere.
  const words = q.split(' ');
  if (words.length < 2) return null;
  let total = 0;
  let reason = '';
  for (const word of words) {
    let wordBest = 0;
    for (const f of fields) {
      const score = matchQuality(f.text, word) * f.weight;
      if (score > wordBest) {
        wordBest = score;
        if (!reason && f.reason) reason = f.reason;
      }
    }
    if (wordBest === 0) return null;
    total += wordBest;
  }
  return { entry, score: (total / words.length) * 0.5, reason };
}

const byName = (a: SearchHit, b: SearchHit) => a.entry.name.localeCompare(b.entry.name);

/**
 * Finds entries matching `query`. An empty query lists everything.
 * Duration mode (and duration-looking queries in "all" mode) accept things like
 * "short", "4h", "2-3 hours", "under 90 min", "onset under 30m".
 */
export function search(entries: readonly Entry[], query: string, mode: SearchMode): SearchHit[] {
  const q = normalize(query);
  if (!q) return entries.map((entry) => ({ entry, score: 0, reason: '' })).sort(byName);

  const hits = new Map<string, SearchHit>();

  if (mode === 'all' || mode === 'duration') {
    const dq = parseDurationQuery(query);
    if (dq) {
      for (const entry of entries) {
        if (matchesDuration(entry.timing, dq)) {
          hits.set(entry.id, { entry, score: 5, reason: describeTiming(entry.timing) });
        }
      }
    }
  }

  if (mode !== 'duration') {
    for (const entry of entries) {
      const hit = scoreEntry(entry, q, mode);
      if (hit && hit.score > (hits.get(entry.id)?.score ?? 0)) hits.set(entry.id, hit);
    }
  }

  return [...hits.values()].sort((a, b) => b.score - a.score || byName(a, b));
}
