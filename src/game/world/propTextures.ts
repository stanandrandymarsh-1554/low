import { CanvasTexture, NearestFilter, RepeatWrapping, SRGBColorSpace } from 'three';
import { text } from '../draw/ui';
import { C, FONT_SIGN } from '../theme';
import { makeCanvas, rng, toTexture } from './textures';

/** A woven lounge rug: a border, then rows of diamonds. */
export function rugTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(360, 440);
  ctx.fillStyle = '#6e2a22';
  ctx.fillRect(0, 0, 360, 440);
  ctx.strokeStyle = '#e8d3a0';
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, 332, 412);
  ctx.strokeStyle = '#3f8a86';
  ctx.lineWidth = 14;
  ctx.strokeRect(34, 34, 292, 372);
  const cols = ['#e0a93f', '#3f8a86', '#e8d3a0', '#d4623a'];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 5; c++) {
      const x = 60 + c * 60;
      const y = 70 + r * 50;
      ctx.fillStyle = cols[(r + c) % cols.length] ?? '#e0a93f';
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x + 18, y);
      ctx.lineTo(x, y + 18);
      ctx.lineTo(x - 18, y);
      ctx.fill();
    }
  }
  // Fringe.
  ctx.fillStyle = '#e8d3a0';
  for (let x = 4; x < 360; x += 8) {
    ctx.fillRect(x, 0, 3, 8);
    ctx.fillRect(x, 432, 3, 8);
  }
  return toTexture(canvas, anisotropy);
}

/** The lounge TV: colour bars, and an on-screen "PLAY". */
export function tvTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 192);
  const bars = ['#e8e8e8', '#e8e040', '#40e0e0', '#40e040', '#e040e0', '#e04040', '#4040e0'];
  bars.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i * (256 / 7), 0, 256 / 7 + 1, 130);
  });
  ctx.fillStyle = '#101018';
  ctx.fillRect(0, 130, 256, 62);
  text(ctx, '▶ PLAY', 14, 36, { size: 30, color: '#ffffff', glow: '#000', glowSize: 2 });
  text(ctx, 'LOW BOTANICA', 128, 172, {
    size: 34,
    color: C.crt,
    align: 'center',
    font: FONT_SIGN,
  });
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 0; y < 192; y += 3) ctx.fillRect(0, y, 256, 1);
  return toTexture(canvas, anisotropy);
}

/** The glass door of a drinks cooler, with bottles and cans on three shelves. */
export function coolerTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 512);
  ctx.fillStyle = '#10161c';
  ctx.fillRect(0, 0, 256, 512);
  const rand = rng(77);
  const cols = ['#d94a3a', '#4a8fc2', '#f2c14e', '#7bb661', '#e8892b', '#8d74c4', '#eee6d2'];
  for (let shelf = 0; shelf < 4; shelf++) {
    const y = 30 + shelf * 118;
    ctx.fillStyle = '#6d7780';
    ctx.fillRect(8, y + 92, 240, 6);
    for (let i = 0; i < 8; i++) {
      const c = cols[Math.floor(rand() * cols.length)] ?? '#d94a3a';
      ctx.fillStyle = c;
      const x = 14 + i * 29;
      if (shelf % 2 === 0) {
        ctx.fillRect(x, y + 28, 22, 64);
        ctx.fillRect(x + 6, y + 12, 10, 18);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x + 3, y + 36, 4, 48);
      } else {
        ctx.fillRect(x, y + 44, 24, 48);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x + 3, y + 48, 4, 38);
      }
    }
  }
  // A cold, pale glare across the glass.
  const glare = ctx.createLinearGradient(0, 0, 256, 512);
  glare.addColorStop(0, 'rgba(200,230,255,0.22)');
  glare.addColorStop(0.5, 'rgba(200,230,255,0)');
  ctx.fillStyle = glare;
  ctx.fillRect(0, 0, 256, 512);
  return toTexture(canvas, anisotropy);
}

/** A wire candy rack: rows of brightly wrapped bars and bags. */
export function candyTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 400);
  ctx.fillStyle = '#2a2420';
  ctx.fillRect(0, 0, 256, 400);
  const rand = rng(5);
  const cols = ['#d94a3a', '#f2c14e', '#4a8fc2', '#7bb661', '#e8892b', '#c75fb0', '#eee6d2'];
  for (let row = 0; row < 5; row++) {
    const y = 16 + row * 76;
    for (let i = 0; i < 6; i++) {
      const c = cols[Math.floor(rand() * cols.length)] ?? '#d94a3a';
      ctx.fillStyle = c;
      ctx.fillRect(10 + i * 40, y, 34, 58);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(14 + i * 40, y + 12, 26, 12);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(10 + i * 40, y + 50, 34, 8);
    }
    ctx.fillStyle = '#8c8c8c';
    ctx.fillRect(4, y + 62, 248, 4);
  }
  return toTexture(canvas, anisotropy);
}

/** A spinner rack of seed packets: a leaf, a name, a colour band. */
export function packetsTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(128, 384);
  ctx.fillStyle = '#3a2a1c';
  ctx.fillRect(0, 0, 128, 384);
  const cols = ['#7bb661', '#e8892b', '#c75fb0', '#f2c14e', '#4a8fc2', '#d94a3a'];
  for (let row = 0; row < 4; row++) {
    for (let c = 0; c < 2; c++) {
      const x = 6 + c * 62;
      const y = 8 + row * 94;
      ctx.fillStyle = '#efe5c8';
      ctx.fillRect(x, y, 56, 84);
      ctx.fillStyle = cols[(row * 2 + c) % cols.length] ?? '#7bb661';
      ctx.fillRect(x, y + 56, 56, 28);
      ctx.beginPath();
      ctx.ellipse(x + 28, y + 30, 10, 20, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2a1c';
      ctx.fillRect(x + 8, y + 6, 40, 4);
    }
  }
  return toTexture(canvas, anisotropy);
}

