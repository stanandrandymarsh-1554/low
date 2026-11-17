import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import type { Entry } from '../data/types';
import { drawTape } from '../draw/tape';
import { fitFont, text } from '../draw/ui';
import { C, FONT_HEAD } from '../theme';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not supported');
  return [canvas, ctx];
}

function toTexture(canvas: HTMLCanvasElement, anisotropy = 4, repeat = false): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = anisotropy;
  if (repeat) tex.wrapS = tex.wrapT = RepeatWrapping;
  return tex;
}

/** Small deterministic random numbers, so textures look the same every time. */
function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 90s arcade carpet: dark purple with scattered neon squiggles. One tile covers about 2.4 m. */
export function carpetTexture(anisotropy: number): CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.fillStyle = '#170a30';
  ctx.fillRect(0, 0, size, size);
  const rand = rng(1994);
  const colours = [C.pink, C.cyan, C.yellow, C.lime];
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 46; i++) {
    const x = 24 + rand() * (size - 48);
    const y = 24 + rand() * (size - 48);
    ctx.strokeStyle = colours[i % colours.length] ?? C.pink;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    switch (i % 3) {
      case 0:
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        break;
      case 1:
        ctx.moveTo(x - 13, y + 9);
        ctx.lineTo(x, y - 10);
        ctx.lineTo(x + 13, y + 9);
        ctx.closePath();
        break;
      default:
        ctx.moveTo(x - 16, y);
        ctx.quadraticCurveTo(x - 8, y - 14, x, y);
        ctx.quadraticCurveTo(x + 8, y + 14, x + 16, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return toTexture(canvas, anisotropy, true);
}

/** Dark wall with faint vertical stripes. One tile covers 3 m. */
export function wallTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#1d1039';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#26164b';
  for (let x = 0; x < 256; x += 64) ctx.fillRect(x, 0, 24, 256);
  return toTexture(canvas, anisotropy, true);
}

/** Hanging aisle sign: neon lettering in a frame. */
export function signTexture(label: string, color: string, anisotropy: number): CanvasTexture {
  const w = 1024;
  const h = 224;
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.fillStyle = '#0a0614';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.shadowBlur = 0;
  const name = label.toUpperCase();
  const size = fitFont(ctx, name, FONT_HEAD, 78, w - 110);
  text(ctx, name, w / 2, h / 2 + 2, {
    size,
    head: true,
    color: C.white,
    align: 'center',
    baseline: 'middle',
    glow: color,
    glowSize: 24,
  });
  return toTexture(canvas, anisotropy);
}

/** The big neon sign on the back wall. */
export function shopSignTexture(anisotropy: number): CanvasTexture {
  const w = 2048;
  const h = 360;
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.clearRect(0, 0, w, h);
  text(ctx, 'LOW BOTANICA', w / 2, 170, {
    size: 150,
    head: true,
    color: '#ffd3ec',
    align: 'center',
    glow: C.pink,
    glowSize: 40,
  });
  text(ctx, 'HERB & VIDEO  ·  EST. 1994', w / 2, 290, {
    size: 78,
    color: C.cyan,
    align: 'center',
    glow: C.cyan,
    glowSize: 18,
  });
  return toTexture(canvas, anisotropy);
}

/** The green-screen search computer on the counter. */
export function terminalTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(320, 240);
  ctx.fillStyle = C.crtBg;
  ctx.fillRect(0, 0, 320, 240);
  text(ctx, 'CATALOGUE SEARCH', 20, 58, { size: 38, color: C.crt, glow: C.crt, glowSize: 8 });
  text(ctx, '> TYPE TO SEARCH_', 20, 112, { size: 34, color: C.crt });
  text(ctx, 'PLANT·COMPOUND·EFFECT·TIME', 20, 170, { size: 26, color: C.crtDim });
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  for (let y = 0; y < 240; y += 3) ctx.fillRect(0, y, 320, 1);
  return toTexture(canvas, anisotropy);
}

/** The "OPEN" neon by the door. */
export function openSignTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 128);
  ctx.strokeStyle = C.lime;
  ctx.lineWidth = 6;
  ctx.shadowColor = C.lime;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect(10, 10, 236, 108, 18);
  ctx.stroke();
  ctx.shadowBlur = 0;
  text(ctx, 'OPEN', 128, 66, {
    size: 44,
    head: true,
    color: C.lime,
    align: 'center',
    baseline: 'middle',
    glow: C.lime,
    glowSize: 14,
  });
  return toTexture(canvas, anisotropy);
}

/** The front of a tape box, in the same style as the rest of the game's tape art. */
export function coverTexture(entry: Entry, anisotropy: number, w = 256, h = 450): CanvasTexture {
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.fillStyle = C.plastic;
  ctx.fillRect(0, 0, w, h);
  drawTape(ctx, entry, 0, 0, w, h);
  return toTexture(canvas, anisotropy);
}

/** A plain white texture, used until a tape's real cover has been drawn. */
export function whiteTexture(): CanvasTexture {
  const [canvas, ctx] = makeCanvas(4, 4);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 4, 4);
  return toTexture(canvas, 1);
}
