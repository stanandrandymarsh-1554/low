import { fitText } from '../../engine/text';
import { buildAisles, type Aisle } from '../aisles';
import type { Entry } from '../data/types';
import { drawTape } from '../draw/tape';
import { button, keyHint, ratingSticker, scanlines, setFont, text } from '../draw/ui';
import { inRect, type Controls, type Rect, type Scene } from '../scene';
import { C, H, TOXICITY_STYLE, W } from '../theme';
import { formatHours } from '../timing';

const COLS = 7;
const ROWS = 3;
const TAPE_W = 68;
const TAPE_H = 98;
const GAP_X = 16;
const ROW_H = 112;
const SHELF_X = 24;
const SHELF_W = 624;
const SHELF_Y = 150;
const TAPES_X = SHELF_X + (SHELF_W - (COLS * TAPE_W + (COLS - 1) * GAP_X)) / 2;

const PREV_AISLE: Rect = { x: SHELF_X, y: 102, w: 40, h: 34 };
const NEXT_AISLE: Rect = { x: SHELF_X + SHELF_W - 40, y: 102, w: 40, h: 34 };
const CRT: Rect = { x: 676, y: 146, w: 260, h: 150 };
const NOTICE_OK: Rect = { x: W / 2 - 90, y: 388, w: 180, h: 36 };

export type OpenTape = (entry: Entry) => void;

/** The shop floor: aisles of tapes, and the counter with the search computer. */
export class FloorScene implements Scene {
  private readonly aisles: Aisle[];
  private aisle = 0;
  private sel = 0;
  private scroll = 0;
  private t = 0;
  private showNotice = true;
  private hoverPrev = false;
  private hoverNext = false;
  private hoverCrt = false;
  private hoverOk = false;

  constructor(
    entries: readonly Entry[],
    private readonly controls: Controls,
    private readonly openSearch: () => void,
    private readonly openTape: OpenTape,
  ) {
    this.aisles = buildAisles(entries);
  }

  private get current(): Aisle {
    return this.aisles[this.aisle] ?? { name: '', entries: [] };
  }

  private slotRect(index: number): Rect {
    const col = index % COLS;
    const row = Math.floor(index / COLS) - this.scroll;
    return {
      x: TAPES_X + col * (TAPE_W + GAP_X),
      y: SHELF_Y + 4 + row * ROW_H,
      w: TAPE_W,
      h: TAPE_H,
    };
  }

  private changeAisle(delta: number): void {
    const n = this.aisles.length;
    this.aisle = (((this.aisle + delta) % n) + n) % n;
    this.sel = 0;
    this.scroll = 0;
  }

