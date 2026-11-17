import type { Input } from '../engine/input';
import type { TextField } from '../engine/textfield';

/** Pointer state in stage coordinates (see theme W/H). */
export interface Mouse {
  x: number;
  y: number;
  inside: boolean;
  /** True if the pointer moved since the last update. */
  moved: boolean;
  clicked: boolean;
  wheel: number;
}

export interface Controls {
  keys: Input;
  mouse: Mouse;
  text: TextField;
  /** Set during update to change the mouse cursor, e.g. 'pointer' over buttons. */
  cursor: string;
}

export interface Scene {
  /** If true, the scene below is drawn first (for pop-ups). */
  readonly overlay?: boolean;
  /** Called when this scene becomes the top of the stack. */
  resume?(): void;
  /** Called when another scene covers this one, or it is removed. */
  pause?(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export interface Stage {
  push(scene: Scene): void;
  pop(): void;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function inRect(p: { x: number; y: number }, r: Rect): boolean {
  return p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
}
