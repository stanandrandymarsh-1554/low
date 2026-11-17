import type { Box } from '../../engine/collision';
import { ALL_AISLE, buildAisles } from '../aisles';
import type { Entry } from '../data/types';
import { SHELF, STORE, TAPE } from './scale';

const ROWS = SHELF.rowBottoms.length;
const BAY_CAPACITY = ROWS * SHELF.maxCols;

/** One tape standing on a shelf. `x/y/z` is the centre of the box. */
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

/** The stretch of shelf front that holds one aisle's tapes. */
export interface AisleSpan {
  aisle: string;
  x0: number;
  x1: number;
  /** z of the face the tapes stand on. */
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

export interface Layout {
  room: { minX: number; maxX: number; minZ: number; maxZ: number; height: number };
  gondolas: Gondola[];
  slots: Slot[];
  spans: AisleSpan[];
  counter: Counter;
  /** The search computer, sitting on the counter and facing the customer (+z). */
  terminal: { x: number; y: number; z: number };
  door: { x: number; z: number; w: number };
  posterSpots: PosterSpot[];
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

/**
 * Lays the catalogue out as a store: aisles are paired back to back on double-sided shelving,
 * lanes of shelving run left to right, and the counter and door sit at the front.
 * An aisle with many tapes gets several bays in a row, so the store grows with the catalogue.
 */
export function buildLayout(entries: readonly Entry[]): Layout {
  const aisles = buildAisles(entries).filter((a) => a.name !== ALL_AISLE && a.entries.length > 0);
  const lanes = Math.ceil(aisles.length / 2);
  const depth = SHELF.depth;

  const gondolas: Gondola[] = [];
  const slots: Slot[] = [];
  const spans: AisleSpan[] = [];
  const colliders: Box[] = [];
  let widest = 0;

  // Lane 0 holds the first aisles (A-Z) and is nearest the door; later ones lie further back.
  const laneZ = (r: number) =>
    STORE.backLane + depth / 2 + (lanes - 1 - r) * (depth + STORE.aisleWidth);

  for (let r = 0; r < lanes; r++) {
    const zc = laneZ(r);
    const sides = [aisles[2 * r], aisles[2 * r + 1]] as const; // [faces +z, faces -z]
    const bays = sides.map((a) => (a ? chunks(a.entries, BAY_CAPACITY) : []));
    const count = Math.max(bays[0]?.length ?? 0, bays[1]?.length ?? 0);
    const lengths = Array.from({ length: count }, (_, s) =>
      Math.max(bayLength(bays[0]?.[s]?.length ?? 0), bayLength(bays[1]?.[s]?.length ?? 0)),
    );
    const total = lengths.reduce((a, b) => a + b, 0);
    widest = Math.max(widest, total);

    let sx = -total / 2;
    const starts: number[] = [];
    lengths.forEach((len, s) => {
      starts.push(sx);
      gondolas.push({ x: sx + len / 2, z: zc, length: len, depth });
      colliders.push({ minX: sx, maxX: sx + len, minZ: zc - depth / 2, maxZ: zc + depth / 2 });

      sides.forEach((aisle, side) => {
        const bay = bays[side]?.[s];
        if (!aisle || !bay) return;
        const front = side === 0;
        const cols = Math.ceil(bay.length / ROWS);
        const firstU = len / 2 - (cols * SHELF.colPitch) / 2 + SHELF.colPitch / 2;
        bay.forEach((entry, i) => {
          // Fill top to bottom, then along: the first tape is top-left as the shopper sees it.
          const col = Math.floor(i / ROWS);
          const row = ROWS - 1 - (i % ROWS);
          const u = firstU + col * SHELF.colPitch;
          slots.push({
            entry,
            aisle: aisle.name,
            // Seen from the back side the shopper faces +z, so left-to-right runs toward -x.
            x: front ? sx + u : sx + len - u,
            y: (SHELF.rowBottoms[row] ?? 0) + TAPE.h / 2,
            z: zc + (front ? 1 : -1) * SHELF.tapeOffset,
            yaw: front ? 0 : Math.PI,
          });
        });
      });
      sx += len;
    });

    sides.forEach((aisle, side) => {
      const n = bays[side]?.length ?? 0;
      if (!aisle || n === 0) return;
      const end = (starts[n - 1] ?? 0) + (lengths[n - 1] ?? 0);
      spans.push({
        aisle: aisle.name,
        x0: starts[0] ?? 0,
        x1: end,
        zFace: zc + (side === 0 ? 1 : -1) * (depth / 2),
        yaw: side === 0 ? 0 : Math.PI,
      });
    });
  }

  const width = Math.max(STORE.minWidth, widest + 2 * STORE.sideLane);
  const lastZ = lanes > 0 ? laneZ(0) + depth / 2 : STORE.backLane;
  const room = {
    minX: -width / 2,
    maxX: width / 2,
    minZ: 0,
    maxZ: lastZ + STORE.frontLane,
    height: STORE.ceiling,
  };

  const counter: Counter = { w: 2.6, d: 0.75, h: 1.05, x: room.maxX - 2.2, z: room.maxZ - 2.9 };
  colliders.push({
    minX: counter.x - counter.w / 2,
    maxX: counter.x + counter.w / 2,
    minZ: counter.z - counter.d / 2,
    maxZ: counter.z + counter.d / 2,
  });

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

  return {
    room,
    gondolas,
    slots,
    spans,
    counter,
    terminal: { x: counter.x - 0.85, y: counter.h, z: counter.z - 0.05 },
    door: { x: 0, z: room.maxZ, w: 1.8 },
    posterSpots,
    colliders,
    spawn: { x: 0, z: room.maxZ - 1.4, yaw: 0 },
  };
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
