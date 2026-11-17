/** An axis-aligned box on the floor plane (x/z), in metres. */
export interface Box {
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
}

export interface Point {
  x: number;
  z: number;
}

/** Does a circle at (x, z) with radius `r` overlap the box? */
export function circleOverlapsBox(x: number, z: number, r: number, b: Box): boolean {
  const cx = Math.min(Math.max(x, b.minX), b.maxX);
  const cz = Math.min(Math.max(z, b.minZ), b.maxZ);
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz < r * r;
}

function blocked(x: number, z: number, r: number, boxes: readonly Box[]): boolean {
  return boxes.some((b) => circleOverlapsBox(x, z, r, b));
}

/**
 * Moves a circle by (dx, dz), one axis at a time, so it slides along walls instead of
 * stopping dead. Steps must be small relative to the thinnest box (a frame at 60 Hz is).
 */
export function moveCircle(
  p: Point,
  dx: number,
  dz: number,
  r: number,
  boxes: readonly Box[],
): void {
  if (!blocked(p.x + dx, p.z, r, boxes)) p.x += dx;
  if (!blocked(p.x, p.z + dz, r, boxes)) p.z += dz;
}
