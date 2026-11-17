import { GRID, type VoxelGrid } from '../voxel/grid';

/** Multiplies a #rrggbb colour's brightness. */
export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * f)));
  return `rgb(${ch(16)} ${ch(8)} ${ch(0)})`;
}

/** Pixels of the sprite for one voxel, and the size of the picture it needs. */
export const ISO = {
  width: (px: number) => (GRID.w + GRID.d) * px,
  height: (px: number) => (GRID.h + (GRID.w + GRID.d) / 2) * px,
  /** Where the plinth's bottom middle sits inside a picture of that size. */
  baseY: (px: number) => (GRID.h + (GRID.w + GRID.d) / 4) * px,
};

/**
 * Draws the model in isometric view, like a sprite from a 90s game. (cx, baseY) is where the
 * middle of the plinth's bottom sits on screen; `px` is the size of one voxel edge.
 */
export function drawVoxelIso(
  ctx: CanvasRenderingContext2D,
  g: VoxelGrid,
  cx: number,
  baseY: number,
  px: number,
): void {
  const tops = g.palette.map((c) => shade(c, 1.08));
  const rights = g.palette.map((c) => shade(c, 0.78));
  const fronts = g.palette.map((c) => shade(c, 0.58));
  const proj = (x: number, y: number, z: number): [number, number] => [
    cx + (x - z) * px,
    baseY + (x + z) * px * 0.5 - y * px,
  ];
  const face = (pts: [number, number, number][], fill: string) => {
    ctx.beginPath();
    pts.forEach(([x, y, z], i) => {
      const [sx, sy] = proj(x - GRID.w / 2, y, z - GRID.d / 2);
      if (i) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.strokeStyle = fill;
    ctx.lineWidth = Math.max(0.5, px * 0.12);
    ctx.lineJoin = 'round';
    ctx.fill();
    ctx.stroke();
  };

  // Pushed back to front: low x, then low z, then low y.
  g.each((x, y, z, c) => {
    const i = c - 1;
    if (!g.get(x, y + 1, z))
      face(
        [
          [x, y + 1, z],
          [x + 1, y + 1, z],
          [x + 1, y + 1, z + 1],
          [x, y + 1, z + 1],
        ],
        tops[i] ?? '#fff',
      );
    if (!g.get(x + 1, y, z))
      face(
        [
          [x + 1, y, z],
          [x + 1, y, z + 1],
          [x + 1, y + 1, z + 1],
          [x + 1, y + 1, z],
        ],
        rights[i] ?? '#888',
      );
    if (!g.get(x, y, z + 1))
      face(
        [
          [x, y, z + 1],
          [x + 1, y, z + 1],
          [x + 1, y + 1, z + 1],
          [x, y + 1, z + 1],
        ],
        fronts[i] ?? '#555',
      );
  });
}
