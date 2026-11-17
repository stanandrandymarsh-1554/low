import { BufferGeometry, Color, Float32BufferAttribute } from 'three';
import { ITEM } from '../store/scale';
import { GRID, type VoxelGrid } from '../voxel/grid';

/** One face of a cube: its outward normal and the four corners (counter-clockwise from outside). */
const FACES: readonly {
  n: readonly [number, number, number];
  v: readonly (readonly [number, number, number])[];
  shade: number;
}[] = [
  {
    n: [0, 1, 0],
    v: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
    shade: 1,
  },
  {
    n: [0, -1, 0],
    v: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    shade: 0.55,
  },
  {
    n: [1, 0, 0],
    v: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
    shade: 0.82,
  },
  {
    n: [-1, 0, 0],
    v: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    shade: 0.82,
  },
  {
    n: [0, 0, 1],
    v: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    shade: 0.92,
  },
  {
    n: [0, 0, -1],
    v: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    shade: 0.7,
  },
];

/** A little stable noise per voxel, so flat colours get the grain of hand-pixelled art. */
function grain(x: number, y: number, z: number): number {
  const h = Math.imul((x * 73856093) ^ (y * 19349663) ^ (z * 83492791), 0x45d9f3b) >>> 0;
  return ((h >>> 8) & 255) / 255;
}

/**
 * Turns a voxel model into one mesh: only the faces you could see are built, each face is
 * coloured from the palette with a little baked shading and grain. The origin is the middle of
 * the plinth's underside, so the figure stands on y = 0.
 */
export function voxelGeometry(g: VoxelGrid): BufferGeometry {
  const colors = g.palette.map((hex) => new Color(hex));
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const s = ITEM.voxel;
  const c = new Color();

  g.each((x, y, z, ci) => {
    const base = colors[ci - 1] ?? new Color(0xffffff);
    const tone = 0.94 + grain(x, y, z) * 0.12;
    for (const f of FACES) {
      if (g.get(x + f.n[0], y + f.n[1], z + f.n[2])) continue;
      const k = pos.length / 3;
      c.copy(base).multiplyScalar(f.shade * tone);
      for (const [dx, dy, dz] of f.v) {
        pos.push((x + dx - GRID.w / 2) * s, (y + dy) * s, (z + dz - GRID.d / 2) * s);
        nor.push(...f.n);
        col.push(c.r, c.g, c.b);
      }
      idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
    }
  });

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}
