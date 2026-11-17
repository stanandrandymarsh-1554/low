/**
 * A tiny voxel canvas that every shelf item is drawn on.
 *
 * Pure data and maths (no DOM, no three.js), so models can be tested and drawn both in the 3D
 * store and as isometric pictures on posters and menus.
 *
 * Axes: +x right, +y up, +z toward the viewer (the front of the item).
 */

export const GRID = { w: 12, h: 16, d: 12 } as const;
/** The first layer above the little plinth every item stands on. */
export const GROUND = 2;
/** Centre of the grid in x and z (it is an even size, so the centre sits between voxels). */
export const MID = 5.5;

/** A small seeded random generator, so an entry always looks the same. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class VoxelGrid {
  /** 0 is empty; otherwise a 1-based index into `palette`. */
  readonly cells = new Uint8Array(GRID.w * GRID.h * GRID.d);
  readonly palette: string[] = [];

  /** The palette index for a colour, adding it if new. */
  color(hex: string): number {
    let i = this.palette.indexOf(hex);
    if (i < 0) {
      this.palette.push(hex);
      i = this.palette.length - 1;
    }
    return i + 1;
  }

  inside(x: number, y: number, z: number): boolean {
    return x >= 0 && x < GRID.w && y >= 0 && y < GRID.h && z >= 0 && z < GRID.d;
  }

  private index(x: number, y: number, z: number): number {
    return (y * GRID.d + z) * GRID.w + x;
  }

  get(x: number, y: number, z: number): number {
    return this.inside(x, y, z) ? (this.cells[this.index(x, y, z)] ?? 0) : 0;
  }

  /** Sets a voxel (coordinates are rounded). Colour 0 erases. Anything off the grid is ignored. */
  set(x: number, y: number, z: number, c: number): void {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rz = Math.round(z);
    if (this.inside(rx, ry, rz)) this.cells[this.index(rx, ry, rz)] = c;
  }

  count(): number {
    let n = 0;
    for (const c of this.cells) if (c) n++;
    return n;
  }

  /** Calls `fn` for every filled voxel, in x, then z, then y order (back to front for painting). */
  each(fn: (x: number, y: number, z: number, c: number) => void): void {
    for (let x = 0; x < GRID.w; x++)
      for (let z = 0; z < GRID.d; z++)
        for (let y = 0; y < GRID.h; y++) {
          const c = this.get(x, y, z);
          if (c) fn(x, y, z, c);
        }
  }

  /** Is the voxel filled and open to air on at least one side? */
  exposed(x: number, y: number, z: number): boolean {
    return (
      this.get(x + 1, y, z) === 0 ||
      this.get(x - 1, y, z) === 0 ||
      this.get(x, y + 1, z) === 0 ||
      this.get(x, y - 1, z) === 0 ||
      this.get(x, y, z + 1) === 0 ||
      this.get(x, y, z - 1) === 0
    );
  }

  /** The highest filled voxel in a column, or -1. */
  top(x: number, z: number): number {
    for (let y = GRID.h - 1; y >= 0; y--) if (this.get(x, y, z)) return y;
    return -1;
  }

  // ── shapes ────────────────────────────────────────────────────────────────────────────

  /** A solid box between two corners, inclusive. */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, c: number): void {
    for (let x = Math.round(x0); x <= Math.round(x1); x++)
      for (let y = Math.round(y0); y <= Math.round(y1); y++)
        for (let z = Math.round(z0); z <= Math.round(z1); z++) this.set(x, y, z, c);
  }

  /** A solid ellipsoid. `yMin` / `yMax` slice it, for domes and bowls. */
  ball(
    cx: number,
    cy: number,
    cz: number,
    rx: number,
    ry: number,
    rz: number,
    c: number,
    yMin = -Infinity,
    yMax = Infinity,
  ): void {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        if (y < yMin || y > yMax) continue;
        for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) {
          const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2;
          if (d <= 1) this.set(x, y, z, c);
        }
      }
  }

  /** A solid upright cylinder from layer `y0` to `y1`, inclusive. */
  cyl(cx: number, cz: number, y0: number, y1: number, r: number, c: number): void {
    this.frustum(cx, cz, y0, y1, r, r, c);
  }

  /** A cylinder whose radius changes from `r0` at `y0` to `r1` at `y1`. */
  frustum(cx: number, cz: number, y0: number, y1: number, r0: number, r1: number, c: number): void {
    for (let y = Math.round(y0); y <= Math.round(y1); y++) {
      const t = y1 === y0 ? 0 : (y - y0) / (y1 - y0);
      const r = r0 + (r1 - r0) * t;
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++)
          if ((x - cx) ** 2 + (z - cz) ** 2 <= r * r) this.set(x, y, z, c);
    }
  }

  /** A straight line of voxels; `thick` makes it a square brush. */
  line(
    x0: number,
    y0: number,
    z0: number,
    x1: number,
    y1: number,
    z1: number,
    c: number,
    thick = 1,
  ): void {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), 1) * 2;
    const off = (thick - 1) / 2;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t - off;
      const y = y0 + (y1 - y0) * t - off;
      const z = z0 + (z1 - z0) * t - off;
      for (let a = 0; a < thick; a++)
        for (let b = 0; b < thick; b++)
          for (let d = 0; d < thick; d++) this.set(x + a, y + b, z + d, c);
    }
  }

  /** Randomly recolours some exposed voxels of colour `from` to `to`, for spots and texture. */
  speckle(from: number, to: number, chance: number, rand: () => number): void {
    const hits: [number, number, number][] = [];
    this.each((x, y, z, c) => {
      if (c === from && this.exposed(x, y, z) && rand() < chance) hits.push([x, y, z]);
    });
    for (const [x, y, z] of hits) this.set(x, y, z, to);
  }
}
