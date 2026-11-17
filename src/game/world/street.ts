import {
  BackSide,
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SphereGeometry,
} from 'three';
import type { Area } from '../store/layout';
import { facadeTexture, pavingTexture, skyTexture } from './propTextures';

const hex = (s: string) => new Color(s);

interface Driver {
  car: Group;
  /** Metres per second along x (negative drives left). */
  speed: number;
}

const SHOPS = ['VIDEO', 'CAFE', 'LAUNDRY', 'PIZZA', 'BOOKS', 'RECORDS', 'DELI', 'PHOTO', 'FLORIST'];
const CAR_COLOURS = ['#c44a3a', '#3a6aa8', '#e8e0cf', '#3a8a62', '#c9a43a', '#6a4a8a', '#2c2c30'];

/**
 * The street outside the shop front, built as real 3D objects: pavement, kerb, a two-lane road
 * with parked and passing cars, trees, lamps, a bench, and shops across the road under a sky.
 * It is seen through the door and windows; you can't walk out to it.
 */
export class Street {
  private readonly drivers: Driver[] = [];
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly plane = new PlaneGeometry(1, 1);
  private readonly cyl = new CylinderGeometry(0.5, 0.5, 1, 14);
  private readonly sphere = new SphereGeometry(0.5, 12, 9);
  private readonly mats = new Map<string, MeshLambertMaterial>();

  constructor(
    private readonly scene: Scene,
    room: Area,
    private readonly anisotropy: number,
  ) {
    const z0 = room.maxZ;
    const cx = (room.minX + room.maxX) / 2;
    this.buildSky(cx, z0);
    this.buildGround(cx, z0);
    this.buildRoad(cx, z0);
    this.buildNeighbours(room);
    this.buildShopsAcross(cx, z0);
    this.buildFurniture(cx, z0);
    this.buildTraffic(cx, z0);
  }

  /** Daylight materials: not dimmed by the shop's indoor fog. */
  private mat(color: string, emissive = 0.28): MeshLambertMaterial {
    const key = `${color}|${emissive}`;
    let m = this.mats.get(key);
    if (!m) {
      m = new MeshLambertMaterial({
        color: hex(color),
        emissive: hex(color).multiplyScalar(emissive),
        fog: false,
      });
      this.mats.set(key, m);
    }
    return m;
  }

  private add(
    geo: BoxGeometry | CylinderGeometry | SphereGeometry,
    material: MeshLambertMaterial,
    size: [number, number, number],
    pos: [number, number, number],
    parent: Group | Scene = this.scene,
    rot: [number, number, number] = [0, 0, 0],
  ): Mesh {
    const m = new Mesh(geo, material);
    m.scale.set(...size);
    m.position.set(...pos);
    m.rotation.set(...rot);
    parent.add(m);
    return m;
  }

  private buildSky(cx: number, z0: number): void {
    const sky = new Mesh(
      new SphereGeometry(110, 24, 12),
      new MeshBasicMaterial({ map: skyTexture(), side: BackSide, fog: false, depthWrite: false }),
    );
    sky.position.set(cx, 0, z0 + 12);
    sky.renderOrder = -10;
    this.scene.add(sky);
  }

  private buildGround(cx: number, z0: number): void {
    // Grass-coloured earth under everything, then the pavement in front of the shop.
    const earth = new Mesh(this.plane, this.mat('#6f7c52'));
    earth.scale.set(300, 300, 1);
    earth.rotation.x = -Math.PI / 2;
    earth.position.set(cx, -0.08, z0 + 20);
    this.scene.add(earth);

    const paving = pavingTexture(this.anisotropy);
    paving.wrapS = paving.wrapT = RepeatWrapping;
    const slab = (z: number, depth: number) => {
      const t = paving.clone();
      t.repeat.set(160 / 1.2, depth / 1.2);
      t.needsUpdate = true;
      const m = new Mesh(
        this.plane,
        new MeshLambertMaterial({ map: t, emissive: hex('#4a4740'), fog: false }),
      );
      m.scale.set(160, depth, 1);
      m.rotation.x = -Math.PI / 2;
      m.position.set(cx, 0.0, z);
      this.scene.add(m);
    };
    slab(z0 + 2.0, 4.0);
    slab(z0 + 19.8, 4.0);
  }

