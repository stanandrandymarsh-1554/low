import type { Viewport } from '../engine/canvas';
import type { GlView } from '../engine/gl';
import type { Input } from '../engine/input';
import type { MouseLook } from '../engine/mouselook';
import type { Pointer } from '../engine/pointer';
import type { TextField } from '../engine/textfield';
import { CATALOGUE } from './data';
import type { Entry } from './data/types';
import type { Controls, Scene, Stage } from './scene';
import { StoreScene } from './scenes/StoreScene';
import { TapeScene } from './scenes/TapeScene';
import { TerminalScene } from './scenes/TerminalScene';
import { H, W } from './theme';

/**
 * Low Botanica: a 90s video store you walk around in first person. Every tape on the shelves
 * is an entry in an index of psychoactive plants and synthetics. Holds a stack of scenes
 * (the store, the search computer, a tape's details) and scales the 960x540 stage used by the
 * 2D screens to fit the window.
 */
export class Game implements Stage {
  private readonly scenes: Scene[] = [];
  private readonly controls: Controls;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private lastMouse = { x: -1, y: -1 };
  private readonly store: StoreScene;

  constructor(
    private readonly view: Viewport,
    input: Input,
    private readonly pointer: Pointer,
    text: TextField,
    look: MouseLook,
    gl: GlView,
    entries: readonly Entry[] = CATALOGUE,
  ) {
    this.controls = {
      keys: input,
      text,
      look,
      cursor: 'default',
      mouse: { x: 0, y: 0, inside: false, moved: false, clicked: false, wheel: 0 },
      pixel: { x: 0, y: 0, inside: false },
      view,
    };

    const openTape = (entry: Entry) =>
      this.push(new TapeScene(entry, this.controls, () => this.pop()));
    const terminal = new TerminalScene(entries, this.controls, () => this.pop(), openTape);
    this.store = new StoreScene(entries, this.controls, gl, () => this.push(terminal), openTape);
    this.push(this.store);
  }

  /** Dev-only: jump the camera somewhere in the store (see main.ts). */
  teleport(x: number, z: number, yaw: number, pitch = 0): void {
    this.store.teleport(x, z, yaw, pitch);
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
    this.controls.pixel.x = p.x;
    this.controls.pixel.y = p.y;
    this.controls.pixel.inside = p.inside;

    // The scene may set this while updating.
    this.controls.cursor = 'default';
    this.scenes.at(-1)?.update(dt);
    p.setCursor(this.controls.cursor);

    this.controls.keys.endFrame();
    p.endFrame();
  }

  render(alpha = 1): void {
    const { ctx, width, height } = this.view;
    this.layout();

    // Draw from the top-most non-overlay scene upward.
    let from = this.scenes.length - 1;
    while (from > 0 && this.scenes[from]?.overlay) from--;

    if (this.scenes[from]?.transparent) {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
    }

    for (const scene of this.scenes.slice(from)) {
      if (scene.renderScreen) {
        ctx.save();
        scene.renderScreen(ctx, width, height, alpha);
        ctx.restore();
      }
      ctx.save();
      ctx.translate(this.offsetX, this.offsetY);
      ctx.scale(this.scale, this.scale);
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();
      scene.render(ctx);
      ctx.restore();
    }
  }
}
