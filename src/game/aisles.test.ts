import { describe, expect, it } from 'vitest';
import { CATALOGUE } from './data';
import { ALL_AISLE, buildAisles, hashString } from './aisles';

describe('buildAisles', () => {
  it('puts every title first, then aisles A-Z, merging case differences', () => {
    const [a, b] = CATALOGUE;
    if (!a || !b) throw new Error('need two entries');
    const entries = [
      { ...a, id: 'z', name: 'Zed', aisle: 'stimulants' },
      { ...b, id: 'y', name: 'Yarrow', aisle: 'Herbs' },
      { ...a, id: 'x', name: 'Xan', aisle: 'Stimulants' },
    ];
    const aisles = buildAisles(entries);
    expect(aisles.map((x) => x.name)).toEqual([ALL_AISLE, 'Herbs', 'Stimulants']);
    expect(aisles[0]?.entries.map((e) => e.id)).toEqual(['x', 'y', 'z']);
    expect(aisles[2]?.entries.map((e) => e.id)).toEqual(['x', 'z']);
  });
});

describe('hashString', () => {
  it('is stable and spreads values', () => {
    expect(hashString('coffee')).toBe(hashString('coffee'));
    expect(hashString('coffee')).not.toBe(hashString('coffef'));
  });
});
