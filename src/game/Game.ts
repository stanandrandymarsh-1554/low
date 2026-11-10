import type { Viewport } from '../engine/canvas';
import type { Input } from '../engine/input';
import { clamp, lerp } from '../engine/math';

const PLAYER_SIZE = 32;
const PLAYER_SPEED = 300; // CSS pixels per second

/**
 * Placeholder game: a square you move with WASD / arrow keys.
 * Replace this with the real game.
 */
export class Game {
  private x = 0;
  private y = 0;
  private prevX = 0;
  private prevY = 0;
  private started = false;

  constructor(
    private readonly view: Viewport,
    private readonly input: Input,
  ) {}

  update(dt: number): void {
    const { width, height } = this.view;
    if (!this.started) {
      this.x = this.prevX = width / 2;
      this.y = this.prevY = height / 2;
      this.started = true;
    }

    this.prevX = this.x;
    this.prevY = this.y;

    let dx = 0;
    let dy = 0;
    if (this.input.isDown('ArrowLeft', 'KeyA')) dx -= 1;
    if (this.input.isDown('ArrowRight', 'KeyD')) dx += 1;
    if (this.input.isDown('ArrowUp', 'KeyW')) dy -= 1;
    if (this.input.isDown('ArrowDown', 'KeyS')) dy += 1;
    const len = Math.hypot(dx, dy) || 1;

    const half = PLAYER_SIZE / 2;
    this.x = clamp(this.x + (dx / len) * PLAYER_SPEED * dt, half, width - half);
    this.y = clamp(this.y + (dy / len) * PLAYER_SPEED * dt, half, height - half);

    this.input.endFrame();
  }

  render(alpha: number): void {
    const { ctx, width, height } = this.view;

    ctx.fillStyle = '#1b1d24';
    ctx.fillRect(0, 0, width, height);

    const x = lerp(this.prevX, this.x, alpha);
    const y = lerp(this.prevY, this.y, alpha);
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(x - PLAYER_SIZE / 2, y - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);

    ctx.fillStyle = '#8a8f9c';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('WASD / arrow keys to move', 16, 28);
  }
}
