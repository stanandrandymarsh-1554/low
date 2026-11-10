/**
 * Keyboard state tracker. Query with `isDown` during `update`; `wasPressed`
 * is true only on the first update after a key goes down — call `endFrame()`
 * at the end of each update to clear it.
 */
export class Input {
  private readonly down = new Set<string>();
  private readonly pressed = new Set<string>();

  constructor(target: Window = window) {
    target.addEventListener('keydown', (e) => {
      if (!e.repeat) this.pressed.add(e.code);
      this.down.add(e.code);
    });
    target.addEventListener('keyup', (e) => this.down.delete(e.code));
    // Drop held keys when the window loses focus so nothing gets "stuck".
    target.addEventListener('blur', () => this.down.clear());
  }

  /** `code` is a KeyboardEvent.code, e.g. 'KeyW', 'ArrowLeft', 'Space'. */
  isDown(...codes: string[]): boolean {
    return codes.some((c) => this.down.has(c));
  }

  wasPressed(...codes: string[]): boolean {
    return codes.some((c) => this.pressed.has(c));
  }

  endFrame(): void {
    this.pressed.clear();
  }
}
