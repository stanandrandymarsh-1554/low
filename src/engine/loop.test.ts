import { describe, expect, it } from 'vitest';
import { FixedStepper } from './loop';

// Steps are powers of two so the arithmetic is exact in floating point.
describe('FixedStepper', () => {
  it('runs one update per full step and carries the remainder', () => {
    const stepper = new FixedStepper({ step: 0.25, maxFrameTime: 1 });
    const dts: number[] = [];

    const alpha = stepper.advance(0.625, (dt) => dts.push(dt));

    expect(dts).toEqual([0.25, 0.25]);
    expect(alpha).toBe(0.5);
  });

  it('accumulates small frames until a step is due', () => {
    const stepper = new FixedStepper({ step: 0.25 });
    let updates = 0;

    stepper.advance(0.125, () => updates++);
    expect(updates).toBe(0);

    stepper.advance(0.125, () => updates++);
    expect(updates).toBe(1);
  });

  it('clamps long frames to avoid a spiral of catch-up updates', () => {
    const stepper = new FixedStepper({ step: 0.25, maxFrameTime: 0.75 });
    let updates = 0;

    stepper.advance(10, () => updates++);

    expect(updates).toBe(3);
  });

  it('ignores negative frame times', () => {
    const stepper = new FixedStepper({ step: 0.25 });
    let updates = 0;

    expect(stepper.advance(-1, () => updates++)).toBe(0);
    expect(updates).toBe(0);
  });
});
