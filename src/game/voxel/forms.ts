import { GROUND as G, MID, VoxelGrid } from './grid';

/** The three colours a form is painted with, as palette indices. What each means is per form. */
export interface Pal {
  a: number;
  b: number;
  c: number;
}

export type Draw = (g: VoxelGrid, p: Pal, r: () => number) => void;

export type Form =
  | 'mushroom'
  | 'shrooms'
  | 'cactus'
  | 'button'
  | 'leaf'
  | 'sprig'
  | 'flower'
  | 'lotus'
  | 'trumpet'
  | 'spike'
  | 'root'
  | 'bark'
  | 'pod'
  | 'poppy'
  | 'seeds'
  | 'berries'
  | 'nut'
  | 'vine'
  | 'moss'
  | 'grass'
  | 'cone'
  | 'succulent'
  | 'jar'
  | 'ginkgo'
  | 'cannabis'
  | 'grain'
  | 'crystals'
  | 'powder'
  | 'pills'
  | 'capsule'
  | 'vial'
  | 'bottle'
  | 'canister'
  | 'blotter'
  | 'molecule';

const CX = MID;
const CZ = MID;
const GREEN = '#4f8a3a';
const DEEP_GREEN = '#2f6a2c';

/** A leaf blade standing in the x/y plane: pointed at both ends, with a midrib and veins. */
function blade(
  g: VoxelGrid,
  cx: number,
  y0: number,
  y1: number,
  half: number,
  z: number,
  lean: number,
  a: number,
  b: number,
): void {
  const n = Math.max(1, y1 - y0);
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / n;
    const w = Math.round(half * Math.sin(Math.PI * Math.pow(t, 0.7)));
    const shift = Math.round(lean * t);
    for (let dx = -w; dx <= w; dx++) {
      const vein = dx === 0 || (dx !== 0 && (y + Math.abs(dx) * 2) % 5 === 0);
      g.set(cx + dx + shift, y, z, vein ? b : a);
      g.set(cx + dx + shift, y, z + 1, a);
    }
  }
}

function plinth(g: VoxelGrid): void {
  const dark = g.color('#2a1d14');
  const gold = g.color('#d9a441');
  const wood = g.color('#6b4a2c');
  g.cyl(CX, CZ, 0, 0, 5.7, dark);
  g.cyl(CX, CZ, 1, 1, 5.2, gold);
  g.cyl(CX, CZ, 1, 1, 4.2, wood);
}

/** A mushroom with its stem on the ground at (cx, cz). */
function shroom(
  g: VoxelGrid,
  p: Pal,
  cx: number,
  cz: number,
  h: number,
  capR: number,
  capH: number,
  stemR: number,
): void {
  g.cyl(cx, cz, G, G + h - 1, stemR, p.c);
  g.ball(cx, G + h, cz, capR, capH, capR, p.a, G + h - 1);
}

function grassTufts(g: VoxelGrid, r: () => number): void {
  const green = g.color(GREEN);
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2;
    const d = 3.6 + r() * 1.2;
    const x = CX + Math.cos(a) * d;
    const z = CZ + Math.sin(a) * d;
    g.set(x, G, z, green);
    if (r() < 0.6) g.set(x, G + 1, z, green);
  }
}

// ── plants and fungi ────────────────────────────────────────────────────────────────────

const mushroom: Draw = (g, p, r) => {
  shroom(g, p, CX, CZ, 6, 5, 4.5, 1.7);
  g.speckle(p.a, p.b, 0.3, r);
  grassTufts(g, r);
};

const shrooms: Draw = (g, p, r) => {
  shroom(g, p, 3.5, 4, 5, 2.7, 2.2, 0.9);
  shroom(g, p, 7.5, 6, 7, 3.2, 2.6, 1);
  shroom(g, p, 4.5, 8.5, 3, 2.3, 1.8, 0.9);
  g.speckle(p.c, p.b, 0.18, r);
  g.speckle(p.a, p.b, 0.1, r);
  grassTufts(g, r);
};

const cactus: Draw = (g, p, r) => {
  g.cyl(CX, CZ, G, G + 11, 2.7, p.a);
  g.ball(CX, G + 11, CZ, 2.7, 1.8, 2.7, p.a, G + 11);
  g.line(CX + 2, G + 6, CZ, CX + 5, G + 6, CZ, p.a, 2);
  g.line(CX + 5, G + 6, CZ, CX + 5, G + 10, CZ, p.a, 2);
  g.ball(CX + 5, G + 10.5, CZ, 1.2, 1.4, 1.2, p.a, G + 10);
  // Ribs: darker grooves running up the trunk.
  for (const [dx, dz] of [
    [0, 2.7],
    [2.3, 1.4],
    [-2.3, 1.4],
  ] as const) {
    for (let y = G; y <= G + 10; y++)
      if (g.get(CX + dx, y, CZ + dz)) g.set(CX + dx, y, CZ + dz, p.c);
  }
  g.speckle(p.a, p.b, 0.14, r);
  g.set(CX + 5, G + 12.5, CZ, p.b);
};

