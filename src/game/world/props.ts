import {
  BoxGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  SphereGeometry,
  type BufferGeometry,
  type Material,
  type Texture,
} from 'three';
import type { PropSpec } from '../store/props';
import {
  candyTexture,
  coolerTexture,
  packetsTexture,
  popcornTexture,
  rugTexture,
  signTexture,
  tvTexture,
} from './propTextures';

const hex = (s: string) => new Color(s);

const SOFA = ['#8a3b2a', '#2f5d62', '#c58a2e'] as const;
const PLANT_POT = ['#b5603a', '#d9c9a8', '#3c3a40'] as const;

/**
 * Turns a prop spec into meshes. Every prop is built facing +z with its origin on the floor in
 * the middle of its footprint; the caller then turns and places it.
 */
export class PropKit {
  private readonly lam = new Map<string, MeshLambertMaterial>();
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly plane = new PlaneGeometry(1, 1);
  private readonly sphere = new SphereGeometry(0.5, 14, 10);
  private readonly cyl = new CylinderGeometry(0.5, 0.5, 1, 16);
  private readonly cyl4 = new CylinderGeometry(0, 0.7071, 1, 4);
  private readonly cone = new ConeGeometry(0.5, 1, 14);
  private tex: Record<string, Texture> = {};

  constructor(
    private readonly anisotropy: number,
    /** A poster texture for the Nth standee. */
    private readonly poster: (index: number) => CanvasTexture | null,
  ) {}

  private cached(key: string, make: () => Texture): Texture {
    let t = this.tex[key];
    if (!t) {
      t = make();
      this.tex[key] = t;
    }
    return t;
  }

  private mat(color: string, emissive = 0): MeshLambertMaterial {
    const key = `${color}|${emissive}`;
    let m = this.lam.get(key);
    if (!m) {
      m = new MeshLambertMaterial({ color: hex(color) });
      if (emissive) m.emissive = hex(color).multiplyScalar(emissive);
      this.lam.set(key, m);
    }
    return m;
  }

  private lit(map: Texture): MeshBasicMaterial {
    return new MeshBasicMaterial({ map, toneMapped: false });
  }

  private part(
    g: Group,
    geo: BufferGeometry,
    material: Material,
    size: [number, number, number],
    pos: [number, number, number],
    rot: [number, number, number] = [0, 0, 0],
  ): Mesh {
    const m = new Mesh(geo, material);
    m.scale.set(...size);
    m.position.set(...pos);
    m.rotation.set(...rot);
    g.add(m);
    return m;
  }

  private box(
    g: Group,
    color: string,
    size: [number, number, number],
    pos: [number, number, number],
    emissive = 0,
  ): Mesh {
    return this.part(g, this.unit, this.mat(color, emissive), size, pos);
  }

  private face(
    g: Group,
    map: Texture,
    w: number,
    h: number,
    pos: [number, number, number],
    ry = 0,
  ): Mesh {
    return this.part(g, this.plane, this.lit(map), [w, h, 1], pos, [0, ry, 0]);
  }

