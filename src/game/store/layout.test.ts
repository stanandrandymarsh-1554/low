import { describe, expect, it } from 'vitest';
import { overlaps } from '../../engine/collision';
import { CATALOGUE } from '../data';
import type { Entry } from '../data/types';
import { buildStoreLayout, FOOT_H, FOOT_W, slotBox, TAPE_H, TAPE_W } from './layout';

function manyEntries(n: number): Entry[] {
  const base = CATALOGUE[0];
  if (!base) throw new Error('need an entry');
  return Array.from({ length: n }, (_, i) => ({
    ...base,
    id: `big-${i}`,
    name: `Big ${i}`,
    aisle: 'Big',
  }));
}

describe('buildStoreLayout', () => {
  const layout = buildStoreLayout(CATALOGUE);

  it('puts every catalogue entry on exactly one shelf', () => {
    const ids = layout.racks.flatMap((r) => r.slots.map((s) => s.entry.id)).sort();
    expect(ids).toEqual(CATALOGUE.map((e) => e.id).sort());
  });

  it('keeps every tape inside its rack, and racks apart from each other', () => {
    for (const rack of layout.racks) {
      for (const slot of rack.slots) {
        const box = slotBox(slot);
        expect(box.x).toBeGreaterThanOrEqual(rack.x);
        expect(box.x + TAPE_W).toBeLessThanOrEqual(rack.x + rack.w);
        expect(box.y).toBeGreaterThanOrEqual(rack.y);
        expect(box.y + TAPE_H).toBeLessThanOrEqual(rack.y + rack.h);
      }
    }
    for (const a of layout.racks) {
      for (const b of layout.racks) {
        if (a !== b) expect(overlaps(a, b)).toBe(false);
      }
    }
  });

  it('fits in the world and leaves the spawn point clear', () => {
    expect(layout.width).toBeGreaterThanOrEqual(960);
    for (const r of layout.racks) {
      expect(r.x + r.w).toBeLessThan(layout.width);
      expect(r.y + r.h).toBeLessThan(layout.height);
    }
    const feet = {
      x: layout.spawn.x - FOOT_W / 2,
      y: layout.spawn.y - FOOT_H,
      w: FOOT_W,
      h: FOOT_H,
    };
    expect(layout.solids.some((s) => overlaps(feet, s))).toBe(false);
  });

  it('keeps the computer on the counter', () => {
    const { counter, computer } = layout;
    expect(computer.x).toBeGreaterThanOrEqual(counter.x);
    expect(computer.x + computer.w).toBeLessThanOrEqual(counter.x + counter.w);
    expect(computer.y + computer.h).toBeLessThanOrEqual(counter.y + 10);
  });

  it('spills big aisles onto extra racks and wraps them into rows', () => {
    const big = buildStoreLayout(manyEntries(60));
    expect(big.racks).toHaveLength(3);
    expect(big.racks.map((r) => r.slots.length)).toEqual([24, 24, 12]);
    expect(big.racks[0]?.name).toBe('Big 1/3');
    const ids = big.racks.flatMap((r) => r.slots.map((s) => s.entry.id));
    expect(new Set(ids).size).toBe(60);
  });

  it('handles an empty catalogue', () => {
    const empty = buildStoreLayout([]);
    expect(empty.racks).toHaveLength(0);
    expect(empty.width).toBeGreaterThanOrEqual(960);
  });
});
