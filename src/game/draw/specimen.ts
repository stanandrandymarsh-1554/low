import { wrapText } from '../../engine/text';
import { hashString } from '../aisles';
import type { Entry } from '../data/types';
import { C, EVIDENCE_COLOR } from '../theme';
import { buildModel } from '../voxel/model';
import { ratingSticker, setFont, text } from './ui';
import { drawVoxelIso, ISO } from './voxel';

/** Hue for an entry's backdrop: greens/teals for botanicals, blues for synthetics. */
export function entryHue(entry: Entry): number {
  const h = hashString(entry.id);
  return entry.kind === 'botanical' ? 70 + (h % 110) : 200 + (h % 40);
}

const sprites = new Map<string, HTMLCanvasElement>();

/** The figure drawn once as an isometric sprite at this voxel size; later draws just copy it. */
function spriteFor(entry: Entry, px: number): HTMLCanvasElement {
  const key = `${entry.id}@${px}`;
  let c = sprites.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = ISO.width(px);
    c.height = ISO.height(px) + px;
    const ctx = c.getContext('2d');
    if (ctx) drawVoxelIso(ctx, buildModel(entry), c.width / 2, ISO.baseY(px), px);
    sprites.set(key, c);
  }
  return c;
}

export interface SpecimenOptions {
  selected?: boolean;
  /** Seconds, for the figure's hover and the sparkle. */
  t?: number;
}

/**
 * A display case for one entry: the figure (a plant, or the isolated compound) on its plinth,
 * under a spotlight, with its name and the rating stickers. Used for the wall posters and the
 * full menu.
 */
