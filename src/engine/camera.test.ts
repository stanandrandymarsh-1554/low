import { describe, expect, it } from 'vitest';
import { clampCamera } from './camera';

const view = { w: 100, h: 50 };

describe('clampCamera', () => {
  it('keeps the view inside the world', () => {
    const world = { w: 400, h: 300 };
    expect(clampCamera(-20, -5, view, world)).toEqual({ x: 0, y: 0 });
    expect(clampCamera(1000, 1000, view, world)).toEqual({ x: 300, y: 250 });
    expect(clampCamera(120, 80, view, world)).toEqual({ x: 120, y: 80 });
  });

  it('centres a world smaller than the view', () => {
    expect(clampCamera(0, 0, view, { w: 60, h: 50 })).toEqual({ x: -20, y: 0 });
  });
});
