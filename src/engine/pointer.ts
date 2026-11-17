import { isTap } from './touch';

/**
 * Mouse / touch / pen state for one element, in that element's CSS pixels.
 * Read during `update`; call `endFrame()` at the end of each update to clear
 * per-frame events (clicks, wheel).
 */
export class Pointer {
  x = 0;
  y = 0;
  /** True while the pointer is over the element (always true after a touch). */
  inside = false;
  private clicked = false;
  private wheel = 0;
  private drag = 0;
  private readonly touches = new Map<number, { x: number; y: number; at: number; lastY: number }>();

  constructor(private readonly target: HTMLElement) {
    const move = (e: PointerEvent) => {
      const rect = target.getBoundingClientRect();
      this.x = e.clientX - rect.left;
      this.y = e.clientY - rect.top;
      this.inside = true;
    };
    target.addEventListener('pointermove', (e) => {
      move(e);
      // A finger drag scrolls lists; it is not a click.
      const t = this.touches.get(e.pointerId);
      if (t) {
        this.drag += e.clientY - t.lastY;
        t.lastY = e.clientY;
      }
    });
    target.addEventListener('pointerdown', (e) => {
      move(e);
      if (e.pointerType === 'mouse') {
        if (e.button === 0) this.clicked = true;
      } else {
        this.touches.set(e.pointerId, {
          x: e.clientX,
          y: e.clientY,
          at: performance.now(),
          lastY: e.clientY,
        });
      }
    });
    // A touch counts as a click when the finger lifts after a short, still tap.
    target.addEventListener('pointerup', (e) => {
      const t = this.touches.get(e.pointerId);
      this.touches.delete(e.pointerId);
      if (t && isTap(Math.hypot(e.clientX - t.x, e.clientY - t.y), performance.now() - t.at)) {
        move(e);
        this.clicked = true;
      }
    });
    target.addEventListener('pointercancel', (e) => this.touches.delete(e.pointerId));
    target.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') this.inside = false;
    });
    target.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        // Normalise line/page deltas to pixels.
        const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? target.clientHeight : 1;
        this.wheel += e.deltaY * scale;
      },
      { passive: false },
    );
  }

  /** True on the first update after the primary button went down. */
  wasClicked(): boolean {
    return this.clicked;
  }

  /** Vertical scroll since the last frame, in pixels (positive = down). */
  wheelDelta(): number {
    return this.wheel;
  }

  /** Vertical finger drag since the last frame, in pixels (positive = down). */
  dragDelta(): number {
    return this.drag;
  }

  setCursor(cursor: string): void {
    if (this.target.style.cursor !== cursor) this.target.style.cursor = cursor;
  }

  endFrame(): void {
    this.clicked = false;
    this.wheel = 0;
    this.drag = 0;
  }
}
