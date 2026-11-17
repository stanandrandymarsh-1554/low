import type { Box } from '../../engine/collision';
import type { Layout } from './layout';

/** Furniture and shop accessories that fill the floor around the shelving. */
export type PropKind =
  | 'sofa'
  | 'armchair'
  | 'coffeeTable'
  | 'sideTable'
  | 'tvStand'
  | 'floorLamp'
  | 'plant'
  | 'beanBag'
  | 'rug'
  | 'cooler'
  | 'popcorn'
  | 'candyRack'
  | 'spinner'
  | 'standee'
  | 'returnBox'
  | 'teaShelf'
  | 'terrarium'
  | 'planterBench'
  | 'bin';

export interface PropSpec {
  kind: PropKind;
  x: number;
  z: number;
  /** 0 faces +z (toward the door), PI/2 faces +x, PI faces -z, -PI/2 faces -x. */
  yaw: number;
  /** A colour variation for the builder (an index into its own list). */
  variant?: number;
  /** Set on standees: which catalogue entry its poster shows. */
  entryIndex?: number;
}

interface Footprint {
  /** Width across the front, and depth front to back, in metres. */
  w: number;
  d: number;
  /** Does it block the player? (Rugs don't.) */
  solid: boolean;
  /** Can a shopper stop in front of it to browse? */
  browse?: boolean;
}

export const FOOTPRINT: Record<PropKind, Footprint> = {
  sofa: { w: 2.1, d: 0.95, solid: true },
  armchair: { w: 0.95, d: 0.9, solid: true },
  coffeeTable: { w: 1.2, d: 0.65, solid: true },
  sideTable: { w: 0.5, d: 0.5, solid: true },
  tvStand: { w: 1.3, d: 0.6, solid: true },
  floorLamp: { w: 0.35, d: 0.35, solid: true },
  plant: { w: 0.6, d: 0.6, solid: true },
  beanBag: { w: 0.9, d: 0.9, solid: true },
  rug: { w: 3.6, d: 4.4, solid: false },
  cooler: { w: 0.85, d: 0.75, solid: true, browse: true },
  popcorn: { w: 0.9, d: 0.7, solid: true, browse: true },
  candyRack: { w: 0.9, d: 0.45, solid: true, browse: true },
  spinner: { w: 0.5, d: 0.5, solid: true, browse: true },
  standee: { w: 0.8, d: 0.3, solid: true, browse: true },
  returnBox: { w: 0.55, d: 0.5, solid: true },
  teaShelf: { w: 2.2, d: 0.4, solid: true, browse: true },
  terrarium: { w: 0.9, d: 0.6, solid: true, browse: true },
  planterBench: { w: 5, d: 0.5, solid: true },
  bin: { w: 0.4, d: 0.4, solid: true },
};

/** Is the prop turned a quarter turn (so its width runs along z)? */
function turned(yaw: number): boolean {
  return Math.abs(Math.sin(yaw)) > 0.7;
}

/** The floor box a prop blocks, or null if you can walk over it. */
export function propBox(p: PropSpec): Box | null {
  const f = FOOTPRINT[p.kind];
  if (!f.solid) return null;
  const hw = (turned(p.yaw) ? f.d : f.w) / 2;
  const hd = (turned(p.yaw) ? f.w : f.d) / 2;
  return { minX: p.x - hw, maxX: p.x + hw, minZ: p.z - hd, maxZ: p.z + hd };
}

/** Where a shopper stands to browse a prop, and which way they face (toward it). */
export function browseSpot(p: PropSpec): { x: number; z: number; yaw: number } | null {
  const f = FOOTPRINT[p.kind];
  if (!f.browse) return null;
  const out = f.d / 2 + 0.6;
  return {
    x: p.x + Math.sin(p.yaw) * out,
    z: p.z + Math.cos(p.yaw) * out,
    yaw: p.yaw + Math.PI,
  };
}

/** Somewhere to sit: the seat's position, and the way a sitter faces. */
export interface Seat {
  x: number;
  z: number;
  yaw: number;
}