  build(spec: PropSpec): Group {
    const g = new Group();
    switch (spec.kind) {
      case 'sofa':
        this.sofa(g, 2.1, SOFA[(spec.variant ?? 0) % SOFA.length] ?? SOFA[0]);
        break;
      case 'armchair':
        this.sofa(g, 0.95, SOFA[(spec.variant ?? 1) % SOFA.length] ?? SOFA[1]);
        break;
      case 'coffeeTable':
        this.coffeeTable(g);
        break;
      case 'sideTable':
        this.sideTable(g);
        break;
      case 'tvStand':
        this.tvStand(g);
        break;
      case 'floorLamp':
        this.floorLamp(g);
        break;
      case 'plant':
        this.plant(g, spec.variant ?? 0);
        break;
      case 'beanBag':
        this.part(g, this.sphere, this.mat('#d4623a'), [0.9, 0.55, 0.9], [0, 0.26, 0]);
        this.part(g, this.sphere, this.mat('#e07a4a'), [0.6, 0.3, 0.6], [0.02, 0.5, 0.05]);
        break;
      case 'rug': {
        this.part(
          g,
          this.plane,
          this.lit(this.cached('rug', () => rugTexture(this.anisotropy))),
          [3.6, 4.4, 1],
          [0, 0.012, 0],
          [-Math.PI / 2, 0, 0],
        );
        break;
      }
      case 'cooler':
        this.cooler(g);
        break;
      case 'popcorn':
        this.popcorn(g);
        break;
      case 'candyRack':
        this.candyRack(g);
        break;
      case 'spinner':
        this.spinner(g);
        break;
      case 'standee':
        this.standee(g, spec.entryIndex ?? 0);
        break;
      case 'returnBox':
        this.returnBox(g);
        break;
      case 'teaShelf':
        this.teaShelf(g);
        break;
      case 'terrarium':
        this.terrarium(g);
        break;
      case 'planterBench':
        this.planterBench(g);
        break;
      case 'bin':
        this.part(g, this.cyl, this.mat('#2f4a38'), [0.36, 0.62, 0.36], [0, 0.31, 0]);
        this.part(g, this.cyl, this.mat('#1c2a20'), [0.3, 0.02, 0.3], [0, 0.62, 0]);
        break;
    }
    return g;
  }

  // ── lounge ──────────────────────────────────────────────────────────────────────────

  private sofa(g: Group, w: number, color: string): void {
    const dark = '#3b2a20';
    this.box(g, dark, [w, 0.1, 0.8], [0, 0.05, -0.02]);
    this.box(g, color, [w, 0.3, 0.9], [0, 0.25, 0]);
    this.box(g, color, [w, 0.55, 0.22], [0, 0.62, -0.34]);
    for (const s of [-1, 1]) this.box(g, color, [0.18, 0.28, 0.9], [s * (w / 2 - 0.09), 0.54, 0]);
    const cushions = Math.max(1, Math.round((w - 0.3) / 0.7));
    const cw = (w - 0.4) / cushions;
    for (let i = 0; i < cushions; i++) {
      const x = -((cushions - 1) * cw) / 2 + i * cw;
      this.box(g, color, [cw - 0.02, 0.14, 0.62], [x, 0.47, 0.1]);
      this.part(
        g,
        this.unit,
        this.mat(color),
        [cw - 0.04, 0.42, 0.14],
        [x, 0.72, -0.18],
        [-0.18, 0, 0],
      );
    }
  }

  private coffeeTable(g: Group): void {
    const wood = '#8b5a2b';
    this.box(g, wood, [1.2, 0.05, 0.65], [0, 0.4, 0]);
    this.box(g, '#5a3a1a', [1.1, 0.04, 0.55], [0, 0.2, 0]);
    for (const x of [-0.55, 0.55])
      for (const z of [-0.28, 0.28]) this.box(g, '#4a2f18', [0.06, 0.4, 0.06], [x, 0.2, z]);
    this.part(
      g,
      this.unit,
      this.mat('#d94a3a'),
      [0.28, 0.012, 0.2],
      [-0.3, 0.43, 0.05],
      [0, 0.3, 0],
    );
    this.part(
      g,
      this.unit,
      this.mat('#4a8fc2'),
      [0.26, 0.012, 0.19],
      [-0.28, 0.445, 0.04],
      [0, -0.2, 0],
    );
    this.part(g, this.cyl, this.mat('#efe5c8'), [0.08, 0.1, 0.08], [0.35, 0.47, -0.05]);
  }

