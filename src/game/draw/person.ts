export type Facing = 'up' | 'down' | 'left' | 'right';

export interface PersonLook {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
  /** Baseball cap colour; leave out for bare hair. */
  cap?: string;
}

export const PLAYER_LOOK: PersonLook = {
  skin: '#f2c9a0',
  hair: '#2b1b12',
  shirt: '#ff3fa4',
  pants: '#2a4bd8',
  shoes: '#f4ecff',
  cap: '#38f2ff',
};

export const CLERK_LOOK: PersonLook = {
  skin: '#d9a273',
  hair: '#5a2a8c',
  shirt: '#ffd23f',
  pants: '#222244',
  shoes: '#111',
};

/**
 * A chunky pixel-art person, about 16 wide and 34 tall. (x, y) is the point between their feet.
 * `t` is time in seconds and drives the walk cycle.
 */
export function drawPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  look: PersonLook,
  facing: Facing,
  moving: boolean,
  t: number,
): void {
  const swing = moving ? Math.sin(t * 13) : 0;
  const bob = moving ? Math.abs(Math.cos(t * 13)) * 1.5 : 0;
  const px = Math.round(x);
  const py = Math.round(y);
  const r = (cx: number, cy: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(px + cx, py + cy, w, h);
  };

  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(px, py - 1, 9, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs and shoes. Each leg shortens as it lifts.
  const lift = (v: number) => Math.max(0, v) * 3;
  r(-5, -11 - bob, 4, 8 - lift(swing) + 0, look.pants);
  r(1, -11 - bob, 4, 8 - lift(-swing) + 0, look.pants);
  r(-5, -4 - lift(swing) - bob, 4, 4, look.shoes);
  r(1, -4 - lift(-swing) - bob, 4, 4, look.shoes);

  // Arms (behind the torso when facing up, in front otherwise) and torso.
  const armY = -23 - bob;
  r(-9, armY + (swing > 0 ? 1 : 0), 3, 10, look.shirt);
  r(6, armY + (swing < 0 ? 1 : 0), 3, 10, look.shirt);
  r(-6, -24 - bob, 12, 13, look.shirt);
  r(-6, -13 - bob, 12, 2, 'rgba(0,0,0,0.25)');

  // Head.
  const hy = -34 - bob;
  r(-5, hy, 10, 10, look.skin);
  if (facing === 'up') {
    r(-5, hy, 10, 8, look.hair);
  } else {
    r(-5, hy, 10, 3, look.hair);
    const eyeY = hy + 5;
    if (facing === 'down') {
      r(-3, eyeY, 2, 2, '#111');
      r(1, eyeY, 2, 2, '#111');
    } else {
      r(facing === 'left' ? -4 : 2, eyeY, 2, 2, '#111');
    }
  }
  if (look.cap) {
    r(-5, hy - 2, 10, 4, look.cap);
    // Brim points the way they're facing (backwards cap when facing up).
    if (facing === 'down') r(-5, hy + 1, 10, 2, look.cap);
    else if (facing === 'left') r(-8, hy + 1, 4, 2, look.cap);
    else if (facing === 'right') r(4, hy + 1, 4, 2, look.cap);
    else r(-2, hy + 2, 4, 2, look.cap);
  }
}