const button: Draw = (g, p, r) => {
  g.ball(CX, G + 2, CZ, 4.9, 3, 4.9, p.a, G);
  // Radial ridges, then the pale woolly tuft in the middle.
  for (let k = 0; k < 8; k++) {
    const ang = (k * Math.PI) / 4;
    for (let d = 1.5; d <= 4.5; d += 0.5) {
      const x = Math.round(CX + Math.cos(ang) * d);
      const z = Math.round(CZ + Math.sin(ang) * d);
      const y = g.top(x, z);
      if (y >= 0) g.set(x, y, z, p.c);
    }
  }
  g.ball(CX, G + 5, CZ, 1.8, 1.1, 1.8, p.b, G + 4);
  g.speckle(p.a, p.c, 0.08, r);
};

const leaf: Draw = (g, p, r) => {
  const variant = Math.floor(r() * 3);
  g.line(CX, G, CZ, CX, G + 3, CZ, p.c);
  if (variant === 0) {
    blade(g, CX - 1, G + 2, G + 12, 3, CZ - 2, -2, p.a, p.b);
    blade(g, CX + 1, G + 3, G + 14, 4, CZ, Math.round(r() * 2), p.a, p.b);
  } else if (variant === 1) {
    // One broad leaf, wide at the bottom like a tobacco or lettuce leaf.
    blade(g, CX, G + 2, G + 14, 5, CZ, 0, p.a, p.b);
    g.speckle(p.a, p.b, 0.08, r);
  } else {
    blade(g, CX - 3, G + 3, G + 11, 2, CZ - 1, -2, p.a, p.b);
    blade(g, CX, G + 3, G + 14, 3, CZ, 0, p.a, p.b);
    blade(g, CX + 3, G + 3, G + 11, 2, CZ - 1, 2, p.a, p.b);
  }
};

const sprig: Draw = (g, p, r) => {
  const variant = Math.floor(r() * 3);
  if (variant === 0) {
    g.line(CX, G, CZ, CX, G + 13, CZ, p.c);
    for (let k = 0; k < 6; k++) {
      const y = G + 1 + k * 2;
      const rx = 2.6 - k * 0.2;
      for (const s of [-1, 1]) {
        g.ball(CX + s * (rx - 0.4), y + 1.2, CZ + (k % 2) * 0.8, rx, 1.1, 1.2, p.a);
      }
    }
    g.ball(CX, G + 14, CZ, 1.3, 1.3, 1.3, p.b);
  } else if (variant === 1) {
    // A woody twig with leaf clusters and a few buds.
    g.line(CX - 1, G, CZ, CX + 1, G + 8, CZ, p.c, 2);
    g.line(CX, G + 5, CZ, CX - 4, G + 11, CZ, p.c);
    g.line(CX + 1, G + 7, CZ, CX + 5, G + 12, CZ, p.c);
    for (const [x, y] of [
      [CX - 4, G + 12],
      [CX + 5, G + 13],
      [CX + 1, G + 14],
      [CX - 3, G + 8],
      [CX + 4, G + 9],
    ] as const) {
      g.ball(x, y, CZ, 2, 1.6, 1.6, p.a);
      g.set(x, y + 2, CZ + 1, p.b);
    }
  } else {
    // Whorls of narrow leaves up a stem, with a flower head.
    g.line(CX, G, CZ, CX, G + 11, CZ, p.c);
    for (let k = 0; k < 4; k++) {
      const y = G + 1 + k * 3;
      const w = 4 - k * 0.6;
      g.line(CX, y, CZ, CX - w, y + 2, CZ, p.a, 2);
      g.line(CX, y, CZ, CX + w, y + 2, CZ, p.a, 2);
      g.line(CX, y, CZ, CX, y + 2, CZ + w * 0.8, p.a, 2);
    }
    g.ball(CX, G + 12.5, CZ, 2, 1.8, 2, p.b);
    g.speckle(p.b, p.a, 0.25, r);
  }
};

const flower: Draw = (g, p, r) => {
  g.line(CX, G, CZ, CX, G + 5, CZ, p.c, 1);
  g.ball(CX - 2.5, G + 2, CZ, 2.2, 1, 1.2, p.c);
  g.ball(CX + 2.5, G + 3.5, CZ, 2.2, 1, 1.2, p.c);
  const n = 8;
  const cy = G + 8.5;
  for (let k = 0; k < n; k++) {
    const ang = (k * Math.PI * 2) / n + 0.2;
    g.line(
      CX + Math.cos(ang) * 1.8,
      cy + Math.sin(ang) * 1.8,
      CZ,
      CX + Math.cos(ang) * 4.6,
      cy + Math.sin(ang) * 4.6,
      CZ,
      p.a,
      2,
    );
  }
  g.ball(CX, cy, CZ + 0.5, 1.8, 1.8, 1.4, p.b);
  if (r() < 0.5) g.set(CX, cy, CZ + 2, p.c);
};

