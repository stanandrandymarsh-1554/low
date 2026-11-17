import type { Botanical } from './types';
import { MYTHS } from './myths';
import { MORE } from './botanicals2';

const TREE = 'The Target Tree: psychoactive botanicals by receptor (rebuild, 16 Sep 2026)';
const RANK =
  'Ethnobotanical pharmacology: consolidated ranking (handover v3 + Rätsch sweep), 4 Oct 2026';

/** Plants, fungi and other natural sources. Figures come from the two uploaded sources unless an entry says otherwise. */
const CORE: Botanical[] = [
  // ───────────────────────────── Visionary ─────────────────────────────
  {
    kind: 'botanical',
    id: 'salvia-divinorum',
    name: 'Salvia divinorum',
    aka: ["Diviner's sage", 'Salvia'],
    latin: 'Salvia divinorum',
    family: 'Lamiaceae',
    region: 'Oaxaca, Mexico (Mazatec use)',
    partsUsed: ['leaf'],
    aisle: 'Visionary',
    summary:
      'The only known naturally occurring non-nitrogenous hallucinogen and the most potent natural hallucinogen by mass. Its active, salvinorin A, binds the kappa-opioid receptor, so the effect is short and intense but physiologically quiet.',
    compounds: [
      {
        name: 'Salvinorin A',
        percent: [0.09, 0.37],
        part: 'leaf',
        notes:
          'Plain leaf 0.89-3.70 mg/g; commercial "enhanced" extracts 13.0-53.2 mg/g. KOR Ki about 4 nM. At least 22 neoclerodanes in the plant; only salvinorin A has demonstrated activity.',
      },
    ],
    effects: ['hallucinations', 'disorientation', 'dissociation'],
    timing: {
      peakMinutes: [2, 2],
      totalHours: [0.25, 1 / 3],
      notes: 'Smoked: peaks around 2 minutes and is largely gone by 20.',
    },
    doses: [
      { amount: '200-500 µg salvinorin A', context: 'effective range cited for smoked leaf' },
    ],
    routes: ['smoked leaf', 'chewed fresh leaf (traditional Mazatec use)'],
    toxicity: 'low',
    toxicityNotes:
      'A Johns Hopkins double-blind ascending-dose study (16 inhaled doses) found no significant heart-rate or blood-pressure change and no adverse events. A 2026 systematic review found physiology largely stable and abuse potential low; kappa agonists are aversive rather than reinforcing. The cost is psychological.',
    risks: [
      'disorientation',
      'anxiety and distress in some people',
      'a large dose reaches the lung in seconds with no way to titrate',
    ],
    history:
      'Mazatec use. Open question: whether use of S. divinorum is itself post-conquest, since both Coleus species in the Mazatec grouping were introduced after the conquest.',
    evidence: 'A',
    evidenceNotes:
      'Double-blind human data. Salvia splendens has related neoclerodanes (salviarin, splenolide B, splendidin) that are inactive at opioid receptors, which shows the C-18/C-19 lactone is load-bearing.',
    sources: [TREE, RANK],
  },
  {
    kind: 'botanical',
    id: 'iboga',
    name: 'Iboga',
    aka: ['Tabernanthe iboga', 'Ibogaine root bark'],
    latin: 'Tabernanthe iboga',
    family: 'Apocynaceae',
    region: 'West Central Africa',
    partsUsed: ['root bark'],
    aisle: 'Visionary',
    summary:
      'Root bark with a continuous initiatory tradition and graded dosing. Its main alkaloid, ibogaine, hits many targets, each with published binding data, and it carries a real death count at very high doses.',
    compounds: [
      {
        name: 'Ibogaine',
        part: 'root bark',
        notes:
          'NMDA antagonist; kappa and mu opioid; SERT; α3β4 nicotinic antagonist; sigma-2. Content in root bark is vendor-declared and unverifiable.',
      },
      {
        name: 'Noribogaine',
        part: 'metabolite',
        notes: 'Made from ibogaine by CYP2D6; long half-life.',
      },
    ],
    effects: ['waking dream imagery', 'mild stimulation (low doses)', 'focus (low doses)'],
    timing: { notes: 'Noribogaine has a long half-life. No timing figures in the sources.' },
    doses: [
      {
        amount: '8 mg ibogaine tablets (Lambaréné)',
        context: 'France marketed an extract in the 1930s as a stimulant-tonic',
      },
      { amount: 'Low doses', context: 'traditionally for hunting, dancing and night work' },
      { amount: 'Flood doses', context: 'traditionally for initiation' },
    ],
    routes: ['oral (root bark)'],
    toxicity: 'severe',
    toxicityNotes:
      'hERG blockade and QT prolongation, with a genuine body of fatalities at flood dosing. CYP2D6 phenotype changes exposure substantially.',
    risks: [
      'QT prolongation (heart-rhythm failure)',
      'deaths recorded at flood doses',
      'exposure varies with CYP2D6 phenotype',
      'alkaloid content of root bark is unverified',
    ],
    interactions: [
      'Interaction list is not in the sources; QT-prolonging drugs and CYP2D6 inhibitors are the obvious concern (inference)',
    ],
    history:
      'A continuous, initiatory, documented tradition with graded doses. Ethnography and Western pharmacy point the same way, which almost nothing else in the catalogue can claim.',
    evidence: 'A',
    evidenceNotes:
      'Published binding data at every target it hits. A 2025 group built a 70-item Ibogaine Experience Scale because existing psychedelic scales miss its dream-like dimension.',
    sources: [TREE, RANK],
  },
  {
    kind: 'botanical',
    id: 'anadenanthera',
    name: 'Anadenanthera',
    aka: ['Yopo', 'Cebil', 'Vilca'],
    latin: 'Anadenanthera colubrina',
    region: 'South America',
    partsUsed: ['seed'],
    aisle: 'Visionary',
    summary:
      'Seeds behind the oldest direct evidence of psychoactive plant use in South America. Its main compound, bufotenine, strongly activates serotonin receptors but crosses the blood-brain barrier poorly, which makes the traditional routes interesting.',
    compounds: [
      { name: 'Bufotenine', part: 'seed', notes: 'Primary compound.' },
      { name: 'DMT', part: 'seed', notes: 'Trace.' },
      { name: '5-MeO-DMT', part: 'seed', notes: 'Trace.' },
    ],
    effects: ['hallucinations'],
    timing: {},
    routes: [
      'smoked (seed in bone pipes)',
      'snuffed',
      'chicha (fermented drink)',
      'enema (tubes found at Circumpuna)',
    ],
    toxicity: 'unknown',
    toxicityNotes: 'Not covered in the sources.',
    risks: [],
    history:
      'Anadenanthera colubrina seed in two bone pipes at Inca Cueva, radiocarbon-dated to 2130 BCE, with tryptamines confirmed chemically (smoking, not snuffing). A 2025 study of bone and shell tubes from Chavín de Huántar pushed the oldest Peruvian Andean evidence past 2,000 years. The Circumpuna tubes held coprostanol and human faecal matter alongside bufotenine.',
    evidence: 'A',
    evidenceNotes:
      'Bufotenine binds and activates 5-HT2A and 5-HT2C comparably to LSD, psilocin and 5-MeO-DMT; the open question is delivery, not receptor activity. Position 5 of the indole ring decides delivery: DMT (nothing) is orally inactive; bufotenine (hydroxyl) is poorly lipid-soluble; 5-MeO-DMT (methoxy) crosses easily and is far more potent. CYP2D6 converts 5-MeO-DMT back into bufotenine.',
    sources: [TREE, RANK],
  },
  {
    kind: 'botanical',
    id: 'hawaiian-baby-woodrose',
    name: 'Hawaiian baby woodrose',
    aka: ['HBWR', 'Argyreia nervosa', 'Elephant creeper'],
    latin: 'Argyreia nervosa',
    family: 'Convolvulaceae',
    region: 'Indian subcontinent',
    partsUsed: ['seed'],
    aisle: 'Visionary',
    summary:
      'Seeds carrying ergine (LSA), a weaker, sedation-dominant cousin of LSD. The alkaloids are made by a fungus living in the plant, so potency varies about threefold between seeds.',
    compounds: [
      {
        name: 'Ergine (LSA)',
        percent: [0.13, 0.44],
        part: 'seed',
        notes: 'Typical value about 0.14%. Isoergine is co-dominant.',
      },
      {
        name: 'LSH',
        percent: [0.035, 0.035],
        part: 'seed',
        notes:
          'About a tenth of LSD potency. Decomposes to ergine under aqueous and acid conditions, so it may be the real active principle.',
      },
      {
        name: 'Ergometrine',
        part: 'seed',
        notes: '10-16% of the alkaloid load.',
      },
    ],
    effects: ['weak hallucinations', 'sedation'],
    timing: {},
    doses: [
      {
        amount: '1-2 mg ergine, oral',
        context:
          'Hofmann\'s self-experiments, the only human data; he stopped at 2 mg, so a "low ceiling" may just mean nobody went higher',
      },
      {
        amount: '0.5-2 mg ergine, IM/SC',
        context:
          'relatively weak but significant hallucinogenic effects with marked sedation (Hofmann)',
      },
    ],
    routes: ['oral'],
    toxicity: 'moderate',
    toxicityNotes:
      'The seeds carry ergometrine alongside ergine, and alkaloid content varies about threefold within the species.',
    risks: [
      'sedation-dominant effects',
      'alkaloid content varies about threefold',
      'ergometrine content',
    ],
    history:
      'The alkaloids are produced by the fungus Periglandula living in the plant, the same kind of plant-plus-fungus chemistry as ergot and endophyte-infected ryegrass.',
    evidence: 'A',
    evidenceNotes:
      "Compound well characterised; human data is one chemist's unblinded self-experiments. LSA differs from LSD only at the amide group: LSD's two ethyls fill a lipophilic pocket at 5-HT2A, which tracks LSA's weak, sedating profile.",
    sources: [TREE, RANK],
  },
  {
    kind: 'botanical',
    id: 'peyote',
    name: 'Peyote',
    aka: ['Lophophora', 'Mescal button'],
    latin: 'Lophophora williamsii',
    family: 'Cactaceae',
    region: 'Chihuahuan Desert and adjacent Texas',
    partsUsed: ['crown ("button")'],
    aisle: 'Visionary',
    summary:
      'A small desert cactus whose mescaline has been found in specimens about 5,700 years old. Slow-growing and threatened; San Pedro carries the same alkaloid and grows fast.',
    compounds: [
      {
        name: 'Mescaline',
        part: 'button',
        notes:
          'Confirmed by GC-MS in the Shumla Cave buttons. It was the only alkaloid identified: the other tetrahydroisoquinolines degraded while the phenethylamine survived.',
      },
      {
        name: 'Total alkaloids',
        percent: [2, 2],
        part: 'archaeological buttons',
        notes: 'About 2% in the Shumla Cave specimens.',
      },
    ],
    effects: ['visual hallucinations', 'altered perception'],
    timing: {
      onsetMinutes: [30, 60],
      totalHours: [6, 12],
      notes: 'Timing is from general references, not the two main sources.',
    },
    routes: ['oral'],
    toxicity: 'unknown',
    toxicityNotes: 'Not covered in the sources.',
    risks: [],
    history:
      'Two mescal buttons from Shumla Cave No. 5, Texas, radiocarbon-dated to 3780-3660 BC, are among the oldest plant drugs to yield a major bioactive compound on analysis. They were aggregates of ground peyote mixed with other plant material and formed into flattened hemispheres: a compounded preparation. A later re-dating without humic-acid pretreatment gave materially younger numbers.',
    evidence: 'A',
    evidenceNotes: 'Mescaline is a well-characterised human-active compound.',
    sources: [TREE],
  },
  {
    kind: 'botanical',
    id: 'fly-agaric',
    name: 'Fly agaric',
    aka: ['Amanita muscaria'],
    latin: 'Amanita muscaria',
    family: 'Amanitaceae',
    partsUsed: ['cap'],
    aisle: 'Visionary',
    summary:
      'The conversion is the story: ibotenic acid, an excitotoxin, loses CO2 to become muscimol, a potent GABA-A agonist. Muscarine is present only in trace, despite the name.',
    compounds: [
      {
        name: 'Ibotenic acid',
        notes: 'NMDA agonist, excitotoxic. Decarboxylates to muscimol.',
      },
      {
        name: 'Muscimol',
        notes: 'Potent orthosteric GABA-A agonist; thermostable.',
      },
      { name: 'Muscarine', notes: 'Trace only.' },
    ],
    effects: ['sedation', 'dissociation', 'confusion'],
    timing: {
      notes:
        'No timing data in the sources, and the effect tags above are from general references: the two main sources describe mechanism only.',
    },
    routes: ['oral'],
    toxicity: 'moderate',
    toxicityNotes:
      'Ibotenic acid is an excitotoxin, and the ratio of ibotenic acid to muscimol in a given mushroom cannot currently be verified: both molecules are small and unstable, and commercial HPLC often fails to give repeatable results.',
    risks: ['unknown and unverifiable ibotenic acid content'],
    evidence: 'A',
    evidenceNotes:
      'Muscimol is a potent orthosteric GABA-A agonist and the conversion from ibotenic acid is well understood. What cannot yet be verified is how much of either a given mushroom holds.',
    sources: [TREE, RANK],
  },
];

export const BOTANICALS: Botanical[] = [...CORE, ...MORE, ...MYTHS];
