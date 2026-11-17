import {
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  EdgesGeometry,
  Fog,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  type BufferGeometry,
  type WebGLRenderer,
} from 'three';
import type { Box } from '../../engine/collision';
import type { Pose } from '../../engine/firstperson';
import type { Entry } from '../data/types';
import { entryHue } from '../draw/specimen';
import { C } from '../theme';
import type { Gondola, Layout } from '../store/layout';
import { EYE_HEIGHT, ITEM, SHELF } from '../store/scale';
import type { Crowd } from '../store/npc';
import { buildModel, lookFor } from '../voxel/model';
import { PeopleKit, Person } from './people';
import { PropKit } from './props';
import { signTexture } from './propTextures';
import { Street } from './street';
import { voxelGeometry } from './voxelMesh';
import {
  carpetTexture,
  ceilingTexture,
  clockTexture,
  headerTexture,
  marqueeTexture,
  openSignTexture,
  plasterTexture,
  posterTexture,
  terminalTexture,
  woodTexture,
} from './textures';

/** What the crosshair (or cursor) is pointing at. */
export type Pick =
  | { kind: 'item'; entry: Entry; distance: number }
  | { kind: 'terminal'; distance: number; clerk: boolean };

/** How close you must be to read a figure's tooltip, and to use the computer. */
const ITEM_REACH = 3.2;
const TERMINAL_REACH = 2.6;
/** Figures are sculpted when you come within this many metres, and freed beyond UNLOAD. */
const MODEL_LOAD = 8;
const MODEL_UNLOAD = 18;

/** One figure on a shelf: an invisible box to aim at, and the sculpture while you are near. */
interface ItemMesh {
  mesh: Mesh;
  entry: Entry;
  /** A plain block in the figure's main colour, shown until it has been sculpted. */
  stand: Mesh;
  model: Mesh | null;
}

interface UserData {
  kind?: 'item' | 'terminal';
  entry?: Entry;
  /** Set on the clerk's hit box, so the prompt can say "ask the clerk". */
  clerk?: boolean;
}

const hex = (s: string) => new Color(s);

/** Posters on the walls: the proportions of the texture drawn in `posterTexture`. */
const POSTER = { w: 360, h: 560 } as const;

/** Builds and renders the 3D store from a layout. Pure presentation: no game rules in here. */
export class StoreWorld {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(72, 16 / 9, 0.1, 160);
  readonly colliders: Box[];

