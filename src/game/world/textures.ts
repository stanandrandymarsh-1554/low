import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import type { Entry } from '../data/types';
import { drawSpecimen } from '../draw/specimen';
import { fitFont, text } from '../draw/ui';
import { C, FONT_SIGN } from '../theme';

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

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
}

/** Charcoal carpet scattered with small stars and ticket stubs. One tile covers about 2.4 m. */
export function carpetTexture(anisotropy: number): CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.fillStyle = '#2a272d';
  ctx.fillRect(0, 0, size, size);
  const rand = rng(1994);
  const colours = ['#e0a93f', '#cf5a3a', '#4fa59c', '#ece3cc', '#8d74c4', '#7fae5b'];
  for (let i = 0; i < 70; i++) {
    const x = 20 + rand() * (size - 40);
    const y = 20 + rand() * (size - 40);
    ctx.fillStyle = colours[i % colours.length] ?? '#ece3cc';
    ctx.globalAlpha = 0.85;
    if (i % 5 === 4) {
      // A ticket stub.
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rand() - 0.5) * 1.2);
      ctx.fillRect(-15, -8, 30, 16);
      ctx.fillStyle = '#2a272d';
      ctx.fillRect(-4, -8, 3, 16);
      ctx.restore();
    } else {
      star(ctx, x, y, 13 + rand() * 6, rand() * 1.2);
    }
  }
  ctx.globalAlpha = 1;
  return toTexture(canvas, anisotropy, true);
}

/** Warm orange painted plaster. One tile covers 3 m. */
export function plasterTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#d98838';
  ctx.fillRect(0, 0, 256, 256);
  const rand = rng(77);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,230,170,0.06)' : 'rgba(120,50,0,0.07)';
    ctx.fillRect(rand() * 256, rand() * 256, 2 + rand() * 3, 2 + rand() * 3);
  }
  return toTexture(canvas, anisotropy, true);
}

/** Honey-coloured wood panelling: vertical planks. One tile covers 2 m. */
export function woodTexture(anisotropy: number): CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  const rand = rng(31);
  const plank = size / 12;
  for (let i = 0; i < 12; i++) {
    const l = 38 + rand() * 8;
    ctx.fillStyle = `hsl(${28 + rand() * 6} 52% ${l}%)`;
    ctx.fillRect(i * plank, 0, plank, size);
    for (let g = 0; g < 14; g++) {
      ctx.strokeStyle = `rgba(60,28,6,${0.05 + rand() * 0.08})`;
      ctx.lineWidth = 1 + rand() * 1.5;
      const x = i * plank + 3 + rand() * (plank - 6);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 4, size * 0.3, x - 4, size * 0.7, x + 2, size);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(40,18,4,0.55)';
    ctx.fillRect(i * plank, 0, 2, size);
  }
  return toTexture(canvas, anisotropy, true);
}

/** Drop-ceiling tiles on a dark grid. One tile of the texture covers 1.2 m. */
export function ceilingTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#4a433c';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#2a2521';
  ctx.fillRect(0, 0, 256, 6);
  ctx.fillRect(0, 0, 6, 256);
  ctx.fillRect(0, 124, 256, 4);
  ctx.fillRect(124, 0, 4, 256);
  return toTexture(canvas, anisotropy, true);
}

/** A black category board with cream capitals and a red stripe, like those over video shelves. */
export function headerTexture(label: string, aspect: number, anisotropy: number): CanvasTexture {
  const h = 128;
  const w = Math.round(Math.min(Math.max(aspect * h, 256), 2048));
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.fillStyle = '#121010';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#c8392b';
  ctx.fillRect(0, h - 20, w, 14);
  ctx.fillStyle = '#e8dcc0';
  ctx.fillRect(0, 0, w, 5);
  ctx.fillRect(0, h - 5, w, 5);
  const name = label.toUpperCase();
  const size = fitFont(ctx, name, FONT_SIGN, 92, w - 60);
  text(ctx, name, w / 2, 56, {
    size,
    color: '#f6ecd5',
    align: 'center',
    baseline: 'middle',
    font: FONT_SIGN,
  });
  return toTexture(canvas, anisotropy);
}

