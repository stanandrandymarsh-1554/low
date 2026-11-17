import { FirstPersonBody, type FirstPersonInput } from '../../engine/firstperson';
import type { GlView } from '../../engine/gl';
import type { Entry } from '../data/types';
import { drawNotice, NOTICE_OK } from '../draw/notice';
import {
  drawAisleBadge,
  drawCrosshair,
  drawHelpBar,
  drawLookHint,
  drawPrompt,
  drawTapeTooltip,
  TOOLTIP_H,
  TOOLTIP_W,
} from '../draw/hud';
import { inRect, type Controls, type Scene } from '../scene';
import { buildLayout, nearestAisle, type Layout } from '../store/layout';
import { PLAYER_RADIUS, RUN_SPEED, WALK_SPEED } from '../store/scale';
import { H, W } from '../theme';
import { StoreWorld, type Pick } from '../world/StoreWorld';

/** Mouse look, radians per pixel. */
const LOOK_SENSITIVITY = 0.0022;

/**
 * Walking around the store in first person. The 3D scene is drawn on the canvas behind;
 * this scene's HUD (crosshair, tooltip, hints) is drawn on the 2D canvas in front.
 */
export class StoreScene implements Scene {
  readonly transparent = true;
  readonly layout: Layout;
  private readonly world: StoreWorld;
  private readonly body: FirstPersonBody;
  private hover: Pick | null = null;
  private notice = true;
  private noticeHover = false;
  private paused = false;
  private t = 0;

  constructor(
    entries: readonly Entry[],
    private readonly controls: Controls,
    gl: GlView,
    private readonly openSearch: () => void,
    private readonly openTape: (entry: Entry) => void,
  ) {
    this.layout = buildLayout(entries);
    this.world = new StoreWorld(this.layout, gl.renderer);
    this.body = new FirstPersonBody(
      {
        radius: PLAYER_RADIUS,
        walkSpeed: WALK_SPEED,
        runSpeed: RUN_SPEED,
        turnSpeed: 1.8,
        lookSensitivity: LOOK_SENSITIVITY,
        pitchLimit: 1.4,
      },
      { x: this.layout.spawn.x, z: this.layout.spawn.z, yaw: this.layout.spawn.yaw, pitch: 0 },
    );
    this.world.setCamera(this.body.pose);
    this.world.updateCovers(this.layout.spawn.x, this.layout.spawn.z, 999);
  }

  /** Moves the player somewhere else instantly (used by the dev-only debug hook). */
  teleport(x: number, z: number, yaw: number, pitch = 0): void {
    this.body.place({ x, z, yaw, pitch });
    this.world.setCamera(this.body.pose);
    this.world.updateCovers(x, z, 999);
    this.notice = false;
  }

  resume(): void {
    this.paused = false;
  }

  /** Another screen (a tape, the computer) is covering the store: let go of the mouse. */
  pause(): void {
    this.paused = true;
    this.controls.look.unlock();
    this.controls.look.lockOnClick = false;
  }

  update(dt: number): void {
    this.t += dt;
    const { keys, mouse, look, pixel, view } = this.controls;

    if (this.notice) {
      this.noticeHover = inRect(mouse, NOTICE_OK);
      // Clicking the button also grabs the mouse, so you can start looking straight away.
      look.lockOnClick = this.noticeHover;
      if (this.noticeHover) this.controls.cursor = 'pointer';
      if (keys.wasPressed('Enter', 'Space') || (mouse.clicked && this.noticeHover)) {
        this.notice = false;
      }
      return;
    }

    const axis = (pos: string[], neg: string[]) =>
      (keys.isDown(...pos) ? 1 : 0) - (keys.isDown(...neg) ? 1 : 0);
    const { dx, dy } = look.consume();
    const input: FirstPersonInput = {
      forward: axis(['KeyW'], ['KeyS']),
      strafe: axis(['KeyD'], ['KeyA']),
      run: keys.isDown('ShiftLeft', 'ShiftRight'),
      turn: axis(['ArrowLeft'], ['ArrowRight']),
      tilt: axis(['ArrowUp'], ['ArrowDown']),
      lookX: dx,
      lookY: dy,
    };
    this.body.step(dt, input, this.world.colliders);
    const pose = this.body.pose;
    this.world.setCamera(pose);
    this.world.updateCovers(pose.x, pose.z);

    // Aim: the screen centre while the mouse is locked, otherwise wherever the cursor is.
    if (look.locked) this.hover = this.world.pick(0, 0);
    else if (pixel.inside && view.width > 0) {
      this.hover = this.world.pick(
        (pixel.x / view.width) * 2 - 1,
        -((pixel.y / view.height) * 2 - 1),
      );
    } else this.hover = this.world.pick(Infinity, Infinity);

    look.lockOnClick = this.hover === null;
    this.controls.cursor = this.hover ? 'pointer' : look.locked ? 'none' : 'default';

    const use = keys.wasPressed('KeyE', 'Enter') || (mouse.clicked && this.hover !== null);
    if (this.hover && use) {
      if (this.hover.kind === 'tape') this.openTape(this.hover.entry);
      else this.openSearch();
    } else if (keys.wasPressed('Slash', 'KeyF')) {
      this.openSearch();
    }
  }

  /** Draws the 3D store, then the HUD, in real screen pixels. */
  renderScreen(ctx: CanvasRenderingContext2D, width: number, height: number, alpha: number): void {
    this.world.setCamera(this.body.poseAt(alpha));
    this.world.render(width, height);
    if (this.paused || this.notice) return;

    // Lay the HUD out on a virtual screen at least as big as the 960x540 stage.
    const s = Math.min(width / W, height / H);
    const vw = width / s;
    const vh = height / s;
    ctx.save();
    ctx.scale(s, s);

    const { look, pixel } = this.controls;
    const locked = look.locked;
    const cx = locked ? vw / 2 : pixel.x / s;
    const cy = locked ? vh / 2 : pixel.y / s;
    if (locked) drawCrosshair(ctx, cx, cy, this.hover !== null);

    if (this.hover && (locked || pixel.inside)) {
      const tip = this.hover.kind === 'tape';
      const w = tip ? TOOLTIP_W : 320;
      const h = tip ? TOOLTIP_H : 70;
      const x = Math.min(Math.max(cx + 28, 8), vw - w - 8);
      const y = Math.min(Math.max(cy - h / 2, 8), vh - h - 48);
      if (this.hover.kind === 'tape') drawTapeTooltip(ctx, this.hover.entry, x, y);
      else drawPrompt(ctx, x, y, 'CATALOGUE SEARCH', 'or click: use the computer');
    }

    const pose = this.body.pose;
    const aisle = nearestAisle(this.layout, pose.x, pose.z);
    if (aisle) drawAisleBadge(ctx, aisle, 16, 16);
    if (!locked && !this.hover) drawLookHint(ctx, vw);
    drawHelpBar(ctx, vw, vh);
    ctx.restore();
  }

  /** The welcome card, on the 960x540 stage. */
  render(ctx: CanvasRenderingContext2D): void {
    if (this.notice) drawNotice(ctx, this.t % 1 < 0.5, this.noticeHover);
  }
}
