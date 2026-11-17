import { hashString } from '../aisles';
import type { Entry } from '../data/types';
import { FORMS, plinth, type Form, type Pal } from './forms';
import { rng, VoxelGrid } from './grid';
import { LOOKS, type Look } from './looks';

/** What to draw for an entry that has no hand-picked look. */
export function fallbackLook(entry: Entry): Look {
  return entry.kind === 'botanical' ? ['sprig'] : ['molecule'];
}

export function lookFor(entry: Entry): Look {
  return LOOKS[entry.id] ?? fallbackLook(entry);
}

export function formFor(entry: Entry): Form {
  return lookFor(entry)[0];
}

/** The little voxel sculpture for an entry: the herb itself, or the isolated compound. */
export function buildModel(entry: Entry): VoxelGrid {
  const [form, a, b, c] = lookFor(entry);
  const def = FORMS[form];
  const g = new VoxelGrid();
  plinth(g);
  const pal: Pal = {
    a: g.color(a ?? def.colors[0]),
    b: g.color(b ?? def.colors[1]),
    c: g.color(c ?? def.colors[2]),
  };
  def.draw(g, pal, rng(hashString(entry.id)));
  return g;
}