const lotus: Draw = (g, p) => {
  g.cyl(CX, CZ, G, G, 5.2, p.c);
  const base = G + 1;
  for (const [ang, len, col, dz] of [
    [-72, 6.5, p.a, -1],
    [72, 6.5, p.a, -1],
    [-45, 8, p.a, 0],
    [45, 8, p.a, 0],
    [-20, 9, p.b, 1],
    [20, 9, p.b, 1],
    [0, 9.5, p.b, 0],
  ] as const) {
    const rad = (ang * Math.PI) / 180;
    g.line(
      CX,
      base,
      CZ + dz,
      CX + Math.sin(rad) * len,
      base + Math.cos(rad) * len,
      CZ + dz,
      col,
      2,
    );
  }
  g.ball(CX, base + 1, CZ, 1.6, 1.2, 1.6, p.c);
};

const trumpet: Draw = (g, p) => {
  g.line(CX - 1, G, CZ, CX, G + 5, CZ, p.c);
  g.frustum(CX, CZ, G + 5, G + 11, 0.8, 3.6, p.a);
  g.frustum(CX, CZ, G + 11, G + 11, 2.5, 2.5, p.b);
  g.ball(CX - 4, G + 3, CZ, 2.2, 1, 1.3, p.c);
  g.ball(CX + 4, G + 5, CZ - 1, 2.2, 1, 1.3, p.c);
  g.ball(CX + 3.5, G + 8, CZ + 1, 1, 1.4, 1, p.a);
};

const spike: Draw = (g, p) => {
  for (const [x, z, h] of [
    [3.5, 5, 11],
    [5.5, 6, 13],
    [7.5, 5, 10],
  ] as const) {
    g.line(x, G, z, x, G + h, z, p.c);
    for (let y = G + h - 6; y <= G + h; y++) {
      const off = y % 2 === 0 ? 1 : 0;
      g.set(x + 1, y, z + off, p.a);
      g.set(x - 1, y, z - off + 1, p.a);
      g.set(x, y, z + 1 - off * 2, p.a);
    }
    g.set(x, G + h + 1, z, p.b);
  }
  for (const s of [-1, 1]) {
    g.line(CX, G, CZ + 1, CX + s * 5, G + 4, CZ + 1, p.c);
    g.line(CX, G, CZ + 2, CX + s * 3.5, G + 6, CZ + 2, p.c);
  }
};

const root: Draw = (g, p, r) => {
  const variant = Math.floor(r() * 3);
  const wob = r() * 6;
  if (variant === 0) {
    for (let i = 0; i <= 10; i++) {
      const y = G + 10 - i;
      const rad = 2.7 * (1 - i / 14) + 0.5;
      g.cyl(CX + Math.sin(i * 0.8 + wob) * 0.9, CZ, y, y, rad, p.a);
    }
    g.cyl(CX, CZ, G + 10, G + 10, 2.4, p.b);
    g.cyl(CX, CZ, G + 10, G + 10, 1.2, p.a);
  } else if (variant === 1) {
    // A forked root.
    g.frustum(CX, CZ, G + 7, G + 10, 2.4, 2.8, p.a);
    g.cyl(CX, CZ, G + 10, G + 10, 2, p.b);
    for (const s of [-1, 1]) g.line(CX + s * 1, G + 7, CZ, CX + s * 3.5, G + 1, CZ, p.a, 3);
    g.line(CX, G + 6, CZ + 1, CX, G + 1, CZ + 1, p.a, 2);
  } else {
    // A knobbly stump lying sideways, the way kava and valerian roots are sold.
    g.line(1.5, G + 3, CZ, 9.5, G + 4, CZ, p.a, 4);
    g.ball(2, G + 3.5, CZ, 2, 2.5, 2.5, p.b, G, G + 6);
    for (const [x, h] of [
      [4, 7],
      [7, 8],
      [9.5, 6],
    ] as const) {
      g.line(x, G + 5, CZ, x + 0.5, G + h, CZ, p.a, 2);
      g.ball(x + 0.5, G + h + 0.5, CZ, 1.3, 1, 1.3, p.b);
    }
  }
  for (const [sx, sy] of [
    [-5, 4],
    [5, 3],
    [-3, 1],
    [4, 6],
  ] as const) {
    g.line(CX, G + 4 + sy / 2, CZ, CX + sx, G + (sy > 3 ? 4 : 0), CZ + (sx > 0 ? 1 : -1), p.c);
  }
  g.speckle(p.a, p.c, 0.12, r);
};

const bark: Draw = (g, p, r) => {
  for (let y = G; y <= G + 11; y++) {
    for (let x = 0; x < 12; x++)
      for (let z = 0; z < 12; z++) {
        const dx = x - CX;
        const dz = z - CZ;
        const d = Math.hypot(dx, dz);
        if (d < 2.4 || d > 3.9) continue;
        const ang = Math.atan2(dz, dx); // +z is the front (pi / 2)
        if (Math.abs(ang - Math.PI / 2) < 0.7) continue; // the open seam
        const top = G + 10 + Math.round(1.5 * Math.sin(ang * 2));
        if (y > top) continue;
        g.set(x, y, z, d < 3.1 ? p.b : p.a);
      }
  }
  g.cyl(9.5, 9, G, G + 3, 1.3, p.a);
  g.cyl(9.5, 9, G + 3, G + 3, 0.7, p.b);
  g.speckle(p.a, p.c, 0.3, r);
};