  private buildRoad(cx: number, z0: number): void {
    const asphalt = this.mat('#4b4a50', 0.2);
    const road = new Mesh(this.plane, asphalt);
    road.scale.set(160, 11.6, 1);
    road.rotation.x = -Math.PI / 2;
    road.position.set(cx, -0.04, z0 + 4 + 5.8);
    this.scene.add(road);
    // Kerbs.
    for (const z of [z0 + 4.05, z0 + 15.55]) {
      this.add(this.unit, this.mat('#cfc9b8'), [160, 0.16, 0.25], [cx, 0.03, z]);
    }
    // Centre line (a double yellow) and dashed lane edges.
    const yellow = this.mat('#e8c84a', 0.5);
    for (const dz of [-0.1, 0.1]) {
      this.add(this.unit, yellow, [160, 0.01, 0.07], [cx, -0.02, z0 + 9.8 + dz]);
    }
    const white = this.mat('#eeeeee', 0.5);
    for (let x = -70; x < 70; x += 4) {
      this.add(this.unit, white, [1.6, 0.01, 0.1], [cx + x, -0.02, z0 + 6.7]);
      this.add(this.unit, white, [1.6, 0.01, 0.1], [cx + x, -0.02, z0 + 12.9]);
    }
    // A zebra crossing to the left of the door.
    for (let i = 0; i < 8; i++) {
      this.add(this.unit, white, [0.5, 0.012, 11.4], [cx - 11 + i * 0.9, -0.019, z0 + 9.8]);
    }
  }

  /** Shops either side of ours, flush with its front wall. */
  private buildNeighbours(room: Area): void {
    const z0 = room.maxZ;
    let seed = 11;
    for (const side of [-1, 1]) {
      let x = side > 0 ? room.maxX : room.minX;
      for (let i = 0; i < 3; i++) {
        const w = 8 + i * 1.5;
        const cx = x + (side * w) / 2;
        const label = SHOPS[(seed + i) % SHOPS.length] ?? 'SHOP';
        const front = new MeshBasicMaterial({
          map: facadeTexture(seed + i * 13, label, this.anisotropy),
          fog: false,
        });
        const wall = this.mat('#9a8e7e');
        const roof = this.mat('#5a5a5e');
        const b = new Mesh(this.unit, [wall, wall, roof, wall, front, wall]);
        const h = 8 + (i % 2) * 2;
        b.scale.set(w - 0.02, h, 14);
        b.position.set(cx, h / 2, z0 - 7 + 0.02);
        this.scene.add(b);
        x += side * w;
      }
      seed += 40;
    }
  }

  private buildShopsAcross(cx: number, z0: number): void {
    let x = -52;
    let i = 0;
    while (x < 52) {
      const w = 9 + (i % 3) * 2;
      const h = 8 + ((i * 5) % 4) * 1.5;
      const label = SHOPS[i % SHOPS.length] ?? 'SHOP';
      const front = new MeshBasicMaterial({
        map: facadeTexture(300 + i * 17, label, this.anisotropy),
        fog: false,
      });
      const wall = this.mat('#9a8e7e');
      const roof = this.mat('#5a5a5e');
      // The face toward the shop is the -z side (index 5).
      const b = new Mesh(this.unit, [wall, wall, roof, wall, wall, front]);
      b.scale.set(w - 0.05, h, 12);
      b.position.set(cx + x + w / 2, h / 2, z0 + 22 + 6);
      this.scene.add(b);
      x += w;
      i++;
    }
  }

  private tree(x: number, z: number, scale = 1): void {
    const g = new Group();
    this.add(
      this.cyl,
      this.mat('#6a4a2a'),
      [0.28 * scale, 2.6 * scale, 0.28 * scale],
      [0, 1.3 * scale, 0],
      g,
    );
    const leaf = ['#3f8a3a', '#4f9a44', '#2f7a34'];
    const blobs: [number, number, number, number][] = [
      [0, 3.4, 0, 2.4],
      [0.9, 2.9, 0.4, 1.7],
      [-0.9, 3.0, -0.3, 1.8],
      [0.1, 4.3, 0.2, 1.6],
    ];
    blobs.forEach(([bx, by, bz, d], k) =>
      this.add(
        this.sphere,
        this.mat(leaf[k % leaf.length] ?? '#3f8a3a', 0.2),
        [d * scale, d * 0.9 * scale, d * scale],
        [bx * scale, by * scale, bz * scale],
        g,
      ),
    );
    g.position.set(x, 0, z);
    this.scene.add(g);
  }

  private lamp(x: number, z: number): void {
    const g = new Group();
    this.add(this.cyl, this.mat('#2f3a36'), [0.12, 5.2, 0.12], [0, 2.6, 0], g);
    this.add(this.unit, this.mat('#2f3a36'), [0.9, 0.08, 0.08], [0.4, 5.2, 0], g);
    this.add(this.unit, this.mat('#fff0c0', 1), [0.35, 0.12, 0.2], [0.8, 5.12, 0], g);
    g.position.set(x, 0, z);
    this.scene.add(g);
  }

  private bench(x: number, z: number): void {
    const g = new Group();
    const wood = this.mat('#8a5a2a');
    for (let i = 0; i < 3; i++)
      this.add(this.unit, wood, [1.6, 0.04, 0.1], [0, 0.45, -0.1 + i * 0.14], g);
    for (let i = 0; i < 3; i++)
      this.add(this.unit, wood, [1.6, 0.1, 0.04], [0, 0.65 + i * 0.13, -0.28], g);
    for (const sx of [-0.7, 0.7])
      this.add(this.unit, this.mat('#2f3a36'), [0.06, 0.45, 0.5], [sx, 0.22, -0.05], g);
    g.position.set(x, 0, z);
    this.scene.add(g);
  }

