import { clampCamera } from '../../engine/camera';
import { moveAndCollide, overlaps } from '../../engine/collision';
import { fitText, wrapText } from '../../engine/text';
import { hashString } from '../aisles';
import type { Entry } from '../data/types';
import { CLERK_LOOK, drawPerson, PLAYER_LOOK, type Facing } from '../draw/person';
import { clearTapeSprites, tapeHue, tapeSprite } from '../draw/tape';
import { button, keyHint, ratingSticker, scanlines, setFont, text } from '../draw/ui';
import { inRect, type Controls, type Rect, type Scene } from '../scene';
import {
  buildStoreLayout,
  FOOT_H,
  FOOT_W,
  PLANK,
  RACK_BASE,
  RACK_TOP,
  ROW_H,
  slotBox,
  TAPE_H,
  TAPE_W,
  WALL_BOTTOM,
  WALL_H,
  WALL_SIDE,
  type Rack,
  type Slot,
  type StoreLayout,
} from '../store/layout';
import { C, EVIDENCE_COLOR, H, TOXICITY_STYLE, W } from '../theme';
import { formatHours } from '../timing';

const SPEED = 175; // world pixels per second
/** How far south of a rack's base you can stand and still reach its tapes. */
const REACH = 64;
const TILE = 48;
const NOTICE_OK: Rect = { x: W / 2 - 90, y: 388, w: 180, h: 36 };

interface Target {
  slot: Slot;
  rack: Rack;
  source: 'mouse' | 'keys';
}

/**
 * Walk around the video store. Racks hold the tapes; point at one for a quick summary, then
 * click it (or press E) for the full box. The counter holds the catalogue search computer.
 */
export class StoreScene implements Scene {
  private readonly layout: StoreLayout;
  private px: number;
  private py: number;
  private facing: Facing = 'up';
  private moving = false;
  private walkT = 0;
  private t = 0;
  private cam: { x: number; y: number };
  private moveTarget: { x: number; y: number } | null = null;
  private stuck = 0;
  private lastInput: 'mouse' | 'keys' = 'mouse';
  private lookRow = 0;
  private lookRackId = '';
  private target: Target | null = null;
  private hoverComputer = false;
  private nearComputer = false;
  private showMap = true;
  private showNotice = true;
  private hoverOk = false;

  constructor(
    private readonly entries: readonly Entry[],
    private readonly controls: Controls,
    private readonly openSearch: () => void,
    private readonly openTape: (entry: Entry) => void,
  ) {
    this.layout = buildStoreLayout(entries);
    this.px = this.layout.spawn.x;
    this.py = this.layout.spawn.y;
    this.cam = this.cameraGoal();

    // Cached tape sprites would freeze the fallback font if drawn before the web fonts arrive.
    if (typeof document !== 'undefined' && document.fonts) {
      void Promise.all([
        document.fonts.load('20px VT323'),
        document.fonts.load('10px "Press Start 2P"'),
      ]).then(() => clearTapeSprites());
    }
  }

  resume(): void {
    this.moveTarget = null;
  }

  private cameraGoal(): { x: number; y: number } {
    return clampCamera(
      this.px - W / 2,
      this.py - 40 - H / 2,
      { w: W, h: H },
      { w: this.layout.width, h: this.layout.height },
    );
  }

  // ───────────────────────────── update ─────────────────────────────

  update(dt: number): void {
    this.t += dt;
    const { keys, mouse } = this.controls;

    if (this.showNotice) {
      this.hoverOk = inRect(mouse, NOTICE_OK);
      if (this.hoverOk) this.controls.cursor = 'pointer';
      if (keys.wasPressed('Enter', 'Space', 'Escape') || (mouse.clicked && this.hoverOk)) {
        this.showNotice = false;
      }
      return;
    }

    this.updateMovement(dt);
    const k = 1 - Math.exp(-dt * 9);
    const goal = this.cameraGoal();
    this.cam.x += (goal.x - this.cam.x) * k;
    this.cam.y += (goal.y - this.cam.y) * k;

    this.updateTarget();

    if (keys.wasPressed('KeyM')) this.showMap = !this.showMap;

    const interact = keys.wasPressed('KeyE', 'Enter', 'Space');
    if (this.target && (interact || (mouse.clicked && this.target.source === 'mouse'))) {
      this.openTape(this.target.slot.entry);
      return;
    }
    const mouseWorld = this.mouseWorld();
    this.hoverComputer = this.mouseInStage() && inRect(mouseWorld, this.layout.computer);
    if (
      keys.wasPressed('Slash') ||
      (interact && !this.target && this.nearComputer) ||
      (mouse.clicked && this.hoverComputer)
    ) {
      this.openSearch();
      return;
    }

    // Click on bare floor: walk there (handy on touch screens).
    if (mouse.clicked && this.mouseInStage() && !this.hoverComputer && !this.target) {
      this.moveTarget = { x: mouseWorld.x, y: mouseWorld.y };
      this.stuck = 0;
    }

    if (this.target?.source === 'mouse' || this.hoverComputer) this.controls.cursor = 'pointer';
  }

