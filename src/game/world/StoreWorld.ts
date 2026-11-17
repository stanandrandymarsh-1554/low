import {
  BoxGeometry,
  CanvasTexture,
  Color,
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
  Vector2,
  type BufferGeometry,
  type Texture,
  type WebGLRenderer,
} from 'three';
import type { Box } from '../../engine/collision';
import type { Pose } from '../../engine/firstperson';
import type { Entry } from '../data/types';
import { tapeHue } from '../draw/tape';
import { C } from '../theme';
import type { Gondola, Layout } from '../store/layout';
import { EYE_HEIGHT, SHELF, STORE, TAPE, TAPE_TILT } from '../store/scale';
import {
  carpetTexture,
  coverTexture,
  openSignTexture,
  shopSignTexture,
  signTexture,
  terminalTexture,
  wallTexture,
  whiteTexture,
} from './textures';

/** What the crosshair (or cursor) is pointing at. */
export type Pick =
  { kind: 'tape'; entry: Entry; distance: number } | { kind: 'terminal'; distance: number };

/** How close you must be to read a tape's tooltip, and to use the computer. */
const TAPE_REACH = 3.2;
const TERMINAL_REACH = 2.6;
/** Tape covers are drawn when you come within this many metres, and freed beyond UNLOAD. */
const COVER_LOAD = 8;
const COVER_UNLOAD = 18;

interface TapeMesh {
  mesh: Mesh;
  entry: Entry;
  material: MeshLambertMaterial;
  cover: CanvasTexture | null;
  placeholder: Color;
}

interface UserData {
  kind?: 'tape' | 'terminal';
  entry?: Entry;
}

const hex = (s: string) => new Color(s);

/** Builds and renders the 3D store from a layout. Pure presentation: no game rules in here. */
export class StoreWorld {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(72, 16 / 9, 0.05, 60);
  readonly colliders: Box[];