  private buildFurniture(cx: number, z0: number): void {
    // Trees along both pavements, lamps at the kerb.
    for (const x of [-15, -6.2, 5.5, 14.5, -26, 26]) this.tree(cx + x, z0 + 3.2, 1);
    for (const x of [-20, -9, 9.5, 20]) this.tree(cx + x, z0 + 19.2, 1.15);
    for (const x of [-11, 0.5, 11.5]) this.lamp(cx + x, z0 + 3.5);
    for (const x of [-4.5, 5]) this.lamp(cx + x, z0 + 16.3);
    this.bench(cx - 3.6, z0 + 0.8);
    // A mailbox and a hydrant by the kerb.
    this.add(this.unit, this.mat('#24407a'), [0.5, 1.1, 0.5], [cx + 3.5, 0.55, z0 + 3.4]);
    this.add(this.cyl, this.mat('#24407a'), [0.5, 0.5, 0.5], [cx + 3.5, 1.1, z0 + 3.4]).rotation.z =
      Math.PI / 2;
    this.add(this.cyl, this.mat('#c0392b'), [0.3, 0.7, 0.3], [cx - 8.5, 0.35, z0 + 3.5]);
    this.add(this.sphere, this.mat('#c0392b'), [0.34, 0.24, 0.34], [cx - 8.5, 0.72, z0 + 3.5]);
    // A bin.
    this.add(this.cyl, this.mat('#2f4a38'), [0.45, 0.8, 0.45], [cx + 2.2, 0.4, z0 + 0.7]);
  }

  private car(color: string): Group {
    const g = new Group();
    const dark = this.mat('#18181c');
    this.add(this.unit, this.mat(color), [4.2, 0.7, 1.75], [0, 0.65, 0], g);
    this.add(this.unit, this.mat(color), [2.3, 0.6, 1.6], [-0.2, 1.25, 0], g);
    const glass = this.mat('#8fb4cc', 0.4);
    this.add(this.unit, glass, [2.0, 0.42, 1.64], [-0.2, 1.27, 0], g);
    this.add(this.unit, this.mat(color), [2.34, 0.08, 1.62], [-0.2, 1.58, 0], g);
    for (const sx of [-1.4, 1.4]) {
      for (const sz of [-0.88, 0.88]) {
        this.add(this.cyl, dark, [0.62, 0.22, 0.62], [sx, 0.31, sz], g, [Math.PI / 2, 0, 0]);
      }
    }
    for (const sz of [-0.6, 0.6]) {
      this.add(this.unit, this.mat('#fff4c0', 1), [0.06, 0.16, 0.3], [2.1, 0.7, sz], g);
      this.add(this.unit, this.mat('#d03a2a', 0.9), [0.06, 0.16, 0.3], [-2.1, 0.7, sz], g);
    }
    this.add(this.unit, dark, [4.25, 0.12, 1.78], [0, 0.3, 0], g);
    return g;
  }

  private buildTraffic(cx: number, z0: number): void {
    // Parked along both kerbs.
    const parked: [number, number, number][] = [
      [-13, 5.2, 0],
      [-5.5, 5.2, 1],
      [6, 5.2, 2],
      [16, 5.2, 3],
      [-9, 14.2, 4],
      [8, 14.2, 5],
    ];
    parked.forEach(([x, dz, c], i) => {
      const car = this.car(CAR_COLOURS[c % CAR_COLOURS.length] ?? '#c44a3a');
      car.position.set(cx + x, 0, z0 + dz);
      if (dz > 10) car.rotation.y = Math.PI;
      if (i === 3) car.scale.set(1, 1.2, 1);
      this.scene.add(car);
    });
    // Two that drive past, one each way, looping.
    const lanes: [number, number, number][] = [
      [8.0, 5.5, 0],
      [11.6, -4.5, 6],
    ];
    lanes.forEach(([dz, speed, c], i) => {
      const car = this.car(CAR_COLOURS[(c + i * 2) % CAR_COLOURS.length] ?? '#3a6aa8');
      car.position.set(cx - 40 + i * 50, 0, z0 + dz);
      if (speed < 0) car.rotation.y = Math.PI;
      this.scene.add(car);
      this.drivers.push({ car, speed });
    });
    this.centre = cx;
  }

  private centre = 0;

  /** Moves the passing cars; `time` is in seconds. */
  update(time: number): void {
    for (const d of this.drivers) {
      const span = 100;
      const start = this.centre - span / 2;
      const phase = (d.car.userData.offset as number | undefined) ?? (d.speed > 0 ? 0 : 0.5);
      const t = ((((time * Math.abs(d.speed)) / span + phase) % 1) + 1) % 1;
      d.car.position.x = d.speed > 0 ? start + t * span : start + (1 - t) * span;
    }
  }
}