export function drawSpecimen(
  ctx: CanvasRenderingContext2D,
  entry: Entry,
  x: number,
  y: number,
  w: number,
  h: number,
  { selected = false, t = 0 }: SpecimenOptions = {},
): void {
  const hue = entryHue(entry);

  ctx.save();
  if (selected) {
    ctx.shadowColor = C.gold;
    ctx.shadowBlur = 14 + Math.sin(t * 5) * 4;
  }
  ctx.fillStyle = C.plastic;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(2, w * 0.04));
  ctx.fill();
  ctx.restore();

  // Backdrop.
  const p = Math.max(2, w * 0.05);
  const ix = x + p;
  const iy = y + p;
  const iw = w - p * 2;
  const ih = h - p * 2;
  const grad = ctx.createLinearGradient(0, iy, 0, iy + ih);
  grad.addColorStop(0, `hsl(${hue} 55% 34%)`);
  grad.addColorStop(0.6, `hsl(${hue + 20} 50% 18%)`);
  grad.addColorStop(1, `hsl(${hue + 40} 45% 8%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(ix, iy, iw, ih);

  // Sunburst and spotlight behind the figure.
  const cx = ix + iw / 2;
  const cy = iy + ih * 0.42;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ix, iy, iw, ih);
  ctx.clip();
  ctx.fillStyle = `hsla(${hue + 30} 80% 70% / 0.12)`;
  const spin = t * 0.15;
  for (let i = 0; i < 16; i += 2) {
    const a0 = spin + (i * Math.PI) / 8;
    const a1 = spin + ((i + 1) * Math.PI) / 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * ih * 1.5, cy + Math.sin(a0) * ih * 1.5);
    ctx.lineTo(cx + Math.cos(a1) * ih * 1.5, cy + Math.sin(a1) * ih * 1.5);
    ctx.fill();
  }
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, iw * 0.7);
  glow.addColorStop(0, 'rgba(255,240,200,0.35)');
  glow.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(ix, iy, iw, ih);
  ctx.restore();

  // Kind band.
  const bandH = Math.max(8, ih * 0.1);
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(ix, iy, iw, bandH);
  text(ctx, entry.kind === 'botanical' ? 'BOTANICAL' : 'SYNTHETIC', cx, iy + bandH / 2 + 1, {
    size: Math.max(9, Math.round(bandH * 1.05)),
    color: entry.kind === 'botanical' ? C.sage : C.teal,
    align: 'center',
    baseline: 'middle',
  });

  // The figure itself, sized to the space between the band and the title.
  const areaTop = iy + bandH + 4;
  const areaH = iy + ih * 0.68 - areaTop;
  const px = Math.max(
    2,
    Math.floor(Math.min((iw * 0.95) / ISO.width(1), (areaH - 6) / (ISO.height(1) + 1))),
  );
  const sprite = spriteFor(entry, px);
  const bob = Math.sin(t * 2.2) * ih * 0.012;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sprite,
    Math.round(cx - sprite.width / 2),
    Math.round(areaTop + (areaH - sprite.height) / 2 + bob),
  );
  ctx.restore();
  // A couple of sparkles, like an item pickup.
  ctx.fillStyle = C.white;
  for (let i = 0; i < 3; i++) {
    const a = t * 1.3 + i * 2.1;
    if (Math.sin(t * 3 + i * 1.7) > 0.2) {
      const sx = cx + Math.cos(a) * iw * 0.36;
      const sy = areaTop + areaH * 0.45 + Math.sin(a * 1.3) * areaH * 0.3;
      const r = Math.max(1, Math.round(iw * 0.012));
      ctx.fillRect(sx - r, sy - r * 3, r * 2, r * 6);
      ctx.fillRect(sx - r * 3, sy - r, r * 6, r * 2);
    }
  }

  // Title: shrink until the longest word fits on a line, so names never break mid-word.
  let size = Math.max(12, Math.round(iw * 0.2));
  const longest = entry.name
    .toUpperCase()
    .split(/\s+/)
    .reduce((a, b) => (b.length > a.length ? b : a), '');
  setFont(ctx, size);
  while (size > 8 && ctx.measureText(longest).width > iw - 4) {
    size -= 1;
    setFont(ctx, size);
  }
  const lines = wrapText(entry.name.toUpperCase(), iw - 4, (s2) => ctx.measureText(s2).width).slice(
    0,
    3,
  );
  const lineH = size * 0.85;
  const top = iy + ih * 0.77 - (lines.length - 1) * lineH;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  lines.forEach((line, i) =>
    text(ctx, line, cx, top + i * lineH, { size, color: C.white, align: 'center' }),
  );
  ctx.restore();

  ratingSticker(ctx, entry.toxicity, ix + iw - iw * 0.15, iy + ih - iw * 0.15, iw * 0.13);

  // Evidence tier sticker (A-D), bottom left.
  if (entry.evidence) {
    const bs = iw * 0.24;
    const bx = ix + iw * 0.15 - bs / 2;
    const by = iy + ih - iw * 0.15 - bs / 2;
    ctx.fillStyle = EVIDENCE_COLOR[entry.evidence];
    ctx.fillRect(bx, by, bs, bs);
    ctx.strokeStyle = C.black;
    ctx.lineWidth = Math.max(1, bs * 0.1);
    ctx.strokeRect(bx, by, bs, bs);
    text(ctx, entry.evidence, bx + bs / 2, by + bs / 2 + 1, {
      size: Math.max(6, bs * 0.62),
      head: true,
      color: C.black,
      align: 'center',
      baseline: 'middle',
    });
  }

  // Red stamp for reputations that don't hold up.
  if (entry.myth) {
    ctx.save();
    ctx.translate(cx, iy + ih * 0.6);
    ctx.rotate(0.28);
    const sw2 = iw * 0.78;
    const sh2 = Math.max(10, iw * 0.15);
    ctx.fillStyle = 'rgba(40,0,0,0.6)';
    ctx.fillRect(-sw2 / 2, -sh2 / 2, sw2, sh2);
    ctx.strokeStyle = C.red;
    ctx.lineWidth = Math.max(1.5, iw * 0.03);
    ctx.strokeRect(-sw2 / 2, -sh2 / 2, sw2, sh2);
    text(ctx, 'BUSTED', 0, 1, {
      size: Math.max(9, Math.round(sh2 * 0.95)),
      color: C.red,
      align: 'center',
      baseline: 'middle',
    });
    ctx.restore();
  }

  if (entry.sample) {
    ctx.save();
    ctx.translate(ix + iw * 0.2, iy + bandH + iw * 0.14);
    ctx.rotate(-0.35);
    ctx.fillStyle = C.gold;
    const sw2 = iw * 0.5;
    const sh2 = Math.max(7, iw * 0.16);
    ctx.fillRect(-sw2 / 2, -sh2 / 2, sw2, sh2);
    text(ctx, 'SAMPLE', 0, 1, {
      size: Math.max(9, Math.round(sh2 * 1.1)),
      color: C.black,
      align: 'center',
      baseline: 'middle',
    });
    ctx.restore();
  }
}
