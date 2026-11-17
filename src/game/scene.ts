import type { Input } from '../engine/input';
import type { MouseLook } from '../engine/mouselook';
import type { TextField } from '../engine/textfield';
import type { TouchControls } from '../engine/touch';

/** Pointer state in stage coordinates (see theme W/H). */
export interface Mouse {
  x: number;
  y: number;
  inside: boolean;
  /** True if the pointer moved since the last update. */
  moved: boolean;
  clicked: boolean;
  wheel: number;
  /** Finger drag since the last update, in stage units (positive = down). */
  drag: number;
}

export interface Controls {
  keys: Input;
  /** Pointer in stage coordinates (the 960x540 layout used by the 2D screens). */
  mouse: Mouse;
  /** Pointer in real CSS pixels, for aiming in the 3D view. */
  pixel: { x: number; y: number; inside: boolean };
  /** Window size in CSS pixels. */
  view: { width: number; height: number };
  look: MouseLook;
  /** Thumb-stick, drag-to-look and buttons for phones. */
  touch: TouchControls;
  text: TextField;
  /** Set during update to change the mouse cursor, e.g. 'pointer' over buttons. */
  cursor: string;
}

export interface Scene {
  /** If true, the scene below is drawn first (for pop-ups). */
  readonly overlay?: boolean;
  /** If true, the 2D canvas is cleared rather than painted black, so the 3D view shows through. */
  readonly transparent?: boolean;
  /** Called when this scene becomes the top of the stack. */
  resume?(): void;
  /** Called when another scene covers this one, or it is removed. */
  pause?(): void;
  update(dt: number): void;
  /** Draws in real screen pixels, before `render`. Used by the 3D store and its HUD. */
  renderScreen?(ctx: CanvasRenderingContext2D, width: number, height: number, alpha: number): void;
  /** Draws on the fixed 960x540 stage. */
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
