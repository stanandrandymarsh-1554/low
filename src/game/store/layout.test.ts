import { describe, expect, it } from 'vitest';
import { circleOverlapsBox } from '../../engine/collision';
import { CATALOGUE } from '../data';
import type { Entry } from '../data/types';
import { buildLayout, nearestAisle, type Layout } from './layout';
import { PLAYER_RADIUS, SHELF, ITEM } from './scale';

/** A big, lopsided catalogue: one huge aisle, some small ones. */
function bigCatalogue(): Entry[] {
  const base = CATALOGUE[0];
  if (!base) throw new Error('need an entry');
  const sizes: Record<string, number> = { Huge: 400, Mid: 30, Small: 5, Tiny: 1, Other: 14 };
  return Object.entries(sizes).flatMap(([aisle, n]) =>
    Array.from({ length: n }, (_, i) => ({
      ...base,
      id: `${aisle}-${i}`.toLowerCase(),
      name: `${aisle} ${i}`,
      aisle,
    })),
  );
}

const layouts: [string, Entry[]][] = [
  ['the real catalogue', [...CATALOGUE]],
  ['a big catalogue', bigCatalogue()],
  ['a single entry', CATALOGUE.slice(0, 1)],
  ['nothing', []],
];

describe.each(layouts)('buildLayout with %s', (_name, entries) => {
  const layout = buildLayout(entries);

  it('places every entry on a shelf exactly once', () => {
    expect(layout.slots.map((s) => s.entry.id).sort()).toEqual(entries.map((e) => e.id).sort());
  });

  it('keeps figures on their gondola and within the room', () => {
    const { room } = layout;
    for (const s of layout.slots) {
      const g = layout.gondolas.find(
        (g) =>
          Math.abs(s.z - g.z) < g.depth / 2 &&
          s.x >= g.x - g.length / 2 &&
          s.x <= g.x + g.length / 2,
      );
      expect(g, `${s.entry.id} is on a gondola`).toBeDefined();
      expect(s.x).toBeGreaterThan(room.minX);
      expect(s.x).toBeLessThan(room.maxX);
      expect(s.y - ITEM.h / 2).toBeGreaterThanOrEqual(SHELF.rowBottoms[0] ?? 0);
      expect(s.y + ITEM.h / 2).toBeLessThanOrEqual(SHELF.height);
    }
  });

  it('never overlaps two figures', () => {
    const sorted = [...layout.slots].sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);
    for (let i = 1; i < sorted.length; i++) {
      const a = sorted[i - 1];
      const b = sorted[i];
      if (a && b && a.z === b.z && a.y === b.y) expect(b.x - a.x).toBeGreaterThanOrEqual(ITEM.w);
    }
  });

  it('leaves room to walk between shelves and puts the spawn in the open', () => {
    for (const g of layout.gondolas) {
      for (const h of layout.gondolas) {
        const gap = Math.abs(g.z - h.z) - g.depth;
        if (g !== h && g.z !== h.z) expect(gap).toBeGreaterThanOrEqual(1.5);
      }
    }
    const { spawn, room } = layout;
    expect(spawn.x).toBeGreaterThan(room.minX);
    expect(spawn.z).toBeLessThan(room.maxZ);
    for (const box of layout.colliders) {
      expect(circleOverlapsBox(spawn.x, spawn.z, PLAYER_RADIUS, box)).toBe(false);
    }
  });
});

describe('rows of shelving', () => {
  it('keep a walkway between neighbouring units and stay inside the room', () => {
    for (const entries of [CATALOGUE, bigCatalogue()]) {
      const l = buildLayout(entries);
      const sorted = [...l.gondolas].sort((a, b) => a.z - b.z || a.x - b.x);
      for (let i = 1; i < sorted.length; i++) {
        const a = sorted[i - 1];
        const b = sorted[i];
        if (!a || !b || a.z !== b.z) continue;
        const gap = b.x - b.length / 2 - (a.x + a.length / 2);
        // Bays of one aisle touch; separate units have a walkway between them.
        expect(gap < 0.01 || gap >= 1.2, `gap ${gap}`).toBe(true);
      }
      for (const g of l.gondolas) {
        expect(g.x - g.length / 2).toBeGreaterThan(l.room.minX + 3);
        expect(g.x + g.length / 2).toBeLessThan(l.room.maxX - 3);
      }
    }
  });

  it('fills the middle of the store with several units per row', () => {
    const l = buildLayout(CATALOGUE);
    const rows = new Set(l.gondolas.map((g) => g.z.toFixed(2)));
    expect(l.gondolas.length).toBeGreaterThan(rows.size);
  });
});

describe('buildLayout scaling', () => {
  it('grows the store as aisles and figures are added', () => {
    const small = buildLayout(CATALOGUE.slice(0, 2));
    const real = buildLayout(CATALOGUE);
    const big = buildLayout(bigCatalogue());
    const depth = (l: Layout) => l.room.maxZ - l.room.minZ;
    expect(depth(real)).toBeGreaterThan(depth(small));
    expect(big.room.maxX - big.room.minX).toBeGreaterThan(real.room.maxX - real.room.minX);
  });

  it('splits a very large aisle into several bays', () => {
    const big = buildLayout(bigCatalogue());
    const huge = big.spans.find((s) => s.aisle === 'Huge');
    expect(huge).toBeDefined();
    expect((huge?.x1 ?? 0) - (huge?.x0 ?? 0)).toBeGreaterThan(5);
  });

  it('reads left to right as the shopper sees it, on both sides of the shelf', () => {
    const big = buildLayout(bigCatalogue());
    const first = (aisle: string) =>
      big.slots
        .filter((s) => s.aisle === aisle)
        .sort((a, b) => a.entry.name.localeCompare(b.entry.name))[0];
    const aisles = [...new Set(big.slots.map((s) => s.aisle))];
    for (const name of aisles) {
      const span = big.spans.find((s) => s.aisle === name);
      const slot = first(name);
      if (!span || !slot) continue;
      // The first title sits at the shopper's left end of the span.
      const nearLeft = span.yaw === 0 ? slot.x - span.x0 : span.x1 - slot.x;
      expect(nearLeft).toBeLessThan(2);
    }
  });
});

describe('nearestAisle', () => {
  const layout = buildLayout(CATALOGUE);

  it('names the aisle you are standing in front of', () => {
    for (const span of layout.spans) {
      const x = (span.x0 + span.x1) / 2;
      const z = span.zFace + (span.yaw === 0 ? 1 : -1) * 0.9;
      expect(nearestAisle(layout, x, z)).toBe(span.aisle);
    }
  });

  it('returns null away from the shelves', () => {
    expect(nearestAisle(layout, layout.spawn.x, layout.spawn.z)).toBeNull();
  });
});
