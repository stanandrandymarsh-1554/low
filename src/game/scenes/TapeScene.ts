import { wrapText } from '../../engine/text';
import { buildBackCover, subtitle, type Block } from '../backcover';
import type { Entry } from '../data/types';
import { drawSpecimen, entryHue } from '../draw/specimen';
import { button, keyHint, ratingSticker, setFont, text } from '../draw/ui';
import { inRect, type Controls, type Rect, type Scene } from '../scene';
import { C, H, TOXICITY_STYLE, W } from '../theme';

const CARD: Rect = { x: 36, y: 22, w: W - 72, h: H - 44 };
const BODY: Rect = { x: 318, y: 112, w: 576, h: 352 };
const BACK: Rect = { x: CARD.x + CARD.w - 140, y: CARD.y + CARD.h - 40, w: 124, h: 28 };
const SCROLL_STEP = 40;

/** The back of a tape box: everything the index knows about one entry. */
export class TapeScene implements Scene {
  readonly overlay = true;
  private readonly blocks: Block[];
  private scroll = 0;
  private contentH = 0;
  private t = 0;
  private hoverBack = false;

  constructor(
    private readonly entry: Entry,
    private readonly controls: Controls,
    private readonly close: () => void,
  ) {
    this.blocks = buildBackCover(entry);
  }

  update(dt: number): void {
    this.t += dt;
    const { keys, mouse } = this.controls;
    this.hoverBack = inRect(mouse, BACK);
    if (this.hoverBack) this.controls.cursor = 'pointer';
    if (
      keys.wasPressed('Escape', 'Backspace', 'Enter', 'Space') ||
      (mouse.clicked && (this.hoverBack || !inRect(mouse, CARD)))
    ) {
      this.close();
      return;
    }
    if (keys.isDown('ArrowDown', 'KeyS')) this.scroll += 360 * dt;
    if (keys.isDown('ArrowUp', 'KeyW')) this.scroll -= 360 * dt;
    if (keys.wasPressed('PageDown')) this.scroll += BODY.h - SCROLL_STEP;
    if (keys.wasPressed('PageUp')) this.scroll -= BODY.h - SCROLL_STEP;
    if (keys.wasPressed('Home')) this.scroll = 0;
    if (keys.wasPressed('End')) this.scroll = Infinity;
    this.scroll += mouse.wheel * 0.6;
    this.scroll = Math.max(0, Math.min(this.scroll, Math.max(0, this.contentH - BODY.h)));
  }

  render(ctx: CanvasRenderingContext2D): void {
    const e = this.entry;
    const hue = entryHue(e);

    ctx.fillStyle = 'rgba(20,14,9,0.82)';
    ctx.fillRect(0, 0, W, H);

    // Clamshell case and printed back cover.
    ctx.fillStyle = C.plastic;
    ctx.beginPath();
    ctx.roundRect(CARD.x - 6, CARD.y - 6, CARD.w + 12, CARD.h + 12, 10);
    ctx.fill();
    const grad = ctx.createLinearGradient(0, CARD.y, 0, CARD.y + CARD.h);
    grad.addColorStop(0, `hsl(${hue} 45% 14%)`);
    grad.addColorStop(1, C.card);
    ctx.fillStyle = grad;
    ctx.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);

    // Left column: cover, rating, kind.
    drawSpecimen(ctx, e, CARD.x + 22, CARD.y + 22, 214, 306, { t: this.t });
    ratingSticker(ctx, e.toxicity, CARD.x + 52, CARD.y + 372, 26);
    const tox = TOXICITY_STYLE[e.toxicity];
    text(ctx, 'RATED', CARD.x + 88, CARD.y + 364, { size: 18, color: C.dim });
    text(ctx, tox.long, CARD.x + 88, CARD.y + 384, { size: 20, color: tox.color });
    text(ctx, `AISLE: ${e.aisle.toUpperCase()}`, CARD.x + 22, CARD.y + 428, {
      size: 20,
      color: C.gold,
    });
    text(ctx, e.kind === 'botanical' ? 'BOTANICAL' : 'SYNTHETIC', CARD.x + 22, CARD.y + 450, {
      size: 20,
      color: e.kind === 'botanical' ? C.sage : C.teal,
    });