  private updateMovement(dt: number): void {
    const { keys } = this.controls;
    let dx = 0;
    let dy = 0;
    if (keys.isDown('ArrowLeft', 'KeyA')) dx -= 1;
    if (keys.isDown('ArrowRight', 'KeyD')) dx += 1;
    if (keys.isDown('ArrowUp', 'KeyW')) dy -= 1;
    if (keys.isDown('ArrowDown', 'KeyS')) dy += 1;

    if (dx || dy) {
      this.moveTarget = null;
      this.lastInput = 'keys';
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    } else if (this.moveTarget) {
      const tx = this.moveTarget.x - this.px;
      const ty = this.moveTarget.y - this.py;
      const dist = Math.hypot(tx, ty);
      if (dist < 5) this.moveTarget = null;
      else {
        dx = tx / dist;
        dy = ty / dist;
      }
    }

    if (!dx && !dy) {
      this.moving = false;
      return;
    }

    const step = SPEED * dt;
    const foot = { x: this.px - FOOT_W / 2, y: this.py - FOOT_H, w: FOOT_W, h: FOOT_H };
    const next = moveAndCollide(foot, dx * step, dy * step, this.layout.solids);
    const nx = next.x + FOOT_W / 2;
    const ny = next.y + FOOT_H;
    const moved = Math.hypot(nx - this.px, ny - this.py);
    this.px = nx;
    this.py = ny;
    this.moving = moved > 0.01;
    this.walkT += dt;
    if (Math.abs(dx) > Math.abs(dy)) this.facing = dx > 0 ? 'right' : 'left';
    else this.facing = dy > 0 ? 'down' : 'up';

    // Give up on a click-to-walk target we can't reach.
    if (this.moveTarget) {
      this.stuck = moved < step * 0.25 ? this.stuck + dt : 0;
      if (this.stuck > 0.35) this.moveTarget = null;
    }
  }

  private mouseInStage(): boolean {
    const { mouse } = this.controls;
    return mouse.x >= 0 && mouse.y >= 0 && mouse.x < W && mouse.y < H;
  }

  private mouseWorld(): { x: number; y: number } {
    const { mouse } = this.controls;
    return { x: mouse.x + this.cam.x, y: mouse.y + this.cam.y };
  }

  /** The tape under the mouse, if any. */
  private slotAt(p: { x: number; y: number }): { slot: Slot; rack: Rack } | null {
    for (const rack of this.layout.racks) {
      if (!inRect(p, rack)) continue;
      for (const slot of rack.slots) {
        if (inRect(p, slotBox(slot))) return { slot, rack };
      }
    }
    return null;
  }

  /** The rack whose tapes the player can reach from where they stand. */
  private reachableRack(): Rack | null {
    for (const rack of this.layout.racks) {
      const base = rack.y + rack.h;
      if (
        this.px >= rack.x &&
        this.px <= rack.x + rack.w &&
        this.py >= base &&
        this.py <= base + REACH
      ) {
        return rack;
      }
    }
    return null;
  }

