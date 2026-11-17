import { describe, expect, it } from 'vitest';
import { CATALOGUE } from './index';
import type { Entry } from './types';
import { validateCatalogue } from './validate';

describe('catalogue data', () => {
  it('has no mistakes', () => {
    expect(validateCatalogue(CATALOGUE)).toEqual([]);
  });
});

describe('validateCatalogue', () => {
  const base = CATALOGUE.find((e) => e.kind === 'botanical');
  if (!base) throw new Error('need a botanical in the catalogue');

  it('catches duplicate ids, bad ranges and bad percentages', () => {
    const broken: Entry = {
      ...base,
      timing: { totalHours: [6, 2] },
      compounds: [{ name: 'X', percent: [5, 140] }],
    };
    const problems = validateCatalogue([base, broken]);
    expect(problems.some((p) => p.includes('duplicate id'))).toBe(true);
    expect(problems.some((p) => p.includes('totalHours'))).toBe(true);
    expect(problems.some((p) => p.includes('X percent'))).toBe(true);
  });
});