/** A lit sign: big capitals on a coloured field. */
export function signTexture(
  label: string,
  fg: string,
  bg: string,
  anisotropy: number,
  w = 256,
  h = 96,
): CanvasTexture {
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  text(ctx, label, w / 2, h / 2 + 2, {
    size: h * 0.62,
    color: fg,
    align: 'center',
    baseline: 'middle',
    font: FONT_SIGN,
  });
  return toTexture(canvas, anisotropy);
}

/** Popped corn heaped behind glass. */
export function popcornTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(128, 128);
  ctx.fillStyle = '#f2d98a';
  ctx.fillRect(0, 0, 128, 128);
  const rand = rng(31);
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = ['#fff5d0', '#f6e6a8', '#e8c868', '#fffbe8'][i % 4] ?? '#fff5d0';
    ctx.beginPath();
    ctx.arc(rand() * 128, rand() * 128, 4 + rand() * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(canvas, anisotropy, true);
}

/**
 * The street seen through the windows: sky, shops across the road, trees, a pole sign and parked
 * cars. It is stood up as a backdrop 8 m tall, so the ground is at the bottom edge.
 */
export function outsideTexture(anisotropy: number): CanvasTexture {
  const w = 2048;
  const h = 640;
  const [canvas, ctx] = makeCanvas(w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#6fb0e6');
  sky.addColorStop(1, '#f6ecd6');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const rand = rng(1999);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 9; i++) {
    const x = rand() * w;
    const y = 30 + rand() * 110;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.ellipse(x + k * 34, y + (k % 2) * 8, 46, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const base = h;
  let x = -20;
  while (x < w) {
    const bw = 190 + rand() * 140;
    const bh = 260 + rand() * 200;
    const hue = Math.floor(rand() * 360);
    ctx.fillStyle = `hsl(${hue} 32% 58%)`;
    ctx.fillRect(x, base - bh, bw, bh);
    ctx.fillStyle = `hsl(${hue} 32% 40%)`;
    ctx.fillRect(x, base - bh, bw, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let row = 0; row < 3; row++) {
      for (let wx = x + 16; wx < x + bw - 36; wx += 52) {
        ctx.fillRect(wx, base - bh + 50 + row * 70, 34, 44);
      }
    }
    ctx.fillStyle = `hsl(${(hue + 40) % 360} 55% 42%)`;
    ctx.fillRect(x + bw * 0.3, base - 190, bw * 0.4, 190);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(x + bw * 0.34, base - 170, bw * 0.32, 90);
    x += bw + 8;
  }
  ctx.fillStyle = '#555';
  ctx.fillRect(1500, base - 560, 14, 560);
  ctx.fillStyle = '#d94a3a';
  ctx.fillRect(1430, base - 640 + 40, 150, 90);
  text(ctx, 'VIDEO', 1505, base - 640 + 108, {
    size: 60,
    color: '#fff',
    align: 'center',
    font: FONT_SIGN,
  });
  for (const tx of [220, 760, 1200, 1800]) {
    ctx.fillStyle = '#5a3d26';
    ctx.fillRect(tx - 9, base - 230, 18, 230);
    ctx.fillStyle = '#3f7a3a';
    ctx.beginPath();
    ctx.arc(tx, base - 290, 84, 0, Math.PI * 2);
    ctx.arc(tx - 56, base - 240, 58, 0, Math.PI * 2);
    ctx.arc(tx + 56, base - 240, 58, 0, Math.PI * 2);
    ctx.fill();
  }
  // Cars parked along the kerb, about 1.4 m tall.
  const cars = [
    [90, '#c44a3a'],
    [560, '#3a6aa8'],
    [980, '#e8e0cf'],
    [1400, '#3a8a62'],
    [1860, '#c9a43a'],
  ] as const;
  for (const [cx, col] of cars) {
    const cy = base - 104;
    ctx.fillStyle = col;
    ctx.fillRect(cx, cy + 30, 240, 54);
    ctx.fillRect(cx + 46, cy, 140, 44);
    ctx.fillStyle = '#9ecbe6';
    ctx.fillRect(cx + 56, cy + 8, 52, 32);
    ctx.fillRect(cx + 116, cy + 8, 60, 32);
    ctx.fillStyle = '#16161a';
    ctx.beginPath();
    ctx.arc(cx + 54, cy + 88, 22, 0, Math.PI * 2);
    ctx.arc(cx + 190, cy + 88, 22, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(canvas, anisotropy);
}

/** A small flat face: eyes and a mouth on a skin tone, in blocky pixels. */
export function faceTexture(skin: string, mood: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(16, 16);
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#2a1c14';
  ctx.fillRect(3, 6, 3, 2);
  ctx.fillRect(10, 6, 3, 2);
  ctx.fillRect(3, 4, 3, 1);
  ctx.fillRect(10, 4, 3, 1);
  ctx.fillStyle = '#a8483a';
  if (mood % 3 === 0) ctx.fillRect(5, 11, 6, 1);
  else if (mood % 3 === 1) {
    ctx.fillRect(5, 11, 6, 1);
    ctx.fillRect(4, 10, 1, 1);
    ctx.fillRect(11, 10, 1, 1);
  } else ctx.fillRect(6, 11, 4, 2);
  const tex = new CanvasTexture(canvas);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  return tex;
}
