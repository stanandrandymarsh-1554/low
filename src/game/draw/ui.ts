import type { Toxicity } from '../data/types';
import type { Rect } from '../scene';
import { C, FONT_BODY, FONT_HEAD, TOXICITY_STYLE } from '../theme';

export interface TextStyle {
  size?: number;
  /** Use the chunky pixel heading font instead of the body font. */
  head?: boolean;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  /** Neon glow colour. */
  glow?: string;
  glowSize?: number;
}

export function setFont(ctx: CanvasRenderingContext2D, size: number, head = false): void {
  ctx.font = `${size}px ${head ? FONT_HEAD : FONT_BODY}`;
}

export function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  style: TextStyle = {},
): void {
  const {
    size = 20,
    head = false,
    color = C.white,
    align = 'left',
    baseline = 'alphabetic',
  } = style;
  setFont(ctx, size, head);
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  if (style.glow) {
    ctx.save();
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = style.glowSize ?? 12;
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  ctx.fillText(s, x, y);
}

/** Round toxicity "rating" sticker, like a video rental age rating. */
export function ratingSticker(
  ctx: CanvasRenderingContext2D,
  tox: Toxicity,
  cx: number,
  cy: number,
  r: number,
): void {
  const style = TOXICITY_STYLE[tox];
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = style.color;
  ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.strokeStyle = C.black;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();
  // The pixel font's glyphs are square, so fit the label's width inside the circle.
  const size = Math.max(4, Math.min(r * 0.8, (r * 1.45) / style.short.length));
  text(ctx, style.short, cx, cy + 1, {
    size,
    head: true,
    color: C.black,
    align: 'center',
    baseline: 'middle',
  });
}

export function button(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  label: string,
  hovered: boolean,
  color: string = C.cyan,
): void {
  ctx.fillStyle = hovered ? color : C.black;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 1, {
    size: 10,
    head: true,
    color: hovered ? C.black : color,
    align: 'center',
    baseline: 'middle',
  });
}

/** CRT scanlines over an area. */
export function scanlines(ctx: CanvasRenderingContext2D, r: Rect, alpha = 0.18): void {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  for (let y = r.y; y < r.y + r.h; y += 3) ctx.fillRect(r.x, y, r.w, 1);
}

/** Key cap hint like [ENTER]. */
export function keyHint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  key: string,
  label: string,
  color: string = C.white,
): number {
  setFont(ctx, 18);
  const kw = ctx.measureText(key).width + 10;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y - 12.5, kw, 18);
  text(ctx, key, x + 5, y + 1, { size: 18, color });
  text(ctx, label, x + kw + 6, y + 1, { size: 18, color: C.dim });
  setFont(ctx, 18);
  return x + kw + 6 + ctx.measureText(label).width + 18;
}