export function seatsOf(p: PropSpec): Seat[] {
  const at = (side: number, fwd: number): Seat => ({
    x: p.x + Math.cos(p.yaw) * side + Math.sin(p.yaw) * fwd,
    z: p.z - Math.sin(p.yaw) * side + Math.cos(p.yaw) * fwd,
    yaw: p.yaw,
  });
  if (p.kind === 'sofa') return [at(-0.5, 0.05), at(0.5, 0.05)];
  if (p.kind === 'armchair') return [at(0, 0.05)];
  if (p.kind === 'beanBag') return [at(0, 0)];
  return [];
}

/**
 * Places the lounge, the snack corner, the plants and the front-of-shop displays around the
 * shelving. Pure: it only reads the layout, so it can be tested without a browser.
 */
export function buildProps(layout: Layout): PropSpec[] {
  const { room, field, counter, staff, door } = layout;
  const out: PropSpec[] = [];
  const add = (kind: PropKind, x: number, z: number, yaw = 0, extra: Partial<PropSpec> = {}) => {
    out.push({ kind, x, z, yaw, ...extra });
  };
  const H = Math.PI / 2;

  // ── The lounge, on the left ──────────────────────────────────────────────────────────
  const z0 = room.minZ + 1.7;
  const z1 = room.maxZ - 5.0;
  const zc = (z0 + z1) / 2;
  const xl = room.minX;
  if (z1 - z0 >= 4.4) {
    add('rug', xl + 2.05, zc);
    add('tvStand', xl + 0.35, zc, H);
    add('coffeeTable', xl + 1.6, zc, H);
    add('sofa', xl + 3.2, zc, -H, { variant: 0 });
    add('armchair', xl + 1.6, zc - 1.95, 0, { variant: 1 });
    add('armchair', xl + 1.6, zc + 1.95, Math.PI, { variant: 2 });
    add('sideTable', xl + 3.25, zc - 1.6);
    add('sideTable', xl + 3.25, zc + 1.6);
    add('floorLamp', xl + 0.35, z0 - 0.4);
    add('beanBag', xl + 0.75, z1 + 0.2, 0.4, { variant: 0 });
    add('plant', xl + 0.4, z0 + 0.4, 0, { variant: 1 });
  }

  // ── The snack corner, on the right ───────────────────────────────────────────────────
  const xr = room.maxX;
  const r0 = room.minZ + 1.7;
  const r1 = staff.minZ - 0.95;
  let cursor = r0;
  const along = (kind: PropKind, gap = 0.25): void => {
    const len = FOOTPRINT[kind].w;
    if (cursor + len > r1) return;
    add(kind, xr - FOOTPRINT[kind].d / 2 - 0.05, cursor + len / 2, -H);
    cursor += len + gap;
  };
  along('teaShelf');
  along('cooler');
  along('popcorn');
  // Free-standing racks in the open floor between the wall and the shelving.
  const mid = (xr + field.maxX) / 2 + 0.1;
  if (r1 - r0 > 3) {
    add('spinner', mid, r0 + 0.6, 0.3);
    add('candyRack', mid, r0 + 2.6, -H);
    add('terrarium', mid, Math.min(r1 - 0.4, r0 + 4.2), -H);
  }

  // ── Along the back wall ──────────────────────────────────────────────────────────────
  if (field.minZ > 2.3) {
    add('planterBench', 0, 0.35, 0);
    add('plant', xl + 0.5, 0.5, 0, { variant: 2 });
    add('plant', xr - 0.5, 0.5, 0, { variant: 1 });
  }

  // ── The front: standees to greet you, the return box, bins ──────────────────────────
  const fz = room.maxZ;
  add('standee', door.x - 2.6, fz - 3.3, 0, { entryIndex: 0 });
  add('standee', door.x + 2.6, fz - 3.3, 0, { entryIndex: 1 });
  add('returnBox', door.x + 1.55, fz - 0.45, Math.PI);
  add('bin', door.x - 1.45, fz - 0.4);
  add('plant', xl + 0.5, fz - 0.5, 0, { variant: 2 });
  add('bin', counter.x - 1.9, counter.z + 0.9);

  return out;
}
