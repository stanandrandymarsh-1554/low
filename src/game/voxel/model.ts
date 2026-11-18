import { hashString } from '../aisles';
import type { Entry } from '../data/types';
import { FORMS, plinth, type Form, type Pal } from './forms';
import { rng, VoxelGrid } from './grid';
import { guessHue, guessLook, tint } from './guess';
import { LOOKS, type Look } from './looks';

export function lookFor(entry: Entry): Look {
  return LOOKS[entry.id] ?? guessLook(entry);
}

export function formFor(entry: Entry): Form {
  return lookFor(entry)[0];
}

/** The little voxel sculpture for an entry: the herb itself, or the isolated compound. */
export function buildModel(entry: Entry): VoxelGrid {
  const hand = LOOKS[entry.id];
  const [form, a, b, c] = hand ?? guessLook(entry);
  // Entries nobody drew by hand get their plant colours nudged, so neighbours don't match.
  const shift = hand || entry.kind !== 'botanical' ? 0 : guessHue(entry);
  const def = FORMS[form];
  const g = new VoxelGrid();
  plinth(g);
  const pal: Pal = {
    a: g.color(a ?? tint(def.colors[0], shift)),
    b: g.color(b ?? tint(def.colors[1], shift)),
    c: g.color(c ?? def.colors[2]),
  };
  def.draw(g, pal, rng(hashString(entry.id)));
  return g;
}
