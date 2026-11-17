import type { TouchControls, TouchZone } from '../../engine/touch';
import { STICK_RADIUS } from '../../engine/touch';
import { C } from '../theme';
import { setFont, text } from './ui';

export interface Circle {
  x: number;
  y: number;
  r: number;
}

export interface TouchLayout {
  use: Circle;
  search: Circle;
  /** Only where the browser offers fullscreen. */
  full: Circle | null;
  /** Where the thumb-stick rests when nobody is touching it. */
  stickHome: { x: number; y: number };
}

/** Space the notch and rounded corners take, in CSS pixels (from the `env()` safe areas). */
export function safeInsets(): { left: number; right: number; top: number; bottom: number } {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.append(probe);
  const cs = getComputedStyle(probe);
  const out = {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  };
  probe.remove();
  return out;
}

export function touchLayout(
  width: number,
  height: number,
  inset: { left: number; right: number; top: number; bottom: number },
  fullscreen: boolean,
): TouchLayout {
  const unit = Math.max(0.8, Math.min(1.25, Math.min(width / 760, height / 380)));
  const r = 44 * unit;
  const small = 27 * unit;
  const right = width - inset.right;
  return {
    use: { x: right - r - 28, y: height - inset.bottom - r - 26, r },
    search: { x: right - small - 18, y: inset.top + small + 16, r: small },
    full: fullscreen
      ? { x: right - small - 18, y: inset.top + small * 3 + 28, r: small * 0.8 }
      : null,
    stickHome: { x: inset.left + STICK_RADIUS + 36, y: height - inset.bottom - STICK_RADIUS - 28 },
  };
}

export function touchZones(l: TouchLayout): TouchZone[] {
  const box = (name: string, c: Circle): TouchZone => ({
    name,
    x: c.x - c.r,
    y: c.y - c.r,
    w: c.r * 2,
    h: c.r * 2,
  });
  const zones = [box('use', l.use), box('search', l.search)];
  if (l.full) zones.push(box('fullscreen', l.full));
  return zones;
}

function disc(ctx: CanvasRenderingContext2D, c: Circle, fill: string, stroke: string): void {
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

/**
 * The on-screen controls: a thumb-stick, a big "use" button that lights up when you are aiming
 * at something, a search button and (where possible) fullscreen. Drawn in real CSS pixels.
 */
export function drawTouchHud(
  ctx: CanvasRenderingContext2D,
  touch: TouchControls,
  layout: TouchLayout,
  aim: string | null,
  time: number,
): void {
  // Thumb-stick.
  const home = layout.stickHome;
  const s = touch.stick;
  const base = s.on ? { x: s.originX, y: s.originY } : home;
  ctx.beginPath();
  ctx.arc(base.x, base.y, STICK_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = s.on ? 'rgba(20,14,9,0.35)' : 'rgba(20,14,9,0.2)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = s.on ? 'rgba(246,236,213,0.7)' : 'rgba(246,236,213,0.3)';
  ctx.stroke();
  const knob = s.on ? { x: s.knobX, y: s.knobY } : home;
  ctx.beginPath();
  ctx.arc(knob.x, knob.y, STICK_RADIUS * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = s.on ? 'rgba(246,236,213,0.55)' : 'rgba(246,236,213,0.22)';
  ctx.fill();

  // Use button.
  const u = layout.use;
  if (aim) {
    const pulse = 1 + Math.sin(time * 6) * 0.04;
    disc(ctx, { ...u, r: u.r * pulse }, 'rgba(20,14,9,0.85)', C.gold);
    text(ctx, aim, u.x, u.y + 5, {
      size: Math.max(9, Math.round(u.r * 0.28)),
      head: true,
      color: C.gold,
      align: 'center',
    });
  } else {
    disc(ctx, u, 'rgba(20,14,9,0.28)', 'rgba(246,236,213,0.3)');
    text(ctx, 'AIM', u.x, u.y + 5, {
      size: Math.max(9, Math.round(u.r * 0.26)),
      head: true,
      color: 'rgba(246,236,213,0.45)',
      align: 'center',
    });
  }
  setFont(ctx, 10);

  // Search: a magnifying glass.
  const q = layout.search;
  disc(ctx, q, 'rgba(20,14,9,0.75)', C.teal);
  ctx.strokeStyle = C.teal;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(q.x - q.r * 0.12, q.y - q.r * 0.12, q.r * 0.36, 0, Math.PI * 2);
  ctx.moveTo(q.x + q.r * 0.16, q.y + q.r * 0.16);
  ctx.lineTo(q.x + q.r * 0.46, q.y + q.r * 0.46);
  ctx.stroke();

  // Fullscreen: four corner brackets.
  const f = layout.full;
  if (f) {
    disc(ctx, f, 'rgba(20,14,9,0.6)', 'rgba(246,236,213,0.5)');
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 3;
    const a = f.r * 0.5;
    const b = f.r * 0.22;
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(f.x + sx * a, f.y + sy * (a - b * 2));
      ctx.lineTo(f.x + sx * a, f.y + sy * a);
      ctx.lineTo(f.x + sx * (a - b * 2), f.y + sy * a);
      ctx.stroke();
    }
  }
}

/** A short first-run hint for the controls, centred near the bottom. */
export function drawTouchHint(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const w = Math.min(width - 40, 520);
  const x = (width - w) / 2;
  const y = height - 76;
  ctx.fillStyle = 'rgba(20,14,9,0.82)';
  ctx.fillRect(x, y, w, 50);
  ctx.strokeStyle = C.teal;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, 48);
  text(ctx, 'LEFT THUMB WALK  ·  DRAG TO LOOK  ·  TAP A FIGURE', width / 2, y + 31, {
    size: 20,
    color: C.white,
    align: 'center',
  });
}
