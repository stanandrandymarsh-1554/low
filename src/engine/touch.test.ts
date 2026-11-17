import { describe, expect, it } from 'vitest';
import { isTap, STICK_RADIUS, stickVector } from './touch';

describe('stickVector', () => {
  it('ignores tiny movements', () => {
    expect(stickVector(3, -2).magnitude).toBe(0);
    expect(stickVector(0, 0)).toEqual({ x: 0, y: 0, magnitude: 0 });
  });

  it('is full strength at the edge, and never more', () => {
    expect(stickVector(0, -STICK_RADIUS).magnitude).toBeCloseTo(1);
    expect(stickVector(0, -STICK_RADIUS * 3).magnitude).toBeCloseTo(1);
  });

  it('points the way the thumb moved', () => {
    const up = stickVector(0, -40);
    expect(up.y).toBeLessThan(0);
    expect(up.x).toBeCloseTo(0);
    const right = stickVector(40, 0);
    expect(right.x).toBeGreaterThan(0);
  });

  it('grows smoothly from the dead zone', () => {
    const a = stickVector(0, -15).magnitude;
    const b = stickVector(0, -30).magnitude;
    const c = stickVector(0, -50).magnitude;
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });
});

describe('isTap', () => {
  it('needs a short, still touch', () => {
    expect(isTap(2, 120)).toBe(true);
    expect(isTap(40, 120)).toBe(false);
    expect(isTap(2, 900)).toBe(false);
  });
});
