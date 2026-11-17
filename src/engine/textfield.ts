/**
 * Text entry for canvas games. Wraps an invisible <input> so typing works with any
 * keyboard layout, paste, IME and phone on-screen keyboards. Turn it on with
 * `setActive(true)` while the game wants typed text, and read `value` in `update`.
 *
 * Key presses still reach `Input`, so Enter/Escape/arrows work as normal.
 */
export class TextField {
  private readonly el: HTMLInputElement;
  private active = false;

  /** `tapTarget` is the canvas: tapping it re-opens the keyboard on phones. */
  constructor(tapTarget: HTMLElement, maxLength = 48) {
    const el = document.createElement('input');
    el.type = 'text';
    el.maxLength = maxLength;
    el.autocomplete = 'off';
    el.spellcheck = false;
    el.setAttribute('autocapitalize', 'off');
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('aria-label', 'Search');
    // Off-screen but focusable. 16px stops iOS zooming in on focus.
    Object.assign(el.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '1px',
      height: '1px',
      opacity: '0',
      fontSize: '16px',
      border: '0',
      padding: '0',
      pointerEvents: 'none',
    });
    // Keys the game uses for navigation shouldn't also move focus or the caret.
    el.addEventListener('keydown', (e) => {
      if (['Tab', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) e.preventDefault();
    });
    document.body.append(el);
    this.el = el;

    // Focus from inside a real user gesture so phones show the keyboard.
    tapTarget.addEventListener('click', () => {
      if (this.active) el.focus();
    });
  }

  get value(): string {
    return this.el.value;
  }

  set value(text: string) {
    this.el.value = text;
  }

  /** Caret position within `value`. */
  get caret(): number {
    return this.el.selectionStart ?? this.el.value.length;
  }

  get focused(): boolean {
    return document.activeElement === this.el;
  }

  setActive(active: boolean): void {
    if (active === this.active) return;
    this.active = active;
    if (active) this.el.focus();
    else this.el.blur();
  }
}