const pod: Draw = (g, p, r) => {
  const flip = r() < 0.5 ? -1 : 1;
  const at = (x: number) => CX + (x - CX) * flip;
  const P0: [number, number] = [2.5, G + 12.5];
  const P1: [number, number] = [10.5, G + 11];
  const P2: [number, number] = [9, G + 1.5];
  const steps = 26;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t ** 2 * P2[0];
    const y = (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t ** 2 * P2[1];
    const rad = 0.7 + 1.1 * Math.sqrt(Math.sin(Math.PI * t));
    g.ball(at(x), y, CZ, rad, rad, rad * 0.9, p.a);
    if (i % 5 === 2) g.ball(at(x), y, CZ + 1, rad * 0.9, rad * 0.9, 0.9, p.b);
  }
  g.ball(at(2.5), G + 13.5, CZ, 1.2, 1.2, 1.2, p.c);
  g.speckle(p.a, p.c, 0.08, r);
};

const poppy: Draw = (g, p) => {
  g.line(CX, G, CZ, CX, G + 7, CZ, p.c);
  g.line(CX, G + 1, CZ, CX - 4.5, G + 4, CZ, p.c, 2);
  g.line(CX, G + 2, CZ, CX + 4.5, G + 6, CZ, p.c, 2);
  g.ball(CX, G + 9, CZ, 3.2, 3.2, 3.2, p.a);
  // Flat crown with its spokes.
  for (let x = 0; x < 12; x++)
    for (let z = 0; z < 12; z++) {
      const y = g.top(x, z);
      if (y >= G + 11 && Math.hypot(x - CX, z - CZ) <= 2.3) g.set(x, y, z, p.b);
    }
};

const seeds: Draw = (g, p, r) => {
  g.frustum(CX, CZ, G, G + 3, 3.4, 5.1, p.c);
  g.cyl(CX, CZ, G + 1, G + 3, 4.2, 0);
  g.ball(CX, G + 3, CZ, 4.1, 4.4, 4.1, p.a, G + 1);
  g.speckle(p.a, p.b, 0.4, r);
  g.speckle(p.a, p.c, 0.1, r);
};

const berries: Draw = (g, p) => {
  g.line(CX, G, CZ, CX, G + 11, CZ, p.c);
  for (let k = 0; k < 6; k++) {
    const side = k % 2 ? 1 : -1;
    const y = G + 10 - k * 1.5;
    g.line(CX, y + 1, CZ, CX + side * 3, y, CZ, p.c);
    g.ball(CX + side * 3.6, y - 1.3, CZ + ((k % 3) - 1), 1.6, 1.6, 1.6, p.a);
    g.set(CX + side * 3.2, y - 0.3, CZ + ((k % 3) - 1) + 1, p.b);
    g.ball(CX + side * 1.8, y + 1.8, CZ, 1.8, 0.9, 1.1, p.c);
  }
  g.ball(CX, G + 12, CZ, 2.2, 1, 1.2, p.c);
};

const nut: Draw = (g, p, r) => {
  const green = g.color(GREEN);
  blade(g, CX, G + 1, G + 14, 4, CZ - 4, 0, green, g.color('#6db35a'));
  g.ball(CX, G + 4.5, CZ + 1, 4.3, 4.4, 4.3, p.a, G);
  g.each((x, y, z, c) => {
    if (c === p.a && g.exposed(x, y, z) && (x + y * 2 + z) % 4 === 0) g.set(x, y, z, p.b);
  });
  g.speckle(p.a, p.c, 0.12, r);
};

const vine: Draw = (g, p) => {
  g.line(CX, G, CZ, CX, G + 13, CZ, p.b);
  for (let y = G; y <= G + 13; y++) {
    const ang = y * 0.85;
    g.set(CX + Math.cos(ang) * 2.5, y, CZ + Math.sin(ang) * 2.5, p.a);
    g.set(CX + Math.cos(ang) * 2.5 + 1, y, CZ + Math.sin(ang) * 2.5, p.a);
    const ang2 = ang + Math.PI;
    g.set(CX + Math.cos(ang2) * 2.5, y, CZ + Math.sin(ang2) * 2.5, p.b);
  }
  for (const y of [G + 3, G + 7, G + 11]) {
    const ang = y * 0.85;
    g.ball(CX + Math.cos(ang) * 3.8, y, CZ + Math.sin(ang) * 3.8, 1.8, 1.2, 1.8, p.c);
  }
};

const moss: Draw = (g, p, r) => {
  g.ball(CX, G + 1, CZ, 4.9, 2.2, 4.9, p.c, G);
  for (let k = 0; k < 4; k++) {
    g.ball(CX + (r() - 0.5) * 2.5, G + 2.5 + k, CZ + (r() - 0.5) * 2.5, 4.4 - k, 0.9, 4.2 - k, p.a);
  }
  g.speckle(p.a, p.b, 0.25, r);
};