    // Title.
    const tx = BODY.x;
    setFont(ctx, 20, true);
    const titleLines = wrapText(e.name.toUpperCase(), BODY.w, (s) => ctx.measureText(s).width);
    const titleSize = titleLines.length > 1 ? 14 : 20;
    text(ctx, titleLines.slice(0, 2).join(' '), tx, CARD.y + 50, {
      size: titleSize,
      head: true,
      color: C.white,
      glow: `hsl(${hue} 90% 60%)`,
      glowSize: 10,
    });
    text(ctx, subtitle(e), tx, CARD.y + 78, { size: 22, color: C.dim });
    ctx.fillStyle = C.accent;
    ctx.fillRect(tx, CARD.y + 86, BODY.w, 2);

    // Scrolling body.
    ctx.save();
    ctx.beginPath();
    ctx.rect(BODY.x - 4, BODY.y - 8, BODY.w + 8, BODY.h + 8);
    ctx.clip();
    this.contentH = this.drawBlocks(ctx, BODY.x, BODY.y + 14 - this.scroll, BODY.w);
    ctx.restore();

    // Scrollbar.
    if (this.contentH > BODY.h) {
      const barH = Math.max(24, (BODY.h * BODY.h) / this.contentH);
      const barY = BODY.y + (BODY.h - barH) * (this.scroll / (this.contentH - BODY.h));
      ctx.fillStyle = C.faint;
      ctx.fillRect(BODY.x + BODY.w + 8, BODY.y, 4, BODY.h);
      ctx.fillStyle = C.gold;
      ctx.fillRect(BODY.x + BODY.w + 8, barY, 4, barH);
    }

    const footY = CARD.y + CARD.h - 20;
    const x = keyHint(ctx, BODY.x, footY, '↑↓', 'scroll');
    keyHint(ctx, x, footY, 'ESC', 'put it back');
    button(ctx, BACK, 'RETURN', this.hoverBack, C.gold);
  }

  /** Draws the blocks and returns their total height. */
  private drawBlocks(ctx: CanvasRenderingContext2D, x: number, top: number, w: number): number {
    let y = top;
    const wrap = (s: string, width: number) => wrapText(s, width, (t) => ctx.measureText(t).width);
    const para = (s: string, color: string = C.white, indent = 0) => {
      setFont(ctx, 21);
      for (const line of wrap(s, w - indent)) {
        text(ctx, line, x + indent, y, { size: 21, color });
        y += 21;
      }
    };

    for (const b of this.blocks) {
      switch (b.type) {
        case 'heading':
          y += 14;
          text(ctx, b.text, x, y, { size: 10, head: true, color: C.gold });
          y += 22;
          break;
        case 'warning':
          ctx.fillStyle = C.gold;
          ctx.fillRect(x, y - 16, w, 24);
          text(ctx, b.text, x + 8, y + 1, { size: 20, color: C.black });
          y += 30;
          break;
        case 'para':
          para(b.text);
          y += 4;
          break;
        case 'facts': {
          const labelW = 150;
          for (const [k, v] of b.rows) {
            text(ctx, k, x, y, { size: 20, color: C.teal });
            setFont(ctx, 21);
            for (const line of wrap(v, w - labelW)) {
              text(ctx, line, x + labelW, y, { size: 21, color: C.white });
              y += 21;
            }
          }
          y += 4;
          break;
        }
        case 'bullets':
          for (const item of b.items) {
            text(ctx, '*', x + 2, y + 2, { size: 21, color: C.accent });
            para(item, C.white, 18);
          }
          y += 4;
          break;
        case 'chips': {
          let cx = x;
          setFont(ctx, 20);
          for (const item of b.items) {
            const cw = ctx.measureText(item).width + 16;
            if (cx + cw > x + w && cx > x) {
              cx = x;
              y += 28;
            }
            ctx.strokeStyle = C.sage;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(cx + 0.5, y - 17.5, cw, 23, 11);
            ctx.stroke();
            text(ctx, item, cx + 8, y, { size: 20, color: C.sage });
            cx += cw + 8;
          }
          y += 30;
          break;
        }
        case 'table': {
          const cols = [x, x + w * 0.45, x + w * 0.65];
          b.head.forEach((h, i) => text(ctx, h, cols[i] ?? x, y, { size: 20, color: C.teal }));
          y += 6;
          ctx.fillStyle = C.faint;
          ctx.fillRect(x, y, w, 1);
          y += 20;
          for (const row of b.rows) {
            row.forEach((cell, i) =>
              text(ctx, cell, cols[i] ?? x, y, {
                size: 21,
                color: i === 1 ? C.gold : C.white,
              }),
            );
            y += 22;
          }
          y += 4;
          break;
        }
      }
    }
    return y - top + 10;
  }
}