  /** Everything you can look at or be blocked by when aiming; used for picking. */
  private readonly solids = new Group();
  private readonly raycaster = new Raycaster();
  private readonly ndc = new Vector2();
  private readonly tapes: TapeMesh[] = [];
  private readonly outline: LineSegments;
  private readonly white: CanvasTexture;
  private readonly anisotropy: number;
  private hovered: Mesh | null = null;
  private readonly geo = {
    unit: new BoxGeometry(1, 1, 1),
    plane: new PlaneGeometry(1, 1),
    tape: new BoxGeometry(TAPE.w, TAPE.h, TAPE.d),
  };
  private readonly mat = {
    body: new MeshLambertMaterial({ color: hex('#34308a') }),
    spine: new MeshLambertMaterial({ color: hex('#221f63') }),
    ledge: new MeshLambertMaterial({ color: hex('#c3b8ea') }),
    plastic: new MeshLambertMaterial({ color: hex('#14101f') }),
    counter: new MeshLambertMaterial({ color: hex('#40308c') }),
    counterTop: new MeshLambertMaterial({ color: hex('#b9a97f') }),
    beige: new MeshLambertMaterial({ color: hex('#d9d2bf'), emissive: hex('#3a362c') }),
    frame: new MeshLambertMaterial({ color: hex('#2b2b3a') }),
    ceiling: new MeshBasicMaterial({ color: hex('#241749') }),
    pink: new MeshBasicMaterial({ color: hex(C.pink) }),
    cyan: new MeshBasicMaterial({ color: hex(C.cyan) }),
    lightPanel: new MeshBasicMaterial({ color: hex('#fff3d8') }),
    shadow: new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 }),
    glass: new MeshBasicMaterial({ color: hex('#6f9bd6'), transparent: true, opacity: 0.3 }),
    mat: new MeshLambertMaterial({ color: hex('#5a1630') }),
  };

  constructor(
    private readonly layout: Layout,
    private readonly renderer: WebGLRenderer,
  ) {
    this.anisotropy = renderer.capabilities.getMaxAnisotropy();
    this.colliders = layout.colliders;
    this.white = whiteTexture();
    this.camera.rotation.order = 'YXZ';

    this.scene.background = hex('#0b0618');
    this.scene.fog = new Fog(hex('#120a26'), 9, 34);
    this.scene.add(this.solids);

    this.buildLights();
    this.buildShell();
    this.buildGondolas();
    this.buildSigns();
    this.buildCounter();
    this.buildDoor();
    this.buildPosters();
    this.buildTapes();

    this.outline = new LineSegments(
      new EdgesGeometry(this.geo.tape),
      new LineBasicMaterial({ color: hex(C.yellow), depthTest: false }),
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

  render(width: number, height: number): void {
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
    this.raycaster.far = Math.max(TAPE_REACH, TERMINAL_REACH);
    const hit = this.raycaster.intersectObjects(this.solids.children, true)[0];
    const data = hit?.object.userData as UserData | undefined;
    if (hit && data?.kind === 'tape' && data.entry && hit.distance <= TAPE_REACH) {
      this.setHover(hit.object as Mesh);
      return { kind: 'tape', entry: data.entry, distance: hit.distance };
    }
    this.setHover(null);
    if (hit && data?.kind === 'terminal' && hit.distance <= TERMINAL_REACH) {
      return { kind: 'terminal', distance: hit.distance };
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

  // ── tape covers: drawn when near, freed when far, so big catalogues stay light ──────────

  updateCovers(x: number, z: number, budget = 4): void {
    for (const t of this.tapes) {
      const dx = t.mesh.position.x - x;
      const dz = t.mesh.position.z - z;
      const d2 = dx * dx + dz * dz;
      if (!t.cover && d2 < COVER_LOAD * COVER_LOAD && budget > 0) {
        budget--;
        t.cover = coverTexture(t.entry, this.anisotropy);
        this.setCover(t, t.cover);
      } else if (t.cover && d2 > COVER_UNLOAD * COVER_UNLOAD) {
        t.cover.dispose();
        t.cover = null;
        this.setCover(t, null);
      }
    }
  }

  private setCover(t: TapeMesh, cover: Texture | null): void {
    const m = t.material;
    if (cover) {
      m.map = cover;
      m.emissiveMap = cover;
      m.color.set(0xffffff);
      m.emissive.set(0x666666);
    } else {
      m.map = this.white;
      m.emissiveMap = this.white;
      m.color.copy(t.placeholder);
      m.emissive.copy(t.placeholder).multiplyScalar(0.4);
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
    this.scene.add(new HemisphereLight(hex('#e4dcff'), hex('#3a2a66'), 1.15));
    const front = new DirectionalLight(0xffffff, 0.8);
    front.position.set(2, 6, 5);
    const back = new DirectionalLight(0xffeedd, 0.6);
    back.position.set(-2, 6, -5);
    this.scene.add(front, back);

    const { room } = this.layout;
    const cx = (room.minX + room.maxX) / 2;
    const pink = new PointLight(hex(C.pink), 9, 16, 1.4);
    pink.position.set(cx, 2.6, room.minZ + 1.2);
    const cyan = new PointLight(hex(C.cyan), 6, 12, 1.4);
    cyan.position.set(room.maxX - 2, 2.4, room.maxZ - 1.2);
    this.scene.add(pink, cyan);
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

    const ceiling = this.plane(w, d, this.mat.ceiling, cx, h, cz);
    ceiling.rotation.x = Math.PI / 2;

    const wall = wallTexture(this.anisotropy);
    const wallMat = (length: number) => {
      const tex = wall.clone();
      tex.repeat.set(length / 3, 1);
      tex.needsUpdate = true;
      return new MeshLambertMaterial({ map: tex });
    };
    this.plane(w, h, wallMat(w), cx, h / 2, room.minZ, 0);
    this.plane(w, h, wallMat(w), cx, h / 2, room.maxZ, Math.PI);
    this.plane(d, h, wallMat(d), room.minX, h / 2, cz, Math.PI / 2);
    this.plane(d, h, wallMat(d), room.maxX, h / 2, cz, -Math.PI / 2);

    // Neon trim running round the walls.
    const y = h - 0.3;
    this.box(w, 0.04, 0.03, this.mat.pink, cx, y, room.minZ + 0.02, false);
    this.box(w, 0.04, 0.03, this.mat.pink, cx, y, room.maxZ - 0.02, false);
    this.box(0.03, 0.04, d, this.mat.cyan, room.minX + 0.02, y, cz, false);
    this.box(0.03, 0.04, d, this.mat.cyan, room.maxX - 0.02, y, cz, false);

    // Fluorescent panels.
    for (let x = room.minX + 2.5; x < room.maxX; x += 5) {
      for (let z = room.minZ + 2.5; z < room.maxZ; z += 5) {
        this.box(1.2, 0.04, 0.6, this.mat.lightPanel, x, h - 0.02, z, false);
      }
    }

    // The big sign on the back wall.
    const sign = shopSignTexture(this.anisotropy);
    this.plane(
      Math.min(w - 1, 6),
      Math.min(w - 1, 6) * (360 / 2048),
      new MeshBasicMaterial({ map: sign, transparent: true, toneMapped: false }),
      cx,
      2.35,
      room.minZ + 0.03,
    );
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

    // Storage cabinet, back panel and cap.
    this.box(length, SHELF.baseH, depth, this.mat.body, x, SHELF.baseH / 2, z);
    const spineH = top - SHELF.baseH;
    this.box(length, spineH, SHELF.spine, this.mat.spine, x, SHELF.baseH + spineH / 2, z);
    this.box(length, 0.03, 0.14, this.mat.body, x, top - 0.015, z);
    // End panels.
    for (const sx of [-1, 1]) {
      this.box(0.04, top, depth, this.mat.body, x + (sx * (length - 0.04)) / 2, top / 2, z);
    }
    // A ledge and lip under each row, on both sides, plus neon along the top.
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
      this.box(
        length - 0.04,
        0.012,
        0.014,
        dir === 1 ? this.mat.pink : this.mat.cyan,
        x,
        top + 0.003,
        z + dir * 0.07,
        false,
      );
    }
  }

  private buildSigns(): void {
    const top = this.layout.room.height;
    for (const s of this.layout.spans) {
      const front = s.yaw === 0;
      const width = Math.min(Math.max(s.x1 - s.x0, 1.6), 3.4);
      const height = width * (224 / 1024);
      const tex = signTexture(s.aisle, front ? C.pink : C.cyan, this.anisotropy);
      const zc = s.zFace + (front ? -1 : 1) * (SHELF.depth / 2);
      const x = (s.x0 + s.x1) / 2;
      this.plane(
        width,
        height,
        new MeshBasicMaterial({ map: tex, toneMapped: false }),
        x,
        STORE.signY,
        zc + (front ? 0.012 : -0.012),
        s.yaw,
      );
      // Two wires up to the ceiling.
      const wireTop = top;
      const wireBottom = STORE.signY + height / 2;
      for (const dx of [-1, 1]) {
        this.box(
          0.008,
          wireTop - wireBottom,
          0.008,
          this.mat.frame,
          x + dx * (width / 2 - 0.12),
          (wireTop + wireBottom) / 2,
          zc,
          false,
        );
      }
    }
  }

  private buildCounter(): void {
    const { counter: c, terminal: t } = this.layout;
    this.box(c.w, c.h - 0.06, c.d, this.mat.counter, c.x, (c.h - 0.06) / 2, c.z);
    this.box(c.w + 0.08, 0.06, c.d + 0.08, this.mat.counterTop, c.x, c.h - 0.03, c.z);
    this.box(c.w, 0.02, 0.012, this.mat.pink, c.x, 0.5, c.z + c.d / 2 + 0.004, false);
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

  private buildDoor(): void {
    const { door } = this.layout;
    const z = door.z - 0.03;
    const h = 2.2;
    this.box(0.08, h, 0.08, this.mat.frame, door.x - door.w / 2, h / 2, z, false);
    this.box(0.08, h, 0.08, this.mat.frame, door.x + door.w / 2, h / 2, z, false);
    this.box(door.w + 0.08, 0.08, 0.08, this.mat.frame, door.x, h, z, false);
    this.plane(door.w, h, this.mat.glass, door.x, h / 2, z, Math.PI);
    this.box(door.w, 0.02, 1.0, this.mat.mat, door.x, 0.01, door.z - 0.6, false);
    const open = openSignTexture(this.anisotropy);
    this.plane(
      0.6,
      0.3,
      new MeshBasicMaterial({ map: open, transparent: true, toneMapped: false }),
      door.x + door.w / 2 + 0.7,
      1.7,
      door.z - 0.03,
      Math.PI,
    );
  }

  /** Big cover art on the side walls, from the strongest-evidence entries. */
  private buildPosters(): void {
    const chosen = [...this.layout.slots]
      .map((s) => s.entry)
      .sort(
        (a, b) =>
          (a.evidence ?? 'Z').localeCompare(b.evidence ?? 'Z') || a.name.localeCompare(b.name),
      );
    const unique = [...new Map(chosen.map((e) => [e.id, e])).values()];
    this.layout.posterSpots.slice(0, unique.length).forEach((spot, i) => {
      const entry = unique[i];
      if (!entry) return;
      const tex = coverTexture(entry, this.anisotropy, 360, 634);
      const h = 1.3;
      this.plane(
        h * (TAPE.w / TAPE.h),
        h,
        new MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0x777777 }),
        spot.x,
        spot.y,
        spot.z,
        spot.yaw,
      );
    });
  }

  private buildTapes(): void {
    const side = this.mat.plastic;
    for (const slot of this.layout.slots) {
      const placeholder = new Color().setHSL((tapeHue(slot.entry) % 360) / 360, 0.55, 0.3);
      const front = new MeshLambertMaterial({ map: this.white, emissiveMap: this.white });
      const mesh = new Mesh(this.geo.tape, [side, side, side, side, front, side]);
      mesh.rotation.order = 'YXZ';
      mesh.rotation.set(-TAPE_TILT, slot.yaw, 0);
      mesh.position.set(slot.x, slot.y, slot.z);
      mesh.userData = { kind: 'tape', entry: slot.entry } satisfies UserData;
      this.solids.add(mesh);
      const t: TapeMesh = { mesh, entry: slot.entry, material: front, cover: null, placeholder };
      this.setCover(t, null);
      this.tapes.push(t);
    }
  }
}
