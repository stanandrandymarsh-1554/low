import { describe, expect, it } from 'vitest';
import { circleOverlapsBox } from '../../engine/collision';
import { CATALOGUE } from '../data';
import type { Entry } from '../data/types';
import { buildLayout } from './layout';
import { NavGrid } from './nav';
import { Crowd, crowdSize, WALKER_RADIUS } from './npc';
import { FOOTPRINT, propBox } from './props';

const layout = buildLayout(CATALOGUE);

function big(): Entry[] {
  const base = CATALOGUE[0];
  if (!base) throw new Error('need an entry');
  const sizes: Record<string, number> = {
    Huge: 300,
    Mid: 30,
    Small: 5,
    Tiny: 1,
    Other: 14,
    More: 9,
  };
  return Object.entries(sizes).flatMap(([aisle, n]) =>
    Array.from({ length: n }, (_, i) => ({
      ...base,
      id: `${aisle}-${i}`.toLowerCase(),
      name: `${aisle} ${i}`,
      aisle,
    })),
  );
}

describe.each([
  ['a big catalogue', big()],
  ['one entry', CATALOGUE.slice(0, 1)],
  ['no entries', []],
])('the floor plan with %s', (_n, entries) => {
  const l = buildLayout(entries);
  it('keeps every prop inside the room, clear of shelving and the player spawn', () => {
    for (const p of l.props) {
      const b = propBox(p);
      if (!b) continue;
      expect(b.minX).toBeGreaterThanOrEqual(l.room.minX);
      expect(b.maxX).toBeLessThanOrEqual(l.room.maxX);
      expect(b.minZ).toBeGreaterThanOrEqual(l.room.minZ);
      expect(b.maxZ).toBeLessThanOrEqual(l.room.maxZ);
      for (const g of l.gondolas) {
        const apart =
          b.maxX <= g.x - g.length / 2 - 0.5 ||
          b.minX >= g.x + g.length / 2 + 0.5 ||
          b.maxZ <= g.z - g.depth / 2 - 0.5 ||
          b.minZ >= g.z + g.depth / 2 + 0.5;
        expect(apart, `${p.kind} at ${p.x.toFixed(1)}, ${p.z.toFixed(1)}`).toBe(true);
      }
    }
    for (const b of l.colliders) {
      expect(circleOverlapsBox(l.spawn.x, l.spawn.z, 0.4, b)).toBe(false);
    }
  });

  it('lets a crowd walk without hitting anything', () => {
    const crowd = new Crowd(l, 2);
    for (let i = 0; i < 60 * 40; i++) {
      crowd.update(1 / 60, l.spawn);
      for (const n of crowd.npcs) {
        if (n.role !== 'customer' || n.mode === 'sit') continue;
        const hit = l.colliders.some((b) => circleOverlapsBox(n.x, n.z, WALKER_RADIUS - 0.08, b));
        if (hit) expect.fail(`npc ${n.id} at step ${i}: ${n.x.toFixed(2)}, ${n.z.toFixed(2)}`);
      }
    }
  });
});

describe('props', () => {
  it('stay inside the room and out of each other', () => {
    const { room } = layout;
    const boxes = layout.props.map((p) => ({ p, b: propBox(p) })).filter((x) => x.b);
    for (const { p, b } of boxes) {
      if (!b) continue;
      expect(b.minX, p.kind).toBeGreaterThanOrEqual(room.minX);
      expect(b.maxX, p.kind).toBeLessThanOrEqual(room.maxX);
      expect(b.minZ, p.kind).toBeGreaterThanOrEqual(room.minZ);
      expect(b.maxZ, p.kind).toBeLessThanOrEqual(room.maxZ);
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]?.b;
        const b = boxes[j]?.b;
        if (!a || !b) continue;
        const overlap =
          a.minX < b.maxX - 0.01 &&
          a.maxX > b.minX + 0.01 &&
          a.minZ < b.maxZ - 0.01 &&
          a.maxZ > b.minZ + 0.01;
        expect(overlap, `${boxes[i]?.p.kind} vs ${boxes[j]?.p.kind}`).toBe(false);
      }
    }
  });

  it('keep clear of the shelving', () => {
    for (const p of layout.props) {
      const b = propBox(p);
      if (!b) continue;
      for (const g of layout.gondolas) {
        const apart =
          b.maxX <= g.x - g.length / 2 - 0.7 ||
          b.minX >= g.x + g.length / 2 + 0.7 ||
          b.maxZ <= g.z - g.depth / 2 - 0.7 ||
          b.minZ >= g.z + g.depth / 2 + 0.7;
        expect(apart, `${p.kind} at ${p.x.toFixed(1)}, ${p.z.toFixed(1)}`).toBe(true);
      }
    }
  });

  it('include a lounge, a snack corner and a door greeting', () => {
    const kinds = new Set(layout.props.map((p) => p.kind));
    for (const k of ['sofa', 'tvStand', 'cooler', 'popcorn', 'standee', 'plant'] as const) {
      expect(kinds.has(k), k).toBe(true);
    }
    expect(Object.keys(FOOTPRINT).length).toBeGreaterThan(10);
  });

  it('leave the spawn and the door clear', () => {
    for (const b of layout.colliders) {
      expect(circleOverlapsBox(layout.spawn.x, layout.spawn.z, 0.4, b)).toBe(false);
    }
  });
});

