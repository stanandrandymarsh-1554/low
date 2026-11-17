export interface Size {
  w: number;
  h: number;
}

/**
 * Keeps a camera (top-left corner of the view, in world pixels) inside the world. If the world is
 * smaller than the view on an axis, the world is centred on that axis instead.
 */
export function clampCamera(
  x: number,
  y: number,
  view: Size,
  world: Size,
): { x: number; y: number } {
  const fit = (pos: number, viewSize: number, worldSize: number) =>
    worldSize <= viewSize
      ? (worldSize - viewSize) / 2
      : Math.min(Math.max(pos, 0), worldSize - viewSize);
  return { x: fit(x, view.w, world.w), y: fit(y, view.h, world.h) };
}
