import { describe, expect, it } from 'vitest';
import { BOTANICALS } from '../data/botanicals';
import { SYNTHETICS } from '../data/synthetics';
import { FORMS } from './forms';
import { GRID, GROUND } from './grid';
import { LOOKS } from './looks';
import { buildModel, formFor } from './model';

const ALL = [...BOTANICALS, ...SYNTHETICS];

describe('voxel models', () => {
  it('every catalogue entry has a hand-picked look', () => {
    const missing = ALL.filter((e) => !LOOKS[e.id]).map((e) => e.id);
    expect(missing).toEqual([]);
  });

  it('has no looks for entries that do not exist', () => {
    const ids = new Set(ALL.map((e) => e.id));
    expect(Object.keys(LOOKS).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('draws plants as plants and lab-made things as compounds', () => {
    const plantForms = new Set(['mushroom', 'shrooms', 'cactus', 'leaf', 'sprig', 'root']);
    const labForms = new Set(['crystals', 'powder', 'pills', 'capsule', 'vial', 'molecule']);
    for (const e of ALL) {
      if (plantForms.has(formFor(e))) expect(e.kind).toBe('botanical');
      if (labForms.has(formFor(e))) expect(e.kind).toBe('synthetic');
    }
  });

  it('gives every form a visible sculpture that stays on its plinth', () => {
    for (const e of ALL) {
      const g = buildModel(e);
      let above = 0;
      let top = 0;
      g.each((_x, y) => {
        if (y >= GROUND) above++;
        top = Math.max(top, y);
      });
      expect(above, e.id).toBeGreaterThan(25);
      expect(top, e.id).toBeLessThan(GRID.h);
    }
  });

  it('draws each entry the same way every time', () => {
    for (const e of ALL.slice(0, 20)) {
      expect(Array.from(buildModel(e).cells)).toEqual(Array.from(buildModel(e).cells));
    }
  });

  it('can draw every form', () => {
    for (const form of Object.keys(FORMS)) {
      const entry = { ...(ALL[0] as (typeof ALL)[number]), id: `test-${form}` };
      LOOKS[entry.id] = [form as keyof typeof FORMS];
      expect(buildModel(entry).count(), form).toBeGreaterThan(50);
      delete LOOKS[entry.id];
    }
  });
});