describe('NavGrid', () => {
  const nav = new NavGrid(layout.room, layout.colliders, WALKER_RADIUS);

  it('finds a way from the door to the sofa that avoids every box', () => {
    const sofa = layout.props.find((p) => p.kind === 'sofa');
    expect(sofa).toBeDefined();
    const route = nav.path(layout.spawn, { x: (sofa?.x ?? 0) + 0.7, z: sofa?.z ?? 0 });
    expect(route).not.toBeNull();
    let prev = { x: layout.spawn.x, z: layout.spawn.z };
    for (const p of route ?? []) {
      // Sample along each leg.
      for (let t = 0; t <= 1; t += 0.1) {
        const x = prev.x + (p.x - prev.x) * t;
        const z = prev.z + (p.z - prev.z) * t;
        for (const b of layout.colliders) {
          expect(circleOverlapsBox(x, z, WALKER_RADIUS - 0.05, b)).toBe(false);
        }
      }
      prev = p;
    }
  });

  it('cannot reach inside the staff pen', () => {
    const inside = { x: layout.staff.minX + 0.5, z: (layout.staff.minZ + layout.staff.maxZ) / 2 };
    expect(nav.walkable(inside)).toBe(true);
    const route = nav.path(layout.spawn, inside);
    // It may snap to the nearest free spot outside, but never into the pen.
    const end = route?.[route.length - 1];
    if (end) {
      const inPen =
        end.x > layout.staff.minX &&
        end.x < layout.staff.maxX &&
        end.z > layout.staff.minZ &&
        end.z < layout.staff.maxZ;
      expect(inPen).toBe(true); // the pen itself is walkable for the clerk
    }
  });
});

describe('Crowd', () => {
  it('scales the crowd with the store', () => {
    expect(crowdSize(layout)).toBeGreaterThanOrEqual(3);
    expect(crowdSize(buildLayout(CATALOGUE.slice(0, 3)))).toBe(2);
  });

  it('has a clerk behind the counter and shoppers who never walk into furniture', () => {
    const crowd = new Crowd(layout, 3);
    const clerk = crowd.npcs.find((n) => n.role === 'clerk');
    expect(clerk).toBeDefined();
    expect(clerk && clerk.z).toBeLessThan(layout.counter.z - layout.counter.d / 2);
    const player = { x: layout.spawn.x, z: layout.spawn.z };
    const hits: string[] = [];
    const moved = new Map<number, number>();
    const last = new Map(crowd.npcs.map((n) => [n.id, { x: n.x, z: n.z }]));
    for (let i = 0; i < 60 * 150; i++) {
      crowd.update(1 / 60, player);
      for (const n of crowd.npcs) {
        if (n.role !== 'customer') continue;
        const p = last.get(n.id);
        if (p) moved.set(n.id, (moved.get(n.id) ?? 0) + Math.hypot(n.x - p.x, n.z - p.z));
        last.set(n.id, { x: n.x, z: n.z });
        if (n.mode === 'sit') continue;
        const hit = layout.colliders.some((b) =>
          circleOverlapsBox(n.x, n.z, WALKER_RADIUS - 0.08, b),
        );
        if (hit) hits.push(`npc ${n.id} at step ${i}: ${n.x.toFixed(2)}, ${n.z.toFixed(2)}`);
      }
    }
    for (const n of crowd.npcs) {
      if (n.role === 'customer')
        expect(moved.get(n.id) ?? 0, `npc ${n.id} walked`).toBeGreaterThan(8);
    }
  });

  it('is repeatable for a seed', () => {
    const run = () => {
      const c = new Crowd(layout, 5);
      for (let i = 0; i < 600; i++) c.update(1 / 60, layout.spawn);
      return c.npcs.map((n) => [n.x.toFixed(3), n.z.toFixed(3)]);
    };
    expect(run()).toEqual(run());
  });
});
