import type { Synthetic } from './types';

/**
 * Lab-made and semi-synthetic substances.
 * Entries marked `sample: true` are placeholders to show the format; replace them.
 */
export const SYNTHETICS: Synthetic[] = [
  {
    sample: true,
    kind: 'synthetic',
    id: 'modafinil',
    name: 'Modafinil',
    aka: ['Provigil', 'Modalert'],
    chemicalClass: 'eugeroic (wakefulness-promoting agent)',
    synthesis: 'synthetic',
    aisle: 'Stimulants',
    summary: 'A prescription wakefulness drug used for narcolepsy and shift-work sleep disorder.',
    origin: {
      year: 1976,
      by: 'Lafon Laboratories, France',
      story:
        'Found while studying adrafinil, which the body turns into modafinil. Approved in France in 1994 and in the US in 1998.',
    },
    effects: ['wakefulness', 'focus', 'reduced fatigue'],
    timing: { onsetMinutes: [30, 90], peakMinutes: [120, 240], totalHours: [10, 15] },
    toxicity: 'low',
    toxicityNotes: 'Low overdose risk, but rare serious skin reactions have been reported.',
    risks: ['insomnia', 'headache', 'anxiety', 'rare serious rash (SJS)'],
    interactions: ['makes hormonal birth control less effective'],
    legal: 'Prescription-only in most countries; Schedule IV in the US.',
  },
];
