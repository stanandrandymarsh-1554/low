/**
 * Mouse look via the Pointer Lock API. While locked the cursor is hidden and mouse
 * movement accumulates; `consume()` returns it since the last call.
 *
 * Browsers only allow locking from a user gesture, so locking is done in a click handler:
 * set `lockOnClick` each frame to say whether a click right now should lock the mouse.
 */
export class MouseLook {
  /** Whether a click on the target should lock the mouse. */
  lockOnClick = false;
  private dx = 0;
  private dy = 0;

  constructor(private readonly target: HTMLElement) {
    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.dx += e.movementX;
      this.dy += e.movementY;
    });
    target.addEventListener('click', () => {
      if (this.lockOnClick && !this.locked) this.lock();
    });
  }

  get locked(): boolean {
    return document.pointerLockElement === this.target;
  }

  lock(): void {
    // Newer browsers return a promise that can reject (e.g. locked again too soon).
    Promise.resolve(this.target.requestPointerLock()).catch(() => undefined);
  }

  unlock(): void {
    if (this.locked) document.exitPointerLock();
  }

  /** Mouse movement (pixels) since the last call. */
  consume(): { dx: number; dy: number } {
    const out = { dx: this.dx, dy: this.dy };
    this.dx = 0;
    this.dy = 0;
    return out;
  }
}
