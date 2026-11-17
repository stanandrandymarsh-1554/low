import {
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  type Texture,
} from 'three';
import type { Npc } from '../store/npc';
import { rng } from '../voxel/grid';
import { faceTexture } from './propTextures';

const SKIN = ['#f1c9a5', '#e0ac82', '#c68a5e', '#9a6641', '#6e4429', '#f6d6b8'] as const;
const HAIR = ['#2a1c14', '#4a3020', '#8a5a2a', '#d9b25a', '#b8402a', '#3a3a3e', '#d8d8d0'] as const;
const SHIRT = [
  '#d94a3a',
  '#4a8fc2',
  '#7bb661',
  '#f2c14e',
  '#8d74c4',
  '#e8892b',
  '#4fa59c',
  '#c75fb0',
  '#eee6d2',
] as const;
const PANTS = ['#2f3d5a', '#3a3a3e', '#6a5a46', '#4a5a3a', '#26262a', '#5a3a3a'] as const;

const pick = <T>(list: readonly T[], r: () => number): T =>
  list[Math.floor(r() * list.length)] ?? (list[0] as T);

function wrap(a: number): number {
  let d = a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** A blocky shopper or clerk, about 1.7 m tall, built from boxes on joints so it can walk and sit. */
export class Person {
  readonly root = new Group();
  private readonly body = new Group();
  private readonly head = new Group();
  private readonly legs: [Group, Group];
  private readonly arms: [Group, Group];
  private prev: { x: number; z: number; yaw: number };

  constructor(
    readonly npc: Npc,
    kit: PeopleKit,
  ) {
    const r = rng(npc.seed);
    const skin = pick(SKIN, r);
    const hair = pick(HAIR, r);
    const clerk = npc.role === 'clerk';
    const shirt = clerk ? '#eee6d2' : pick(SHIRT, r);
    const pants = clerk ? '#26262a' : pick(PANTS, r);
    const height = 0.93 + r() * 0.13;
    const style = clerk ? 0 : Math.floor(r() * 5);
    this.prev = { x: npc.x, z: npc.z, yaw: npc.yaw };

    this.root.add(this.body);
    this.body.scale.setScalar(height);

    // Legs hang from the hips.
    const mkLeg = (x: number): Group => {
      const leg = new Group();
      leg.position.set(x, 0.84, 0);
      const l = kit.box(0.15, 0.78, 0.17, pants, 0, -0.43, 0);
      const shoe = kit.box(0.17, 0.08, 0.27, '#1c1816', 0, -0.8, 0.045);
      leg.add(l, shoe);
      this.body.add(leg);
      return leg;
    };
    this.legs = [mkLeg(-0.1), mkLeg(0.1)];

    // Torso.
    this.body.add(kit.box(0.4, 0.58, 0.22, shirt, 0, 1.13, 0));
    if (clerk) {
      // A green vest with a gold name tag.
      this.body.add(kit.box(0.42, 0.42, 0.24, '#2f6a52', 0, 1.06, 0));
      this.body.add(kit.box(0.09, 0.05, 0.01, '#f2c14e', 0.1, 1.2, 0.125));
    }

    // Arms swing from the shoulders: a sleeve and a bare forearm.
    const mkArm = (x: number): Group => {
      const arm = new Group();
      arm.position.set(x, 1.4, 0);
      arm.add(kit.box(0.11, 0.26, 0.13, shirt, 0, -0.13, 0));
      arm.add(kit.box(0.09, 0.3, 0.11, skin, 0, -0.41, 0));
      this.body.add(arm);
      return arm;
    };
    this.arms = [mkArm(-0.255), mkArm(0.255)];

    // Head, face and hair.
    this.head.position.set(0, 1.44, 0);
    this.body.add(this.head);
    this.head.add(kit.box(0.2, 0.23, 0.21, skin, 0, 0.115, 0));
    const face = new Mesh(kit.plane, kit.face(skin, Math.floor(r() * 6)));
    face.scale.set(0.2, 0.23, 1);
    face.position.set(0, 0.115, 0.1056);
    this.head.add(face);
    if (style === 0 || style === 3) {
      this.head.add(kit.box(0.22, 0.07, 0.23, hair, 0, 0.245, 0));
      this.head.add(kit.box(0.22, 0.14, 0.05, hair, 0, 0.17, -0.09));
    } else if (style === 1) {
      this.head.add(kit.box(0.22, 0.07, 0.23, hair, 0, 0.245, 0));
      this.head.add(kit.box(0.22, 0.34, 0.05, hair, 0, 0.08, -0.1));
      for (const s of [-1, 1])
        this.head.add(kit.box(0.03, 0.26, 0.16, hair, s * 0.105, 0.1, -0.02));
    } else if (style === 2) {
      const cap = pick(SHIRT, r);
      this.head.add(kit.box(0.22, 0.08, 0.23, cap, 0, 0.25, 0));
      this.head.add(kit.box(0.2, 0.02, 0.12, cap, 0, 0.225, 0.15));
    } else {
      this.head.add(kit.box(0.22, 0.12, 0.22, hair, 0, 0.255, -0.005));
      this.head.add(kit.box(0.24, 0.08, 0.06, hair, 0, 0.17, -0.1));
    }
    if (clerk || r() < 0.25) {
      this.head.add(kit.box(0.2, 0.025, 0.012, '#1c1816', 0, 0.135, 0.112));
    }
  }

  /** Remembers where the simulation had the person, before it takes its next step. */
  snapshot(): void {
    this.prev = { x: this.npc.x, z: this.npc.z, yaw: this.npc.yaw };
  }

  /**
   * Puts the figure between its last two simulated positions (`alpha` is how far through the
   * step we are), mid-stride or seated or reaching for a shelf.
   */
  update(alpha: number, time: number): void {
    const n = this.npc;
    const { root, body, head, legs, arms } = this;
    root.position.set(
      this.prev.x + (n.x - this.prev.x) * alpha,
      0,
      this.prev.z + (n.z - this.prev.z) * alpha,
    );
    root.rotation.y = this.prev.yaw + wrap(n.yaw - this.prev.yaw) * alpha;
    let bob = 0;
    let legSwing = 0;
    let rightArm = 0;
    let leftArm = 0;
    let sit = 0;

    switch (n.mode) {
      case 'walk': {
        legSwing = Math.sin(n.phase) * 0.7;
        bob = Math.abs(Math.cos(n.phase)) * 0.02;
        leftArm = -legSwing * 0.7;
        rightArm = legSwing * 0.7;
        break;
      }
      case 'browse': {
        // Stand still, shifting weight, with one hand out toward the shelf now and then.
        const reach = Math.max(0, Math.sin(n.phase * 0.7 + n.seed));
        rightArm = -1.35 * reach;
        bob = Math.sin(n.phase * 1.3) * 0.004;
        break;
      }
      case 'sit': {
        sit = 1;
        legSwing = 0;
        leftArm = -0.5;
        rightArm = -0.5;
        break;
      }
      case 'pay': {
        // Holding something out across the counter, or ringing it up.
        const scan = Math.sin(time * 3 + n.seed) * 0.15;
        rightArm = -1.25 + scan;
        leftArm = n.role === 'clerk' ? -0.9 - scan : 0;
        break;
      }
      default: {
        bob = Math.sin(time * 1.4 + n.seed) * 0.004;
        break;
      }
    }

    if (sit) {
      body.position.y = -0.4 + bob;
      body.position.z = -0.12;
      legs[0].rotation.x = -Math.PI / 2;
      legs[1].rotation.x = -Math.PI / 2;
    } else {
      body.position.y = bob;
      body.position.z = 0;
      legs[0].rotation.x = legSwing;
      legs[1].rotation.x = -legSwing;
    }
    arms[0].rotation.x = leftArm;
    arms[1].rotation.x = rightArm;

    // The head turns toward whatever is being looked at, within a comfortable range.
    if (n.look) {
      const want = Math.atan2(n.look.x - n.x, n.look.z - n.z);
      head.rotation.y = Math.max(-1.0, Math.min(1.0, wrap(want - n.yaw)));
      head.rotation.x = n.mode === 'browse' ? 0.12 : 0;
    } else {
      head.rotation.y *= 0.9;
      head.rotation.x = 0;
    }
  }
}

/** Shared geometry and materials for every person. */
export class PeopleKit {
  readonly plane = new PlaneGeometry(1, 1);
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly mats = new Map<string, MeshLambertMaterial>();
  private readonly faces = new Map<string, MeshBasicMaterial>();
  private readonly faceTex: Texture[] = [];

  box(w: number, h: number, d: number, color: string, x: number, y: number, z: number): Mesh {
    let m = this.mats.get(color);
    if (!m) {
      m = new MeshLambertMaterial({
        color: new Color(color),
        emissive: new Color(color).multiplyScalar(0.12),
      });
      this.mats.set(color, m);
    }
    const mesh = new Mesh(this.unit, m);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    return mesh;
  }

  face(skin: string, mood: number): MeshBasicMaterial {
    const key = `${skin}|${mood % 3}`;
    let m = this.faces.get(key);
    if (!m) {
      const tex = faceTexture(skin, mood);
      this.faceTex.push(tex);
      // Unlit, but dimmed a little so faces sit with the lit shirts.
      m = new MeshBasicMaterial({ map: tex, color: new Color(0.82, 0.8, 0.78), toneMapped: false });
      this.faces.set(key, m);
    }
    return m;
  }
}
