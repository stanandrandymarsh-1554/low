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
    const table = buildBackCover(get('coffee')).find((b) => b.type === 'table');
    expect(table).toMatchObject({ rows: [['Caffeine', '1-1.5%', 'seeds'], expect.any(Array)] });
    expect(headings('coffee')).toContain('ACTIVE COMPOUNDS');
    expect(headings('coffee')).not.toContain('ORIGIN');
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