const grass: Draw = (g, p, r) => {
  g.line(2.5, G, CZ + 1, 9, G, CZ + 1, p.c, 2);
  for (let i = 0; i < 9; i++) {
    const x = 2.5 + i * 0.85;
    const h = 8 + Math.round(r() * 5);
    const lean = (x - CX) * 0.25 + (r() - 0.5) * 2;
    g.line(x, G + 1, CZ, x + lean, G + h, CZ - 1 + (i % 3), i % 2 ? p.a : p.b);
  }
};

const cone: Draw = (g, p) => {
  g.line(1.5, G + 14, CZ - 1, 10, G + 13, CZ - 1, p.c);
  const green = g.color(DEEP_GREEN);
  blade(g, CX, G, G + 10, 5, CZ - 4, 0, green, g.color('#4f8a3a'));
  for (const [x, y] of [
    [3, G + 8],
    [6, G + 6],
    [9, G + 9],
  ] as const) {
    g.line(x, y + 3, CZ - 1, x, G + 13, CZ - 1, p.c);
    g.ball(x, y, CZ, 1.8, 2.8, 1.8, p.a);
    g.each((vx, vy, vz, c) => {
      if (c === p.a && Math.abs(vx - x) < 3 && vy % 2 === 0 && g.exposed(vx, vy, vz))
        g.set(vx, vy, vz, p.b);
    });
  }
};

const succulent: Draw = (g, p) => {
  g.cyl(CX, CZ, G, G + 1, 2.2, p.c);
  for (let k = 0; k < 8; k++) {
    const ang = (k * Math.PI) / 4;
    g.line(CX, G + 1, CZ, CX + Math.cos(ang) * 4.6, G + 4, CZ + Math.sin(ang) * 4.6, p.a, 2);
  }
  for (let k = 0; k < 5; k++) {
    const ang = (k * Math.PI * 2) / 5 + 0.3;
    g.line(CX, G + 2, CZ, CX + Math.cos(ang) * 2.6, G + 8, CZ + Math.sin(ang) * 2.6, p.a, 2);
  }
  g.ball(CX, G + 9.5, CZ, 1.8, 1.4, 1.8, p.b);
};

const jar: Draw = (g, p) => {
  g.cyl(CX, CZ, G, G + 9, 3.9, p.c);
  g.cyl(CX, CZ, G + 1, G + 7, 3.1, p.a);
  g.cyl(CX, CZ, G + 8, G + 9, 3.1, 0);
  g.cyl(CX, CZ, G + 10, G + 11, 4, p.b);
  g.set(CX + 5, G + 12, CZ, p.b);
  // A drip down the front.
  g.line(CX + 1, G + 8, CZ + 4, CX + 1, G + 5, CZ + 4, p.a);
};

const ginkgo: Draw = (g, p) => {
  g.line(CX, G, CZ, CX, G + 3, CZ, p.c);
  const cy = G + 3;
  for (let x = 0; x < 12; x++)
    for (let y = G + 3; y < 16; y++) {
      const dx = x - CX;
      const dy = y - cy;
      const rad = Math.hypot(dx, dy);
      const ang = Math.atan2(dx, dy);
      if (rad < 1.2 || rad > 9.5 || Math.abs(ang) > 1.3) continue;
      if (Math.abs(ang) < 0.1 && rad > 7) continue; // the notch
      const spoke = Math.abs(((ang + 2) % 0.26) - 0.13) < 0.045;
      g.set(x, y, CZ, spoke ? p.b : p.a);
      g.set(x, y, CZ + 1, p.a);
    }
};

const cannabis: Draw = (g, p) => {
  g.line(CX, G, CZ, CX, G + 3, CZ, p.c);
  const y0 = G + 3.5;
  for (const [deg, len] of [
    [-80, 4.5],
    [-54, 6.2],
    [-27, 8],
    [0, 9.2],
    [27, 8],
    [54, 6.2],
    [80, 4.5],
  ] as const) {
    const rad = (deg * Math.PI) / 180;
    const sx = Math.sin(rad);
    const sy = Math.cos(rad);
    const steps = Math.round(len * 2);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = CX + sx * len * t;
      const py = y0 + sy * len * t;
      const w = 1.25 * Math.sin(Math.PI * Math.pow(t, 0.6)) + 0.3;
      for (let k = -Math.round(w); k <= Math.round(w); k++) {
        // Spread sideways, perpendicular to the leaflet.
        const vx = px + sy * k;
        const vy = py - sx * k;
        g.set(vx, vy, CZ, k === 0 ? p.b : p.a);
        g.set(vx, vy, CZ + 1, p.a);
      }
    }
  }
};

const grain: Draw = (g, p) => {
  g.line(CX, G, CZ, CX - 0.5, G + 9, CZ, p.c, 1);
  for (let k = 0; k < 6; k++) {
    const y = G + 8 + k * 1.1;
    const side = k % 2 ? 1 : -1;
    g.ball(CX + side * 1.2, y, CZ, 1, 1.4, 1, p.b);
    g.line(CX + side * 1.2, y + 1, CZ, CX + side * 2.8, y + 3.5, CZ, p.b);
  }
  // The dark, curved ergot bodies pushing out of the ear.
  g.line(CX + 1.5, G + 9, CZ, CX + 4.5, G + 12, CZ + 1, p.a, 2);
  g.line(CX - 1.5, G + 10, CZ, CX - 4.5, G + 7, CZ + 1, p.a, 2);
  g.line(CX + 1, G + 11, CZ, CX + 3, G + 7, CZ + 1, p.a, 2);
};