/** The gold marquee over the back wall, with a row of bulbs. */
export function marqueeTexture(anisotropy: number): CanvasTexture {
  const w = 2048;
  const h = 420;
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.fillStyle = '#1b2147';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#e3b04b';
  ctx.lineWidth = 12;
  ctx.strokeRect(28, 28, w - 56, h - 56);
  for (let x = 60; x < w - 40; x += 70) {
    for (const y of [14, h - 14]) {
      ctx.fillStyle = '#fff2c0';
      ctx.shadowColor = '#ffd36a';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
  text(ctx, 'LOW BOTANICA', w / 2, 200, {
    size: 230,
    color: '#f1c85a',
    align: 'center',
    baseline: 'middle',
    font: FONT_SIGN,
    glow: '#f1c85a',
    glowSize: 10,
  });
  text(ctx, 'HERB & VIDEO  ·  EST. 1994', w / 2, 340, {
    size: 74,
    color: '#e8dcc0',
    align: 'center',
    baseline: 'middle',
    font: FONT_SIGN,
  });
  return toTexture(canvas, anisotropy);
}

/** A glowing media-button ring ("play", "fast-forward", "stop", "pause") for the wall. */
export function mediaButtonTexture(
  kind: 'play' | 'ff' | 'stop' | 'pause',
  anisotropy: number,
): CanvasTexture {
  const s = 256;
  const [canvas, ctx] = makeCanvas(s, s);
  const colour = '#ffd98a';
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.shadowColor = '#ffb84a';
  ctx.shadowBlur = 22;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, 104, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 9;
  ctx.lineJoin = 'round';
  const tri = (x: number) => {
    ctx.beginPath();
    ctx.moveTo(x - 24, s / 2 - 36);
    ctx.lineTo(x + 30, s / 2);
    ctx.lineTo(x - 24, s / 2 + 36);
    ctx.closePath();
    ctx.stroke();
  };
  if (kind === 'play') tri(s / 2 + 4);
  else if (kind === 'ff') {
    tri(s / 2 - 22);
    tri(s / 2 + 26);
  } else if (kind === 'stop') ctx.strokeRect(s / 2 - 34, s / 2 - 34, 68, 68);
  else {
    ctx.strokeRect(s / 2 - 36, s / 2 - 38, 24, 76);
    ctx.strokeRect(s / 2 + 12, s / 2 - 38, 24, 76);
  }
  return toTexture(canvas, anisotropy);
}

/** The amber-screen search computer on the counter. */
export function terminalTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(320, 240);
  ctx.fillStyle = C.crtBg;
  ctx.fillRect(0, 0, 320, 240);
  ctx.strokeStyle = C.crtDim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(12, 70);
  ctx.lineTo(308, 70);
  ctx.stroke();
  text(ctx, 'LOW-O-MOVIE  v1.0', 18, 44, { size: 34, color: C.crt, glow: C.crt, glowSize: 6 });
  text(ctx, 'CATALOGUE SEARCH', 18, 110, { size: 34, color: C.crt });
  text(ctx, '> TYPE TO SEARCH_', 18, 152, { size: 32, color: C.crt });
  text(ctx, 'PLANT·COMPOUND·EFFECT·TIME', 18, 206, { size: 24, color: C.crtDim });
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (let y = 0; y < 240; y += 3) ctx.fillRect(0, y, 320, 1);
  return toTexture(canvas, anisotropy);
}

/** The "OPEN" sign by the door: a red neon tube in a rounded frame. */
export function openSignTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 128);
  ctx.strokeStyle = '#ff6a4a';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#ff4a2a';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect(10, 10, 236, 108, 18);
  ctx.stroke();
  ctx.shadowBlur = 0;
  text(ctx, 'OPEN', 128, 68, {
    size: 84,
    color: '#ff8466',
    align: 'center',
    baseline: 'middle',
    font: FONT_SIGN,
    glow: '#ff4a2a',
    glowSize: 12,
  });
  return toTexture(canvas, anisotropy);
}

/** A round wall clock. */
export function clockTexture(anisotropy: number): CanvasTexture {
  const s = 256;
  const [canvas, ctx] = makeCanvas(s, s);
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, 124, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f3e8cc';
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, 108, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1d12';
  ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ctx.lineWidth = i % 3 === 0 ? 8 : 4;
    ctx.beginPath();
    ctx.moveTo(s / 2 + Math.sin(a) * 88, s / 2 - Math.cos(a) * 88);
    ctx.lineTo(s / 2 + Math.sin(a) * 100, s / 2 - Math.cos(a) * 100);
    ctx.stroke();
  }
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(s / 2, s / 2);
  ctx.lineTo(s / 2 + Math.sin(0.6) * 56, s / 2 - Math.cos(0.6) * 56);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(s / 2, s / 2);
  ctx.lineTo(s / 2 + Math.sin(3.4) * 80, s / 2 - Math.cos(3.4) * 80);
  ctx.stroke();
  return toTexture(canvas, anisotropy);
}

/** A wall poster: the figure in its display case, drawn at 360 x 560. */
export function posterTexture(entry: Entry, anisotropy: number, w = 360, h = 560): CanvasTexture {
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.fillStyle = C.plastic;
  ctx.fillRect(0, 0, w, h);
  drawSpecimen(ctx, entry, 0, 0, w, h, { t: 0.4 });
  return toTexture(canvas, anisotropy);
}