  private sideTable(g: Group): void {
    this.part(g, this.cyl, this.mat('#7a5230'), [0.5, 0.04, 0.5], [0, 0.55, 0]);
    this.part(g, this.cyl, this.mat('#4a2f18'), [0.06, 0.55, 0.06], [0, 0.27, 0]);
    this.part(g, this.cyl, this.mat('#4a2f18'), [0.3, 0.03, 0.3], [0, 0.015, 0]);
    // A lava lamp: brass base, glowing glass, brass cap.
    this.part(g, this.cyl, this.mat('#d9a441'), [0.12, 0.08, 0.12], [0, 0.61, 0]);
    this.part(g, this.cone, this.mat('#ff7a3a', 0.7), [0.11, 0.3, 0.11], [0, 0.8, 0]);
    this.part(g, this.sphere, this.mat('#ffd04a', 0.9), [0.06, 0.07, 0.06], [0.01, 0.76, 0]);
    this.part(g, this.cyl, this.mat('#d9a441'), [0.04, 0.04, 0.04], [0, 0.96, 0]);
  }

  private tvStand(g: Group): void {
    this.box(g, '#6b4423', [1.3, 0.5, 0.55], [0, 0.25, 0]);
    this.box(g, '#4a2f18', [1.22, 0.4, 0.04], [0, 0.26, 0.28]);
    // A VCR in the cabinet, and a row of tapes beside it.
    this.box(g, '#18181c', [0.5, 0.09, 0.02], [-0.3, 0.3, 0.3]);
    this.box(g, '#ff4a3a', [0.03, 0.03, 0.02], [-0.1, 0.3, 0.31], 1);
    for (let i = 0; i < 6; i++) {
      const c = ['#d94a3a', '#4a8fc2', '#7bb661', '#f2c14e', '#8d74c4', '#e8892b'][i] ?? '#d94a3a';
      this.box(g, c, [0.02, 0.2, 0.1], [0.12 + i * 0.07, 0.25, 0.3]);
    }
    // The set itself.
    this.box(g, '#3a3a3e', [0.86, 0.66, 0.6], [0, 0.83, -0.02]);
    this.box(g, '#26262a', [0.7, 0.5, 0.04], [0, 0.85, 0.3]);
    this.face(
      g,
      this.cached('tv', () => tvTexture(this.anisotropy)),
      0.62,
      0.46,
      [0, 0.86, 0.321],
    );
    this.part(g, this.unit, this.mat('#2a2a2e'), [0.5, 0.05, 0.4], [0, 1.18, -0.05]);
  }

  private floorLamp(g: Group): void {
    this.part(g, this.cyl, this.mat('#2a2420'), [0.3, 0.03, 0.3], [0, 0.015, 0]);
    this.part(g, this.cyl, this.mat('#2a2420'), [0.03, 1.4, 0.03], [0, 0.7, 0]);
    this.part(g, this.cyl, this.mat('#f2d9a0', 0.85), [0.34, 0.3, 0.34], [0, 1.5, 0]);
  }

