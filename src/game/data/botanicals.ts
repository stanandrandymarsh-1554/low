import type { Botanical } from './types';

/**
 * Plants, fungi and other natural sources.
 * Entries marked `sample: true` are placeholders to show the format; replace them.
 */
export const BOTANICALS: Botanical[] = [
  {
    sample: true,
    kind: 'botanical',
    id: 'coffee',
    name: 'Coffee',
    aka: ['Arabica', 'Coffee bean'],
    latin: 'Coffea arabica',
    family: 'Rubiaceae',
    region: 'Native to Ethiopia; grown across the tropics',
    partsUsed: ['seeds ("beans")'],
    aisle: 'Stimulants',
    summary:
      "The world's most popular psychoactive plant. Roasted seeds are brewed into a drink that keeps people awake.",
    compounds: [
      { name: 'Caffeine', percent: [1.0, 1.5], part: 'seeds', notes: 'Robusta beans: ~2-2.7%' },
      { name: 'Trigonelline', percent: [0.6, 1.2], part: 'seeds' },
    ],
    effects: ['alertness', 'focus', 'wakefulness', 'mild euphoria'],
    timing: { onsetMinutes: [15, 45], peakMinutes: [30, 60], totalHours: [3, 6] },
    toxicity: 'low',
    toxicityNotes: 'Safe in normal amounts. Concentrated caffeine powders and pills can be lethal.',
    risks: ['anxiety', 'insomnia', 'racing heart', 'dependence with withdrawal headaches'],
    interactions: ['other stimulants'],
    history: 'Brewed in Yemen by the 15th century, then spread through the Ottoman Empire.',
  },
];
