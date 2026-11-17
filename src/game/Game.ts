import type { Viewport } from '../engine/canvas';
import type { GlView } from '../engine/gl';
import type { Input } from '../engine/input';
import type { MouseLook } from '../engine/mouselook';
import type { Pointer } from '../engine/pointer';
import type { TextField } from '../engine/textfield';
import type { TouchControls } from '../engine/touch';
import { CATALOGUE } from './data';
import type { Entry } from './data/types';
import type { Controls, Scene, Stage } from './scene';
import { StoreScene } from './scenes/StoreScene';
import { TapeScene } from './scenes/TapeScene';
import { TerminalScene } from './scenes/TerminalScene';
import { text } from './draw/ui';
import { C, H, W } from './theme';

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
    touch: TouchControls,
    gl: GlView,
    entries: readonly Entry[] = CATALOGUE,
  ) {
    this.controls = {
      keys: input,
      text,
      look,
      touch,
      cursor: 'default',
      mouse: { x: 0, y: 0, inside: false, moved: false, clicked: false, wheel: 0, drag: 0 },
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
    mouse.drag = p.dragDelta() / this.scale;
    if (!p.inside) mouse.x = mouse.y = -1;
    this.lastMouse = { x: mouse.x, y: mouse.y };
    this.controls.pixel.x = p.x;
    this.controls.pixel.y = p.y;
    this.controls.pixel.inside = p.inside;

    // The scene may set this while updating. A phone held upright waits until it is turned.
    this.controls.cursor = 'default';
    if (!this.upright()) this.scenes.at(-1)?.update(dt);
    p.setCursor(this.controls.cursor);

    this.controls.keys.endFrame();
    this.controls.touch.endFrame();
    p.endFrame();
  }

  /** Is a touch screen being held in portrait, where the shop is too cramped to use? */
  private upright(): boolean {
    const { width, height } = this.view;
    return this.controls.touch.active && height > width * 1.05;
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
    if (this.upright()) this.drawRotate(ctx, width, height);
  }

  private drawRotate(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(20,14,9,0.94)';
    ctx.fillRect(0, 0, width, height);
    const s = Math.min(1, width / 360);
    ctx.translate(width / 2, height / 2);
    ctx.scale(s, s);
    // A little phone, turned on its side.
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-34, -58, 68, 116, 10);
    ctx.stroke();
    ctx.fillStyle = C.gold;
    ctx.fillRect(-10, 44, 20, 4);
    ctx.beginPath();
    ctx.arc(62, -50, 34, Math.PI * 1.1, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(86, -40);
    ctx.lineTo(96, -62);
    ctx.lineTo(70, -62);
    ctx.fill();
    text(ctx, 'TURN YOUR PHONE', 0, 110, { size: 14, head: true, align: 'center', color: C.white });
    text(ctx, 'SIDEWAYS TO BROWSE', 0, 136, {
      size: 14,
      head: true,
      align: 'center',
      color: C.white,
    });
    ctx.restore();
  }
}