  private plant(g: Group, variant: number): void {
    const pot = PLANT_POT[variant % PLANT_POT.length] ?? PLANT_POT[0];
    this.part(g, this.cyl, this.mat(pot), [0.4, 0.36, 0.4], [0, 0.18, 0]);
    this.part(g, this.cyl, this.mat('#3a2a1c'), [0.34, 0.02, 0.34], [0, 0.36, 0]);
    const leaf = '#3f8a3a';
    const dark = '#2d6a2c';
    if (variant === 1) {
      // A bushy shrub.
      const blobs: [number, number, number, number][] = [
        [0, 0.8, 0, 0.55],
        [0.2, 0.62, 0.1, 0.4],
        [-0.2, 0.66, -0.05, 0.42],
        [0.05, 1.1, 0.05, 0.4],
        [-0.1, 0.95, 0.15, 0.34],
      ];
      blobs.forEach(([x, y, z, s], i) =>
        this.part(g, this.sphere, this.mat(i % 2 ? dark : leaf), [s, s * 0.9, s], [x, y, z]),
      );
    } else if (variant === 2) {
      // A snake plant: upright blades.
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const h = 0.7 + (i % 3) * 0.28;
        this.part(
          g,
          this.unit,
          this.mat(i % 2 ? leaf : dark),
          [0.07, h, 0.025],
          [Math.cos(a) * 0.08, 0.36 + h / 2, Math.sin(a) * 0.08],
          [Math.sin(a) * 0.12, a, Math.cos(a) * 0.12],
        );
      }
    } else {
      // A palm: arching leaves on a trunk.
      this.part(g, this.cyl, this.mat('#6a4a2a'), [0.05, 0.7, 0.05], [0, 0.7, 0]);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const leafMesh = this.part(
          g,
          this.sphere,
          this.mat(i % 2 ? leaf : dark),
          [0.1, 0.62, 0.04],
          [Math.cos(a) * 0.26, 1.15, Math.sin(a) * 0.26],
          [Math.sin(a) * 0.9, a, -Math.cos(a) * 0.9],
        );
        leafMesh.rotation.order = 'YXZ';
      }
    }
  }

  // ── snack corner ────────────────────────────────────────────────────────────────────

  private cooler(g: Group): void {
    this.box(g, '#cdc7b8', [0.85, 1.95, 0.75], [0, 0.975, 0]);
    this.box(g, '#9a1f1a', [0.88, 0.16, 0.78], [0, 1.97, 0]);
    this.box(g, '#2c3238', [0.86, 0.12, 0.06], [0, 0.06, 0.34]);
    this.face(
      g,
      this.cached('cooler', () => coolerTexture(this.anisotropy)),
      0.66,
      1.5,
      [0, 1.0, 0.378],
    );
    this.box(g, '#8a929a', [0.74, 1.58, 0.02], [0, 1.0, 0.372]);
    this.face(
      g,
      this.cached('coldSign', () => signTexture('ICE COLD', '#fff4d8', '#b3221c', this.anisotropy)),
      0.7,
      0.2,
      [0, 1.97, 0.4],
    );
    this.box(g, '#d9d9d9', [0.03, 0.5, 0.03], [0.34, 1.0, 0.4]);
  }

  private popcorn(g: Group): void {
    this.box(g, '#b3221c', [0.9, 0.75, 0.7], [0, 0.55, 0]);
    this.box(g, '#2a2420', [0.9, 0.06, 0.7], [0, 0.18, 0]);
    for (const x of [-0.38, 0.38]) {
      this.part(
        g,
        this.cyl,
        this.mat('#1c1c1c'),
        [0.22, 0.05, 0.22],
        [x, 0.11, 0.3],
        [0, 0, Math.PI / 2],
      );
      this.part(
        g,
        this.cyl,
        this.mat('#1c1c1c'),
        [0.22, 0.05, 0.22],
        [x, 0.11, -0.3],
        [0, 0, Math.PI / 2],
      );
    }
    // The glass case with the popcorn in it.
    const corn = new MeshLambertMaterial({
      map: this.cached('corn', () => popcornTexture(this.anisotropy)),
      emissive: hex('#5a4a1a'),
    });
    this.part(g, this.unit, corn, [0.72, 0.52, 0.56], [0, 1.1, 0]);
    this.part(
      g,
      this.unit,
      new MeshBasicMaterial({
        color: hex('#cfe6f2'),
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
      [0.8, 0.62, 0.64],
      [0, 1.1, 0],
    );
    for (const x of [-0.4, 0.4])
      for (const z of [-0.32, 0.32]) this.box(g, '#d9a441', [0.04, 0.64, 0.04], [x, 1.1, z]);
    // A striped roof and a sign.
    this.part(
      g,
      this.cyl4,
      this.mat('#d94a3a'),
      [0.95, 0.34, 0.8],
      [0, 1.58, 0],
      [0, Math.PI / 4, 0],
    );
    this.part(g, this.sphere, this.mat('#f2c14e'), [0.12, 0.12, 0.12], [0, 1.78, 0]);
    this.face(
      g,
      this.cached('popSign', () => signTexture('POPCORN', '#fff4d8', '#b3221c', this.anisotropy)),
      0.6,
      0.2,
      [0, 0.62, 0.356],
    );
  }

  private candyRack(g: Group): void {
    this.box(g, '#2c2c2c', [0.9, 0.04, 0.45], [0, 0.02, 0]);
    this.box(g, '#2c2c2c', [0.86, 1.5, 0.12], [0, 0.78, 0]);
    const map = this.cached('candy', () => candyTexture(this.anisotropy));
    this.face(g, map, 0.82, 1.4, [0, 0.8, 0.065]);
    this.face(g, map, 0.82, 1.4, [0, 0.8, -0.065], Math.PI);
    this.box(g, '#d94a3a', [0.9, 0.12, 0.14], [0, 1.58, 0]);
  }

  private spinner(g: Group): void {
    this.part(g, this.cyl, this.mat('#2c2c2c'), [0.5, 0.04, 0.5], [0, 0.02, 0]);
    this.part(g, this.cyl, this.mat('#555'), [0.05, 1.5, 0.05], [0, 0.75, 0]);
    const spin = new Group();
    spin.position.y = 0.95;
    const map = this.cached('packets', () => packetsTexture(this.anisotropy));
    for (let i = 0; i < 4; i++) {
      const side = new Group();
      side.rotation.y = (i * Math.PI) / 2;
      this.face(side, map, 0.4, 1.2, [0, 0, 0.21]);
      spin.add(side);
    }
    this.part(spin, this.unit, this.mat('#3a2a1c'), [0.4, 1.2, 0.4], [0, 0, 0]);
    g.add(spin);
    this.part(
      g,
      this.unit,
      this.lit(
        this.cached('seedSign', () =>
          signTexture('SEEDS', '#2c3a1c', '#bfe08a', this.anisotropy, 128, 48),
        ),
      ),
      [0.42, 0.14, 0.42],
      [0, 1.64, 0],
    );
  }

  private standee(g: Group, index: number): void {
    const tex = this.poster(index);
    this.box(g, '#d8c7a0', [0.74, 1.3, 0.025], [0, 1.0, 0]);
    if (tex) this.face(g, tex, 0.66, 1.17, [0, 1.0, 0.014]);
    this.box(g, '#d94a3a', [0.74, 0.12, 0.03], [0, 1.72, 0.002]);
    this.face(
      g,
      this.cached('newSign', () =>
        signTexture('NEW IN', '#fff4d8', '#d94a3a', this.anisotropy, 192, 48),
      ),
      0.66,
      0.1,
      [0, 1.72, 0.02],
    );
    // A fold-out leg at the back and a base.
    this.part(g, this.unit, this.mat('#bfae88'), [0.5, 0.9, 0.02], [0, 0.5, -0.12], [0.35, 0, 0]);
    this.box(g, '#3b2a20', [0.7, 0.04, 0.3], [0, 0.02, 0.0]);
  }

  private returnBox(g: Group): void {
    this.box(g, '#24407a', [0.55, 1.05, 0.5], [0, 0.525, 0]);
    this.part(
      g,
      this.cyl,
      this.mat('#24407a'),
      [0.55, 0.5, 0.55],
      [0, 1.05, 0],
      [0, 0, Math.PI / 2],
    );
    this.box(g, '#0f1a33', [0.38, 0.06, 0.02], [0, 0.9, 0.255]);
    this.face(
      g,
      this.cached('returnSign', () =>
        signTexture('RETURNS', '#ffffff', '#24407a', this.anisotropy),
      ),
      0.46,
      0.18,
      [0, 0.66, 0.256],
    );
    this.box(g, '#d9d9d9', [0.04, 0.1, 0.02], [0.2, 0.5, 0.256]);
  }

  private teaShelf(g: Group): void {
    const L = 2.2;
    const wood = '#7a5230';
    this.box(g, '#3f2c1c', [L, 1.9, 0.04], [0, 0.95, -0.18]);
    for (const x of [-L / 2 + 0.02, L / 2 - 0.02])
      this.box(g, wood, [0.04, 1.9, 0.4], [x, 0.95, 0]);
    const cols = ['#c44a3a', '#3f7a62', '#d9a441', '#3a5f8a', '#7a3a6a', '#e8e0cf', '#5a7a3a'];
    for (let s = 0; s < 5; s++) {
      const y = 0.25 + s * 0.4;
      this.box(g, wood, [L - 0.04, 0.03, 0.4], [0, y, 0]);
      const n = Math.floor((L - 0.2) / 0.15);
      for (let i = 0; i < n; i++) {
        const x = -((n - 1) * 0.15) / 2 + i * 0.15;
        const c = cols[(i + s * 3) % cols.length] ?? '#c44a3a';
        if (s % 2 === 0) {
          this.part(g, this.cyl, this.mat(c), [0.11, 0.2, 0.11], [x, y + 0.115, 0.02]);
          this.part(g, this.cyl, this.mat('#d9a441'), [0.12, 0.025, 0.12], [x, y + 0.225, 0.02]);
        } else {
          this.box(g, c, [0.1, 0.18, 0.07], [x, y + 0.105, 0.04]);
          this.box(g, '#efe5c8', [0.07, 0.07, 0.01], [x, y + 0.11, 0.077]);
        }
      }
    }
    this.box(g, '#2c3a1c', [L, 0.16, 0.06], [0, 1.98, 0.17], 0.1);
    this.face(
      g,
      this.cached('teaSign', () =>
        signTexture('TEAS & TISANES', '#f2e6c0', '#3a4a22', this.anisotropy, 512, 64),
      ),
      L - 0.1,
      0.14,
      [0, 1.98, 0.205],
    );
  }

  private terrarium(g: Group): void {
    this.box(g, '#7a5230', [0.9, 0.04, 0.6], [0, 0.78, 0]);
    for (const x of [-0.4, 0.4])
      for (const z of [-0.25, 0.25]) this.box(g, '#5a3a1a', [0.05, 0.78, 0.05], [x, 0.39, z]);
    this.box(g, '#3a2a1c', [0.8, 0.12, 0.5], [0, 0.86, 0]);
    this.part(g, this.sphere, this.mat('#4fa05a'), [0.5, 0.2, 0.34], [-0.1, 0.95, 0]);
    this.part(g, this.cone, this.mat('#2f7a3a'), [0.18, 0.34, 0.18], [0.22, 1.1, 0.05]);
    this.part(g, this.cone, this.mat('#3f8a3a'), [0.14, 0.26, 0.14], [0.05, 1.07, -0.1]);
    for (const [x, z] of [
      [-0.3, 0.1],
      [-0.18, -0.1],
    ] as const) {
      this.part(g, this.cyl, this.mat('#efe5c8'), [0.03, 0.08, 0.03], [x, 1.0, z]);
      this.part(g, this.sphere, this.mat('#d94a3a'), [0.1, 0.06, 0.1], [x, 1.05, z]);
    }
    this.part(
      g,
      this.unit,
      new MeshBasicMaterial({
        color: hex('#cfe6f2'),
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
      [0.86, 0.46, 0.56],
      [0, 1.1, 0],
    );
    this.box(g, '#2a2420', [0.9, 0.03, 0.6], [0, 1.34, 0]);
  }

  private planterBench(g: Group): void {
    this.box(g, '#6b4423', [5, 0.4, 0.5], [0, 0.2, 0]);
    this.box(g, '#2e2218', [4.9, 0.05, 0.42], [0, 0.42, 0]);
    for (let i = 0; i < 9; i++) {
      const x = -2.2 + i * 0.55;
      const h = 0.35 + (i % 3) * 0.14;
      this.part(
        g,
        this.sphere,
        this.mat(i % 2 ? '#3f8a3a' : '#2d6a2c'),
        [0.34, h, 0.3],
        [x, 0.45 + h / 2, 0],
      );
      if (i % 3 === 1)
        this.part(g, this.sphere, this.mat('#e8892b'), [0.1, 0.1, 0.1], [x + 0.08, 0.45 + h, 0.12]);
    }
  }
}
