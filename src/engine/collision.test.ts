import { describe, expect, it } from 'vitest';
import { moveAndCollide, overlaps, type Box } from './collision';

const wall: Box = { x: 100, y: 0, w: 20, h: 200 };

describe('overlaps', () => {
  it('is true only when the boxes share area', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });
});

describe('moveAndCollide', () => {
  const box: Box = { x: 80, y: 50, w: 14, h: 8 };

  it('moves freely when nothing is in the way', () => {
    expect(moveAndCollide(box, 3, 2, [wall])).toEqual({ x: 83, y: 52 });
  });

  it('stops flush against a solid', () => {
    expect(moveAndCollide(box, 10, 0, [wall])).toEqual({ x: 86, y: 50 });
    const right: Box = { x: 130, y: 50, w: 14, h: 8 };
    expect(moveAndCollide(right, -20, 0, [wall])).toEqual({ x: 120, y: 50 });
  });

  it('slides along a wall instead of sticking to it', () => {
    expect(moveAndCollide(box, 10, 5, [wall])).toEqual({ x: 86, y: 55 });
  });

  it('stops against a solid above or below', () => {
    const floor: Box = { x: 0, y: 100, w: 500, h: 20 };
    expect(moveAndCollide(box, 0, 45, [floor])).toEqual({ x: 80, y: 92 });
  });
});
