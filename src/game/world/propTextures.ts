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

/** A shop front for the buildings across the road: wall, windows, a door, an awning and a sign. */
export function facadeTexture(seed: number, label: string, anisotropy: number): CanvasTexture {
  const w = 512;
  const h = 512;
  const [canvas, ctx] = makeCanvas(w, h);
  const rand = rng(seed);
  const hue = Math.floor(rand() * 360);
  ctx.fillStyle = `hsl(${hue} 30% 62%)`;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = `hsl(${hue} 30% 46%)`;
  ctx.fillRect(0, 0, w, 24);
  // Upper floors: rows of windows.
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 36 + col * 118;
      const y = 50 + row * 88;
      ctx.fillStyle = '#2c3a4a';
      ctx.fillRect(x, y, 70, 60);
      ctx.fillStyle = 'rgba(190,225,250,0.55)';
      ctx.fillRect(x + 4, y + 4, 62, 52);
      ctx.fillStyle = `hsl(${hue} 30% 40%)`;
      ctx.fillRect(x + 33, y, 4, 60);
      ctx.fillRect(x, y + 28, 70, 4);
      ctx.fillRect(x - 5, y + 60, 80, 6);
    }
  }
  // The ground floor: shop window, door, awning, sign.
  ctx.fillStyle = `hsl(${hue} 25% 30%)`;
  ctx.fillRect(0, 320, w, 192);
  ctx.fillStyle = '#9fc4dc';
  ctx.fillRect(28, 372, 220, 120);
  ctx.fillRect(300, 372, 184, 120);
  ctx.fillStyle = '#22262c';
  ctx.fillRect(252, 360, 44, 152);
  const awning = `hsl(${(hue + 160) % 360} 55% 42%)`;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? awning : '#efe6d0';
    ctx.fillRect(i * 32, 340, 32, 28);
  }
  ctx.fillStyle = '#1c1816';
  ctx.fillRect(40, 290, 432, 44);
  text(ctx, label, 256, 313, {
    size: 40,
    color: '#f2d98a',
    align: 'center',
    baseline: 'middle',
    font: FONT_SIGN,
  });
  return toTexture(canvas, anisotropy);
}

/** Paving: pale slabs with joints. One tile is 1.2 m. */
export function pavingTexture(anisotropy: number): CanvasTexture {
  const [canvas, ctx] = makeCanvas(128, 128);
  ctx.fillStyle = '#b9b4a8';
  ctx.fillRect(0, 0, 128, 128);
  const rand = rng(404);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.03 + rand() * 0.04})`;
    ctx.fillRect(rand() * 128, rand() * 128, 6, 6);
  }
  ctx.strokeStyle = '#8f8a7e';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 128, 128);
  return toTexture(canvas, anisotropy, true);
}

/** The sky: blue overhead, pale at the horizon, with a few soft clouds. */
export function skyTexture(): CanvasTexture {
  const [canvas, ctx] = makeCanvas(1024, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#4f93d8');
  g.addColorStop(0.55, '#8cc4ee');
  g.addColorStop(0.78, '#e9f0f0');
  g.addColorStop(1, '#f3e8d0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);
  const rand = rng(1999);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 16; i++) {
    const x = rand() * 1024;
    const y = 120 + rand() * 170;
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.ellipse(x + k * 30, y + (k % 2) * 8, 44, 17, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
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
