import { BOTANICALS } from './botanicals';
import { SYNTHETICS } from './synthetics';
import type { Entry } from './types';

export const CATALOGUE: readonly Entry[] = [...BOTANICALS, ...SYNTHETICS];

export type * from './types';
