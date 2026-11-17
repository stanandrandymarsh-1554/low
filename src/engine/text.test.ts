import { describe, expect, it } from 'vitest';
import { fitText, wrapText } from './text';

// Every character is 10px wide.
const measure = (s: string) => s.length * 10;

describe('wrapText', () => {
  it('wraps on word boundaries', () => {
    expect(wrapText('the quick brown fox', 100, measure)).toEqual(['the quick', 'brown fox']);
  });

  it('keeps explicit newlines and empty lines', () => {
    expect(wrapText('a\n\nb', 100, measure)).toEqual(['a', '', 'b']);
  });

  it('breaks words longer than a line', () => {
    expect(wrapText('abcdefghij xy', 40, measure)).toEqual(['abcd', 'efgh', 'ij', 'xy']);
  });
});

describe('fitText', () => {
  it('leaves short text alone and truncates long text', () => {
    expect(fitText('short', 100, measure)).toBe('short');
    expect(fitText('much too long', 60, measure)).toBe('much…');
  });
});
