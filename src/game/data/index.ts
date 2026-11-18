import { BOTANICALS } from './botanicals';
import { buildCtl, ctlEntryIds } from './ctl';
import { applyPatches } from './patches';
import { SYNTHETICS } from './synthetics';
import type { Entry } from './types';

/** The hand-written entries, then the rows of the pharmacology index, then its evidence upgrade. */
const CORE: readonly Entry[] = [...BOTANICALS, ...SYNTHETICS];
const GENERATED = buildCtl(CORE);

export const CATALOGUE: readonly Entry[] = applyPatches(
  [...CORE, ...GENERATED],
  ctlEntryIds(CORE),
  new Set(GENERATED.map((e) => e.id)),
);

export type * from './types';
