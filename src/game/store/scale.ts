/**
 * The store is built in metres at real-world sizes, so it feels right to walk through.
 * +x is right, +y is up, and +z points toward the front door. Yaw 0 faces -z (into the store).
 */

export const EYE_HEIGHT = 1.65;
export const PLAYER_RADIUS = 0.28;
/** A browsing pace, and a brisk walk. */
export const WALK_SPEED = 1.9;
export const RUN_SPEED = 3.4;

/**
 * A shelf item: a small display figure on a plinth, 15 x 20 x 15 cm, built from a 12 x 16 x 12
 * grid of 1.25 cm voxels (see `voxel/grid.ts`).
 */
export const ITEM = { w: 0.15, h: 0.2, d: 0.15, voxel: 0.0125 } as const;

/** Double-sided shelving ("gondolas") with the figures standing along each row. */
export const SHELF = {
  /** Total depth of a gondola, both sides together. */
  depth: 0.6,
  /** Solid storage cabinet at the bottom. */
  baseH: 0.62,
  /** Top of the unit; the player's eyes (1.65 m) are just above the highest figures. */
  height: 1.74,
  /** Thickness of the central back panel. */
  spine: 0.06,
  /** Heights of each shelf board (where figures stand), lowest first. */
  rowBottoms: [0.7, 0.96, 1.22, 1.48],
  /** How far a figure's centre sits from the gondola's centre line. */
  itemOffset: 0.105,
  ledgeDepth: 0.17,
  /** Distance between figure centres along a row. */
  colPitch: 0.17,
  endMargin: 0.15,
  minLength: 1.0,
  /** Longest bay, in columns; more figures than fit continue in the next bay. */
  maxCols: 14,
} as const;

export const STORE = {
  ceiling: 3.1,
  /** Clear walking space between two facing gondolas. */
  aisleWidth: 2.0,
  /** Space behind the first gondola, and in front of the last (counter and door). */
  backLane: 2.4,
  frontLane: 5.2,
  /** Space either side of the longest gondola. */
  sideLane: 2.0,
  minWidth: 10,
  /** Height of the middle of the hanging aisle signs. */
  signY: 2.35,
} as const;
