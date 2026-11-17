import type { Rect } from '../scene';
import { C, H, W } from '../theme';
import { button, text } from './ui';

export const NOTICE_OK: Rect = { x: W / 2 - 90, y: 408, w: 180, h: 36 };

/** The "welcome" card shown on first entering the store. Drawn on the 960x540 stage. */
export function drawNotice(ctx: CanvasRenderingContext2D, flash: boolean, hoverOk: boolean): void {
  ctx.fillStyle = 'rgba(20,14,9,0.8)';
  ctx.fillRect(0, 0, W, H);
  const r: Rect = { x: W / 2 - 300, y: 90, w: 600, h: 366 };
  ctx.fillStyle = C.card;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = C.gold;
  ctx.fillRect(r.x, r.y, r.w, 40);
  text(ctx, 'STORE NOTICE', W / 2, r.y + 27, {
    size: 16,
    head: true,
    color: C.black,
    align: 'center',
  });
  const body = [
    'Welcome, member! Every tape in this store is an entry',
    'in an index of psychoactive plants and synthetics.',
    '',
    'Numbers on the boxes (doses, percentages, timing) are',
    'figures reported in the sources, often from single',
    'studies or traditional use. Treat them as reference,',
    'not advice, and expect them to vary.',
    '',
    'WASD walk  ·  mouse look  ·  aim at a tape, press E',
  ];
  body.forEach((line, i) =>
    text(ctx, line, W / 2, r.y + 78 + i * 25, {
      size: 22,
      color: i === body.length - 1 ? C.teal : C.white,
      align: 'center',
    }),
  );
  button(ctx, NOTICE_OK, 'ENTER STORE', hoverOk || flash, C.gold);
}
