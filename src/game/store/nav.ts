import { circleOverlapsBox, type Box, type Point } from '../../engine/collision';

/** A coarse walkability grid over the floor, for finding paths around the shelving and furniture. */
export class NavGrid {
  private readonly cols: number;
  private readonly rows: number;
  private readonly blocked: Uint8Array;

  constructor(
    private readonly bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    boxes: readonly Box[],
    radius: number,
    private readonly cell = 0.25,
  ) {
    this.cols = Math.ceil((bounds.maxX - bounds.minX) / cell);
    this.rows = Math.ceil((bounds.maxZ - bounds.minZ) / cell);
    this.blocked = new Uint8Array(this.cols * this.rows);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const p = this.centre(c, r);
        const outside =
          p.x - radius < bounds.minX ||
          p.x + radius > bounds.maxX ||
          p.z - radius < bounds.minZ ||
          p.z + radius > bounds.maxZ;
        if (outside || boxes.some((b) => circleOverlapsBox(p.x, p.z, radius, b))) {
          this.blocked[r * this.cols + c] = 1;
        }
      }
    }
  }

  private centre(c: number, r: number): Point {
    return {
      x: this.bounds.minX + (c + 0.5) * this.cell,
      z: this.bounds.minZ + (r + 0.5) * this.cell,
    };
  }

  private cellOf(p: Point): [number, number] {
    return [
      Math.min(this.cols - 1, Math.max(0, Math.floor((p.x - this.bounds.minX) / this.cell))),
      Math.min(this.rows - 1, Math.max(0, Math.floor((p.z - this.bounds.minZ) / this.cell))),
    ];
  }

  isBlocked(c: number, r: number): boolean {
    return (
      c < 0 || r < 0 || c >= this.cols || r >= this.rows || this.blocked[r * this.cols + c] === 1
    );
  }

  /** Can a person stand at this point? */
  walkable(p: Point): boolean {
    const [c, r] = this.cellOf(p);
    return !this.isBlocked(c, r);
  }

  /** The closest walkable point to `p` (which may be inside furniture). */
  nearestFree(p: Point): Point | null {
    const [c0, r0] = this.cellOf(p);
    for (let ring = 0; ring < 12; ring++) {
      let best: Point | null = null;
      let bestD = Infinity;
      for (let r = r0 - ring; r <= r0 + ring; r++) {
        for (let c = c0 - ring; c <= c0 + ring; c++) {
          if (Math.max(Math.abs(c - c0), Math.abs(r - r0)) !== ring || this.isBlocked(c, r))
            continue;
          const q = this.centre(c, r);
          const d = Math.hypot(q.x - p.x, q.z - p.z);
          if (d < bestD) {
            best = q;
            bestD = d;
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  /** Is the straight line between two points clear? */
  private clear(a: Point, b: Point): boolean {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (this.cell * 0.5));
    for (let i = 0; i <= n; i++) {
      const t = n === 0 ? 0 : i / n;
      const [c, r] = this.cellOf({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
      if (this.isBlocked(c, r)) return false;
    }
    return true;
  }

  /** A walkable route from `from` to `to` (corners only), or null if there is none. */
  path(from: Point, to: Point): Point[] | null {
    const route = this.route(from, to);
    // Someone standing inside the planning margin first steps out to the nearest open spot.
    if (route && !this.walkable(from)) {
      const a = this.nearestFree(from);
      if (a) route.unshift(a);
    }
    return route;
  }

  private route(from: Point, to: Point): Point[] | null {
    const a = this.nearestFree(from);
    const b = this.nearestFree(to);
    if (!a || !b) return null;
    if (this.clear(a, b)) return [b];

    const [c0, r0] = this.cellOf(a);
    const [c1, r1] = this.cellOf(b);
    const key = (c: number, r: number) => r * this.cols + c;
    const g = new Map<number, number>([[key(c0, r0), 0]]);
    const from_ = new Map<number, number>();
    const h = (c: number, r: number) => Math.hypot(c - c1, r - r1);
    // A small open list kept sorted by cost; the grid is a few thousand cells.
    const open: { k: number; c: number; r: number; f: number }[] = [
      { k: key(c0, r0), c: c0, r: r0, f: h(c0, r0) },
    ];
    const closed = new Set<number>();
    let found = false;
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if ((open[i]?.f ?? 0) < (open[bi]?.f ?? 0)) bi = i;
      const cur = open.splice(bi, 1)[0];
      if (!cur) break;
      if (closed.has(cur.k)) continue;
      closed.add(cur.k);
      if (cur.c === c1 && cur.r === r1) {
        found = true;
        break;
      }
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dc && !dr) continue;
          const nc = cur.c + dc;
          const nr = cur.r + dr;
          if (this.isBlocked(nc, nr)) continue;
          // No cutting corners around furniture.
          if (dc && dr && (this.isBlocked(cur.c + dc, cur.r) || this.isBlocked(cur.c, cur.r + dr)))
            continue;
          const nk = key(nc, nr);
          if (closed.has(nk)) continue;
          const ng = (g.get(cur.k) ?? 0) + (dc && dr ? 1.414 : 1);
          if (ng < (g.get(nk) ?? Infinity)) {
            g.set(nk, ng);
            from_.set(nk, cur.k);
            open.push({ k: nk, c: nc, r: nr, f: ng + h(nc, nr) });
          }
        }
      }
    }
    if (!found) return null;

    const cells: Point[] = [];
    for (let k: number | undefined = key(c1, r1); k !== undefined; k = from_.get(k)) {
      cells.push(this.centre(k % this.cols, Math.floor(k / this.cols)));
    }
    cells.reverse();
    // String-pull: keep only the corners you can't cut across.
    const route: Point[] = [];
    let anchor = a;
    for (let i = 1; i < cells.length; i++) {
      const next = cells[i];
      const after = cells[i + 1];
      if (next && after && !this.clear(anchor, after)) {
        route.push(next);
        anchor = next;
      }
    }
    route.push(b);
    return route;
  }
}