  private updateTarget(): void {
    const { keys, mouse } = this.controls;
    if (mouse.moved && this.mouseInStage()) this.lastInput = 'mouse';
    if (mouse.clicked) this.lastInput = 'mouse';

    // Keyboard: the tape in front of you, with R/F to look up and down the rack.
    const rack = this.reachableRack();
    if (rack && rack.id !== this.lookRackId) {
      this.lookRackId = rack.id;
      this.lookRow = Math.min(rack.rows - 1, Math.floor(rack.rows / 2));
    }
    if (rack) {
      if (keys.wasPressed('KeyR')) {
        this.lookRow--;
        this.lastInput = 'keys';
      }
      if (keys.wasPressed('KeyF')) {
        this.lookRow++;
        this.lastInput = 'keys';
      }
      this.lookRow = Math.max(0, Math.min(rack.rows - 1, this.lookRow));
    }
    let keyTarget: Target | null = null;
    if (rack) {
      const col = Math.floor((this.px - rack.x - 14) / 62);
      let best: Slot | null = null;
      for (const slot of rack.slots) {
        const score = Math.abs(slot.row - this.lookRow) * 100 + Math.abs(slot.col - col);
        if (!best || score < Math.abs(best.row - this.lookRow) * 100 + Math.abs(best.col - col)) {
          best = slot;
        }
      }
      if (best) keyTarget = { slot: best, rack, source: 'keys' };
    }

    // Mouse: whatever tape it is over.
    const hit = this.mouseInStage() ? this.slotAt(this.mouseWorld()) : null;
    const mouseTarget: Target | null = hit ? { ...hit, source: 'mouse' } : null;

    this.target = this.lastInput === 'mouse' ? mouseTarget : keyTarget;

    const c = this.layout.counter;
    this.nearComputer =
      this.px > c.x - 40 &&
      this.px < c.x + c.w + 40 &&
      this.py > c.y - 10 &&
      this.py < c.y + c.h + 52;
  }

  // ───────────────────────────── render ─────────────────────────────

  render(ctx: CanvasRenderingContext2D): void {
    const camX = Math.round(this.cam.x);
    const camY = Math.round(this.cam.y);

    ctx.save();
    ctx.translate(-camX, -camY);
    this.drawFloor(ctx, camX, camY);
    this.drawWalls(ctx, camX);

    // Everything with depth is drawn back to front by the y of its base.
    const view = { x: camX - 40, y: camY - 80, w: W + 80, h: H + 160 };
    const items: { y: number; draw: () => void }[] = [];
    const selected = this.showNotice ? null : this.target?.slot;
    for (const rack of this.layout.racks) {
      if (rack.x + rack.w < view.x || rack.x > view.x + view.w) continue;
      if (rack.y + rack.h < view.y || rack.y - 40 > view.y + view.h) continue;
      items.push({ y: rack.y + rack.h, draw: () => this.drawRack(ctx, rack, selected) });
    }
    const { counter } = this.layout;
    items.push({ y: counter.y + counter.h, draw: () => this.drawCounter(ctx) });
    items.push({
      y: counter.y + 8,
      draw: () => drawPerson(ctx, counter.x + 64, counter.y + 8, CLERK_LOOK, 'down', false, this.t),
    });
    items.push({
      y: this.py,
      draw: () =>
        drawPerson(ctx, this.px, this.py, PLAYER_LOOK, this.facing, this.moving, this.walkT),
    });
    items.sort((a, b) => a.y - b.y);
    for (const item of items) {
      ctx.save();
      item.draw();
      ctx.restore();
    }
    ctx.restore();

    if (!this.showNotice) {
      if (this.showMap) this.drawMap(ctx);
      if (this.target) this.drawTooltip(ctx, this.target, camX, camY);
      else if (this.nearComputer) this.drawPrompt(ctx, 'E', 'USE THE CATALOGUE COMPUTER');
    }
    this.drawHelp(ctx);
    if (this.showNotice) this.drawNotice(ctx);
  }

