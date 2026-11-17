import type { Box } from '../../engine/collision';
import { buildAisles } from '../aisles';
import type { Entry } from '../data/types';

// All sizes are world pixels. The store is drawn top-down in 3/4 view: each rack shows its
// tapes on its south face, and you browse by standing south of it.
export const TAPE_W = 52;
export const TAPE_H = 74;
export const SLOT_W = 62;
export const ROW_H = 92;
export const RACK_PAD = 14;
export const RACK_TOP = 16;
export const RACK_BASE = 12;
export const PLANK = 10;

export const WALL_H = 110;
export const WALL_SIDE = 26;
export const WALL_BOTTOM = 24;

/** The player's feet: collision is only against this small box at the bottom of the sprite. */
export const FOOT_W = 14;
export const FOOT_H = 8;

const RACK_GAP = 90;
const ROW_GAP = 140;
const TOP_MARGIN = 200;
const BOTTOM_AREA = 290;
const MAX_ROW_W = 1500;
const MIN_WORLD_W = 960;
const MAX_COLS = 8;
const MAX_ROWS = 3;
const CHUNK = MAX_COLS * MAX_ROWS;

export interface Slot {
  entry: Entry;
  col: number;
  row: number;
  /** Top-left of the tape on the shelf. */
  x: number;
  y: number;
}

export interface Rack extends Box {
  id: string;
  name: string;
  cols: number;
  rows: number;
  slots: Slot[];
}

export interface StoreLayout {
  width: number;
  height: number;
  racks: Rack[];
  counter: Box;
  /** The search computer sitting on the counter. */
  computer: Box;
  /** Where the player starts (feet position, just inside the door). */
  spawn: { x: number; y: number };
  /** Everything the player can't walk through: walls, racks, counter. */
  solids: Box[];
}

interface Proto {
  id: string;
  name: string;
  entries: Entry[];
  cols: number;
  rows: number;
  w: number;
  h: number;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Slot rectangle (the tape's footprint on the shelf). */
export function slotBox(slot: Slot): Box {
  return { x: slot.x, y: slot.y, w: TAPE_W, h: TAPE_H };
}

/**
 * Lays the catalogue out as a store: one rack per aisle (aisles over 24 tapes spill onto extra
 * racks), racks wrapped into rows, a counter with the search computer near the door.
 */
export function buildStoreLayout(entries: readonly Entry[]): StoreLayout {
  const protos: Proto[] = [];
  for (const aisle of buildAisles(entries).slice(1)) {
    const chunks = Math.ceil(aisle.entries.length / CHUNK);
    for (let c = 0; c < chunks; c++) {
      const list = aisle.entries.slice(c * CHUNK, (c + 1) * CHUNK);
      const cols = Math.min(MAX_COLS, Math.max(3, Math.ceil(list.length / MAX_ROWS)));
      const rows = Math.ceil(list.length / cols);
      protos.push({
        id: chunks > 1 ? `${slug(aisle.name)}-${c + 1}` : slug(aisle.name),
        name: chunks > 1 ? `${aisle.name} ${c + 1}/${chunks}` : aisle.name,
        entries: list,
        cols,
        rows,
        w: cols * SLOT_W + RACK_PAD * 2,
        h: RACK_TOP + rows * ROW_H + RACK_BASE,
      });
    }
  }

  // Wrap racks into rows.
  const rowsOfProtos: Proto[][] = [];
  let current: Proto[] = [];
  let currentW = 0;
  for (const p of protos) {
    const next = current.length ? currentW + RACK_GAP + p.w : p.w;
    if (current.length && next > MAX_ROW_W) {
      rowsOfProtos.push(current);
      current = [];
      currentW = 0;
    }
    currentW = current.length ? currentW + RACK_GAP + p.w : p.w;
    current.push(p);
  }
  if (current.length) rowsOfProtos.push(current);

  const rowWidth = (row: Proto[]) =>
    row.reduce((sum, p) => sum + p.w, 0) + RACK_GAP * (row.length - 1);
  const widest = Math.max(0, ...rowsOfProtos.map(rowWidth));
  const width = Math.max(MIN_WORLD_W, widest + 2 * (WALL_SIDE + 60));

  const racks: Rack[] = [];
  let y = TOP_MARGIN;
  for (const row of rowsOfProtos) {
    let x = Math.round((width - rowWidth(row)) / 2);
    for (const p of row) {
      const rack: Rack = {
        id: p.id,
        name: p.name,
        x,
        y,
        w: p.w,
        h: p.h,
        cols: p.cols,
        rows: p.rows,
        slots: [],
      };
      p.entries.forEach((entry, i) => {
        const col = i % p.cols;
        const r = Math.floor(i / p.cols);
        rack.slots.push({
          entry,
          col,
          row: r,
          x: x + RACK_PAD + col * SLOT_W + (SLOT_W - TAPE_W) / 2,
          y: y + RACK_TOP + r * ROW_H + (ROW_H - PLANK - TAPE_H),
        });
      });
      racks.push(rack);
      x += p.w + RACK_GAP;
    }
    y += Math.max(...row.map((p) => p.h)) + ROW_GAP;
  }

  const height = y - ROW_GAP + BOTTOM_AREA;
  const counter: Box = { x: 70, y: height - 170, w: 250, h: 60 };
  const computer: Box = { x: counter.x + counter.w - 74, y: counter.y - 38, w: 52, h: 46 };
  const spawn = { x: Math.round(width / 2), y: height - 70 };

  const solids: Box[] = [
    { x: 0, y: 0, w: width, h: WALL_H + 8 },
    { x: 0, y: 0, w: WALL_SIDE, h: height },
    { x: width - WALL_SIDE, y: 0, w: WALL_SIDE, h: height },
    { x: 0, y: height - WALL_BOTTOM, w: width, h: WALL_BOTTOM },
    counter,
    ...racks.map((r) => ({ x: r.x - 4, y: r.y, w: r.w + 8, h: r.h })),
  ];

  return { width, height, racks, counter, computer, spawn, solids };
}
