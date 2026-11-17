import type { Entry } from './data/types';

export interface Aisle {
  name: string;
  entries: Entry[];
}

export const ALL_AISLE = 'Every Title';

/** Groups entries into aisles: "Every Title" first, then each aisle A-Z, titles A-Z. */
export function buildAisles(entries: readonly Entry[]): Aisle[] {
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
  const byAisle = new Map<string, Entry[]>();
  for (const entry of sorted) {
    const key = entry.aisle.trim();
    // Group case-insensitively, keeping the first spelling seen.
    const existing = [...byAisle.keys()].find((k) => k.toLowerCase() === key.toLowerCase());
    const list = byAisle.get(existing ?? key) ?? [];
    list.push(entry);
    byAisle.set(existing ?? key, list);
  }
  const aisles = [...byAisle.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, list]) => ({ name, entries: list }));
  return [{ name: ALL_AISLE, entries: sorted }, ...aisles];
}

/** Small stable hash of a string, for picking per-tape colours. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
