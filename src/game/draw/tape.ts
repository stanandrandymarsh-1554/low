import { wrapText } from '../../engine/text';
import { hashString } from '../aisles';
import type { Entry } from '../data/types';
import { C } from '../theme';
import { ratingSticker, setFont, text } from './ui';

/** Hue for a tape's cover: greens/teals for botanicals, purples/pinks for synthetics. */
export function tapeHue(entry: Entry): number {
  const h = hashString(entry.id);
  return entry.kind === 'botanical' ? 70 + (h % 110) : 200 + (h % 140);
}

function leaf(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s);
  ctx.quadraticCurveTo(cx - s * 1.1, cy, cx, cy - s);
  ctx.quadraticCurveTo(cx + s * 1.1, cy, cx, cy + s);
  ctx.moveTo(cx, cy + s * 1.25);
  ctx.lineTo(cx, cy - s * 0.6);
  for (let i = -1; i <= 1; i++) {
    const y = cy + i * s * 0.35;
    ctx.moveTo(cx, y + s * 0.15);
    ctx.lineTo(cx - s * 0.45, y - s * 0.15);
    ctx.moveTo(cx, y + s * 0.15);
    ctx.lineTo(cx + s * 0.45, y - s * 0.15);
  }
  ctx.stroke();
}

function molecule(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  const r = s * 0.62;
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    pts.push([cx - s * 0.25 + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  // Side chain off one corner.
  const [ex, ey] = pts[5] ?? [cx, cy];
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex + s * 0.45, ey - s * 0.25);
  ctx.lineTo(ex + s * 0.85, ey + s * 0.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ex + s * 0.85, ey + s * 0.05, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

export interface TapeOptions {
  selected?: boolean;
  /** Seconds, for the selection shimmer. */
  t?: number;
}

/** Draws the front of a VHS clamshell box for an entry. */
export function drawTape(
  ctx: CanvasRenderingContext2D,
  entry: Entry,
  x: number,
  y: number,
  w: number,
  h: number,
  { selected = false, t = 0 }: TapeOptions = {},
): void {
  const hue = tapeHue(entry);

  ctx.save();
  if (selected) {
    ctx.shadowColor = C.yellow;
    ctx.shadowBlur = 14 + Math.sin(t * 5) * 4;
  }
  ctx.fillStyle = C.plastic;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(2, w * 0.04));
  ctx.fill();
  ctx.restore();

  // Cover art.
  const p = Math.max(2, w * 0.05);
  const ix = x + p;
  const iy = y + p;
  const iw = w - p * 2;
  const ih = h - p * 2;
  const grad = ctx.createLinearGradient(0, iy, 0, iy + ih);
  grad.addColorStop(0, `hsl(${hue} 75% 52%)`);
  grad.addColorStop(0.55, `hsl(${hue + 30} 70% 28%)`);
  grad.addColorStop(1, `hsl(${hue + 50} 60% 10%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(ix, iy, iw, ih);

  // Sunburst behind the icon.
  const cx = ix + iw / 2;
  const cy = iy + ih * 0.4;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ix, iy, iw, ih);
  ctx.clip();
  ctx.fillStyle = `hsla(${hue + 180} 90% 70% / 0.18)`;
  for (let i = 0; i < 12; i += 2) {
    const a0 = (i * Math.PI) / 6;
    const a1 = ((i + 1) * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * iw * 1.5, cy + Math.sin(a0) * iw * 1.5);
    ctx.lineTo(cx + Math.cos(a1) * iw * 1.5, cy + Math.sin(a1) * iw * 1.5);
    ctx.fill();
  }
  ctx.restore();

  // Kind band.
  const bandH = Math.max(8, ih * 0.12);
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(ix, iy, iw, bandH);
  text(ctx, entry.kind === 'botanical' ? 'BOTANICAL' : 'SYNTHETIC', cx, iy + bandH / 2 + 1, {
    size: Math.max(9, Math.round(bandH * 1.05)),
    color: entry.kind === 'botanical' ? C.lime : C.cyan,
    align: 'center',
    baseline: 'middle',
  });

  // Icon.
  ctx.save();
  ctx.strokeStyle = C.white;
  ctx.fillStyle = C.white;
  ctx.lineWidth = Math.max(1.5, w * 0.025);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = `hsl(${hue + 180} 100% 70%)`;
  ctx.shadowBlur = w * 0.12;
  const s = iw * 0.24;
  if (entry.kind === 'botanical') leaf(ctx, cx, cy + bandH * 0.3, s);
  else molecule(ctx, cx, cy + bandH * 0.3, s);
  ctx.restore();

  // Title.
  const size = Math.max(12, Math.round(iw * 0.24));
  setFont(ctx, size);
  const lines = wrapText(entry.name.toUpperCase(), iw - 4, (s2) => ctx.measureText(s2).width).slice(
    0,
    2,
  );
  const lineH = size * 0.85;
  const top = iy + ih * 0.78 - (lines.length - 1) * lineH;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  lines.forEach((line, i) =>
    text(ctx, line, cx, top + i * lineH, { size, color: C.white, align: 'center' }),
  );
  ctx.restore();

  ratingSticker(ctx, entry.toxicity, ix + iw - iw * 0.15, iy + ih - iw * 0.15, iw * 0.13);

  if (entry.sample) {
    ctx.save();
    ctx.translate(ix + iw * 0.2, iy + bandH + iw * 0.14);
    ctx.rotate(-0.35);
    ctx.fillStyle = C.yellow;
    const sw = iw * 0.5;
    const sh = Math.max(7, iw * 0.16);
    ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
    text(ctx, 'SAMPLE', 0, 1, {
      size: Math.max(9, Math.round(sh * 1.1)),
      color: C.black,
      align: 'center',
      baseline: 'middle',
    });
    ctx.restore();
  }

  // Plastic shine.
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * 0.45, y);
  ctx.lineTo(x, y + h * 0.35);
  ctx.fill();
}
