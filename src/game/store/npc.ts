import type { Box, Point } from '../../engine/collision';
import { rng } from '../voxel/grid';
import type { Layout } from './layout';
import { NavGrid } from './nav';
import { browseSpot, seatsOf, type Seat } from './props';

/** What a person is doing right now. */
export type Mode = 'idle' | 'walk' | 'browse' | 'sit' | 'pay';

export interface Npc {
  id: number;
  role: 'clerk' | 'customer';
  x: number;
  z: number;
  /** Radians, 0 faces +z, PI/2 faces +x. */
  yaw: number;
  mode: Mode;
  /** Walk cycle phase, advancing while walking. */
  phase: number;
  /** A point to look at (the shelf, the player), or null to look ahead. */
  look: Point | null;
  /** Picks the person's clothes and build. */
  seed: number;
}

interface Goal {
  kind: 'browse' | 'sit' | 'pay';
  /** Where to stand (for sitting, the spot in front of the seat). */
  at: Point;
  yaw: number;
  /** A point on the thing being looked at. */
  focus: Point;
  seat?: Seat;
  key: string;
}

interface Brain {
  npc: Npc;
  route: Point[];
  goal: Goal | null;
  timer: number;
  blockedFor: number;
  speed: number;
}

export const WALKER_RADIUS = 0.26;
const SPEED = [0.85, 1.25] as const;
const TURN = 7;

function angleTo(from: Point, to: Point): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

function turnToward(current: number, target: number, maxStep: number): number {
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return current + Math.max(-maxStep, Math.min(maxStep, d));
}

/** How many shoppers a store this size has. */
export function crowdSize(layout: Layout): number {
  return Math.max(2, Math.min(8, 2 + Math.floor(layout.slots.length / 25)));
}

/**
 * The people in the store: a clerk behind the counter, and shoppers who wander between shelves,
 * snacks, the sofas and the till. Pure: positions only, drawn elsewhere.
 */
export class Crowd {
  readonly npcs: Npc[] = [];
  private readonly brains: Brain[] = [];
  private readonly nav: NavGrid;
  private readonly goals: Goal[] = [];
  private readonly rand: () => number;
  private readonly taken = new Set<string>();
  private readonly clerk: Npc;

  constructor(
    private readonly layout: Layout,
    seed = 7,
    count = crowdSize(layout),
  ) {
    this.rand = rng(seed);
    // Plan with a little extra room, since paths cut across the corners of grid cells.
    this.nav = new NavGrid(layout.room, layout.colliders, WALKER_RADIUS + 0.1);
    this.buildGoals();

    this.clerk = {
      id: 0,
      role: 'clerk',
      x: layout.clerk.x,
      z: layout.clerk.z,
      yaw: 0,
      mode: 'idle',
      phase: 0,
      look: null,
      seed: 1,
    };
    this.npcs.push(this.clerk);

    for (let i = 0; i < count; i++) {
      const goal = this.pickGoal(true);
      const seat = goal?.seat;
      const start = seat ?? (goal ? (this.nav.nearestFree(goal.at) ?? layout.spawn) : layout.spawn);
      const npc: Npc = {
        id: i + 1,
        role: 'customer',
        x: start.x,
        z: start.z,
        yaw: goal?.yaw ?? 0,
        mode: seat ? 'sit' : 'browse',
        phase: this.rand() * 6,
        look: goal?.focus ?? null,
        seed: seed * 31 + i * 7 + 3,
      };
      this.npcs.push(npc);
      this.brains.push({
        npc,
        route: [],
        goal,
        timer: 1 + this.rand() * 6,
        blockedFor: 0,
        speed: SPEED[0] + this.rand() * (SPEED[1] - SPEED[0]),
      });
    }
  }

  private buildGoals(): void {
    const { layout, goals } = this;
    for (const s of layout.spans) {
      const dir = s.yaw === 0 ? 1 : -1;
      for (let x = s.x0 + 0.55; x <= s.x1 - 0.55; x += 0.9) {
        goals.push({
          kind: 'browse',
          at: { x, z: s.zFace + dir * 0.85 },
          yaw: s.yaw === 0 ? Math.PI : 0,
          focus: { x, z: s.zFace },
          key: `shelf:${s.aisle}:${x.toFixed(1)}`,
        });
      }
    }
    layout.props.forEach((p, i) => {
      const spot = browseSpot(p);
      if (spot) {
        goals.push({
          kind: 'browse',
          at: spot,
          yaw: spot.yaw,
          focus: { x: p.x, z: p.z },
          key: `prop:${i}`,
        });
      }
      seatsOf(p).forEach((seat, k) => {
        const front = {
          x: seat.x + Math.sin(seat.yaw) * 0.85,
          z: seat.z + Math.cos(seat.yaw) * 0.85,
        };
        goals.push({
          kind: 'sit',
          at: front,
          yaw: seat.yaw,
          focus: { x: seat.x + Math.sin(seat.yaw) * 3, z: seat.z + Math.cos(seat.yaw) * 3 },
          seat,
          key: `seat:${i}:${k}`,
        });
      });
    });
    const { counter } = layout;
    goals.push({
      kind: 'pay',
      at: { x: counter.x - 0.7, z: counter.z + counter.d / 2 + 0.55 },
      yaw: Math.PI,
      focus: layout.clerk,
      key: 'pay',
    });
  }