// ── lab-made things ─────────────────────────────────────────────────────────────────────

const crystals: Draw = (g, p) => {
  g.ball(CX, G + 0.5, CZ, 4.6, 1.5, 4.6, p.c, G);
  for (const [x, z, h, lean] of [
    [3.5, 5, 8, -1.2],
    [5.5, 5.5, 12, 0.3],
    [8, 5, 9, 1.4],
    [4.5, 8, 6, -0.6],
    [7.5, 8, 7, 0.8],
  ] as const) {
    for (let y = 0; y <= h; y++) {
      const x0 = Math.round(x + (lean * y) / h);
      const last = y >= h - 1;
      if (last) g.set(x0, G + 1 + y, z, p.b);
      else g.box(x0, G + 1 + y, z, x0 + 1, G + 1 + y, z + 1, p.a);
    }
    g.line(Math.round(x), G + 1, z + 1, Math.round(x + lean * 0.5), G + 1 + h * 0.8, z + 1, p.b);
  }
};

const powder: Draw = (g, p, r) => {
  g.frustum(CX, CZ, G, G + 1, 4.9, 5.2, p.c);
  g.frustum(CX, CZ, G + 2, G + 9, 4.3, 0.6, p.a);
  g.speckle(p.a, p.b, 0.18, r);
  g.line(9, G + 2, 8.5, 10.5, G + 5, 9.5, p.c);
};

const pills: Draw = (g, p) => {
  g.cyl(4.5, 4.5, G, G + 3, 2.7, p.a);
  g.cyl(4.5, 4.5, G + 3, G + 3, 2.7, p.b);
  g.line(2.5, G + 3, 4.5, 6.5, G + 3, 4.5, p.c);
  g.cyl(8, 8, G, G + 1, 2.4, p.a);
  g.cyl(8, 8, G + 1, G + 1, 2.4, p.b);
  // One tablet stood on its edge at the back.
  for (let x = 0; x < 12; x++)
    for (let y = G; y < 16; y++)
      if (Math.hypot(x - 8.5, y - (G + 6)) <= 3 && y >= G) {
        g.set(x, y, 3, p.a);
        g.set(x, y, 4, p.b);
      }
  g.line(6, G + 6, 4, 11, G + 6, 4, p.c);
};

function capsuleAt(
  g: VoxelGrid,
  x: number,
  z: number,
  y0: number,
  h: number,
  rad: number,
  top: number,
  bottom: number,
): void {
  const mid = y0 + h / 2;
  g.cyl(x, z, y0, mid, rad, bottom);
  g.cyl(x, z, mid + 1, y0 + h, rad, top);
  g.ball(x, y0, z, rad, rad, rad, bottom, -Infinity, y0 - 0.5);
  g.ball(x, y0 + h, z, rad, rad, rad, top, y0 + h + 0.5);
}

const capsule: Draw = (g, p) => {
  capsuleAt(g, 3.5, 5, G + 1, 8, 1.7, p.a, p.b);
  capsuleAt(g, 7, 4.5, G + 1, 9, 1.7, p.a, p.b);
  capsuleAt(g, 9, 8, G + 1, 6, 1.5, p.a, p.b);
  // One lying on its side at the front.
  g.line(2, G + 1, 9, 5, G + 1, 9, p.b, 3);
  g.line(6, G + 1, 9, 8, G + 1, 9, p.a, 3);
  g.set(1, G + 2, 10, p.c);
};

const vial: Draw = (g, p) => {
  const cream = g.color('#efe5c8');
  g.cyl(4.5, 5.5, G, G + 10, 3, p.c);
  g.cyl(4.5, 5.5, G + 1, G + 8, 2.2, p.a);
  g.cyl(4.5, 5.5, G + 9, G + 10, 2.2, 0);
  g.cyl(4.5, 5.5, G + 11, G + 12, 2.2, p.b);
  for (let y = G + 3; y <= G + 6; y++)
    for (let x = 0; x < 12; x++)
      for (let z = 0; z < 12; z++) {
        const d = Math.hypot(x - 4.5, z - 5.5);
        if (d >= 2.2 && d <= 3.2 && z >= 5.5) g.set(x, y, z, cream);
      }
  g.line(2.5, G + 4, 8.5, 6.5, G + 4, 8.5, p.a);
  g.cyl(9, 8, G, G + 5, 1.6, p.c);
  g.cyl(9, 8, G + 1, G + 4, 1, p.a);
  g.cyl(9, 8, G + 6, G + 6, 1.2, p.b);
};

