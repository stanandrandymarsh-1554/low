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
import { canFullscreen, toggleFullscreen } from '../../engine/fullscreen';
import { buildLayout, nearestAisle, type Layout } from '../store/layout';
import { drawTouchHint, drawTouchHud, safeInsets, touchLayout, touchZones } from '../draw/touchhud';
import { Crowd } from '../store/npc';
import { PLAYER_RADIUS, RUN_SPEED, WALK_SPEED } from '../store/scale';
import { H, W } from '../theme';
import { StoreWorld, type Pick } from '../world/StoreWorld';

/** Mouse look, radians per pixel. */
const LOOK_SENSITIVITY = 0.0022;
/** A finger covers less screen than a mouse mat, so touch turns further per pixel. */
const TOUCH_LOOK = 0.0048;

/**
 * Walking around the store in first person. The 3D scene is drawn on the canvas behind;
 * this scene's HUD (crosshair, tooltip, hints) is drawn on the 2D canvas in front.
 */
export class StoreScene implements Scene {
  readonly transparent = true;
  readonly layout: Layout;
  private readonly world: StoreWorld;
  private readonly body: FirstPersonBody;
  private readonly crowd: Crowd;
  private hover: Pick | null = null;
  private notice = true;
  private noticeHover = false;
  private paused = false;
  private t = 0;
  private inset = { left: 0, right: 0, top: 0, bottom: 0 };
  private hintFor = 0;
  private insetMeasured = false;
  private layoutTouch = touchLayout(0, 0, { left: 0, right: 0, top: 0, bottom: 0 }, false);

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
    this.crowd = new Crowd(this.layout);
    this.world.setCrowd(this.crowd);
    this.world.setCamera(this.body.pose);
    this.world.updateModels(this.layout.spawn.x, this.layout.spawn.z, 999);
  }

  /** Moves the player somewhere else instantly (used by the dev-only debug hook). */
  teleport(x: number, z: number, yaw: number, pitch = 0): void {
    this.body.place({ x, z, yaw, pitch });
    this.world.setCamera(this.body.pose);
    this.world.updateModels(x, z, 999);
    this.notice = false;
  }

  resume(): void {
    this.paused = false;
    this.controls.touch.reset();
    this.controls.touch.enabled = true;
  }

  /** Another screen (a tape, the computer) is covering the store: let go of the mouse. */
  pause(): void {
    this.paused = true;
    this.controls.look.unlock();
    this.controls.look.lockOnClick = false;
    this.controls.touch.enabled = false;
    this.controls.touch.reset();
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
        this.hintFor = this.t;
        this.controls.touch.reset();
      }
      return;
    }

    const touch = this.controls.touch;
    const touching = touch.active;
    if (touching) {
      // On a phone the buttons sit at fixed places on screen; the rest is thumb-stick and look.
      if (!this.insetMeasured) {
        this.inset = safeInsets();
        this.insetMeasured = true;
      }
      this.layoutTouch = touchLayout(view.width, view.height, this.inset, canFullscreen());
      touch.zones = touchZones(this.layoutTouch);
    }

    const axis = (pos: string[], neg: string[]) =>
      (keys.isDown(...pos) ? 1 : 0) - (keys.isDown(...neg) ? 1 : 0);
    const mouseLook = look.consume();
    const fingerLook = touch.consumeLook();
    const walk = touch.walk;
    const input: FirstPersonInput = {
      forward: axis(['KeyW'], ['KeyS']) || walk.forward,
      strafe: axis(['KeyD'], ['KeyA']) || walk.strafe,
      run: keys.isDown('ShiftLeft', 'ShiftRight') || walk.run,
      turn: axis(['ArrowLeft'], ['ArrowRight']),
      tilt: axis(['ArrowUp'], ['ArrowDown']),
      lookX: mouseLook.dx + (fingerLook.dx * TOUCH_LOOK) / LOOK_SENSITIVITY,
      lookY: mouseLook.dy + (fingerLook.dy * TOUCH_LOOK) / LOOK_SENSITIVITY,
    };
    this.world.snapshotPeople();
    this.crowd.update(dt, this.body.pose);
    this.body.step(dt, input, [...this.world.colliders, ...this.crowd.boxes()]);
    const pose = this.body.pose;
    this.world.setCamera(pose);
    this.world.updateModels(pose.x, pose.z);

    // Aim: the screen centre while the mouse is locked (or on a phone), otherwise the cursor.
    if (look.locked || touching) this.hover = this.world.pick(0, 0);
    else if (pixel.inside && view.width > 0) {
      this.hover = this.world.pick(
        (pixel.x / view.width) * 2 - 1,
        -((pixel.y / view.height) * 2 - 1),
      );
    } else this.hover = this.world.pick(Infinity, Infinity);

    look.lockOnClick = this.hover === null && !touching;
    this.controls.cursor = this.hover ? 'pointer' : look.locked ? 'none' : 'default';

    if (touching) {
      this.updateTouch(touch, view);
      return;
    }
    const use = keys.wasPressed('KeyE', 'Enter') || (mouse.clicked && this.hover !== null);
    if (this.hover && use) this.activate(this.hover);
    else if (keys.wasPressed('Slash', 'KeyF')) this.openSearch();
  }

  private activate(pick: Pick): void {
    if (pick.kind === 'item') this.openTape(pick.entry);
    else this.openSearch();
  }

  /** Buttons and taps on a touch screen. */
  private updateTouch(touch: Controls['touch'], view: { width: number; height: number }): void {
    const tap = touch.consumeTap();
    if (tap && view.width > 0) {
      // Tapping a figure (or the clerk, or the computer) opens it, wherever it is on screen.
      const picked = this.world.pick(
        (tap.x / view.width) * 2 - 1,
        -((tap.y / view.height) * 2 - 1),
      );
      if (picked) {
        this.activate(picked);
        return;
      }
    }
    if (touch.wasTapped('use') && this.hover) this.activate(this.hover);
    else if (touch.wasTapped('search')) this.openSearch();
    else if (touch.wasTapped('fullscreen')) toggleFullscreen();
  }

  /** Draws the 3D store, then the HUD, in real screen pixels. */
  renderScreen(ctx: CanvasRenderingContext2D, width: number, height: number, alpha: number): void {
    this.world.setCamera(this.body.poseAt(alpha));
    this.world.render(width, height, alpha, this.t);
    if (this.paused || this.notice) return;

    // Lay the HUD out on a virtual screen at least as big as the 960x540 stage. On a phone the
    // screen is small, so the HUD is drawn a little larger instead.
    const touching = this.controls.touch.active;
    const s = touching
      ? Math.max(0.8, Math.min(1.3, width / 760, height / 380))
      : Math.min(width / W, height / H);
    const vw = width / s;
    const vh = height / s;
    ctx.save();
    ctx.scale(s, s);

    const { look, pixel } = this.controls;
    const locked = look.locked || touching;
    const cx = locked ? vw / 2 : pixel.x / s;
    const cy = locked ? vh / 2 : pixel.y / s;
    if (locked) drawCrosshair(ctx, cx, cy, this.hover !== null);

    if (this.hover && (locked || pixel.inside)) {
      const tip = this.hover.kind === 'item';
      const w = tip ? TOOLTIP_W : 320;
      const h = tip ? TOOLTIP_H : 70;
      const x = Math.min(Math.max(cx + 28, 8), vw - w - 8);
      const y = Math.min(Math.max(cy - h / 2, 8), vh - h - 48);
      if (this.hover.kind === 'item') drawTapeTooltip(ctx, this.hover.entry, x, y, touching);
      else if (this.hover.clerk) {
        drawPrompt(
          ctx,
          x,
          y,
          'THE CLERK',
          touching ? 'tap ASK: get help' : 'or click: ask for help',
        );
      } else {
        drawPrompt(
          ctx,
          x,
          y,
          'CATALOGUE SEARCH',
          touching ? 'tap USE: use the computer' : 'or click: use the computer',
        );
      }
    }

    const pose = this.body.pose;
    const aisle = nearestAisle(this.layout, pose.x, pose.z);
    if (aisle) drawAisleBadge(ctx, aisle, 16, 16);
    if (!touching) {
      if (!locked && !this.hover) drawLookHint(ctx, vw);
      drawHelpBar(ctx, vw, vh);
    }
    ctx.restore();

    if (touching) {
      const label = !this.hover
        ? null
        : this.hover.kind === 'item'
          ? 'OPEN'
          : this.hover.clerk
            ? 'ASK'
            : 'USE';
      drawTouchHud(ctx, this.controls.touch, this.layoutTouch, label, this.t);
      if (this.t - this.hintFor < 9) drawTouchHint(ctx, width, height);
    }
  }

  /** The welcome card, on the 960x540 stage. */
  render(ctx: CanvasRenderingContext2D): void {
    if (this.notice) {
      drawNotice(ctx, this.t % 1 < 0.5, this.noticeHover, this.controls.touch.active);
    }
  }
}
