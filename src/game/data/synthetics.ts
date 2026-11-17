import type { Synthetic } from './types';

const TREE = 'The Target Tree: psychoactive botanicals by receptor (rebuild, 16 Sep 2026)';

/**
 * Lab-made and semi-synthetic substances (and drugs that began as plant alkaloids).
 * Entries marked `sample: true` are placeholders to show the format; replace them.
 */
export const SYNTHETICS: Synthetic[] = [
  {
    kind: 'synthetic',
    id: 'galantamine',
    name: 'Galantamine',
    aka: ['Reminyl', 'Razadyne'],
    chemicalClass:
      'Amaryllidaceae alkaloid; acetylcholinesterase inhibitor and nicotinic modulator',
    aisle: 'Dreams',
    summary:
      'The only proper randomised trial in the catalogue: a double-blind crossover in which 8 mg tripled lucid-dream rates, but only when combined with a technique.',
    origin: {
      story:
        'A natural alkaloid of the snowdrop family, now a licensed medicine. As a lucid-dreaming aid it was tested by LaBerge, LaMarca and Baird (PLOS ONE, 2018, n=121). The origin details here come from general reference, not the two main sources.',
    },
    effects: ['lucid dreaming', 'vivid dreams', 'increased dream recall', 'cognitive clarity'],
    timing: {
      notes:
        'In the trial it was taken about 4.5 hours after lights out, during 30 minutes out of bed, combined with the MILD technique. Bedtime dosing is counterproductive because the first half of the night is NREM-dominated.',
    },
    doses: [
      {
        amount: '4 mg',
        context: 'lucid dream rate 27% (placebo 14%; odds ratio 2.29)',
      },
      {
        amount: '8 mg',
        context:
          'lucid dream rate 42% (odds ratio 4.46); 57% had a lucid dream on at least one of two active nights',
      },
    ],
    routes: ['oral'],
    toxicity: 'moderate',
    toxicityNotes: 'Nausea and vomiting are common; bradycardia is on the label.',
    risks: ['nausea and vomiting', 'slow heart rate (bradycardia)'],
    evidence: 'A',
    evidenceNotes:
      'Double-blind crossover, n=121. It enhanced an existing practice rather than creating lucidity from nothing. Also raised dream recall, vividness, control, positive emotion and complexity.',
    sources: [TREE],
  },
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
  },
];
