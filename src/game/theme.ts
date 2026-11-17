import type { Evidence, Toxicity } from './data/types';

/** The game is laid out on a fixed 960x540 stage, scaled to fit the window. */
export const W = 960;
export const H = 540;

export const FONT_HEAD = '"Press Start 2P", monospace';
export const FONT_BODY = 'VT323, monospace';
/** Condensed capitals, like the black category boards over video-store shelves. */
export const FONT_SIGN = '"Bebas Neue", Impact, sans-serif';

/**
 * Warm 90s video-store palette: amber walls, honey wood, dark shelving, cream lettering.
 * (Names are by role: `accent` is the burnt-orange used for borders and highlights.)
 */
export const C = {
  black: '#14100c',
  accent: '#e2683b',
  teal: '#5fb3a8',
  sage: '#a7c957',
  gold: '#f2c14e',
  orange: '#e8892b',
  red: '#d94a3a',
  white: '#f6ecd5',
  dim: '#a39482',
  faint: '#5b4e42',
  crt: '#ffb43a',
  crtDim: '#a8691a',
  crtBg: '#150c02',
  plastic: '#0c0a08',
  card: '#1d1610',
} as const;

/** Dark, warm panel fill used behind HUD and menu text. */
export const PANEL = 'rgba(20,14,9,0.88)';

export const TOXICITY_STYLE: Record<Toxicity, { color: string; short: string; long: string }> = {
  low: { color: '#7cc866', short: 'LOW', long: 'LOW TOXICITY' },
  moderate: { color: C.gold, short: 'MOD', long: 'MODERATE TOXICITY' },
  high: { color: C.orange, short: 'HIGH', long: 'HIGH TOXICITY' },
  severe: { color: C.red, short: 'SEV', long: 'SEVERE TOXICITY' },
  unknown: { color: '#a89f94', short: '?', long: 'TOXICITY UNKNOWN' },
};

export const EVIDENCE_COLOR: Record<Evidence, string> = {
  A: C.sage,
  B: C.teal,
  C: C.gold,
  D: C.accent,
};