const bottle: Draw = (g, p) => {
  const cream = g.color('#efe5c8');
  g.cyl(CX, CZ, G, G + 7, 3.8, p.a);
  g.frustum(CX, CZ, G + 8, G + 9, 3.2, 1.8, p.a);
  g.cyl(CX, CZ, G + 10, G + 11, 1.7, p.a);
  g.cyl(CX, CZ, G + 12, G + 13, 2.1, p.b);
  g.each((x, y, z, c) => {
    if (c === p.a && y >= G + 2 && y <= G + 6 && z >= CZ + 2 && g.exposed(x, y, z)) {
      g.set(x, y, z, y === G + 4 ? p.c : cream);
    }
  });
  g.line(CX - 2.5, G + 1, CZ + 3.2, CX - 2.5, G + 7, CZ + 3.2, p.c);
};

const canister: Draw = (g, p) => {
  g.cyl(CX, 4.5, G, G + 7, 2.2, p.a);
  g.frustum(CX, 4.5, G + 8, G + 10, 2.2, 0.9, p.a);
  g.cyl(CX, 4.5, G + 11, G + 11, 0.5, p.b);
  g.cyl(CX, 4.5, G + 3, G + 4, 2.3, p.b);
  // A spent cartridge lying in front, and a small one beside it.
  g.line(2, G + 1, 9.5, 8, G + 1, 9.5, p.a, 2);
  g.line(8, G + 1, 9.5, 9, G + 1, 9.5, p.b, 2);
  g.cyl(9.5, 6, G, G + 4, 1.2, p.c);
};

const blotter: Draw = (g, p) => {
  for (let y = G + 1; y <= G + 11; y++) {
    const z = CZ + 1 - Math.floor((y - G) / 4);
    for (let x = 1; x <= 10; x++) {
      const gridLine = x === 4 || x === 7 || (y - G) % 4 === 1;
      g.set(x, y, z, gridLine ? p.b : p.a);
    }
  }
  for (const x of [2, 5, 8]) {
    for (const yy of [G + 3, G + 6, G + 9]) {
      const z = CZ + 1 - Math.floor((yy - G) / 4) + 1;
      g.set(x, yy, z, p.c);
      g.set(x + 1, yy, z, p.c);
      g.set(x, yy + 1, z, p.c);
    }
  }
};

const molecule: Draw = (g, p, r) => {
  const bond = g.color('#e8dcc0');
  const atoms: [number, number, number, number][] = [];
  const atom = (x: number, y: number, z: number, c: number) => atoms.push([x, y, z, c]);
  const link = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) =>
    g.line(x0, y0, z0, x1, y1, z1, bond, 2);
  const variant = Math.floor(r() * 3);

  const hexRing = (cx: number, cy: number, cz: number, rad: number): [number, number][] => {
    const pts: [number, number][] = [];
    for (let k = 0; k < 6; k++) {
      const ang = Math.PI / 6 + (k * Math.PI) / 3;
      pts.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
    }
    pts.forEach(([x, y], k) => {
      const [nx, ny] = pts[(k + 1) % 6] ?? [x, y];
      link(x, y, cz, nx, ny, cz);
      atom(x, y, cz, p.a);
    });
    return pts;
  };

  if (variant === 0) {
    // A ring and a zig-zag chain ending in a nitrogen, with an oxygen on the ring.
    const ring = hexRing(3.6, G + 7.5, CZ, 2.6);
    let [px, py] = ring[0] ?? [0, 0];
    for (let i = 0; i < 3; i++) {
      const nx = px + 2.2;
      const ny = py + (i % 2 ? 1.6 : -1.6);
      const nz = CZ + (i % 2 ? 1.5 : -1.5);
      link(px, py, i === 0 ? CZ : CZ + (i % 2 ? -1.5 : 1.5), nx, ny, nz);
      atom(nx, ny, nz, i === 2 ? p.b : p.a);
      [px, py] = [nx, ny];
    }
    const [ox, oy] = ring[3] ?? [0, 0];
    link(ox, oy, CZ, ox - 0.4, oy - 2.3, CZ + 1);
    atom(ox - 0.4, oy - 2.3, CZ + 1, p.c);
  } else if (variant === 1) {
    // Two fused rings, like an indole or an ergoline, with a nitrogen in the second.
    const one = hexRing(3.3, G + 7, CZ, 2.4);
    const [sx, sy] = one[5] ?? [0, 0];
    const [tx, ty] = one[0] ?? [0, 0];
    const mx = Math.max(sx, tx) + 2.2;
    link(sx, sy, CZ, mx, (sy + ty) / 2 + 0.2, CZ + 1.5);
    link(tx, ty, CZ, mx, (sy + ty) / 2 + 0.2, CZ + 1.5);
    atom(mx, (sy + ty) / 2 + 0.2, CZ + 1.5, p.b);
    link(mx, (sy + ty) / 2 + 0.2, CZ + 1.5, mx + 2.2, G + 5.5, CZ - 1);
    atom(mx + 2.2, G + 5.5, CZ - 1, p.a);
    link(mx + 2.2, G + 5.5, CZ - 1, mx + 3, G + 9, CZ);
    atom(mx + 3, G + 9, CZ, p.c);
    const [ox, oy] = one[2] ?? [0, 0];
    link(ox, oy, CZ, ox - 1.5, oy + 2.4, CZ + 1);
    atom(ox - 1.5, oy + 2.4, CZ + 1, p.c);
  } else {
    // A ring with a bulky ring on a stalk: a flat hexagon, and a puckered one in front of it.
    const flat = hexRing(3.6, G + 8, CZ - 1, 2.4);
    const ox = 7.8;
    const oy = G + 4.5;
    link(3.6, G + 5.6, CZ - 1, ox, oy, CZ + 1);
    atom(ox, oy, CZ + 1, p.b);
    for (let k = 0; k < 5; k++) {
      const ang = (k * Math.PI * 2) / 5;
      const nx = ox + Math.cos(ang) * 2.1;
      const ny = oy + Math.sin(ang) * 2.1;
      const nz = CZ + 1 + (k % 2 ? 1.4 : -0.6);
      atom(nx, ny, nz, p.a);
      link(ox, oy, CZ + 1, nx, ny, nz);
    }
    const [ax, ay] = flat[1] ?? [0, 0];
    link(ax, ay, CZ - 1, ax + 0.5, ay + 2.2, CZ);
    atom(ax + 0.5, ay + 2.2, CZ, p.c);
  }
  for (const [x, y, z, c] of atoms) g.ball(x, y, z, 1.3, 1.3, 1.3, c);
};

