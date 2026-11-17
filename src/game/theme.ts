import type { Toxicity } from './data/types';

/** The game is laid out on a fixed 960x540 stage, scaled to fit the window. */
export const W = 960;
export const H = 540;

export const FONT_HEAD = '"Press Start 2P", monospace';
export const FONT_BODY = 'VT323, monospace';

export const C = {
  black: '#07040f',
  wall: '#1a0f33',
  wallStripe: '#21143f',
  pink: '#ff3fa4',
  cyan: '#38f2ff',
  yellow: '#ffd23f',
  lime: '#9bff4a',
  orange: '#ff8a2a',
  red: '#ff3b3b',
  white: '#f4ecff',
  dim: '#8b7fb0',
  faint: '#4a3f6e',
  shelf: '#22307a',
  shelfEdge: '#4a62d8',
  shelfShadow: '#0d1240',
  carpet: '#120a24',
  crt: '#39ff7a',
  crtDim: '#1f8f48',
  crtBg: '#031a0c',
  plastic: '#0c0a14',
  card: '#140d26',
} as const;

export const TOXICITY_STYLE: Record<Toxicity, { color: string; short: string; long: string }> = {
  low: { color: '#4be37a', short: 'LOW', long: 'LOW TOXICITY' },
  moderate: { color: C.yellow, short: 'MOD', long: 'MODERATE TOXICITY' },
  high: { color: C.orange, short: 'HIGH', long: 'HIGH TOXICITY' },
  severe: { color: C.red, short: 'SEV', long: 'SEVERE TOXICITY' },
  unknown: { color: '#a59fc0', short: '?', long: 'TOXICITY UNKNOWN' },
};