  update(dt: number): void {
    this.t += dt;
    const { keys, mouse } = this.controls;

    if (this.showNotice) {
      this.hoverOk = inRect(mouse, NOTICE_OK);
      if (this.hoverOk) this.controls.cursor = 'pointer';
      if (keys.wasPressed('Enter', 'Space', 'Escape') || (mouse.clicked && this.hoverOk)) {
        this.showNotice = false;
      }
      return;
    }

    const count = this.current.entries.length;
    if (keys.wasPressed('ArrowRight', 'KeyD')) this.sel++;
    if (keys.wasPressed('ArrowLeft', 'KeyA')) this.sel--;
    if (keys.wasPressed('ArrowDown', 'KeyS')) this.sel += COLS;
    if (keys.wasPressed('ArrowUp', 'KeyW')) this.sel -= COLS;
    this.sel = Math.max(0, Math.min(this.sel, count - 1));
    if (keys.wasPressed('BracketRight', 'KeyE', 'PageDown')) this.changeAisle(1);
    if (keys.wasPressed('BracketLeft', 'KeyQ', 'PageUp')) this.changeAisle(-1);

    // Scroll the shelf so the selected row is visible; the wheel scrolls rows too.
    const rows = Math.ceil(count / COLS);
    const maxScroll = Math.max(0, rows - ROWS);
    if (mouse.wheel)
      this.scroll = Math.max(0, Math.min(maxScroll, this.scroll + Math.sign(mouse.wheel)));
    const selRow = Math.floor(this.sel / COLS);
    if (!mouse.wheel) {
      if (selRow < this.scroll) this.scroll = selRow;
      if (selRow >= this.scroll + ROWS) this.scroll = selRow - ROWS + 1;
    }

    this.hoverPrev = inRect(mouse, PREV_AISLE);
    this.hoverNext = inRect(mouse, NEXT_AISLE);
    this.hoverCrt = inRect(mouse, CRT);
    let hoverTape = -1;
    for (let i = this.scroll * COLS; i < Math.min(count, (this.scroll + ROWS) * COLS); i++) {
      if (inRect(mouse, this.slotRect(i))) hoverTape = i;
    }
    if (hoverTape >= 0 && (mouse.moved || mouse.clicked)) this.sel = hoverTape;
    if (this.hoverPrev || this.hoverNext || this.hoverCrt || hoverTape >= 0) {
      this.controls.cursor = 'pointer';
    }

    if (mouse.clicked) {
      if (this.hoverPrev) this.changeAisle(-1);
      if (this.hoverNext) this.changeAisle(1);
      if (this.hoverCrt) this.openSearch();
    }

    const selected = this.current.entries[this.sel];
    if (selected && (keys.wasPressed('Enter', 'Space') || (mouse.clicked && hoverTape >= 0))) {
      this.openTape(selected);
    } else if (keys.wasPressed('Slash', 'KeyF', 'Tab')) {
      this.openSearch();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.drawRoom(ctx);
    this.drawSign(ctx);
    this.drawAisleSign(ctx);
    this.drawShelves(ctx);
    this.drawCounter(ctx);
    this.drawHelp(ctx);
    if (this.showNotice) this.drawNotice(ctx);
  }

  private drawRoom(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = C.wall;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.wallStripe;
    for (let x = -H; x < W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + H, 0);
      ctx.lineTo(x + H + 16, 0);
      ctx.lineTo(x + 16, H);
      ctx.fill();
    }
    // Arcade carpet.
    ctx.fillStyle = C.carpet;
    ctx.fillRect(0, 490, W, H - 490);
    const colours = [C.pink, C.cyan, C.yellow, C.lime];
    for (let i = 0; i < 70; i++) {
      const x = (i * 137) % W;
      const y = 496 + ((i * 53) % 40);
      ctx.strokeStyle = colours[i % colours.length] ?? C.pink;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (i % 3 === 0) ctx.arc(x, y, 3, 0, Math.PI * 2);
      else if (i % 3 === 1) {
        ctx.moveTo(x - 5, y + 3);
        ctx.lineTo(x, y - 3);
        ctx.lineTo(x + 5, y + 3);
      } else {
        ctx.moveTo(x - 6, y);
        ctx.quadraticCurveTo(x - 3, y - 5, x, y);
        ctx.quadraticCurveTo(x + 3, y + 5, x + 6, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawSign(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, W, 92);
    ctx.fillStyle = C.pink;
    ctx.fillRect(0, 90, W, 2);

    // Occasional neon flicker.
    const flicker = Math.sin(this.t * 37) > 0.97 || (this.t % 7 > 6.85 && this.t % 7 < 6.95);
    const pink = flicker ? '#5a1a3e' : C.pink;
    text(ctx, 'LOW BOTANICA', 24, 50, {
      size: 30,
      head: true,
      color: pink,
      glow: flicker ? undefined : C.pink,
      glowSize: 18,
    });
    text(ctx, 'HERB & VIDEO  ·  PSYCHOACTIVE PLANTS & SYNTHETICS INDEX', 26, 78, {
      size: 20,
      color: C.cyan,
      glow: C.cyan,
      glowSize: 6,
    });

    // OPEN sign.
    const ox = 820;
    ctx.strokeStyle = C.lime;
    ctx.lineWidth = 2;
    ctx.save();
    ctx.shadowColor = C.lime;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(ox, 20, 112, 46, 10);
    ctx.stroke();
    ctx.restore();
    text(ctx, 'OPEN', ox + 56, 44, {
      size: 18,
      head: true,
      color: C.lime,
      align: 'center',
      baseline: 'middle',
      glow: C.lime,
    });
    text(ctx, 'EST. 1994', ox + 56, 84, { size: 16, color: C.dim, align: 'center' });
  }

  private drawAisleSign(ctx: CanvasRenderingContext2D): void {
    const x = SHELF_X + 46;
    const w = SHELF_W - 92;
    // Hanging wires.
    ctx.strokeStyle = C.faint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 30, 92);
    ctx.lineTo(x + 30, 102);
    ctx.moveTo(x + w - 30, 92);
    ctx.lineTo(x + w - 30, 102);
    ctx.stroke();
    ctx.fillStyle = C.yellow;
    ctx.fillRect(x, 102, w, 34);
    const name = this.current.name.toUpperCase();
    text(ctx, `AISLE ${this.aisle + 1}`, x + 12, 124, { size: 10, head: true, color: C.black });
    setFont(ctx, 14, true);
    text(
      ctx,
      fitText(name, w - 200, (s) => ctx.measureText(s).width),
      x + w / 2 + 20,
      125,
      {
        size: 14,
        head: true,
        color: C.black,
        align: 'center',
      },
    );
    text(ctx, `${this.current.entries.length} TITLES`, x + w - 12, 126, {
      size: 20,
      color: C.black,
      align: 'right',
    });
    button(ctx, PREV_AISLE, '<', this.hoverPrev, C.yellow);
    button(ctx, NEXT_AISLE, '>', this.hoverNext, C.yellow);
  }

  private drawShelves(ctx: CanvasRenderingContext2D): void {
    // Shelf unit back and sides.
    ctx.fillStyle = C.shelfShadow;
    ctx.fillRect(SHELF_X, SHELF_Y - 6, SHELF_W, ROWS * ROW_H + 8);
    ctx.fillStyle = C.shelf;
    ctx.fillRect(SHELF_X - 8, SHELF_Y - 10, 8, ROWS * ROW_H + 14);
    ctx.fillRect(SHELF_X + SHELF_W, SHELF_Y - 10, 8, ROWS * ROW_H + 14);

    const entries = this.current.entries;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const i = (row + this.scroll) * COLS + col;
        const r = this.slotRect(i);
        const entry = entries[i];
        if (entry) {
          const sel = i === this.sel && !this.showNotice;
          drawTape(ctx, entry, r.x, r.y - (sel ? 6 : 0), r.w, r.h, { selected: sel, t: this.t });
        } else {
          // Empty slot.
          ctx.strokeStyle = C.faint;
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1;
          ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
          ctx.setLineDash([]);
        }
      }
      // Shelf plank.
      const py = SHELF_Y + 4 + row * ROW_H + TAPE_H;
      ctx.fillStyle = C.shelfEdge;
      ctx.fillRect(SHELF_X - 8, py, SHELF_W + 16, 5);
      ctx.fillStyle = C.shelf;
      ctx.fillRect(SHELF_X - 8, py + 5, SHELF_W + 16, 5);
    }

    // Scroll indicator.
    const rows = Math.ceil(entries.length / COLS);
    if (rows > ROWS) {
      const trackH = ROWS * ROW_H - 10;
      const barH = (trackH * ROWS) / rows;
      const barY = SHELF_Y + (trackH - barH) * (this.scroll / (rows - ROWS));
      ctx.fillStyle = C.faint;
      ctx.fillRect(SHELF_X + SHELF_W + 2, SHELF_Y, 4, trackH);
      ctx.fillStyle = C.yellow;
      ctx.fillRect(SHELF_X + SHELF_W + 2, barY, 4, barH);
    }

    if (entries.length === 0) {
      text(ctx, 'THIS AISLE IS EMPTY', SHELF_X + SHELF_W / 2, SHELF_Y + 160, {
        size: 14,
        head: true,
        color: C.dim,
        align: 'center',
      });
    }
  }

