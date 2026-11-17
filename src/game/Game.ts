import type { Viewport } from '../engine/canvas';
import type { Input } from '../engine/input';
import type { Pointer } from '../engine/pointer';
import type { TextField } from '../engine/textfield';
import { CATALOGUE } from './data';
import type { Entry } from './data/types';
import type { Controls, Scene, Stage } from './scene';
import { FloorScene } from './scenes/FloorScene';
import { TapeScene } from './scenes/TapeScene';
import { TerminalScene } from './scenes/TerminalScene';
import { H, W } from './theme';

/**
 * Low Botanica: a 90s video store where every tape is an entry in an index of
 * psychoactive plants and synthetics. Holds a stack of scenes (floor, search
 * terminal, tape details) and scales the fixed 960x540 stage to fit the window.
 */
export class Game implements Stage {
  private readonly scenes: Scene[] = [];
  private readonly controls: Controls;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private lastMouse = { x: -1, y: -1 };

  constructor(
    private readonly view: Viewport,
    input: Input,
    private readonly pointer: Pointer,
    text: TextField,
    entries: readonly Entry[] = CATALOGUE,
  ) {
    this.controls = {
      keys: input,
      text,
      cursor: 'default',
      mouse: { x: 0, y: 0, inside: false, moved: false, clicked: false, wheel: 0 },
    };

    const openTape = (entry: Entry) =>
      this.push(new TapeScene(entry, this.controls, () => this.pop()));
    const terminal = new TerminalScene(entries, this.controls, () => this.pop(), openTape);
    this.push(new FloorScene(entries, this.controls, () => this.push(terminal), openTape));
  }

  push(scene: Scene): void {
    this.scenes.at(-1)?.pause?.();
    this.scenes.push(scene);
    scene.resume?.();
  }

  pop(): void {
    if (this.scenes.length <= 1) return;
    this.scenes.pop()?.pause?.();
    this.scenes.at(-1)?.resume?.();
  }

  private layout(): void {
    const { width, height } = this.view;
    this.scale = Math.min(width / W, height / H) || 1;
    this.offsetX = (width - W * this.scale) / 2;
    this.offsetY = (height - H * this.scale) / 2;
  }

  update(dt: number): void {
    this.layout();
    const p = this.pointer;
    const mouse = this.controls.mouse;
    mouse.x = (p.x - this.offsetX) / this.scale;
    mouse.y = (p.y - this.offsetY) / this.scale;
    mouse.inside = p.inside;
    mouse.moved = mouse.x !== this.lastMouse.x || mouse.y !== this.lastMouse.y;
    mouse.clicked = p.wasClicked();
    mouse.wheel = p.wheelDelta();
    if (!p.inside) mouse.x = mouse.y = -1;
    this.lastMouse = { x: mouse.x, y: mouse.y };

    // The scene may set this while updating.
    this.controls.cursor = 'default';
    // A pushed scene starts on the next update, so a key press isn't handled twice.
    this.scenes.at(-1)?.update(dt);
    p.setCursor(this.controls.cursor);

    this.controls.keys.endFrame();
    p.endFrame();
  }

  render(): void {
    const { ctx, width, height } = this.view;
    this.layout();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw from the top-most non-overlay scene upward.
    let from = this.scenes.length - 1;
    while (from > 0 && this.scenes[from]?.overlay) from--;

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    for (const scene of this.scenes.slice(from)) {
      ctx.save();
      scene.render(ctx);
      ctx.restore();
    }
    ctx.restore();
  }
}
