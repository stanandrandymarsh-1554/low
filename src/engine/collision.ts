/** An axis-aligned box: top-left corner plus size. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Moves `box` by (dx, dy) one axis at a time, stopping flush against any solid in the way.
 * Doing the axes separately lets a mover slide along walls. Returns the new top-left corner.
 * Steps must be smaller than the thinnest solid (true at game speeds), or a mover can tunnel through.
 */
export function moveAndCollide(
  box: Box,
  dx: number,
  dy: number,
  solids: readonly Box[],
): { x: number; y: number } {
  let x = box.x + dx;
  if (dx !== 0) {
    for (const s of solids) {
      if (overlaps({ x, y: box.y, w: box.w, h: box.h }, s)) x = dx > 0 ? s.x - box.w : s.x + s.w;
    }
  }
  let y = box.y + dy;
  if (dy !== 0) {
    for (const s of solids) {
      if (overlaps({ x, y, w: box.w, h: box.h }, s)) y = dy > 0 ? s.y - box.h : s.y + s.h;
    }
  }
  return { x, y };
}
