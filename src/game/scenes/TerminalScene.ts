import { fitText } from '../../engine/text';
import type { Entry } from '../data/types';
import { scanlines, setFont, text } from '../draw/ui';
import { inRect, type Controls, type Rect, type Scene } from '../scene';
import { search, SEARCH_MODES, type SearchHit, type SearchMode } from '../search';
import { C, H, W } from '../theme';

const SCREEN: Rect = { x: 70, y: 34, w: 820, h: 440 };
const PAD = 22;
const LINE = 24;
const LIST_TOP = SCREEN.y + 196;
const VISIBLE = 9;

const HINTS: Record<SearchMode, string> = {
  all: 'try: coffee, caffeine, focus, stimulants, 4h',
  name: 'common, latin or brand name',
  compound: 'e.g. caffeine - lists every plant that contains it',
  effect: 'e.g. euphoria, sedation, focus',
  duration: 'try: short (<2h), medium (2-6h), long (6-16h), 4h, under 90m, onset under 30m',
};

/** The store computer: a green-screen terminal for searching the catalogue. */
export class TerminalScene implements Scene {
  private mode: SearchMode = 'all';
  private hits: SearchHit[] = [];
  private lastQuery: string | null = null;
  private lastMode: SearchMode | null = null;
  private sel = 0;
  private scroll = 0;
  private t = 0;
  private hoverRow = -1;
  private hoverMode = -1;
  private hoverExit = false;
  private dragged = 0;

  constructor(
    private readonly entries: readonly Entry[],
    private readonly controls: Controls,
    private readonly close: () => void,
    private readonly openTape: (entry: Entry) => void,
  ) {}

  resume(): void {
    this.controls.text.setActive(true);
  }

  pause(): void {
    this.controls.text.setActive(false);
  }

  private modeRect(i: number): Rect {
    return { x: SCREEN.x + PAD + i * 150, y: SCREEN.y + 74, w: 140, h: 28 };
  }

  private rowRect(i: number): Rect {
    return {
      x: SCREEN.x + PAD - 6,
      y: LIST_TOP + i * LINE - 18,
      w: SCREEN.w - PAD * 2 + 12,
      h: LINE,
    };
  }

  private exitRect(): Rect {
    return { x: SCREEN.x + SCREEN.w - 150, y: SCREEN.y + 10, w: 132, h: 26 };
  }

