import { describe, expect, it } from 'vitest';
import { buildBackCover } from './backcover';
import { CATALOGUE } from './data';

const get = (id: string) => {
  const e = CATALOGUE.find((x) => x.id === id);
  if (!e) throw new Error(`no entry ${id}`);
  return e;
};

const headings = (id: string) =>
  buildBackCover(get(id)).flatMap((b) => (b.type === 'heading' ? [b.text] : []));

describe('buildBackCover', () => {
  it('lists a botanical’s compounds with percentages', () => {
    const table = buildBackCover(get('syrian-rue')).find((b) => b.type === 'table');
    expect(table).toMatchObject({ rows: expect.arrayContaining([['Harmine', '4.3%', 'seed']]) });
    expect(headings('syrian-rue')).toContain('ACTIVE COMPOUNDS');
    expect(headings('syrian-rue')).not.toContain('ORIGIN');
  });

  it('includes doses, routes and the evidence tier when an entry has them', () => {
    expect(headings('salvia-divinorum')).toEqual(
      expect.arrayContaining(['REPORTED DOSES', 'ROUTES', 'EVIDENCE TIER A']),
    );
  });

  it('shows a myth check for busted reputations, and says when timing is unknown', () => {
    expect(headings('blue-lotus')).toEqual(
      expect.arrayContaining(['REPUTATION', 'WHAT THE RECORD SHOWS']),
    );
    const timing = buildBackCover(get('blue-lotus')).find(
      (b) => b.type === 'para' && b.text.includes('No timing data'),
    );
    expect(timing).toBeDefined();
  });

  it('gives a synthetic its origin and timing', () => {
    expect(headings('modafinil')).toEqual(
      expect.arrayContaining(['ORIGIN', 'EFFECTS', 'RUNNING TIME', 'LOW TOXICITY']),
    );
    const timing = buildBackCover(get('modafinil')).find(
      (b) => b.type === 'facts' && b.rows.some(([k]) => k === 'DURATION'),
    );
    expect(timing).toMatchObject({ rows: expect.arrayContaining([['DURATION', '10-15 h']]) });
  });
});
