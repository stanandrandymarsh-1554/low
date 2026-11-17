import { fitText } from '../../engine/text';
import { subtitle } from '../backcover';
import type { Entry } from '../data/types';
import { C, EVIDENCE_COLOR, PANEL, TOXICITY_STYLE } from '../theme';
import { keyHint, ratingSticker, setFont, text } from './ui';

const panel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  edge: string,
) => {
  ctx.fillStyle = PANEL;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
};

export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  active: boolean,
): void {
  ctx.strokeStyle = active ? C.gold : 'rgba(246,236,213,0.9)';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, active ? 9 : 3, 0, Math.PI * 2);
  if (active) ctx.stroke();
  else ctx.fill();
}

export const TOOLTIP_W = 340;
export const TOOLTIP_H = 128;

/** The little card that appears when you aim at a tape. (x, y) is its top-left corner. */
export function drawTapeTooltip(
  ctx: CanvasRenderingContext2D,
  entry: Entry,
  x: number,
  y: number,
): void {
  const w = TOOLTIP_W;
  const h = TOOLTIP_H;
  const measure = (s: string) => ctx.measureText(s).width;
  panel(ctx, x, y, w, h, C.accent);

  setFont(ctx, 12, true);
  text(ctx, fitText(entry.name.toUpperCase(), w - 76, measure), x + 14, y + 28, {
    size: 12,
    head: true,
  });
  ratingSticker(ctx, entry.toxicity, x + w - 30, y + 29, 17);

  setFont(ctx, 20);
  text(ctx, fitText(subtitle(entry), w - 28, measure), x + 14, y + 52, { size: 20, color: C.dim });

  const kind = entry.kind === 'botanical' ? 'BOTANICAL' : 'SYNTHETIC';
  text(ctx, kind, x + 14, y + 76, {
    size: 20,
    color: entry.kind === 'botanical' ? C.sage : C.teal,
  });
  let cx = x + 14 + 100;
  if (entry.evidence) {
    text(ctx, `EVIDENCE ${entry.evidence}`, cx, y + 76, {
      size: 20,
      color: EVIDENCE_COLOR[entry.evidence],
    });
    cx += 124;
  }
  text(ctx, TOXICITY_STYLE[entry.toxicity].short, cx, y + 76, {
    size: 20,
    color: TOXICITY_STYLE[entry.toxicity].color,
  });

  setFont(ctx, 20);
  const effects = entry.effects.slice(0, 3).join(', ');
  text(ctx, fitText(effects, w - 28, measure), x + 14, y + 98, { size: 20 });

  keyHint(ctx, x + 14, y + h - 8, 'E', 'or click: open the box', C.gold);
}

export function drawPrompt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  title: string,
  hint: string,
): void {
  panel(ctx, x, y, 320, 70, C.teal);
  text(ctx, title, x + 14, y + 28, { size: 12, head: true });
  keyHint(ctx, x + 14, y + 56, 'E', hint, C.gold);
}

/** "NOW BROWSING: AISLE" badge. */
export function drawAisleBadge(
  ctx: CanvasRenderingContext2D,
  aisle: string,
  x: number,
  y: number,
): void {
  const measure = (s: string) => ctx.measureText(s).width;
  setFont(ctx, 12, true);
  const label = fitText(aisle.toUpperCase(), 300, measure);
  const w = Math.max(190, measure(label) + 32);
  panel(ctx, x, y, w, 58, C.gold);
  text(ctx, 'NOW BROWSING', x + 14, y + 22, { size: 18, color: C.dim });
  text(ctx, label, x + 14, y + 46, { size: 12, head: true, color: C.gold });
}

export function drawHelpBar(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = 'rgba(20,14,9,0.8)';
  ctx.fillRect(0, height - 34, width, 34);
  let x = 16;
  const y = height - 12;
  x = keyHint(ctx, x, y, 'WASD', 'walk');
  x = keyHint(ctx, x, y, 'SHIFT', 'run');
  x = keyHint(ctx, x, y, 'MOUSE', 'look');
  x = keyHint(ctx, x, y, 'E', 'open');
  x = keyHint(ctx, x, y, '/', 'search');
  keyHint(ctx, x, y, 'ESC', 'free mouse');
}

export function drawLookHint(ctx: CanvasRenderingContext2D, width: number): void {
  const w = 330;
  const x = (width - w) / 2;
  const y = 16;
  panel(ctx, x, y, w, 40, C.accent);
  text(ctx, 'CLICK TO LOOK AROUND', width / 2, y + 26, {
    size: 12,
    head: true,
    align: 'center',
    color: C.accent,
  });
}