/** How to draw each form, and its default colours (a, b, c). */
export const FORMS: Record<Form, { colors: readonly [string, string, string]; draw: Draw }> = {
  mushroom: { colors: ['#d7352b', '#f6efe0', '#efe6cf'], draw: mushroom },
  shrooms: { colors: ['#b88a56', '#4f86d6', '#e6d9bb'], draw: shrooms },
  cactus: { colors: ['#4d8a4a', '#f3e9b0', '#356b3a'], draw: cactus },
  button: { colors: ['#5f8f6c', '#efe7cf', '#46705a'], draw: button },
  leaf: { colors: ['#4f9a43', '#9ed26f', '#6f7a2e'], draw: leaf },
  sprig: { colors: ['#5c9b45', '#e8c44a', '#6c7a38'], draw: sprig },
  flower: { colors: ['#f0a12a', '#e8d03a', '#4f8a3a'], draw: flower },
  lotus: { colors: ['#6f8fe0', '#b9ccf5', '#2f7a4a'], draw: lotus },
  trumpet: { colors: ['#7a5fe0', '#f1ecff', '#4f8a3a'], draw: trumpet },
  spike: { colors: ['#9a72d6', '#d6c1f2', '#7e9a62'], draw: spike },
  root: { colors: ['#a8794a', '#eadbb6', '#7a5634'], draw: root },
  bark: { colors: ['#7a4e2d', '#c9955a', '#4e3320'], draw: bark },
  pod: { colors: ['#6a4a2a', '#c8a468', '#3f2c18'], draw: pod },
  poppy: { colors: ['#8fa88a', '#d9d2a8', '#5d8a52'], draw: poppy },
  seeds: { colors: ['#6b4a2a', '#d8b27a', '#8a5a30'], draw: seeds },
  berries: { colors: ['#6b2a78', '#e9c4f0', '#3f7a38'], draw: berries },
  nut: { colors: ['#b0763c', '#e9cf9a', '#7a4b22'], draw: nut },
  vine: { colors: ['#7a5a38', '#a9b45a', '#4f8a3a'], draw: vine },
  moss: { colors: ['#4fa05a', '#a6dd8a', '#6e6a62'], draw: moss },
  grass: { colors: ['#6fa84a', '#a9d46a', '#c9b078'], draw: grass },
  cone: { colors: ['#b8d86a', '#e4f0a8', '#4f7a38'], draw: cone },
  succulent: { colors: ['#7fb06a', '#f0c24a', '#9a8a5a'], draw: succulent },
  jar: { colors: ['#d98a1c', '#e8b83a', '#bfe0ea'], draw: jar },
  ginkgo: { colors: ['#e4c43a', '#fff0a0', '#7a8a3a'], draw: ginkgo },
  cannabis: { colors: ['#3f9a3a', '#9fe07a', '#4a7a30'], draw: cannabis },
  grain: { colors: ['#2a1a36', '#d8b860', '#b8a050'], draw: grain },
  crystals: { colors: ['#cfe7f2', '#ffffff', '#8aa9ba'], draw: crystals },
  powder: { colors: ['#f2f0ea', '#ffffff', '#9aa3a8'], draw: powder },
  pills: { colors: ['#f2f0ea', '#e9b7c9', '#c9c4b8'], draw: pills },
  capsule: { colors: ['#e8dcc0', '#c9453b', '#9a9a9a'], draw: capsule },
  vial: { colors: ['#e6b84a', '#2a2a2a', '#bfe0ea'], draw: vial },
  bottle: { colors: ['#b83a2e', '#e8e3d6', '#f0c24a'], draw: bottle },
  canister: { colors: ['#b9c0c6', '#d9a441', '#8c949a'], draw: canister },
  blotter: { colors: ['#f2ecd8', '#cdbf9a', '#b85fd6'], draw: blotter },
  molecule: { colors: ['#8a8f96', '#3d6bff', '#e63b2e'], draw: molecule },
};

export { plinth };