  update(dt: number): void {
    this.t += dt;
    const { keys, mouse, text: field } = this.controls;

    if (keys.wasPressed('Escape')) {
      this.close();
      return;
    }

    if (keys.wasPressed('Tab')) {
      const back = keys.isDown('ShiftLeft', 'ShiftRight');
      const i = SEARCH_MODES.indexOf(this.mode) + (back ? -1 : 1);
      this.mode = SEARCH_MODES[(i + SEARCH_MODES.length) % SEARCH_MODES.length] ?? 'all';
    }

    this.hoverMode = SEARCH_MODES.findIndex((_, i) => inRect(mouse, this.modeRect(i)));
    this.hoverExit = inRect(mouse, this.exitRect());
    if (mouse.clicked && this.hoverMode >= 0) this.mode = SEARCH_MODES[this.hoverMode] ?? 'all';
    if (mouse.clicked && this.hoverExit) {
      this.close();
      return;
    }

    const query = field.value;
    if (query !== this.lastQuery || this.mode !== this.lastMode) {
      this.hits = search(this.entries, query, this.mode);
      this.lastQuery = query;
      this.lastMode = this.mode;
      this.sel = 0;
      this.scroll = 0;
    }

    const n = this.hits.length;
    if (keys.wasPressed('ArrowDown')) this.sel++;
    if (keys.wasPressed('ArrowUp')) this.sel--;
    if (keys.wasPressed('PageDown')) this.sel += VISIBLE;
    if (keys.wasPressed('PageUp')) this.sel -= VISIBLE;
    // The wheel scrolls a row at a time; so does dragging a finger up the list.
    let scrolled = Math.sign(mouse.wheel);
    this.dragged += mouse.drag;
    const rows = Math.trunc(this.dragged / LINE);
    if (rows) {
      scrolled -= rows;
      this.dragged -= rows * LINE;
    }
    this.scroll += scrolled;
    this.scroll = Math.max(0, Math.min(this.scroll, n - VISIBLE));
    this.sel = Math.max(0, Math.min(this.sel, n - 1));
    if (scrolled) {
      // Keep the highlight on screen rather than snapping the list back to it.
      this.sel = Math.max(this.scroll, Math.min(this.sel, this.scroll + VISIBLE - 1, n - 1));
    } else {
      if (this.sel < this.scroll) this.scroll = this.sel;
      if (this.sel >= this.scroll + VISIBLE) this.scroll = this.sel - VISIBLE + 1;
      this.scroll = Math.max(0, Math.min(this.scroll, n - VISIBLE));
    }

    this.hoverRow = -1;
    for (let i = 0; i < Math.min(VISIBLE, n - this.scroll); i++) {
      if (inRect(mouse, this.rowRect(i))) this.hoverRow = this.scroll + i;
    }
    if (this.hoverRow >= 0 && mouse.moved) this.sel = this.hoverRow;
    if (this.hoverRow >= 0 || this.hoverMode >= 0 || this.hoverExit)
      this.controls.cursor = 'pointer';

    const chosen = this.hits[this.sel];
    if (
      chosen &&
      (keys.wasPressed('Enter', 'NumpadEnter') || (mouse.clicked && this.hoverRow >= 0))
    ) {
      this.openTape(chosen.entry);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, W, H);

    // Monitor casing.
    ctx.fillStyle = '#d9d2bf';
    ctx.beginPath();
    ctx.roundRect(SCREEN.x - 34, SCREEN.y - 24, SCREEN.w + 68, SCREEN.h + 70, 26);
    ctx.fill();
    ctx.fillStyle = '#bdb5a0';
    ctx.fillRect(SCREEN.x + SCREEN.w - 120, SCREEN.y + SCREEN.h + 16, 90, 12);
    text(ctx, 'LOWTEK 9000', SCREEN.x, SCREEN.y + SCREEN.h + 32, {
      size: 10,
      head: true,
      color: '#7a725f',
    });
    ctx.fillStyle = this.t % 2 < 1.8 ? C.gold : '#3a2a08';
    ctx.beginPath();
    ctx.arc(SCREEN.x + SCREEN.w - 6, SCREEN.y + SCREEN.h + 22, 4, 0, Math.PI * 2);
    ctx.fill();

    // Screen.
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, 18);
    ctx.fillStyle = C.crtBg;
    ctx.fill();
    ctx.clip();
    const glow = ctx.createRadialGradient(W / 2, H / 2 - 20, 50, W / 2, H / 2 - 20, 520);
    glow.addColorStop(0, 'rgba(255,180,58,0.09)');
    glow.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = glow;
    ctx.fillRect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
    this.drawScreen(ctx);
    scanlines(ctx, SCREEN, 0.22);
    ctx.restore();
  }

  /** Horizontal divider made of dashes, like a text-mode screen. */
  private rule(ctx: CanvasRenderingContext2D, y: number, double = false): void {
    ctx.fillStyle = C.crtDim;
    for (let x = SCREEN.x + PAD; x < SCREEN.x + SCREEN.w - PAD; x += 10) {
      ctx.fillRect(x, y, 6, 2);
      if (double) ctx.fillRect(x, y + 4, 6, 2);
    }
  }

  private drawScreen(ctx: CanvasRenderingContext2D): void {
    const x = SCREEN.x + PAD;
    const right = SCREEN.x + SCREEN.w - PAD;
    const g = { size: 22, color: C.crt };
    const dim = { size: 20, color: C.crtDim };
    const measure = (s: string) => ctx.measureText(s).width;

    text(ctx, 'LOW BOTANICA CATALOGUE SYSTEM v1.0', x, SCREEN.y + 30, {
      ...g,
      glow: C.crt,
      glowSize: 6,
    });
    const ex = this.exitRect();
    ctx.strokeStyle = C.crt;
    ctx.lineWidth = 1;
    if (this.hoverExit) {
      ctx.fillStyle = C.crt;
      ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
    }
    ctx.strokeRect(ex.x + 0.5, ex.y + 0.5, ex.w - 1, ex.h - 1);
    text(ctx, this.controls.touch.active ? 'EXIT' : '[ESC] EXIT', ex.x + ex.w / 2, ex.y + 19, {
      ...dim,
      color: this.hoverExit ? C.crtBg : C.crt,
      align: 'center',
    });
    this.rule(ctx, SCREEN.y + 50, true);

    // Mode tabs.
    SEARCH_MODES.forEach((m, i) => {
      const r = this.modeRect(i);
      const on = m === this.mode;
      if (on || i === this.hoverMode) {
        ctx.fillStyle = on ? C.crt : 'rgba(255,180,58,0.22)';
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
      text(ctx, m.toUpperCase(), r.x + r.w / 2, r.y + 21, {
        size: 22,
        color: on ? C.crtBg : C.crt,
        align: 'center',
      });
    });
    if (!this.controls.touch.active) {
      text(ctx, 'TAB: change search type', right, SCREEN.y + 124, { ...dim, align: 'right' });
    }

    // Query line.
    const q = this.controls.text.value.toUpperCase();
    const qy = SCREEN.y + 150;
    text(ctx, 'SEARCH>', x, qy, g);
    setFont(ctx, 22);
    const qx = x + measure('SEARCH> ') + 4;
    text(ctx, q, qx, qy, g);
    if (this.t % 1 < 0.55) {
      setFont(ctx, 22);
      const cx = qx + measure(q.slice(0, this.controls.text.caret));
      ctx.fillStyle = C.crt;
      ctx.fillRect(cx, qy - 16, 10, 19);
    }
    if (!q) {
      const tapToType = this.controls.touch.active && !this.controls.text.focused;
      text(ctx, tapToType ? 'TAP ANYWHERE TO TYPE' : HINTS[this.mode], qx + 18, qy, dim);
    }
    this.rule(ctx, qy + 18);

    // Results.
    const n = this.hits.length;
    if (n === 0) {
      text(ctx, 'NO TITLES FOUND.', x, LIST_TOP, g);
      text(
        ctx,
        this.mode === 'duration' ? HINTS.duration : 'Try another word or search type.',
        x,
        LIST_TOP + LINE,
        dim,
      );
    }
    const nameW = 230;
    const kindW = 120;
    for (let i = 0; i < Math.min(VISIBLE, n - this.scroll); i++) {
      const idx = this.scroll + i;
      const hit = this.hits[idx];
      if (!hit) continue;
      const y = LIST_TOP + i * LINE;
      const selected = idx === this.sel;
      if (selected) {
        const r = this.rowRect(i);
        ctx.fillStyle = C.crt;
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
      const color = selected ? C.crtBg : C.crt;
      setFont(ctx, 22);
      text(
        ctx,
        (selected ? '> ' : '  ') + fitText(hit.entry.name.toUpperCase(), nameW - 20, measure),
        x,
        y,
        {
          size: 22,
          color,
        },
      );
      text(ctx, hit.entry.kind === 'botanical' ? 'BOTANICAL' : 'SYNTHETIC', x + nameW, y, {
        size: 22,
        color,
      });
      const reason =
        hit.reason || (hit.entry.kind === 'botanical' ? hit.entry.latin : hit.entry.chemicalClass);
      setFont(ctx, 20);
      text(ctx, fitText(reason, right - (x + nameW + kindW), measure), x + nameW + kindW, y, {
        size: 20,
        color: selected ? C.crtBg : C.crtDim,
      });
    }

    const footY = SCREEN.y + SCREEN.h - 16;
    this.rule(ctx, footY - 26);
    const shown = n ? `${this.scroll + 1}-${Math.min(n, this.scroll + VISIBLE)} OF ${n}` : '0';
    text(ctx, `${n} TITLE${n === 1 ? '' : 'S'} FOUND   [${shown}]`, x, footY, g);
    const keys = this.controls.touch.active
      ? 'DRAG TO SCROLL   TAP A TITLE'
      : '↑↓ SELECT   ENTER VIEW TAPE';
    text(ctx, keys, right, footY, { ...g, align: 'right' });
  }
}