  private drawCounter(ctx: CanvasRenderingContext2D): void {
    // CRT monitor.
    const m = CRT;
    ctx.fillStyle = '#d9d2bf';
    ctx.beginPath();
    ctx.roundRect(m.x, m.y, m.w, m.h, 10);
    ctx.fill();
    if (this.hoverCrt) {
      ctx.strokeStyle = C.yellow;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    const s: Rect = { x: m.x + 14, y: m.y + 12, w: m.w - 28, h: m.h - 36 };
    ctx.fillStyle = C.crtBg;
    ctx.beginPath();
    ctx.roundRect(s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    text(ctx, 'CATALOGUE SEARCH', s.x + 10, s.y + 24, {
      size: 20,
      color: C.crt,
      glow: C.crt,
      glowSize: 6,
    });
    const cursor = this.t % 1 < 0.5 ? '_' : ' ';
    text(ctx, `> TYPE TO SEARCH${cursor}`, s.x + 10, s.y + 50, { size: 20, color: C.crt });
    text(ctx, 'PLANT·COMPOUND·EFFECT·TIME', s.x + 10, s.y + 76, { size: 18, color: C.crtDim });
    scanlines(ctx, s);
    text(ctx, 'PRESS / OR CLICK', m.x + m.w / 2, m.y + m.h - 8, {
      size: 16,
      color: '#5d5648',
      align: 'center',
    });

    // Counter top with the selected tape's details.
    const cx = 668;
    const cy = 306;
    ctx.fillStyle = '#2a1d4f';
    ctx.fillRect(cx, cy, 276, 184);
    ctx.fillStyle = C.pink;
    ctx.fillRect(cx, cy, 276, 4);

    const entry = this.current.entries[this.sel];
    if (!entry) {
      text(ctx, 'Pick a tape off the shelf.', cx + 14, cy + 34, { size: 20, color: C.dim });
      return;
    }
    const measure = (str: string) => ctx.measureText(str).width;
    setFont(ctx, 12, true);
    text(ctx, fitText(entry.name.toUpperCase(), 200, measure), cx + 14, cy + 30, {
      size: 12,
      head: true,
      color: C.white,
    });
    ratingSticker(ctx, entry.toxicity, cx + 250, cy + 30, 16);
    setFont(ctx, 18);
    const sub = entry.kind === 'botanical' ? entry.latin : entry.chemicalClass;
    text(ctx, fitText(sub, 210, measure), cx + 14, cy + 52, { size: 18, color: C.dim });
    const lines: [string, string][] = [
      ['TYPE', entry.kind === 'botanical' ? 'Botanical' : 'Synthetic'],
      ['AISLE', entry.aisle],
      ['RUNS', formatHours(entry.timing.totalHours)],
      ['RATED', TOXICITY_STYLE[entry.toxicity].long.toLowerCase()],
      ['EFFECTS', entry.effects.join(', ')],
    ];
    setFont(ctx, 18);
    lines.forEach(([k, v], i) => {
      const y = cy + 80 + i * 20;
      text(ctx, k, cx + 14, y, { size: 18, color: C.yellow });
      setFont(ctx, 18);
      text(ctx, fitText(v, 180, measure), cx + 86, y, { size: 18, color: C.white });
    });
  }

  private drawHelp(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(7,4,15,0.85)';
    ctx.fillRect(0, H - 34, W, 34);
    let x = 16;
    const y = H - 12;
    x = keyHint(ctx, x, y, '← ↑ ↓ →', 'browse');
    x = keyHint(ctx, x, y, 'Q/E', 'change aisle');
    x = keyHint(ctx, x, y, 'ENTER', 'pick up tape');
    keyHint(ctx, x, y, '/', 'search catalogue');
  }

  private drawNotice(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(7,4,15,0.8)';
    ctx.fillRect(0, 0, W, H);
    const r: Rect = { x: W / 2 - 300, y: 110, w: 600, h: 330 };
    ctx.fillStyle = C.card;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = C.yellow;
    ctx.lineWidth = 3;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = C.yellow;
    ctx.fillRect(r.x, r.y, r.w, 40);
    text(ctx, 'STORE NOTICE', W / 2, r.y + 27, {
      size: 16,
      head: true,
      color: C.black,
      align: 'center',
    });
    const body = [
      'Welcome, member! Every tape in this store is an entry',
      'in an index of psychoactive plants and synthetics.',
      '',
      'This catalogue is for education and harm reduction.',
      'It is NOT medical advice, and the numbers on the boxes',
      'are rough ranges, not dosing guidance. Check current,',
      'reliable sources and your local laws.',
    ];
    body.forEach((line, i) =>
      text(ctx, line, W / 2, r.y + 80 + i * 24, { size: 22, color: C.white, align: 'center' }),
    );
    button(ctx, NOTICE_OK, 'ENTER STORE', this.hoverOk || this.t % 1 < 0.5, C.yellow);
  }
}
