import { describe, expect, it } from 'vitest';
import { BOTANICALS } from './botanicals';
import { buildCtl, ctlEntryIds } from './ctl';
import { CATALOGUE } from './index';
import { factual, PATCH_TIER } from './patches';
import upgrade from './sources/evidence-upgrade.json';
import { SYNTHETICS } from './synthetics';
import { validateCatalogue } from './validate';

const CORE = [...BOTANICALS, ...SYNTHETICS];
const IDS = ctlEntryIds(CORE);
const get = (row: string) => CATALOGUE.find((e) => e.id === IDS[row]);
const patches = (upgrade as unknown as { patches: { original_id: string }[] }).patches;

describe('the evidence upgrade', () => {
  it('reaches an entry for every patch, and has a tier decided for each', () => {
    expect(patches.length).toBe(32);
    for (const p of patches) {
      expect(IDS[p.original_id], p.original_id).toBeDefined();
      expect(get(p.original_id), p.original_id).toBeDefined();
      expect(PATCH_TIER[p.original_id], p.original_id).toMatch(/^[ABCD]$/);
    }
  });

  it('folds rows that repeat existing entries into those entries', () => {
    expect(IDS['ctl-042']).toBe('modafinil');
    expect(IDS['ctl-213']).toBe('kanna');
    expect(IDS['ctl-214']).toBe('kava');
    expect(IDS['ctl-226']).toBe('magnolia-bark');
    expect(buildCtl(CORE).some((e) => e.id.startsWith('magnolia-officinalis'))).toBe(false);
  });

  it('keeps the catalogue valid and no larger than before', () => {
    expect(validateCatalogue(CATALOGUE)).toEqual([]);
    expect(CATALOGUE.length).toBe(CORE.length + buildCtl(CORE).length);
  });

  it('replaces the mechanism and applies the decided tier', () => {
    const dmaa = get('ctl-002');
    expect(dmaa?.mechanism).toMatch(/300 µM/);
    expect(dmaa?.evidence).toBe('B');
    expect(get('ctl-001')?.evidence).toBe('A');
    expect(get('ctl-005')?.evidence).toBe('D');
    expect(get('ctl-041')?.mechanism).toMatch(/fluorinated modafinil/);
  });

  it('keeps hand-written text on existing entries and adds the new material', () => {
    const before = CORE.find((e) => e.id === 'kava');
    const kava = get('ctl-214');
    expect(kava?.summary).toBe(before?.summary);
    expect(kava?.mechanism).toMatch(/kavalactone/i);
    expect(kava?.doses?.length).toBeGreaterThan(before?.doses?.length ?? 0);
    expect(kava?.evidenceNotes).toContain('Target:');
  });

  it('lists an exposure only where the patch gives an amount', () => {
    expect(get('ctl-074')?.doses?.[0]?.context).toMatch(/203 participants/);
    expect(get('ctl-068')?.doses?.[0]?.amount).toMatch(/µg/);
    expect(get('ctl-003')?.doses).toBeUndefined();
    expect(get('ctl-004')?.doses).toBeUndefined();
  });

  it('leaves out regulator links, editorial instructions and corrections', () => {
    for (const p of patches) {
      const e = get(p.original_id);
      expect(
        e?.sources?.some((s) => /fda\.gov/i.test(s)),
        p.original_id,
      ).toBe(false);
      expect(e?.evidenceNotes ?? '', p.original_id).not.toMatch(
        /(^|[.!?] )(do not|avoid|never)\b|correction|outdated/i,
      );
    }
  });

  it('keeps only the statements of fact from a caveat', () => {
    expect(
      factual(
        'Tiny sample does not show safety. Do not present this as proof. IMPORTANT CORRECTION: old.',
      ),
    ).toBe('Tiny sample does not show safety.');
  });
});
