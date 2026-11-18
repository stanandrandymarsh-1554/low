import { BOTANICALS } from './botanicals';
import { buildCtl } from './ctl';
import { SYNTHETICS } from './synthetics';
import type { Entry } from './types';

/** The hand-written entries, then the rows of the pharmacology index. */
const CORE: readonly Entry[] = [...BOTANICALS, ...SYNTHETICS];

export const CATALOGUE: readonly Entry[] = [...CORE, ...buildCtl(CORE)];

export type * from './types';
