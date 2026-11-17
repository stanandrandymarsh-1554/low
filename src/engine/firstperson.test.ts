import { describe, expect, it } from 'vitest';
import type { Box } from './collision';
import { FirstPersonBody, NO_INPUT, type FirstPersonOptions } from './firstperson';

const opts: FirstPersonOptions = {
  radius: 0.3,
  walkSpeed: 2,
  runSpeed: 4,
  turnSpeed: 1,
  lookSensitivity: 0.01,
  pitchLimit: 1,
};
const start = { x: 0, z: 0, yaw: 0, pitch: 0 };

describe('FirstPersonBody', () => {
  it('walks toward -z when facing yaw 0', () => {
    const b = new FirstPersonBody(opts, start);
    b.step(1, { ...NO_INPUT, forward: 1 }, []);
    expect(b.pose.x).toBeCloseTo(0);
    expect(b.pose.z).toBeCloseTo(-2);
  });

  it('strafes right, and turning left makes forward point toward -x', () => {
    const b = new FirstPersonBody(opts, start);
    b.step(1, { ...NO_INPUT, strafe: 1 }, []);
    expect(b.pose.x).toBeCloseTo(2);

    const c = new FirstPersonBody(opts, { ...start, yaw: Math.PI / 2 });
    c.step(1, { ...NO_INPUT, forward: 1 }, []);
    expect(c.pose.x).toBeCloseTo(-2);
    expect(c.pose.z).toBeCloseTo(0);
  });

  it('is not faster diagonally, and running is faster', () => {
    const b = new FirstPersonBody(opts, start);
    b.step(1, { ...NO_INPUT, forward: 1, strafe: 1 }, []);
    expect(Math.hypot(b.pose.x, b.pose.z)).toBeCloseTo(2);
    const r = new FirstPersonBody(opts, start);
    r.step(1, { ...NO_INPUT, forward: 1, run: true }, []);
    expect(r.pose.z).toBeCloseTo(-4);
  });

  it('turns with the mouse and keyboard, and clamps looking up and down', () => {
    const b = new FirstPersonBody(opts, start);
    b.step(0.5, { ...NO_INPUT, turn: 1, lookX: 10 }, []);
    expect(b.pose.yaw).toBeCloseTo(0.5 - 0.1); // mouse right turns right
    b.step(1, { ...NO_INPUT, tilt: 1 }, []);
    expect(b.pose.pitch).toBe(1);
    b.step(1, { ...NO_INPUT, lookY: -1000 }, []);
    expect(b.pose.pitch).toBe(1);
    b.step(1, { ...NO_INPUT, lookY: 1000 }, []);
    expect(b.pose.pitch).toBe(-1);
  });

  it('collides with boxes', () => {
    const wall: Box = { minX: -5, maxX: 5, minZ: -3, maxZ: -2 };
    const b = new FirstPersonBody(opts, start);
    for (let i = 0; i < 300; i++) b.step(1 / 60, { ...NO_INPUT, forward: 1 }, [wall]);
    expect(b.pose.z).toBeGreaterThanOrEqual(-2 + 0.3 - 1e-9);
  });

  it('interpolates between the last two steps', () => {
    const b = new FirstPersonBody(opts, start);
    b.step(1, { ...NO_INPUT, forward: 1 }, []);
    expect(b.poseAt(0).z).toBeCloseTo(0);
    expect(b.poseAt(0.5).z).toBeCloseTo(-1);
    expect(b.poseAt(1).z).toBeCloseTo(-2);
  });
});
