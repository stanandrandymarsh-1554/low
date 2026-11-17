/**
 * Touch controls for walking around a 3D scene: a floating thumb-stick on the left, drag to
 * look anywhere else, taps, and on-screen buttons the scene registers each frame.
 *
 * Everything is in CSS pixels relative to the canvas. The scene reads `move`, `consumeLook()`,
 * `consumeTap()` and `wasTapped(name)` during `update`.
 */

export interface TouchZone {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** How far the thumb can travel from where it landed, and the dead zone in the middle. */
export const STICK_RADIUS = 58;
const STICK_DEAD = 0.12;
/** A touch that moves less than this far, and ends quickly, is a tap. */
const TAP_TRAVEL = 12;
const TAP_MS = 350;

export interface StickVector {
  /** Right is positive. */
  x: number;
  /** Down is positive (screen coordinates). */
  y: number;
  /** 0..1 after the dead zone is removed. */
  magnitude: number;
}

/** Turns a thumb offset (pixels from where it landed) into a stick position. */
export function stickVector(
  dx: number,
  dy: number,
  radius = STICK_RADIUS,
  dead = STICK_DEAD,
): StickVector {
  const len = Math.hypot(dx, dy);
  const raw = Math.min(len / radius, 1);
  if (raw < dead || len === 0) return { x: 0, y: 0, magnitude: 0 };
  const magnitude = (raw - dead) / (1 - dead);
  return { x: (dx / len) * magnitude, y: (dy / len) * magnitude, magnitude };
}

export function isTap(travel: number, ms: number): boolean {
  return travel < TAP_TRAVEL && ms < TAP_MS;
}

type Grab =
  | { kind: 'stick' }
  | { kind: 'look'; lastX: number; lastY: number; startX: number; startY: number; at: number }
  | { kind: 'button'; name: string };

export class TouchControls {
  /** True once a finger has been used, or from the start on a phone-sized touch screen. */
  active: boolean;
  /** Buttons to hit-test; set by the scene each frame, in CSS pixels. */
  zones: TouchZone[] = [];
  /** Set false while another screen is on top, so gestures don't pile up. */
  enabled = true;
  readonly stick = { on: false, originX: 0, originY: 0, knobX: 0, knobY: 0 };

  private readonly grabs = new Map<number, Grab>();
  private lookX = 0;
  private lookY = 0;
  private tap: { x: number; y: number } | null = null;
  private readonly tapped = new Set<string>();
  private readonly held = new Set<string>();

  constructor(private readonly target: HTMLElement) {
    this.active = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    target.addEventListener('pointerdown', (e) => this.down(e));
    target.addEventListener('pointermove', (e) => this.move(e));
    target.addEventListener('pointerup', (e) => this.up(e, true));
    target.addEventListener('pointercancel', (e) => this.up(e, false));
    target.addEventListener('contextmenu', (e) => e.preventDefault());
    // Using the mouse or keyboard on a hybrid device hands control back to them.
    window.addEventListener('keydown', () => {
      this.active = false;
    });
  }

  private local(e: PointerEvent): { x: number; y: number } {
    const r = this.target.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private down(e: PointerEvent): void {
    if (e.pointerType === 'mouse') {
      this.active = false;
      return;
    }
    this.active = true;
    if (!this.enabled) return;
    const p = this.local(e);
    const zone = this.zones.find(
      (z) => p.x >= z.x && p.x < z.x + z.w && p.y >= z.y && p.y < z.y + z.h,
    );
    if (zone) {
      this.grabs.set(e.pointerId, { kind: 'button', name: zone.name });
      this.held.add(zone.name);
    } else if (p.x < this.target.clientWidth * 0.45 && !this.stick.on) {
      this.grabs.set(e.pointerId, { kind: 'stick' });
      Object.assign(this.stick, {
        on: true,
        originX: p.x,
        originY: p.y,
        knobX: p.x,
        knobY: p.y,
      });
    } else {
      this.grabs.set(e.pointerId, {
        kind: 'look',
        lastX: p.x,
        lastY: p.y,
        startX: p.x,
        startY: p.y,
        at: performance.now(),
      });
    }
    try {
      this.target.setPointerCapture(e.pointerId);
    } catch {
      // Not every browser lets a touch be captured; dragging still works inside the canvas.
    }
  }

  private move(e: PointerEvent): void {
    const grab = this.grabs.get(e.pointerId);
    if (!grab) return;
    const p = this.local(e);
    if (grab.kind === 'stick') {
      const dx = p.x - this.stick.originX;
      const dy = p.y - this.stick.originY;
      const len = Math.hypot(dx, dy);
      const k = len > STICK_RADIUS ? STICK_RADIUS / len : 1;
      this.stick.knobX = this.stick.originX + dx * k;
      this.stick.knobY = this.stick.originY + dy * k;
    } else if (grab.kind === 'look') {
      this.lookX += p.x - grab.lastX;
      this.lookY += p.y - grab.lastY;
      grab.lastX = p.x;
      grab.lastY = p.y;
    }
  }

  private up(e: PointerEvent, ok: boolean): void {
    const grab = this.grabs.get(e.pointerId);
    if (!grab) return;
    this.grabs.delete(e.pointerId);
    const p = this.local(e);
    if (grab.kind === 'stick') this.stick.on = false;
    else if (grab.kind === 'button') {
      this.held.delete(grab.name);
      const zone = this.zones.find((z) => z.name === grab.name);
      if (
        ok &&
        zone &&
        p.x >= zone.x &&
        p.x < zone.x + zone.w &&
        p.y >= zone.y &&
        p.y < zone.y + zone.h
      ) {
        this.tapped.add(grab.name);
      }
    } else if (
      ok &&
      isTap(Math.hypot(p.x - grab.startX, p.y - grab.startY), performance.now() - grab.at)
    ) {
      this.tap = p;
    }
  }

  /** Walk input from the thumb-stick: forward and strafe in -1..1, and whether to run. */
  get walk(): { forward: number; strafe: number; run: boolean } {
    if (!this.stick.on) return { forward: 0, strafe: 0, run: false };
    const v = stickVector(
      this.stick.knobX - this.stick.originX,
      this.stick.knobY - this.stick.originY,
    );
    return { forward: -v.y, strafe: v.x, run: v.magnitude > 0.95 };
  }

  /** Drag movement since the last call, in pixels. */
  consumeLook(): { dx: number; dy: number } {
    const out = { dx: this.lookX, dy: this.lookY };
    this.lookX = 0;
    this.lookY = 0;
    return out;
  }

  /** A quick tap since the last call (where the finger lifted), or null. */
  consumeTap(): { x: number; y: number } | null {
    const t = this.tap;
    this.tap = null;
    return t;
  }

  /** True once after a button was tapped. */
  wasTapped(name: string): boolean {
    return this.tapped.has(name);
  }

  isHeld(name: string): boolean {
    return this.held.has(name);
  }

  /** Call at the end of each update to clear one-shot events. */
  endFrame(): void {
    this.tapped.clear();
  }

  /** Forget every touch in progress (when another screen takes over, or comes back). */
  reset(): void {
    this.grabs.clear();
    this.held.clear();
    this.tapped.clear();
    this.stick.on = false;
    this.lookX = this.lookY = 0;
    this.tap = null;
  }
}
