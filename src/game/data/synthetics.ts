import type { Synthetic } from './types';
import { MORE_SYNTHETICS } from './synthetics2';

const TREE = 'The Target Tree: psychoactive botanicals by receptor (rebuild, 16 Sep 2026)';

/**
 * Lab-made and semi-synthetic substances (and drugs that began as plant alkaloids).
 *  */
const CORE: Synthetic[] = [
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
];

export const SYNTHETICS: Synthetic[] = [...CORE, ...MORE_SYNTHETICS];