  private pickGoal(initial = false): Goal | null {
    const r = this.rand();
    const wanted: Goal['kind'] = initial
      ? r < 0.85
        ? 'browse'
        : 'sit'
      : r < 0.55
        ? 'browse'
        : r < 0.72
          ? 'sit'
          : 'pay';
    const free = (g: Goal) => !this.taken.has(g.key);
    let options = this.goals.filter((g) => g.kind === wanted && free(g));
    // Mostly the shelves (that is what the shop is for), sometimes the snacks and displays.
    if (wanted === 'browse') {
      const onShelf = (g: Goal) => g.key.startsWith('shelf');
      const chosen =
        this.rand() < 0.7 ? options.filter(onShelf) : options.filter((g) => !onShelf(g));
      if (chosen.length) options = chosen;
    }
    // If that kind of thing is all taken (the till, say), browse instead.
    if (!options.length) options = this.goals.filter((g) => g.kind === 'browse' && free(g));
    const goal = options[Math.floor(this.rand() * options.length)] ?? null;
    if (goal && initial) this.taken.add(goal.key);
    return goal;
  }

  /** Boxes around the shoppers, for the player to bump into. */
  boxes(): Box[] {
    return this.npcs
      .filter((n) => n.role === 'customer')
      .map((n) => ({ minX: n.x - 0.24, maxX: n.x + 0.24, minZ: n.z - 0.24, maxZ: n.z + 0.24 }));
  }

  update(dt: number, player: Point): void {
    this.updateClerk(dt, player);
    for (const b of this.brains) this.think(b, dt, player);
  }

  private updateClerk(dt: number, player: Point): void {
    const c = this.clerk;
    const near = Math.hypot(player.x - c.x, player.z - c.z) < 4.5;
    const serving = this.brains.some((b) => b.npc.mode === 'pay');
    c.look = near ? player : null;
    c.mode = serving ? 'pay' : 'idle';
    c.yaw = turnToward(c.yaw, near ? angleTo(c, player) : 0, TURN * dt * 0.6);
    c.phase += dt;
  }

  private think(b: Brain, dt: number, player: Point): void {
    const n = b.npc;
    n.phase += dt * (n.mode === 'walk' ? 6.5 * b.speed : 1);

    if (n.mode === 'browse' || n.mode === 'sit' || n.mode === 'pay') {
      b.timer -= dt;
      if (n.look) {
        n.yaw = turnToward(n.yaw, n.mode === 'sit' ? n.yaw : angleTo(n, n.look), TURN * dt);
      }
      if (b.timer <= 0) this.leave(b);
      return;
    }

    // Walking, or waiting for the next idea.
    if (!b.route.length) {
      if (b.goal) {
        this.arrive(b);
        return;
      }
      b.timer -= dt;
      if (b.timer <= 0) this.choose(b);
      return;
    }

    const next = b.route[0];
    if (!next) return;
    const dx = next.x - n.x;
    const dz = next.z - n.z;
    const dist = Math.hypot(dx, dz);
    n.look = null;
    const want = Math.atan2(dx, dz);
    const step = Math.min(dist, b.speed * dt);

    // Head for the next corner, but steer around anyone in the way (the player included).
    const others = [player, ...this.npcs.filter((o) => o !== n && o.role === 'customer')];
    let heading: number | null = null;
    for (const off of [0, 0.7, -0.7, 1.3, -1.3]) {
      const h = want + off;
      const probe = { x: n.x + Math.sin(h) * 0.55, z: n.z + Math.cos(h) * 0.55 };
      const clear = !others.some((o) => Math.hypot(o.x - probe.x, o.z - probe.z) < 0.42);
      const to = { x: n.x + Math.sin(h) * step, z: n.z + Math.cos(h) * step };
      if (clear && (off === 0 || this.nav.walkable(to))) {
        heading = h;
        break;
      }
    }

    if (heading === null) {
      // Boxed in: wait, and think again if it drags on.
      n.yaw = turnToward(n.yaw, want, TURN * dt);
      b.blockedFor += dt;
      if (b.blockedFor > 2.5) {
        this.release(b);
        b.route = [];
        b.goal = null;
        b.timer = 0.5;
      }
      return;
    }
    b.blockedFor = 0;
    n.yaw = turnToward(n.yaw, heading, TURN * dt);
    n.x += Math.sin(heading) * step;
    n.z += Math.cos(heading) * step;
    if (Math.hypot(next.x - n.x, next.z - n.z) < 0.08) b.route.shift();
  }

  private release(b: Brain): void {
    if (b.goal) this.taken.delete(b.goal.key);
  }

  private choose(b: Brain): void {
    const goal = this.pickGoal();
    if (!goal) {
      b.timer = 2;
      return;
    }
    const route = this.nav.path(b.npc, goal.at);
    if (!route) {
      b.timer = 1;
      return;
    }
    this.taken.add(goal.key);
    b.goal = goal;
    b.route = route;
    b.npc.mode = 'walk';
    b.blockedFor = 0;
  }

  private arrive(b: Brain): void {
    const g = b.goal;
    if (!g) return;
    const n = b.npc;
    n.look = g.focus;
    if (g.kind === 'sit' && g.seat) {
      n.x = g.seat.x;
      n.z = g.seat.z;
      n.yaw = g.seat.yaw;
      n.mode = 'sit';
      b.timer = 14 + this.rand() * 20;
    } else if (g.kind === 'pay') {
      n.mode = 'pay';
      b.timer = 4 + this.rand() * 3;
    } else {
      n.mode = 'browse';
      b.timer = 4 + this.rand() * 7;
    }
  }

  /** Done here: stand up if sitting, free the spot, and wander off to the next thing. */
  private leave(b: Brain): void {
    const n = b.npc;
    const g = b.goal;
    if (g?.kind === 'sit' && g.seat) {
      n.x = g.at.x;
      n.z = g.at.z;
    }
    this.release(b);
    b.goal = null;
    b.route = [];
    n.mode = 'walk';
    n.look = null;
    b.timer = 0.3;
  }
}
