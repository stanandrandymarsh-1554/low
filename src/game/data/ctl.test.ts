import { describe, expect, it } from 'vitest';
import { CATALOGUE } from './index';
import {
  buildCtl,
  clean,
  CTL_ROW_COUNT,
  doseOf,
  effectTags,
  evidenceTier,
  latinOf,
  splitName,
  toxicityOf,
} from './ctl';
import { BOTANICALS } from './botanicals';
import { SYNTHETICS } from './synthetics';
import { validateCatalogue } from './validate';

const CORE = [...BOTANICALS, ...SYNTHETICS];
const CTL = buildCtl(CORE);

describe('the pharmacology index', () => {
  it('adds almost every row, skipping only ones already on the shelves', () => {
    expect(CTL_ROW_COUNT).toBe(333);
    expect(CTL.length).toBeGreaterThan(300);
    expect(CTL.length).toBeLessThanOrEqual(CTL_ROW_COUNT);
    expect(CATALOGUE.length).toBe(CORE.length + CTL.length);
  });

  it('makes valid entries with unique ids and names', () => {
    expect(validateCatalogue(CATALOGUE)).toEqual([]);
    const names = CATALOGUE.map((e) => e.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('never carries legal, regulatory or retail wording into an entry', () => {
    const bad =
      /\b(FDA|banned|illegal|legal|controlled[- ]substance|WADA|doping|grey[- ]market|vendors?|retail|marketed|marketing|labell?ed|sold|purchase|buy)\b|prescription(?:-class| drug)/i;
    for (const e of CTL) {
      const text = [
        e.summary,
        e.mechanism,
        ...e.effects,
        ...e.risks,
        ...(e.aka ?? []),
        ...(e.doses ?? []).flatMap((d) => [d.amount, d.context]),
      ].join(' | ');
      expect(bad.test(text), `${e.id}: ${text}`).toBe(false);
    }
  });

  it('only lists doses that come with an amount', () => {
    for (const e of CTL) {
      for (const d of e.doses ?? []) expect(d.amount).toMatch(/\d/);
    }
    expect(CTL.filter((e) => e.doses).length).toBeGreaterThan(30);
  });

  it('gives unidentified formulas the lowest tier and an unknown rating', () => {
    const mystery = CTL.filter((e) => e.aisle === 'Mystery Labels');
    expect(mystery.length).toBeGreaterThan(5);
    for (const e of mystery) {
      expect(e.evidence).toBe('D');
      expect(e.toxicity).toBe('unknown');
    }
  });

  it('keeps every entry searchable by the names it was sold under', () => {
    const caffeine = CTL.find((e) => e.id === 'caffeine');
    expect(caffeine?.aka).toContain('Infinergy');
  });
});

describe('evidenceTier', () => {
  it.each([
    ['established human', 'A'],
    ['human trials', 'A'],
    ['human RCT', 'A'],
    ['human RCT low certainty', 'B'],
    ['nutrient', 'A'],
    ['limited human', 'B'],
    ['preclinical', 'B'],
    ['in vitro / animal', 'B'],
    ['limited human / preclinical / anecdotal', 'B'],
    ['historical pharmacology / no modern human trials', 'C'],
    ['traditional/preclinical', 'B'],
    ['ethnobotanical / unestablished', 'C'],
    ['unestablished', 'D'],
    ['unidentified', 'D'],
    ['human metabolic / CNS unestablished', 'B'],
    ['lithium established / salt unproven', 'B'],
    ['limited parent / variant unestablished', 'D'],
  ])('%s is %s', (level, tier) => {
    expect(evidenceTier(level)).toBe(tier);
  });

  it('puts unverified placeholders at D whatever they claim', () => {
    expect(evidenceTier('established human', true)).toBe('D');
  });
});

describe('toxicityOf', () => {
  it('rates by what the cautions say', () => {
    expect(toxicityOf('Serious cardiovascular toxicity.', 'limited human', 'B')).toBe('high');
    expect(toxicityOf('Opioid-like dependence, respiratory risk.', 'human', 'B')).toBe('high');
    expect(toxicityOf('Anxiety, tachycardia and sleep disruption.', 'established human', 'A')).toBe(
      'moderate',
    );
    expect(toxicityOf('Anecdotal claims on forums are not proof.', 'limited human', 'B')).toBe(
      'low',
    );
  });

  it('is only reassuring about nothing listed when there is human experience', () => {
    expect(toxicityOf('', 'established human', 'A')).toBe('low');
    expect(toxicityOf('', 'animal/preclinical', 'B')).toBe('unknown');
    expect(toxicityOf('', 'unestablished', 'D')).toBe('unknown');
    expect(toxicityOf('Anything', 'x', 'A', true)).toBe('unknown');
  });
});

describe('text helpers', () => {
  it('drops sentences about law and selling', () => {
    expect(clean('Does X. Prescription drug; rare reactions. Sold as Y.')).toBe('Does X.');
  });

  it('splits a name from the names in brackets', () => {
    const n = splitName('DMAA (1,3-dimethylamylamine)');
    expect(n.name).toBe('DMAA');
    expect(n.aka).toEqual(['1,3-dimethylamylamine']);
    expect(
      splitName('Vitamins: A, B1, B2, B3 (niacin / niacinamide), B5, B6, B7, B9 (folic acid)').name,
    ).toBe('Vitamins');
  });

  it('finds species names', () => {
    expect(latinOf('Amla (Phyllanthus emblica)')).toBe('Phyllanthus emblica');
    expect(latinOf('Alpinia galanga (EnXtra)')).toBe('Alpinia galanga');
    expect(latinOf('Black tea')).toBeUndefined();
    expect(latinOf('Bitter orange')).toBeUndefined();
  });

  it('turns an effects sentence into tags', () => {
    expect(effectTags('Alertness, reduced sleepiness and insomnia; tolerance possible.')).toEqual([
      'alertness',
      'reduced sleepiness',
      'insomnia',
      'tolerance possible',
    ]);
  });

  it('keeps an amount only when there is one', () => {
    expect(
      doseOf('Placebo trial: 0.25, 0.5 or 1 mg daily for 24 weeks.', 'reported research exposure')
        ?.amount,
    ).toBe('0.25, 0.5 or 1 mg');
    expect(doseOf('No validated dose.', 'reported research exposure')).toBeUndefined();
    expect(doseOf('Typically 100 mg.', 'not established / non-comparable')).toBeUndefined();
  });
});