  private drawFloor(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    const x0 = Math.floor(camX / TILE) * TILE;
    const y0 = Math.floor(camY / TILE) * TILE;
    ctx.fillStyle = '#150e29';
    ctx.fillRect(x0, y0, W + TILE * 2, H + TILE * 2);
    ctx.fillStyle = '#1d1437';
    for (let y = y0; y < camY + H + TILE; y += TILE) {
      for (let x = x0; x < camX + W + TILE; x += TILE) {
        if ((x / TILE + y / TILE) & 1) ctx.fillRect(x, y, TILE, TILE);
      }
    }
    // Scattered confetti, like the old carpet.
    const colours = [C.pink, C.cyan, C.yellow, C.lime];
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 2;
    for (let y = y0; y < camY + H + TILE; y += TILE) {
      for (let x = x0; x < camX + W + TILE; x += TILE) {
        const h = hashString(`${x},${y}`);
        if (h % 5) continue;
        ctx.strokeStyle = colours[(h >> 3) % colours.length] ?? C.pink;
        const cx = x + 10 + (h % 28);
        const cy = y + 10 + ((h >> 8) % 28);
        ctx.beginPath();
        if (h & 8) ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        else {
          ctx.moveTo(cx - 5, cy + 3);
          ctx.lineTo(cx, cy - 3);
          ctx.lineTo(cx + 5, cy + 3);
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawWalls(ctx: CanvasRenderingContext2D, camX: number): void {
    const { width, height } = this.layout;

    // Back wall.
    ctx.fillStyle = C.wall;
    ctx.fillRect(0, 0, width, WALL_H + 8);
    ctx.fillStyle = C.wallStripe;
    for (let x = 0; x < width; x += 48) ctx.fillRect(x, 0, 16, WALL_H + 8);
    ctx.fillStyle = '#5a1a45';
    ctx.fillRect(0, WALL_H - 2, width, 10);
    ctx.fillStyle = C.pink;
    ctx.fillRect(0, WALL_H + 6, width, 2);

    // Posters of tapes in the store.
    if (this.entries.length) {
      for (let i = 0, x = 90; x < width - 150; i++, x += 190) {
        if (Math.abs(x + 42 - width / 2) < 250) continue;
        if (x + 84 < camX - 10 || x > camX + W + 10) continue;
        const entry = this.entries[(i * 7) % this.entries.length];
        if (!entry) continue;
        const hue = tapeHue(entry);
        const g = ctx.createLinearGradient(0, 22, 0, 82);
        g.addColorStop(0, `hsl(${hue} 70% 45%)`);
        g.addColorStop(1, `hsl(${hue + 40} 60% 14%)`);
        ctx.fillStyle = C.black;
        ctx.fillRect(x - 3, 19, 90, 68);
        ctx.fillStyle = g;
        ctx.fillRect(x, 22, 84, 62);
        setFont(ctx, 16);
        const lines = wrapText(entry.name.toUpperCase(), 76, (s) => ctx.measureText(s).width).slice(
          0,
          2,
        );
        lines.forEach((line, li) =>
          text(ctx, line, x + 42, 62 + li * 15 - (lines.length - 1) * 7, {
            size: 16,
            color: C.white,
            align: 'center',
          }),
        );
        text(ctx, 'NOW RENTING', x + 42, 36, { size: 12, color: C.yellow, align: 'center' });
      }
    }

    // Neon sign.
    const flicker = Math.sin(this.t * 37) > 0.97 || (this.t % 7 > 6.85 && this.t % 7 < 6.95);
    text(ctx, 'LOW BOTANICA', width / 2, 60, {
      size: 28,
      head: true,
      color: flicker ? '#5a1a3e' : C.pink,
      align: 'center',
      glow: flicker ? undefined : C.pink,
      glowSize: 18,
    });
    text(ctx, 'HERB & VIDEO  ·  EST. 1994', width / 2, 88, {
      size: 20,
      color: C.cyan,
      align: 'center',
      glow: C.cyan,
      glowSize: 6,
    });

    // Side and front walls.
    ctx.fillStyle = '#0b0716';
    ctx.fillRect(0, 0, WALL_SIDE, height);
    ctx.fillRect(width - WALL_SIDE, 0, WALL_SIDE, height);
    ctx.fillRect(0, height - WALL_BOTTOM, width, WALL_BOTTOM);
    ctx.fillStyle = C.pink;
    ctx.fillRect(WALL_SIDE - 2, WALL_H, 2, height - WALL_H - WALL_BOTTOM);
    ctx.fillRect(width - WALL_SIDE, WALL_H, 2, height - WALL_H - WALL_BOTTOM);

    // The door you came in by.
    const dx = Math.round(width / 2) - 50;
    ctx.fillStyle = 'rgba(56,242,255,0.25)';
    ctx.fillRect(dx, height - WALL_BOTTOM, 100, WALL_BOTTOM);
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 2;
    ctx.strokeRect(dx + 1, height - WALL_BOTTOM + 1, 98, WALL_BOTTOM - 2);
    text(ctx, 'EXIT', dx + 50, height - 8, { size: 16, color: C.lime, align: 'center' });
  }

  private drawRack(
    ctx: CanvasRenderingContext2D,
    rack: Rack,
    selected: Slot | null | undefined,
  ): void {
    const { x, y, w, h } = rack;

    // Hanging aisle sign.
    const sw = Math.min(w, 250);
    const sx = x + w / 2 - sw / 2;
    ctx.strokeStyle = C.faint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + 24, y - 36);
    ctx.lineTo(sx + 24, y - 52);
    ctx.moveTo(sx + sw - 24, y - 36);
    ctx.lineTo(sx + sw - 24, y - 52);
    ctx.stroke();
    ctx.fillStyle = C.yellow;
    ctx.fillRect(sx, y - 36, sw, 26);
    setFont(ctx, 10, true);
    text(
      ctx,
      fitText(rack.name.toUpperCase(), sw - 16, (s) => ctx.measureText(s).width),
      sx + sw / 2,
      y - 18,
      {
        size: 10,
        head: true,
        color: C.black,
        align: 'center',
      },
    );

    // Shelf unit: top, back panel, posts, planks, base.
    ctx.fillStyle = '#3a4fb8';
    ctx.fillRect(x - 4, y, w + 8, RACK_TOP);
    ctx.fillStyle = C.shelfEdge;
    ctx.fillRect(x - 4, y, w + 8, 3);
    ctx.fillStyle = C.shelfShadow;
    ctx.fillRect(x, y + RACK_TOP, w, h - RACK_TOP - RACK_BASE);
    ctx.fillStyle = C.shelf;
    ctx.fillRect(x - 4, y, 8, h);
    ctx.fillRect(x + w - 4, y, 8, h);
    for (let r = 0; r < rack.rows; r++) {
      const py = y + RACK_TOP + r * ROW_H + ROW_H - PLANK;
      ctx.fillStyle = C.shelfEdge;
      ctx.fillRect(x - 4, py, w + 8, 5);
      ctx.fillStyle = C.shelf;
      ctx.fillRect(x - 4, py + 5, w + 8, 5);
    }
    ctx.fillStyle = '#10153a';
    ctx.fillRect(x - 4, y + h - RACK_BASE, w + 8, RACK_BASE);

    for (const slot of rack.slots) {
      const sprite = tapeSprite(slot.entry, TAPE_W, TAPE_H);
      if (slot === selected) {
        ctx.save();
        ctx.shadowColor = C.yellow;
        ctx.shadowBlur = 16 + Math.sin(this.t * 6) * 4;
        ctx.drawImage(sprite, slot.x, slot.y - 6, TAPE_W, TAPE_H);
        ctx.restore();
        ctx.strokeStyle = C.yellow;
        ctx.lineWidth = 2;
        ctx.strokeRect(slot.x - 1, slot.y - 7, TAPE_W + 2, TAPE_H + 2);
      } else {
        ctx.drawImage(sprite, slot.x, slot.y, TAPE_W, TAPE_H);
      }
    }
  }

  private drawCounter(ctx: CanvasRenderingContext2D): void {
    const { counter: c, computer: m } = this.layout;

    ctx.fillStyle = '#2a1d4f';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#4a3b8c';
    ctx.fillRect(c.x, c.y, c.w, 18);
    ctx.fillStyle = C.pink;
    ctx.fillRect(c.x, c.y + 18, c.w, 3);
    text(ctx, 'RENTALS  ·  RETURNS', c.x + 14, c.y + 44, { size: 18, color: C.cyan });

    // Till.
    ctx.fillStyle = '#d9d2bf';
    ctx.fillRect(c.x + 18, c.y - 16, 40, 26);
    ctx.fillStyle = '#7a725f';
    ctx.fillRect(c.x + 22, c.y - 12, 32, 8);

    // The search computer.
    ctx.fillStyle = '#d9d2bf';
    ctx.beginPath();
    ctx.roundRect(m.x, m.y, m.w, m.h, 5);
    ctx.fill();
    if (this.hoverComputer || (this.nearComputer && !this.target)) {
      ctx.strokeStyle = C.yellow;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    const s: Rect = { x: m.x + 5, y: m.y + 5, w: m.w - 10, h: m.h - 16 };
    ctx.fillStyle = C.crtBg;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    text(ctx, 'SEARCH', s.x + 4, s.y + 13, { size: 14, color: C.crt });
    text(ctx, this.t % 1 < 0.5 ? '>_' : '>', s.x + 4, s.y + 24, { size: 14, color: C.crt });
    scanlines(ctx, s, 0.25);
    ctx.fillStyle = '#7a725f';
    ctx.fillRect(m.x + m.w / 2 - 8, m.y + m.h - 6, 16, 6);
  }

  private drawTooltip(
    ctx: CanvasRenderingContext2D,
    tgt: Target,
    camX: number,
    camY: number,
  ): void {
    const e = tgt.slot.entry;
    const tw = 310;
    const measure = (s: string) => ctx.measureText(s).width;

    setFont(ctx, 18);
    const sub = e.kind === 'botanical' ? e.latin : e.chemicalClass;
    const rows: [string, string, string][] = [
      ['EFFECTS', e.effects.slice(0, 3).join(', '), C.lime],
    ];
    if (e.timing.totalHours) rows.push(['RUNS', formatHours(e.timing.totalHours), C.white]);
    rows.push([
      'RATED',
      TOXICITY_STYLE[e.toxicity].long.toLowerCase(),
      TOXICITY_STYLE[e.toxicity].color,
    ]);
    if (e.myth) rows.push(['MYTH', 'busted', C.red]);
    const summary = wrapText(e.summary, tw - 28, measure);
    const shown = summary.slice(0, 3);
    if (summary.length > 3) shown[2] = fitText(`${shown[2] ?? ''}...`, tw - 28, measure);

    const th = 60 + rows.length * 20 + shown.length * 18 + 14 + 28;
    const sx = tgt.slot.x - camX;
    const sy = tgt.slot.y - camY;

    // Prefer above the tape, then below, right, left; skip spots that run off screen or cover
    // the player.
    const player = { x: this.px - camX - 12, y: this.py - camY - 40, w: 24, h: 46 };
    const gap = 14;
    const candidates: { x: number; y: number; side: 'above' | 'below' | 'right' | 'left' }[] = [
      { x: sx + TAPE_W / 2 - tw / 2, y: sy - th - gap, side: 'above' },
      { x: sx + TAPE_W / 2 - tw / 2, y: sy + TAPE_H + gap, side: 'below' },
      { x: sx + TAPE_W + gap, y: sy + TAPE_H / 2 - th / 2, side: 'right' },
      { x: sx - tw - gap, y: sy + TAPE_H / 2 - th / 2, side: 'left' },
    ];
    const fits = (c: { x: number; y: number }) => {
      const x0 = Math.max(8, Math.min(W - tw - 8, c.x));
      const y0 = c.y;
      return y0 >= 8 && y0 + th <= H - 40 && !overlaps({ x: x0, y: y0, w: tw, h: th }, player);
    };
    const pick = candidates.find(fits) ?? candidates[0];
    const side = pick?.side ?? 'above';
    const x = Math.round(Math.max(8, Math.min(W - tw - 8, pick?.x ?? 8)));
    const y = Math.round(Math.max(8, Math.min(H - th - 40, pick?.y ?? 8)));

    ctx.fillStyle = 'rgba(20,13,38,0.96)';
    ctx.fillRect(x, y, tw, th);
    ctx.strokeStyle = C.yellow;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, tw - 2, th - 2);
    // Pointer toward the tape.
    ctx.fillStyle = C.yellow;
    ctx.beginPath();
    if (side === 'above' || side === 'below') {
      const px = Math.max(x + 16, Math.min(x + tw - 16, sx + TAPE_W / 2));
      if (side === 'below') {
        ctx.moveTo(px - 8, y);
        ctx.lineTo(px + 8, y);
        ctx.lineTo(px, y - 9);
      } else {
        ctx.moveTo(px - 8, y + th);
        ctx.lineTo(px + 8, y + th);
        ctx.lineTo(px, y + th + 9);
      }
    } else {
      const py = Math.max(y + 16, Math.min(y + th - 16, sy + TAPE_H / 2));
      const ex = side === 'right' ? x : x + tw;
      const dir = side === 'right' ? -1 : 1;
      ctx.moveTo(ex, py - 8);
      ctx.lineTo(ex, py + 8);
      ctx.lineTo(ex + dir * 9, py);
    }
    ctx.fill();

    setFont(ctx, 11, true);
    text(ctx, fitText(e.name.toUpperCase(), tw - 90, measure), x + 14, y + 28, {
      size: 11,
      head: true,
      color: C.white,
    });
    ratingSticker(ctx, e.toxicity, x + tw - 22, y + 24, 12);
    if (e.evidence) {
      const bx = x + tw - 56;
      ctx.fillStyle = EVIDENCE_COLOR[e.evidence];
      ctx.fillRect(bx - 11, y + 13, 22, 22);
      text(ctx, e.evidence, bx, y + 25, {
        size: 10,
        head: true,
        color: C.black,
        align: 'center',
        baseline: 'middle',
      });
    }
    setFont(ctx, 18);
    text(ctx, fitText(sub, tw - 28, measure), x + 14, y + 50, { size: 18, color: C.dim });

    let ry = y + 74;
    for (const [k, v, color] of rows) {
      text(ctx, k, x + 14, ry, { size: 18, color: C.yellow });
      setFont(ctx, 18);
      text(ctx, fitText(v, tw - 100, measure), x + 86, ry, { size: 18, color });
      ry += 20;
    }
    ry += 2;
    for (const line of shown) {
      text(ctx, line, x + 14, ry, { size: 18, color: C.white });
      ry += 18;
    }
    text(ctx, 'CLICK OR PRESS E: FULL BOX', x + tw / 2, y + th - 9, {
      size: 16,
      color: C.yellow,
      align: 'center',
    });
  }

  private drawPrompt(ctx: CanvasRenderingContext2D, key: string, label: string): void {
    setFont(ctx, 18);
    const w = ctx.measureText(label).width + 70;
    const x = Math.round(W / 2 - w / 2);
    const y = H - 78;
    ctx.fillStyle = 'rgba(20,13,38,0.95)';
    ctx.fillRect(x, y, w, 30);
    ctx.strokeStyle = C.yellow;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, 28);
    keyHint(ctx, x + 12, y + 20, key, label, C.yellow);
  }

  private drawMap(ctx: CanvasRenderingContext2D): void {
    const { width, height, racks, counter } = this.layout;
    const mw = 170;
    const mh = 112;
    const s = Math.min((mw - 12) / width, (mh - 26) / height);
    const ox = W - mw - 10;
    const oy = H - 34 - mh - 8;
    ctx.fillStyle = 'rgba(7,4,15,0.82)';
    ctx.fillRect(ox, oy, mw, mh);
    ctx.strokeStyle = C.faint;
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 0.5, oy + 0.5, mw - 1, mh - 1);
    text(ctx, 'MAP [M]', ox + 6, oy + 14, { size: 16, color: C.dim });
    const mx = ox + 6;
    const my = oy + 20;
    ctx.fillStyle = C.shelfEdge;
    for (const r of racks) {
      const lit = this.target?.rack === r;
      ctx.fillStyle = lit ? C.yellow : C.shelfEdge;
      ctx.fillRect(mx + r.x * s, my + r.y * s, Math.max(2, r.w * s), Math.max(2, r.h * s));
    }
    ctx.fillStyle = C.pink;
    ctx.fillRect(mx + counter.x * s, my + counter.y * s, counter.w * s, counter.h * s);
    ctx.strokeStyle = 'rgba(244,236,255,0.35)';
    ctx.strokeRect(mx + this.cam.x * s, my + this.cam.y * s, W * s, H * s);
    ctx.fillStyle = this.t % 0.8 < 0.5 ? C.lime : C.white;
    ctx.fillRect(mx + this.px * s - 2, my + this.py * s - 2, 4, 4);
  }

  private drawHelp(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(7,4,15,0.85)';
    ctx.fillRect(0, H - 34, W, 34);
    let x = 16;
    const y = H - 12;
    x = keyHint(ctx, x, y, 'WASD', 'walk');
    x = keyHint(ctx, x, y, 'E', 'open tape');
    x = keyHint(ctx, x, y, 'R/F', 'look up/down');
    x = keyHint(ctx, x, y, '/', 'search');
    keyHint(ctx, x, y, 'M', 'map');
  }

  private drawNotice(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(7,4,15,0.8)';
    ctx.fillRect(0, 0, W, H);
    const r: Rect = { x: W / 2 - 300, y: 110, w: 600, h: 330 };
    ctx.fillStyle = C.card;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = C.yellow;
    ctx.lineWidth = 3;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = C.yellow;
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
      'Walk with WASD or the arrow keys. Point at a tape for',
      'the quick facts; click it or press E for the full box.',
      '',
      'Numbers are reported figures, not advice.',
    ];
    body.forEach((line, i) =>
      text(ctx, line, W / 2, r.y + 80 + i * 24, { size: 22, color: C.white, align: 'center' }),
    );
    button(ctx, NOTICE_OK, 'ENTER STORE', this.hoverOk || this.t % 1 < 0.5, C.yellow);
  }
}
