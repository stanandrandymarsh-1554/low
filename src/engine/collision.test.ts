import { describe, expect, it } from 'vitest';
import { circleOverlapsBox, moveCircle, type Box } from './collision';

const wall: Box = { minX: 1, maxX: 2, minZ: -5, maxZ: 5 };

describe('circleOverlapsBox', () => {
  it('detects overlap, including at corners', () => {
    expect(circleOverlapsBox(0.9, 0, 0.2, wall)).toBe(true);
    expect(circleOverlapsBox(0.7, 0, 0.2, wall)).toBe(false);
    // Diagonal from the corner (1, 5): distance sqrt(0.1^2 + 0.1^2) < 0.2
    expect(circleOverlapsBox(0.9, 5.1, 0.2, wall)).toBe(true);
    expect(circleOverlapsBox(0.8, 5.2, 0.2, wall)).toBe(false);
  });
});

describe('moveCircle', () => {
  it('moves freely when nothing is in the way', () => {
    const p = { x: 0, z: 0 };
    moveCircle(p, 0.1, 0.2, 0.2, [wall]);
    expect(p).toEqual({ x: 0.1, z: 0.2 });
  });

  it('stops at a wall and slides along it', () => {
    const p = { x: 0.7, z: 0 };
    moveCircle(p, 0.3, 0.3, 0.2, [wall]);
    expect(p.x).toBe(0.7);
    expect(p.z).toBeCloseTo(0.3);
  });

  it('never ends up inside a box when walking at it repeatedly', () => {
    const p = { x: -3, z: 0 };
    for (let i = 0; i < 500; i++) moveCircle(p, 0.05, 0.01, 0.28, [wall]);
    expect(circleOverlapsBox(p.x, p.z, 0.28, wall)).toBe(false);
    expect(p.x).toBeLessThanOrEqual(1 - 0.28);
  });
});
