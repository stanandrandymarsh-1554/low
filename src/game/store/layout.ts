import type { Box } from '../../engine/collision';
import { ALL_AISLE, buildAisles } from '../aisles';
import type { Entry } from '../data/types';
import { buildProps, propBox, type PropSpec } from './props';
import { SHELF, STORE, ITEM } from './scale';

const ROWS = SHELF.rowBottoms.length;
const BAY_CAPACITY = ROWS * SHELF.maxCols;

/** One figure standing on a shelf. `x/y/z` is the centre of the box. */
export interface Slot {
  entry: Entry;
  aisle: string;
  x: number;
  y: number;
  z: number;
  /** 0 faces +z (toward the door), PI faces -z. */
  yaw: number;
}

/** A section of double-sided shelving. */
export interface Gondola {
  x: number;
  z: number;
  length: number;
  depth: number;
}

/** The stretch of shelf front that holds one aisle's figures. */
export interface AisleSpan {
  aisle: string;
  x0: number;
  x1: number;
  /** z of the face the figures stand on. */
  zFace: number;
  yaw: number;
}

export interface Counter {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

export interface PosterSpot {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

/** A floor rectangle. */
export interface Area {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Layout {
  room: Area & { height: number };
  gondolas: Gondola[];
  slots: Slot[];
  spans: AisleSpan[];
  /** The rectangle that the shelving fills. Everything beside it is for the lounge and snacks. */
  field: Area;
  counter: Counter;
  /** The pen behind the counter where the clerk stands; shoppers can't enter it. */
  staff: Area;
  /** Where the clerk stands, behind the counter. */
  clerk: { x: number; z: number };
  /** The search computer, sitting on the counter and facing the customer (+z). */
  terminal: { x: number; y: number; z: number };
  door: { x: number; z: number; w: number };
  posterSpots: PosterSpot[];
  /** Furniture and accessories (see props.ts); the ones you can't walk over are in `colliders`. */
  props: PropSpec[];
  /** Everything the player can't walk through, including the walls. */
  colliders: Box[];
  spawn: { x: number; z: number; yaw: number };
}

function chunks<T>(list: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function bayLength(count: number): number {
  const cols = Math.ceil(count / ROWS);
  return Math.max(SHELF.minLength, cols * SHELF.colPitch + 2 * SHELF.endMargin);
}

type Aisle = ReturnType<typeof buildAisles>[number];

/** Two aisles back to back on one run of shelving, split into bays when they are long. */
interface Unit {
  sides: readonly [Aisle | undefined, Aisle | undefined]; // [faces +z, faces -z]
  bays: Entry[][][];
  lengths: number[];
  total: number;
}

function makeUnit(front: Aisle | undefined, back: Aisle | undefined): Unit {
  const sides = [front, back] as const;
  const bays = sides.map((a) => (a ? chunks(a.entries, BAY_CAPACITY) : []));
  const count = Math.max(bays[0]?.length ?? 0, bays[1]?.length ?? 0);
  const lengths = Array.from({ length: count }, (_, s) =>
    Math.max(bayLength(bays[0]?.[s]?.length ?? 0), bayLength(bays[1]?.[s]?.length ?? 0)),
  );
  return { sides, bays, lengths, total: lengths.reduce((a, b) => a + b, 0) };
}

/**
 * Lays the catalogue out as a store. Aisles are paired back to back on double-sided shelving;
 * pairs stand side by side in rows across the middle (the first aisles nearest the door), with a
 * lounge to the left, a snack corner to the right, and the counter and door at the front.
 * An aisle with many figures gets several bays in a row, so the store grows with the catalogue.
 */
export function buildLayout(entries: readonly Entry[]): Layout {
  const aisles = buildAisles(entries).filter((a) => a.name !== ALL_AISLE && a.entries.length > 0);
  const depth = SHELF.depth;

  const units: Unit[] = [];
  for (let i = 0; i < aisles.length; i += 2) units.push(makeUnit(aisles[i], aisles[i + 1]));

  // Pack units into rows no wider than the shelving field (a long unit gets a row to itself).
  const rows: Unit[][] = [];
  let used = 0;
  for (const u of units) {
    const last = rows[rows.length - 1];
    if (last && used + STORE.unitGap + u.total <= STORE.fieldWidth) {
      last.push(u);
      used += STORE.unitGap + u.total;
    } else {
      rows.push([u]);
      used = u.total;
    }
  }
  const rowWidth = (row: Unit[]) =>
    row.reduce((a, u) => a + u.total, 0) + STORE.unitGap * Math.max(0, row.length - 1);
  const widest = Math.max(0, ...rows.map(rowWidth));

  const gondolas: Gondola[] = [];
  const slots: Slot[] = [];
  const spans: AisleSpan[] = [];
  const colliders: Box[] = [];

  // Row 0 holds the first aisles (A-Z) and is nearest the door; later ones lie further back.
  const laneZ = (r: number) =>
    STORE.backLane + depth / 2 + (rows.length - 1 - r) * (depth + STORE.aisleWidth);

  rows.forEach((row, r) => {
    const zc = laneZ(r);
    let sx = -rowWidth(row) / 2;
    for (const unit of row) {
      const starts: number[] = [];
      unit.lengths.forEach((len, s) => {
        starts.push(sx);
        gondolas.push({ x: sx + len / 2, z: zc, length: len, depth });
        colliders.push({ minX: sx, maxX: sx + len, minZ: zc - depth / 2, maxZ: zc + depth / 2 });

        unit.sides.forEach((aisle, side) => {
          const bay = unit.bays[side]?.[s];
          if (!aisle || !bay) return;
          const front = side === 0;
          const cols = Math.ceil(bay.length / ROWS);
          const firstU = len / 2 - (cols * SHELF.colPitch) / 2 + SHELF.colPitch / 2;
          bay.forEach((entry, i) => {
            // Fill top to bottom, then along: the first figure is top-left as the shopper sees it.
            const col = Math.floor(i / ROWS);
            const row = ROWS - 1 - (i % ROWS);
            const u = firstU + col * SHELF.colPitch;
            slots.push({
              entry,
              aisle: aisle.name,
              // Seen from the back side the shopper faces +z, so left-to-right runs toward -x.
              x: front ? sx + u : sx + len - u,
              y: (SHELF.rowBottoms[row] ?? 0) + ITEM.h / 2,
              z: zc + (front ? 1 : -1) * SHELF.itemOffset,
              yaw: front ? 0 : Math.PI,
            });
          });
        });
        sx += len;
      });

      unit.sides.forEach((aisle, side) => {
        const n = unit.bays[side]?.length ?? 0;
        if (!aisle || n === 0) return;
        const end = (starts[n - 1] ?? 0) + (unit.lengths[n - 1] ?? 0);
        spans.push({
          aisle: aisle.name,
          x0: starts[0] ?? 0,
          x1: end,
          zFace: zc + (side === 0 ? 1 : -1) * (depth / 2),
          yaw: side === 0 ? 0 : Math.PI,
        });
      });
      sx += STORE.unitGap;
    }
  });

  const width = Math.max(STORE.minWidth, widest + 2 * STORE.sideZone);
  const lastZ = rows.length > 0 ? laneZ(0) + depth / 2 : STORE.backLane;
  const firstZ = rows.length > 0 ? laneZ(rows.length - 1) - depth / 2 : STORE.backLane;
  const room = {
    minX: -width / 2,
    maxX: width / 2,
    minZ: 0,
    maxZ: lastZ + STORE.frontLane,
    height: STORE.ceiling,
  };
  const field: Area = {
    minX: -widest / 2,
    maxX: widest / 2,
    minZ: firstZ,
    maxZ: lastZ,
  };

  // The counter sits in the front right corner, with a pen behind it for the clerk.
  const counter: Counter = { w: 2.6, d: 0.75, h: 1.05, x: room.maxX - 2.2, z: room.maxZ - 2.9 };
  const staff: Area = {
    minX: counter.x - counter.w / 2 + 0.2,
    maxX: counter.x + counter.w / 2,
    minZ: counter.z - counter.d / 2 - 1.5,
    maxZ: counter.z - counter.d / 2,
  };
  colliders.push(
    // Front of the counter, the half-wall at its left end, and the shelf unit at the back.
    {
      minX: counter.x - counter.w / 2,
      maxX: counter.x + counter.w / 2 + 0.2,
      minZ: counter.z - counter.d / 2,
      maxZ: counter.z + counter.d / 2,
    },
    { minX: counter.x + counter.w / 2, maxX: room.maxX, minZ: staff.minZ, maxZ: counter.z + 0.4 },
    { minX: staff.minX - 0.2, maxX: staff.minX, minZ: staff.minZ, maxZ: staff.maxZ },
    { minX: staff.minX - 0.2, maxX: room.maxX, minZ: staff.minZ - 0.45, maxZ: staff.minZ },
  );

  const T = 2;
  colliders.push(
    { minX: room.minX - T, maxX: room.minX, minZ: room.minZ - T, maxZ: room.maxZ + T },
    { minX: room.maxX, maxX: room.maxX + T, minZ: room.minZ - T, maxZ: room.maxZ + T },
    { minX: room.minX - T, maxX: room.maxX + T, minZ: room.minZ - T, maxZ: room.minZ },
    { minX: room.minX - T, maxX: room.maxX + T, minZ: room.maxZ, maxZ: room.maxZ + T },
  );

  const posterSpots: PosterSpot[] = [];
  for (let z = 2.2; z < room.maxZ - 3; z += 2.4) {
    posterSpots.push({ x: room.minX + 0.02, y: 1.75, z, yaw: Math.PI / 2 });
    posterSpots.push({ x: room.maxX - 0.02, y: 1.75, z, yaw: -Math.PI / 2 });
  }

  const layout: Layout = {
    room,
    gondolas,
    slots,
    spans,
    field,
    counter,
    staff,
    clerk: { x: counter.x - 0.15, z: counter.z - 0.95 },
    terminal: { x: counter.x - 0.85, y: counter.h, z: counter.z - 0.05 },
    door: { x: 0, z: room.maxZ, w: 1.8 },
    posterSpots,
    props: [],
    colliders,
    spawn: { x: 0, z: room.maxZ - 1.4, yaw: 0 },
  };
  layout.props = buildProps(layout);
  for (const p of layout.props) {
    const box = propBox(p);
    if (box) colliders.push(box);
  }
  return layout;
}

/**
 * The aisle whose shelf the player is standing in front of, or null if they aren't near one.
 */
export function nearestAisle(layout: Layout, x: number, z: number, reach = 2.4): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const s of layout.spans) {
    // How far out from the shelf face (positive = on the aisle side).
    const out = (s.yaw === 0 ? 1 : -1) * (z - s.zFace);
    if (out < -0.05 || out > reach) continue;
    const along = x < s.x0 ? s.x0 - x : x > s.x1 ? x - s.x1 : 0;
    const dist = Math.hypot(along, Math.max(0, out));
    if (dist <= reach && dist < bestDist) {
      best = s.aisle;
      bestDist = dist;
    }
  }
  return best;
}
