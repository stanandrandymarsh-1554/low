/**
 * Fixed-timestep game loop.
 *
 * `update` always runs with the same `dt` (default 1/60 s), so game logic is
 * deterministic regardless of the display's refresh rate. `render` runs once per
 * animation frame and receives `alpha` (0..1), how far we are between the last
 * update and the next one, for optional interpolation.
 */
export interface LoopCallbacks {
  update(dt: number): void;
  render(alpha: number): void;
}

export interface LoopOptions {
  /** Seconds per update tick. */
  step?: number;
  /** Clamp on elapsed frame time, so a backgrounded tab doesn't trigger a huge catch-up. */
  maxFrameTime?: number;
}

export class FixedStepper {
  readonly step: number;
  readonly maxFrameTime: number;
  private accumulator = 0;

  constructor({ step = 1 / 60, maxFrameTime = 0.25 }: LoopOptions = {}) {
    this.step = step;
    this.maxFrameTime = maxFrameTime;
  }

  /**
   * Advance by `frameTime` seconds, calling `update` zero or more times.
   * Returns the interpolation alpha for rendering.
   */
  advance(frameTime: number, update: (dt: number) => void): number {
    this.accumulator += Math.min(Math.max(frameTime, 0), this.maxFrameTime);
    while (this.accumulator >= this.step) {
      update(this.step);
      this.accumulator -= this.step;
    }
    return this.accumulator / this.step;
  }

  reset(): void {
    this.accumulator = 0;
  }
}

/** Starts a requestAnimationFrame loop. Returns a function that stops it. */
export function startLoop(callbacks: LoopCallbacks, options?: LoopOptions): () => void {
  const stepper = new FixedStepper(options);
  let last = performance.now();
  let handle = 0;

  const frame = (now: number) => {
    const alpha = stepper.advance((now - last) / 1000, callbacks.update);
    last = now;
    callbacks.render(alpha);
    handle = requestAnimationFrame(frame);
  };

  handle = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(handle);
}