  /** Everything you can look at or be blocked by when aiming; used for picking. */
  private readonly solids = new Group();
  private readonly raycaster = new Raycaster();
  private readonly ndc = new Vector2();
  private readonly items: ItemMesh[] = [];
  private readonly standMaterials = new Map<string, MeshLambertMaterial>();
  private readonly outline: LineSegments;
  private readonly anisotropy: number;
  private hovered: Mesh | null = null;
  private readonly people: Person[] = [];
  private readonly street: Street;
  private readonly peopleKit = new PeopleKit();
  private readonly geo = {
    unit: new BoxGeometry(1, 1, 1),
    plane: new PlaneGeometry(1, 1),
    item: new BoxGeometry(ITEM.w, ITEM.h, ITEM.d),
    stand: new BoxGeometry(ITEM.w * 0.5, ITEM.h * 0.6, ITEM.d * 0.5),
  };
  private readonly mat = {
    cabinet: new MeshLambertMaterial({ color: hex('#2e241d') }),
    backPanel: new MeshLambertMaterial({ color: hex('#17110d') }),
    ledge: new MeshLambertMaterial({ color: hex('#cfa56e') }),
    endPanel: new MeshLambertMaterial({ color: hex('#8d5c2e') }),
    trim: new MeshLambertMaterial({ color: hex('#d9a441') }),
    plastic: new MeshLambertMaterial({ color: hex('#14110d') }),
    counter: new MeshLambertMaterial({ color: hex('#3b2b20') }),
    counterTop: new MeshLambertMaterial({ color: hex('#c99c64') }),
    counterFront: new MeshLambertMaterial({ color: hex('#d6802a') }),
    beige: new MeshLambertMaterial({ color: hex('#cdbfa3'), emissive: hex('#3a352a') }),
    frame: new MeshLambertMaterial({ color: hex('#2a1d14') }),
    dark: new MeshLambertMaterial({ color: hex('#1e1a17') }),
    cream: new MeshLambertMaterial({ color: hex('#e8dcc0') }),
    gold: new MeshLambertMaterial({ color: hex('#d9a441'), emissive: hex('#4a3510') }),
    lightPanel: new MeshBasicMaterial({ color: hex('#fff2d6') }),
    shadow: new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32 }),
    glass: new MeshBasicMaterial({
      color: hex('#bcd8ea'),
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
    metal: new MeshLambertMaterial({ color: hex('#3a2c22') }),
    exit: new MeshBasicMaterial({ color: hex('#46d06a') }),
    brass: new MeshLambertMaterial({ color: hex('#c9a04a'), emissive: hex('#3a2a0c') }),
    rug: new MeshLambertMaterial({ color: hex('#7a3322') }),
    figure: new MeshLambertMaterial({ vertexColors: true, emissive: hex('#241a12') }),
    hit: new MeshBasicMaterial({ visible: false }),
  };

  constructor(
    private readonly layout: Layout,
    private readonly renderer: WebGLRenderer,
  ) {
    this.anisotropy = renderer.capabilities.getMaxAnisotropy();
    this.colliders = layout.colliders;
    this.camera.rotation.order = 'YXZ';

    this.scene.background = hex('#1a120c');
    this.scene.fog = new Fog(hex('#1a120c'), 12, 40);
    this.scene.add(this.solids);

    this.buildLights();
    this.buildShell();
    this.buildGondolas();
    this.buildHeaders();
    this.buildCounter();
    this.buildDoor();
    this.street = new Street(this.scene, this.layout.room, this.anisotropy);
    this.buildProps();
    this.buildDecor();
    this.buildPosters();
    this.buildItems();

    this.outline = new LineSegments(
      new EdgesGeometry(this.geo.item),
      new LineBasicMaterial({ color: hex(C.gold), depthTest: false }),
    );
    this.outline.renderOrder = 10;
    this.outline.scale.setScalar(1.12);
    this.outline.visible = false;
    this.scene.add(this.outline);
  }

  // ── camera & rendering ──────────────────────────────────────────────────────────────────

  setCamera(pose: Pose): void {
    this.camera.position.set(pose.x, EYE_HEIGHT, pose.z);
    this.camera.rotation.set(pose.pitch, pose.yaw, 0);
    this.camera.updateMatrixWorld();
  }

  render(width: number, height: number, alpha = 1, time = 0): void {
    for (const p of this.people) p.update(alpha, time);
    this.street.update(time);
    const aspect = width / Math.max(height, 1);
    if (this.camera.aspect !== aspect) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.render(this.scene, this.camera);
  }

  // ── aiming ──────────────────────────────────────────────────────────────────────────────

  /** What is under (x, y) in normalised device coordinates (-1..1, +y up)? `null` for nothing. */
  pick(x: number, y: number): Pick | null {
    this.raycaster.setFromCamera(this.ndc.set(x, y), this.camera);
    this.raycaster.far = Math.max(ITEM_REACH, TERMINAL_REACH);
    const hit = this.raycaster.intersectObjects(this.solids.children, true)[0];
    const data = hit?.object.userData as UserData | undefined;
    if (hit && data?.kind === 'item' && data.entry && hit.distance <= ITEM_REACH) {
      this.setHover(hit.object as Mesh);
      return { kind: 'item', entry: data.entry, distance: hit.distance };
    }
    this.setHover(null);
    if (hit && data?.kind === 'terminal' && hit.distance <= TERMINAL_REACH) {
      return { kind: 'terminal', distance: hit.distance, clerk: data.clerk === true };
    }
    return null;
  }

  private setHover(mesh: Mesh | null): void {
    if (mesh === this.hovered) return;
    this.hovered = mesh;
    this.outline.visible = mesh !== null;
    if (mesh) {
      this.outline.position.copy(mesh.position);
      this.outline.quaternion.copy(mesh.quaternion);
    }
  }

  // ── figures: sculpted when near, freed when far, so big catalogues stay light ───────────

  updateModels(x: number, z: number, budget = 4): void {
    for (const it of this.items) {
      const dx = it.mesh.position.x - x;
      const dz = it.mesh.position.z - z;
      const d2 = dx * dx + dz * dz;
      if (!it.model && d2 < MODEL_LOAD * MODEL_LOAD && budget > 0) {
        budget--;
        const model = new Mesh(voxelGeometry(buildModel(it.entry)), this.mat.figure);
        model.position.y = -ITEM.h / 2;
        it.mesh.add(model);
        it.model = model;
        it.stand.visible = false;
      } else if (it.model && d2 > MODEL_UNLOAD * MODEL_UNLOAD) {
        it.mesh.remove(it.model);
        it.model.geometry.dispose();
        it.model = null;
        it.stand.visible = true;
      }
    }
  }

  // ── construction ────────────────────────────────────────────────────────────────────────

  private box(
    w: number,
    h: number,
    d: number,
    material: MeshLambertMaterial | MeshBasicMaterial,
    x: number,
    y: number,
    z: number,
    solid = true,
  ): Mesh {
    const m = new Mesh(this.geo.unit, material);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    (solid ? this.solids : this.scene).add(m);
    return m;
  }

  private plane(
    w: number,
    h: number,
    material: MeshLambertMaterial | MeshBasicMaterial,
    x: number,
    y: number,
    z: number,
    ry = 0,
    solid = false,
  ): Mesh {
    const m = new Mesh(this.geo.plane as BufferGeometry, material);
    m.scale.set(w, h, 1);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    (solid ? this.solids : this.scene).add(m);
    return m;
  }

  private buildLights(): void {
    this.scene.add(new HemisphereLight(hex('#fff1dc'), hex('#5a4030'), 1.25));
    const front = new DirectionalLight(hex('#fff0d8'), 0.85);
    front.position.set(2, 6, 5);
    const back = new DirectionalLight(hex('#ffe6c4'), 0.65);
    back.position.set(-2, 6, -5);
    this.scene.add(front, back);

    // Pools of warm light over the counter and the middle of the shop.
    const { room, counter } = this.layout;
    const warm = new PointLight(hex('#ffc47a'), 7, 12, 1.4);
    warm.position.set(counter.x, 2.7, counter.z + 0.5);
    const mid = new PointLight(hex('#ffd9a0'), 6, 16, 1.4);
    mid.position.set((room.minX + room.maxX) / 2, 2.8, (room.minZ + room.maxZ) / 2);
    this.scene.add(warm, mid);
  }

  /** A wall panel from y0 to y1 with a tiling texture, facing into the room. */
  private wall(
    length: number,
    y0: number,
    y1: number,
    tex: CanvasTexture,
    tile: number,
    x: number,
    z: number,
    ry: number,
  ): void {
    const t = tex.clone();
    t.repeat.set(length / tile, (y1 - y0) / tile);
    t.needsUpdate = true;
    this.plane(length, y1 - y0, new MeshLambertMaterial({ map: t }), x, (y0 + y1) / 2, z, ry);
  }

  private buildShell(): void {
    const { room } = this.layout;
    const w = room.maxX - room.minX;
    const d = room.maxZ - room.minZ;
    const h = room.height;
    const cx = (room.minX + room.maxX) / 2;
    const cz = (room.minZ + room.maxZ) / 2;

    const carpet = carpetTexture(this.anisotropy);
    carpet.repeat.set(w / 2.4, d / 2.4);
    const floor = this.plane(w, d, new MeshLambertMaterial({ map: carpet }), cx, 0, cz);
    floor.rotation.x = -Math.PI / 2;

    const tiles = ceilingTexture(this.anisotropy);
    tiles.repeat.set(w / 1.2, d / 1.2);
    const ceiling = this.plane(w, d, new MeshBasicMaterial({ map: tiles }), cx, h, cz);
    ceiling.rotation.x = Math.PI / 2;

    // Walls: wood panelling at the back; orange plaster over a wood wainscot elsewhere.
    const wood = woodTexture(this.anisotropy);
    const plaster = plasterTexture(this.anisotropy);
    const rail = 1.05;
    this.wall(w, 0, h, wood, 2, cx, room.minZ, 0);
    const sides: [number, number, number, number][] = [
      [d, room.minX, cz, Math.PI / 2],
      [d, room.maxX, cz, -Math.PI / 2],
    ];
    for (const [length, x, z, ry] of sides) {
      this.wall(length, 0, rail, wood, 2, x, z, ry);
      this.wall(length, rail, h, plaster, 3, x, z, ry);
    }
    // Chair rail and skirting.
    for (const [length, x, z, ry] of sides) {
      const along = ry === Math.PI ? 'x' : 'z';
      const inset = ry === Math.PI ? -0.02 : ry > 0 ? 0.02 : -0.02;
      const bx = along === 'x' ? x : x + inset;
      const bz = along === 'x' ? z + inset : z;
      const [sx, sz] = along === 'x' ? [length, 0.04] : [0.04, length];
      this.box(sx, 0.05, sz, this.mat.cream, bx, rail, bz, false);
      this.box(sx, 0.1, sz, this.mat.dark, bx, 0.05, bz, false);
    }
    this.box(w, 0.1, 0.04, this.mat.dark, cx, 0.05, room.minZ + 0.02, false);
    this.buildFrontWall(wood, plaster, rail);

    // Fluorescent panels.
    for (let x = room.minX + 2.5; x < room.maxX; x += 5) {
      for (let z = room.minZ + 2.5; z < room.maxZ; z += 5) {
        this.box(1.2, 0.04, 0.6, this.mat.lightPanel, x, h - 0.02, z, false);
      }
    }
  }

  /** Where the windows in the front wall are (centres), kept clear of the door. */
  private windowXs(): number[] {
    const { room, door } = this.layout;
    return [-6.4, -3.3, 3.3, 6.4].filter(
      (x) => Math.abs(x) <= (room.maxX - room.minX) / 2 - 1.3 && Math.abs(x - door.x) > 1.9,
    );
  }

  /** The front wall, with real openings for the door and the windows. */
  private buildFrontWall(wood: CanvasTexture, plaster: CanvasTexture, rail: number): void {
    const { room, door } = this.layout;
    const z = room.maxZ;
    const h = room.height;
    const openings = [
      { x0: door.x - 1.0, x1: door.x + 1.0, y0: 0, y1: 2.75 },
      ...this.windowXs().map((x) => ({ x0: x - 0.95, x1: x + 0.95, y0: 1.15, y1: 2.35 })),
    ].sort((a, b) => a.x0 - b.x0);

    const panel = (xa: number, xb: number, ya: number, yb: number) => {
      if (xb - xa < 0.01 || yb - ya < 0.01) return;
      const cx = (xa + xb) / 2;
      if (ya < rail) this.wall(xb - xa, ya, Math.min(yb, rail), wood, 2, cx, z, Math.PI);
      if (yb > rail) this.wall(xb - xa, Math.max(ya, rail), yb, plaster, 3, cx, z, Math.PI);
    };
    let cursor = room.minX;
    for (const o of openings) {
      panel(cursor, o.x0, 0, h);
      panel(o.x0, o.x1, 0, o.y0);
      panel(o.x0, o.x1, o.y1, h);
      cursor = o.x1;
    }
    panel(cursor, room.maxX, 0, h);

    // Chair rail and skirting, broken by the doorway.
    const spans: [number, number][] = [
      [room.minX, door.x - 1.0],
      [door.x + 1.0, room.maxX],
    ];
    for (const [a, b] of spans) {
      this.box(b - a, 0.05, 0.04, this.mat.cream, (a + b) / 2, rail, z - 0.02, false);
      this.box(b - a, 0.1, 0.04, this.mat.dark, (a + b) / 2, 0.05, z - 0.02, false);
    }
  }

  private buildGondolas(): void {
    for (const g of this.layout.gondolas) this.addGondola(g);
  }

  private addGondola(g: Gondola): void {
    const { x, z, length, depth } = g;
    const top = SHELF.height;
    // Soft "shadow" on the carpet.
    const shadow = this.plane(length + 0.3, depth + 0.3, this.mat.shadow, x, 0.004, z);
    shadow.rotation.x = -Math.PI / 2;

    // Storage cabinet, black back panel, cap and wooden end panels.
    // The pieces inside the wooden end panels stop a hair short of them, so no faces coincide.
    const inner = length - 0.02;
    this.box(inner, SHELF.baseH, depth - 0.01, this.mat.cabinet, x, SHELF.baseH / 2, z);
    const spineH = top - SHELF.baseH;
    this.box(inner, spineH, SHELF.spine, this.mat.backPanel, x, SHELF.baseH + spineH / 2, z);
    this.box(inner, 0.03, 0.14, this.mat.cabinet, x, top - 0.015, z);
    for (const sx of [-1, 1]) {
      this.box(0.04, top, depth, this.mat.endPanel, x + (sx * (length - 0.04)) / 2, top / 2, z);
    }
    // Light wooden ledge and lip under each row, on both sides, and a thin gold trim at the top.
    for (const dir of [1, -1]) {
      const centre = SHELF.spine / 2 + SHELF.ledgeDepth / 2;
      for (const bottom of SHELF.rowBottoms) {
        this.box(
          length - 0.08,
          0.02,
          SHELF.ledgeDepth,
          this.mat.ledge,
          x,
          bottom - 0.01,
          z + dir * centre,
        );
        this.box(
          length - 0.08,
          0.035,
          0.012,
          this.mat.ledge,
          x,
          bottom + 0.0075,
          z + dir * (SHELF.spine / 2 + SHELF.ledgeDepth - 0.006),
        );
      }
      this.box(length - 0.04, 0.012, 0.014, this.mat.trim, x, top + 0.003, z + dir * 0.07, false);
    }
  }

  /** Black category boards standing on top of the shelving, one per aisle, facing the aisle. */
  private buildHeaders(): void {
    const height = 0.36;
    const y = SHELF.height + height / 2 + 0.005;
    for (const s of this.layout.spans) {
      const front = s.yaw === 0;
      const dir = front ? 1 : -1;
      const zc = s.zFace - dir * (SHELF.depth / 2);
      const length = s.x1 - s.x0;
      const x = (s.x0 + s.x1) / 2;
      this.box(length, height, 0.05, this.mat.dark, x, y, zc + dir * 0.03);
      const tex = headerTexture(s.aisle, length / height, this.anisotropy);
      this.plane(
        length,
        height,
        new MeshBasicMaterial({ map: tex }),
        x,
        y,
        zc + dir * 0.0565,
        s.yaw,
        true,
      );
    }
  }

  private buildCounter(): void {
    const { counter: c, terminal: t } = this.layout;
    this.box(c.w, c.h - 0.06, c.d, this.mat.counter, c.x, (c.h - 0.06) / 2, c.z);
    this.box(c.w + 0.08, 0.06, c.d + 0.08, this.mat.counterTop, c.x, c.h - 0.03, c.z);
    // An orange laminate panel on the customer side, and a brass service bell.
    this.box(c.w - 0.1, 0.5, 0.012, this.mat.counterFront, c.x, 0.5, c.z + c.d / 2 + 0.004, false);
    const bell = new Mesh(new CylinderGeometry(0.02, 0.06, 0.04, 16), this.mat.gold);
    bell.position.set(c.x - 0.15, c.h + 0.02, c.z + 0.2);
    this.scene.add(bell);
    this.buildStaffPen();
    const shadow = this.plane(c.w + 0.3, c.d + 0.3, this.mat.shadow, c.x, 0.004, c.z);
    shadow.rotation.x = -Math.PI / 2;

    // The search computer: monitor, screen, keyboard. All of it counts as "the terminal".
    const terminal: UserData = { kind: 'terminal' };
    const parts: Mesh[] = [
      this.box(0.5, 0.42, 0.44, this.mat.beige, t.x, t.y + 0.21 + 0.04, t.z),
      this.box(0.3, 0.04, 0.3, this.mat.beige, t.x, t.y + 0.02, t.z),
      this.box(0.44, 0.025, 0.15, this.mat.beige, t.x, t.y + 0.0125, t.z + 0.3),
      this.plane(
        0.38,
        0.285,
        new MeshBasicMaterial({ map: terminalTexture(this.anisotropy), toneMapped: false }),
        t.x,
        t.y + 0.25,
        t.z + 0.222,
        0,
        true,
      ),
    ];
    for (const p of parts) p.userData = terminal;
  }

  /** A shop-front door: two glass leaves in a dark frame, push bars, kick plates, a transom. */
  /** The pen behind the counter: its end walls, the register, a candy tray, and a shelf of tapes. */
  private buildStaffPen(): void {
    const { counter: c, staff, room } = this.layout;
    const m = this.mat;
    const right = c.x + c.w / 2;
    // The counter carries on to the wall, and a half-wall closes the left end.
    this.box(
      room.maxX - right,
      c.h - 0.06,
      c.z + c.d / 2 - staff.minZ,
      m.counter,
      (right + room.maxX) / 2,
      (c.h - 0.06) / 2,
      (staff.minZ + c.z + c.d / 2) / 2,
    );
    this.box(
      room.maxX - right,
      0.06,
      c.z + c.d / 2 - staff.minZ,
      m.counterTop,
      (right + room.maxX) / 2,
      c.h - 0.03,
      (staff.minZ + c.z + c.d / 2) / 2,
    );
    this.box(
      0.2,
      c.h - 0.06,
      staff.maxZ - staff.minZ,
      m.counter,
      staff.minX - 0.1,
      (c.h - 0.06) / 2,
      (staff.minZ + staff.maxZ) / 2,
    );
    this.box(
      0.26,
      0.06,
      staff.maxZ - staff.minZ,
      m.counterTop,
      staff.minX - 0.1,
      c.h - 0.03,
      (staff.minZ + staff.maxZ) / 2,
    );

    // A tall shelf across the back, stocked with spare tapes in coloured cases.
    const w = room.maxX - staff.minX + 0.2;
    const x = (staff.minX - 0.2 + room.maxX) / 2;
    const z = staff.minZ - 0.225;
    this.box(w, 2.0, 0.45, m.cabinet, x, 1.0, z);
    const cols = ['#d94a3a', '#4a8fc2', '#7bb661', '#f2c14e', '#8d74c4', '#e8892b', '#eee6d2'];
    for (let row = 0; row < 3; row++) {
      this.box(w - 0.06, 0.03, 0.44, m.ledge, x, 0.9 + row * 0.38, z + 0.02);
      const n = Math.floor((w - 0.2) / 0.075);
      for (let i = 0; i < n; i++) {
        const tc = cols[(i * 3 + row * 2) % cols.length] ?? '#d94a3a';
        const tape = this.box(
          0.062,
          0.19,
          0.03,
          this.tapeMaterial(tc),
          x - ((n - 1) * 0.075) / 2 + i * 0.075,
          1.02 + row * 0.38,
          z + 0.245,
          false,
        );
        tape.rotation.x = -0.06;
      }
    }

    // A cash register and a tray of sweets on the counter.
    const rx = c.x + 0.4;
    this.box(0.36, 0.14, 0.36, m.beige, rx, c.h + 0.07, c.z - 0.05, false);
    this.box(0.3, 0.1, 0.16, m.dark, rx, c.h + 0.2, c.z - 0.16, false).rotation.x = -0.4;
    this.box(0.28, 0.025, 0.12, this.mat.dark, rx, c.h + 0.16, c.z + 0.1, false);
    this.box(0.5, 0.03, 0.3, m.cream, c.x + 1.0, c.h + 0.015, c.z + 0.1, false);
    for (let i = 0; i < 8; i++) {
      const sw = this.box(
        0.07,
        0.05,
        0.07,
        this.tapeMaterial(cols[i % cols.length] ?? '#d94a3a'),
        c.x + 0.82 + (i % 4) * 0.12,
        c.h + 0.055,
        c.z + 0.03 + Math.floor(i / 4) * 0.13,
        false,
      );
      sw.rotation.y = i * 0.7;
    }

    // The clerk can be spoken to: an invisible box where they stand.
    const spot = this.layout.clerk;
    const hit = new Mesh(this.geo.unit, this.mat.hit);
    hit.scale.set(0.55, 0.9, 0.45);
    hit.position.set(spot.x, 1.4, spot.z);
    hit.userData = { kind: 'terminal', clerk: true } satisfies UserData;
    this.solids.add(hit);
  }

  private tapeMaterial(color: string): MeshLambertMaterial {
    return this.standMaterial(color);
  }

  private buildDoor(): void {
    const { door, room } = this.layout;
    const z = door.z - 0.06;
    const m = this.mat;
    const open = 2.0;
    const top = 2.75;
    const leafH = 2.2;
    const x0 = door.x - open / 2;
    const x1 = door.x + open / 2;

    // Frame: posts, a head above the leaves, and the top of the transom.
    for (const x of [x0 + 0.05, x1 - 0.05]) this.box(0.1, top, 0.14, m.metal, x, top / 2, z, false);
    this.box(open, 0.1, 0.14, m.metal, door.x, leafH + 0.05, z, false);
    this.box(open, 0.08, 0.14, m.metal, door.x, top - 0.04, z, false);
    // Transom glass, with a lit sign on it.
    this.plane(
      open - 0.2,
      top - leafH - 0.18,
      m.glass,
      door.x,
      (leafH + 0.1 + top - 0.08) / 2,
      z + 0.02,
      Math.PI,
    );
    const leafW = (open - 0.2) / 2;
    for (const s of [-1, 1]) {
      const cx = door.x + s * (leafW / 2);
      // Stiles, rails and the brass kick plate.
      for (const e of [-1, 1])
        this.box(
          0.07,
          leafH - 0.1,
          0.06,
          m.metal,
          cx + e * (leafW / 2 - 0.035),
          (leafH - 0.1) / 2,
          z,
          false,
        );
      this.box(leafW, 0.08, 0.06, m.metal, cx, leafH - 0.14, z, false);
      this.box(leafW, 0.3, 0.06, m.brass, cx, 0.15, z + 0.005, false);
      this.box(leafW, 0.06, 0.06, m.metal, cx, 0.32, z, false);
      this.plane(
        leafW - 0.12,
        leafH - 0.62,
        m.glass,
        cx,
        0.35 + (leafH - 0.62) / 2,
        z + 0.02,
        Math.PI,
      );
      // A long brass push bar on standoffs, on the inside of each leaf near the middle.
      const bx = door.x + s * 0.17;
      const bar = new Mesh(new CylinderGeometry(0.018, 0.018, 0.5, 10), m.brass);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(bx, 1.0, z - 0.1);
      this.scene.add(bar);
      for (const e of [-0.2, 0.2])
        this.box(0.02, 0.02, 0.08, m.brass, bx + e, 1.0, z - 0.05, false);
      // Hinges on the outer edge.
      for (const hy of [0.4, 1.1, 1.9])
        this.box(0.03, 0.12, 0.07, m.metal, door.x + s * (open / 2 - 0.12), hy, z - 0.02, false);
    }
    // The meeting rail between the leaves, the closer on top, a threshold and the mat.
    this.box(0.05, leafH - 0.1, 0.07, m.metal, door.x, (leafH - 0.1) / 2, z, false);
    this.box(0.34, 0.07, 0.1, m.dark, door.x + 0.5, leafH - 0.03, z - 0.07, false);
    this.box(open, 0.03, 0.3, m.brass, door.x, 0.015, z + 0.02, false);
    this.box(open - 0.1, 0.02, 1.0, m.rug, door.x, 0.01, door.z - 0.7, false);
    // A little hours sign hanging in the glass, and an exit sign over the door.
    this.plane(
      0.42,
      0.2,
      new MeshBasicMaterial({
        map: signTexture('OPEN 10 - 9', '#fff4d8', '#2f5d62', this.anisotropy, 256, 96),
        toneMapped: false,
      }),
      door.x - 0.4,
      1.55,
      z - 0.03,
      0,
    );
    this.box(0.32, 0.12, 0.05, this.mat.exit, door.x, top + 0.18, door.z - 0.04, false);
    const neon = openSignTexture(this.anisotropy);
    this.plane(
      0.6,
      0.3,
      new MeshBasicMaterial({ map: neon, transparent: true, toneMapped: false }),
      door.x + open / 2 + 0.75,
      1.7,
      room.maxZ - 0.03,
      Math.PI,
    );
  }

  /** Marquee, windows, clock and balloons. */
  private buildDecor(): void {
    const { room, door, counter } = this.layout;
    const cx = (room.minX + room.maxX) / 2;
    const h = room.height;

    // Gold marquee on the back wall.
    const mw = Math.min(room.maxX - room.minX - 1, 5.4);
    this.plane(
      mw,
      mw * (420 / 2048),
      new MeshBasicMaterial({ map: marqueeTexture(this.anisotropy), toneMapped: false }),
      cx,
      2.45,
      room.minZ + 0.03,
    );

    // Windows on the front wall, glazed and framed.
    for (const wx of this.windowXs()) {
      const z = room.maxZ - 0.04;
      this.plane(1.9, 1.2, this.mat.glass, wx, 1.75, z + 0.02, Math.PI);
      this.box(2.0, 0.07, 0.1, this.mat.frame, wx, 2.35, z, false);
      this.box(2.1, 0.07, 0.16, this.mat.cream, wx, 1.12, z - 0.03, false);
      this.box(0.07, 1.2, 0.1, this.mat.frame, wx - 0.95, 1.75, z, false);
      this.box(0.07, 1.2, 0.1, this.mat.frame, wx + 0.95, 1.75, z, false);
      this.box(0.04, 1.2, 0.06, this.mat.frame, wx, 1.75, z, false);
      this.box(1.9, 0.04, 0.06, this.mat.frame, wx, 1.75, z, false);
    }

    // A clock on the right wall above the counter.
    this.plane(
      0.5,
      0.5,
      new MeshBasicMaterial({ map: clockTexture(this.anisotropy), transparent: true }),
      room.maxX - 0.03,
      2.45,
      counter.z - 1.1,
      -Math.PI / 2,
    );

    // A bunch of balloons tied to a weight by the door.
    const colours = [
      '#d94a3a',
      '#f2c14e',
      '#4a8fc2',
      '#7bb661',
      '#e8892b',
      '#8d74c4',
      '#d94a3a',
      '#f2c14e',
    ];
    const bx = door.x - 1.9;
    const bz = door.z - 0.9;
    this.box(0.18, 0.12, 0.18, this.mat.dark, bx, 0.06, bz, false);
    const balloon = new SphereGeometry(0.17, 18, 14);
    colours.forEach((c, i) => {
      const a = (i / colours.length) * Math.PI * 2;
      const r = 0.13 + (i % 3) * 0.05;
      const by = Math.min(h - 0.35, 2.05 + (i % 4) * 0.17);
      const m = new Mesh(
        balloon,
        new MeshLambertMaterial({ color: hex(c), emissive: hex(c).multiplyScalar(0.25) }),
      );
      m.scale.set(1, 1.18, 1);
      m.position.set(bx + Math.cos(a) * r, by, bz + Math.sin(a) * r);
      this.scene.add(m);
      const string = this.box(
        0.006,
        by - 0.17 - 0.15,
        0.006,
        this.mat.cream,
        bx,
        0.12 + (by - 0.32) / 2,
        bz,
        false,
      );
      string.position.x = bx + Math.cos(a) * r * 0.4;
      string.position.z = bz + Math.sin(a) * r * 0.4;
    });
  }

  /** Entries to feature on posters and standees: strongest evidence first. */
  private featured(): Entry[] {
    const sorted = [...this.layout.slots]
      .map((s) => s.entry)
      .sort(
        (a, b) =>
          (a.evidence ?? 'Z').localeCompare(b.evidence ?? 'Z') || a.name.localeCompare(b.name),
      );
    return [...new Map(sorted.map((e) => [e.id, e])).values()];
  }

  /** Furniture and accessories around the shelving. */
  private buildProps(): void {
    const featured = this.featured();
    const kit = new PropKit(this.anisotropy, (i) => {
      const entry =
        featured[(featured.length - 1 - i + featured.length) % Math.max(1, featured.length)];
      return entry ? posterTexture(entry, this.anisotropy) : null;
    });
    for (const spec of this.layout.props) {
      const g = kit.build(spec);
      g.position.set(spec.x, 0, spec.z);
      g.rotation.y = spec.yaw;
      this.scene.add(g);
    }
  }

  // ── people ──────────────────────────────────────────────────────────────────────────────

  /** Adds a figure for everyone in the crowd. */
  setCrowd(crowd: Crowd): void {
    for (const npc of crowd.npcs) {
      const person = new Person(npc, this.peopleKit);
      person.update(1, 0);
      this.scene.add(person.root);
      this.people.push(person);
    }
  }

  /** Call before each simulation step, so drawing can blend between steps. */
  snapshotPeople(): void {
    for (const p of this.people) p.snapshot();
  }

  /** Big display posters of the figures on the side walls, from the strongest-evidence entries. */
  private buildPosters(): void {
    const unique = this.featured();
    this.layout.posterSpots.slice(0, unique.length).forEach((spot, i) => {
      const entry = unique[i];
      if (!entry) return;
      const tex = posterTexture(entry, this.anisotropy);
      const h = 1.3;
      const w = h * (POSTER.w / POSTER.h);
      const inward = spot.yaw === Math.PI / 2 ? 1 : -1;
      this.box(
        0.03,
        h + 0.08,
        w + 0.08,
        this.mat.frame,
        spot.x - inward * 0.004,
        spot.y,
        spot.z,
        false,
      );
      this.plane(
        w,
        h,
        new MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0x777777 }),
        spot.x + inward * 0.015,
        spot.y,
        spot.z,
        spot.yaw,
      );
    });
  }

  private buildItems(): void {
    for (const slot of this.layout.slots) {
      const mesh = new Mesh(this.geo.item, this.mat.hit);
      mesh.rotation.y = slot.yaw;
      mesh.position.set(slot.x, slot.y, slot.z);
      mesh.userData = { kind: 'item', entry: slot.entry } satisfies UserData;
      this.solids.add(mesh);

      const look = lookFor(slot.entry);
      const stand = new Mesh(this.geo.stand, this.standMaterial(look[1] ?? entryColor(slot.entry)));
      stand.position.y = -ITEM.h / 2 + (ITEM.h * 0.6) / 2;
      mesh.add(stand);
      this.items.push({ mesh, entry: slot.entry, stand, model: null });
    }
  }

  private standMaterial(color: string): MeshLambertMaterial {
    let m = this.standMaterials.get(color);
    if (!m) {
      m = new MeshLambertMaterial({ color: hex(color), emissive: hex(color).multiplyScalar(0.3) });
      this.standMaterials.set(color, m);
    }
    return m;
  }
}

/** A colour for an entry with no hand-picked one, from its stable hue. */
function entryColor(entry: Entry): string {
  return new Color().setHSL((entryHue(entry) % 360) / 360, 0.5, 0.4).getStyle();
}
