import { describe, expect, it } from 'vitest';
import type { Botanical, Entry, Synthetic } from './data/types';
import { normalize, search } from './search';

const plant = (over: Partial<Botanical>): Botanical => ({
  kind: 'botanical',
  id: 'p',
  name: 'Plant',
  latin: 'Plantus testus',
  aisle: 'Test',
  summary: 'A plant.',
  compounds: [],
  effects: ['calm'],
  timing: { totalHours: [2, 4] },
  toxicity: 'low',
  risks: [],
  ...over,
});

const synth = (over: Partial<Synthetic>): Synthetic => ({
  kind: 'synthetic',
  id: 's',
  name: 'Synth',
  chemicalClass: 'testamine',
  aisle: 'Test',
  summary: 'A synthetic.',
  origin: { story: 'Made in a lab.' },
  effects: ['focus'],
  timing: { totalHours: [8, 12] },
  toxicity: 'moderate',
  risks: [],
  ...over,
});

const entries: Entry[] = [
  plant({
    id: 'coffee',
    name: 'Coffee',
    latin: 'Coffea arabica',
    compounds: [{ name: 'Caffeine', percent: [1, 1.5], part: 'seeds' }],
    effects: ['alertness', 'focus'],
    timing: { totalHours: [3, 6], onsetMinutes: [15, 45] },
  }),
  plant({
    id: 'tea',
    name: 'Tea',
    latin: 'Camellia sinensis',
    compounds: [
      { name: 'Caffeine', percent: [2, 4] },
      { name: 'L-theanine', percent: [1, 3] },
    ],
    effects: ['calm focus'],
  }),
  synth({ id: 'modafinil', name: 'Modafinil', aka: ['Provigil'] }),
  synth({ id: 'caffeine', name: 'Caffeine', chemicalClass: 'xanthine alkaloid' }),
];

const ids = (hits: { entry: Entry }[]) => hits.map((h) => h.entry.id);

describe('normalize', () => {
  it('lowercases and strips accents and punctuation', () => {
    expect(normalize('  Ayahuasca—Café!  ')).toBe('ayahuasca cafe');
    expect(normalize('L-Theanine')).toBe('l theanine');
  });
});

describe('search', () => {
  it('lists everything alphabetically for an empty query', () => {
    expect(ids(search(entries, '  ', 'all'))).toEqual(['caffeine', 'coffee', 'modafinil', 'tea']);
  });

  it('finds plants by compound, with the percentage in the reason', () => {
    const hits = search(entries, 'caffeine', 'compound');
    expect(ids(hits)).toEqual(['caffeine', 'coffee', 'tea']);
    expect(hits[1]?.reason).toBe('contains Caffeine 1-1.5% (seeds)');
  });

  it('matches names, aka and latin names', () => {
    expect(ids(search(entries, 'provigil', 'name'))).toEqual(['modafinil']);
    expect(ids(search(entries, 'camellia', 'name'))).toEqual(['tea']);
    expect(ids(search(entries, 'coffee', 'compound'))).toEqual([]);
  });

  it('finds by effect, ranking exact tags first', () => {
    expect(ids(search(entries, 'focus', 'effect'))).toEqual([
      'caffeine',
      'coffee',
      'modafinil',
      'tea',
    ]);
    expect(search(entries, 'focus', 'effect')[3]?.score).toBeLessThan(9);
  });

  it('requires every word to match for multi-word queries', () => {
    expect(ids(search(entries, 'theanine calm', 'all'))).toEqual(['tea']);
    expect(ids(search(entries, 'theanine alertness', 'all'))).toEqual([]);
  });

  it('searches by duration', () => {
    expect(ids(search(entries, 'long', 'duration'))).toEqual(['caffeine', 'modafinil']);
    expect(ids(search(entries, 'onset under 1h', 'duration'))).toEqual(['coffee']);
    expect(search(entries, '5h', 'duration')[0]?.reason).toBe('lasts 3-6 h, onset 15-45 min');
    expect(search(entries, 'caffeine', 'duration')).toEqual([]);
  });

  it('also understands durations in "all" mode', () => {
    expect(ids(search(entries, '10h', 'all'))).toEqual(['caffeine', 'modafinil']);
  });
});
