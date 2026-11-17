import { describe, expect, it } from 'vitest';
import {
  durationBucket,
  formatHours,
  formatMinutes,
  formatPercent,
  matchesDuration,
  parseDurationQuery,
} from './timing';

describe('formatting', () => {
  it('formats ranges with sensible units', () => {
    expect(formatMinutes([15, 45])).toBe('15-45 min');
    expect(formatMinutes([120, 240])).toBe('2-4 h');
    expect(formatHours([3, 6])).toBe('3-6 h');
    expect(formatHours([0.25, 0.5])).toBe('15-30 min');
    expect(formatHours([48, 72])).toBe('2-3 days');
    expect(formatPercent([1, 1.5])).toBe('1-1.5%');
    expect(formatPercent([2, 2])).toBe('2%');
  });

  it('buckets by the middle of the range', () => {
    expect(durationBucket([0.5, 1])).toBe('short');
    expect(durationBucket([3, 6])).toBe('medium');
    expect(durationBucket([8, 12])).toBe('long');
    expect(durationBucket([12, 24])).toBe('very long');
  });
});

describe('parseDurationQuery', () => {
  it('parses buckets, values, ranges and comparisons', () => {
    expect(parseDurationQuery('Long')).toEqual({ field: 'total', type: 'bucket', bucket: 'long' });
    expect(parseDurationQuery('very-long')).toMatchObject({ bucket: 'very long' });
    expect(parseDurationQuery('4h')).toEqual({ field: 'total', type: 'within', range: [4, 4] });
    expect(parseDurationQuery('2 to 3 hours')).toMatchObject({ type: 'within', range: [2, 3] });
    expect(parseDurationQuery('<90m')).toMatchObject({ type: 'under', value: 1.5 });
    expect(parseDurationQuery('over 1 day')).toMatchObject({ type: 'over', value: 24 });
    expect(parseDurationQuery('onset under 30')).toEqual({
      field: 'onset',
      type: 'under',
      value: 30,
    });
    expect(parseDurationQuery('onset 1h')).toMatchObject({ field: 'onset', range: [60, 60] });
  });

  it('rejects things that are not durations', () => {
    expect(parseDurationQuery('caffeine')).toBeNull();
    expect(parseDurationQuery('4 parsecs')).toBeNull();
    expect(parseDurationQuery('')).toBeNull();
  });
});

describe('matchesDuration', () => {
  const timing = { onsetMinutes: [15, 45], totalHours: [3, 6] } as const;
  const match = (q: string) => {
    const parsed = parseDurationQuery(q);
    if (!parsed) throw new Error(`did not parse: ${q}`);
    return matchesDuration(timing, parsed);
  };

  it('matches overlapping ranges and comparisons', () => {
    expect(match('4h')).toBe(true);
    expect(match('7h')).toBe(false);
    expect(match('5-8h')).toBe(true);
    expect(match('medium')).toBe(true);
    expect(match('long')).toBe(false);
    expect(match('under 5h')).toBe(true);
    expect(match('over 5h')).toBe(false);
    expect(match('onset under 1h')).toBe(true);
  });
});
