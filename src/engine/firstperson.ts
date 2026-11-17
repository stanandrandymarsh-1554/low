import { moveCircle, type Box } from './collision';

export interface Pose {
  x: number;
  z: number;
  /** Radians, counter-clockwise from facing -z (so positive turns left). */
  yaw: number;
  /** Radians; positive looks up. */
  pitch: number;
}

export interface FirstPersonOptions {
  /** Collision radius in metres. */
  radius: number;
  walkSpeed: number;
  runSpeed: number;
  /** Keyboard turn rate, radians per second. */
  turnSpeed: number;
  /** Mouse look, radians per pixel. */
  lookSensitivity: number;
  /** Largest look up/down angle. */
  pitchLimit: number;
}

export interface FirstPersonInput {
  /** -1..1, positive walks forward. */
  forward: number;
  /** -1..1, positive steps right. */
  strafe: number;
  run: boolean;
  /** -1..1 keyboard turn, positive turns left. */
  turn: number;
  /** -1..1 keyboard look, positive looks up. */
  tilt: number;
  /** Mouse movement since the last step, in pixels (right / down are positive). */
  lookX: number;
  lookY: number;
}

export const NO_INPUT: FirstPersonInput = {
  forward: 0,
  strafe: 0,
  run: false,
  turn: 0,
  tilt: 0,
  lookX: 0,
  lookY: 0,
};

/**
 * A walking viewpoint on a floor plane: position, facing, and collision against boxes.
 * Advances in fixed steps; `poseAt(alpha)` interpolates for smooth rendering at any refresh rate.
 */
export class FirstPersonBody {
  private cur: Pose;
  private prev: Pose;

  constructor(
    private readonly opts: FirstPersonOptions,
    start: Pose,
  ) {
    this.cur = { ...start };
    this.prev = { ...start };
  }

  get pose(): Readonly<Pose> {
    return this.cur;
  }

  /** Teleports without interpolating. */
  place(pose: Pose): void {
    this.cur = { ...pose };
    this.prev = { ...pose };
  }

  step(dt: number, input: FirstPersonInput, boxes: readonly Box[]): void {
    this.prev = { ...this.cur };
    const o = this.opts;

    this.cur.yaw += input.turn * o.turnSpeed * dt - input.lookX * o.lookSensitivity;
    const pitch = this.cur.pitch + input.tilt * o.turnSpeed * dt - input.lookY * o.lookSensitivity;
    this.cur.pitch = Math.min(Math.max(pitch, -o.pitchLimit), o.pitchLimit);

    // Normalise so walking diagonally isn't faster, but let analogue input stay below 1.
    const len = Math.hypot(input.strafe, input.forward);
    const scale = len > 1 ? 1 / len : 1;
    const strafe = input.strafe * scale;
    const forward = input.forward * scale;
    const speed = (input.run ? o.runSpeed : o.walkSpeed) * dt;

    const sin = Math.sin(this.cur.yaw);
    const cos = Math.cos(this.cur.yaw);
    // Forward is (-sin, -cos) in (x, z); right is (cos, -sin).
    const dx = (cos * strafe - sin * forward) * speed;
    const dz = (-sin * strafe - cos * forward) * speed;
    moveCircle(this.cur, dx, dz, o.radius, boxes);
  }

  poseAt(alpha: number): Pose {
    const a = Math.min(Math.max(alpha, 0), 1);
    const { prev, cur } = this;
    return {
      x: prev.x + (cur.x - prev.x) * a,
      z: prev.z + (cur.z - prev.z) * a,
      yaw: prev.yaw + (cur.yaw - prev.yaw) * a,
      pitch: prev.pitch + (cur.pitch - prev.pitch) * a,
    };
  }
}
