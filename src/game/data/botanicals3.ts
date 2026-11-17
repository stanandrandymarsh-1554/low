import type { Botanical, Timing } from './types';

const SUPP = 'The Target Tree: Supplement A, synthetics and familiar botanicals (17 Nov 2026)';

type Input = Omit<Botanical, 'kind' | 'sources' | 'timing' | 'risks'> & {
  timing?: Timing;
  risks?: string[];
};

const bot = (e: Input): Botanical => ({
  kind: 'botanical',
  timing: {},
  risks: [],
  sources: [SUPP],
  ...e,
});

/** Familiar plants and fungi, from household stimulants to the everyday sedative herbs. */
export const FAMILIAR: Botanical[] = [
  // ───────────────────────────── Stimulants ─────────────────────────────
  bot({
    id: 'caffeine-plants',
    name: 'Coffee, tea and other caffeine plants',
    aka: ['coffee', 'tea', 'mate', 'guarana', 'cacao', 'kola'],
    latin:
      'Coffea spp., Camellia sinensis, Ilex paraguariensis, Paullinia cupana, Theobroma cacao, Cola nitida',
    aisle: 'Stimulants',
    summary:
      'The household stimulants: coffee, tea, mate (Ilex paraguariensis), guarana (high in caffeine), cacao (theobromine and some caffeine) and kola.',
    compounds: [
      {
        name: 'Caffeine',
        notes:
          'Adenosine A1/A2A receptor antagonist (blocks the sleepiness signal), with phosphodiesterase effects at high levels.',
      },
      { name: 'Theobromine', part: 'cacao', notes: 'Toxic to dogs.' },
      { name: 'L-Theanine', part: 'tea' },
    ],
    effects: ['alertness', 'focus', 'wakefulness'],
    toxicity: 'low',
    risks: ['sleep disruption', 'anxiety', 'tolerance', 'mild withdrawal headache'],
    evidence: 'A',
    evidenceNotes:
      'Adenosine antagonism is the well-characterised mechanism of the most widely used psychoactive drug.',
  }),
  bot({
    id: 'tobacco',
    name: 'Tobacco',
    aka: ['Nicotiana tabacum', 'mapacho (Nicotiana rustica)'],
    latin: 'Nicotiana tabacum, N. rustica',
    aisle: 'Stimulants',
    summary:
      'Among the most addictive mainstream drugs. Nicotine acts on the nicotinic receptors, the same branch as galantamine and cytisine.',
    compounds: [
      {
        name: 'Nicotine',
        notes:
          'Agonist at nicotinic acetylcholine receptors (α4β2 and α7). N. rustica has a much higher nicotine content than common tobacco.',
      },
    ],
    effects: ['stimulation', 'relaxation'],
    toxicity: 'high',
    toxicityNotes: 'The cancer burden comes from smoke, not from nicotine itself.',
    risks: ['among the most addictive mainstream drugs', 'smoke-related cancer'],
    evidence: 'A',
  }),
  bot({
    id: 'areca-nut',
    name: 'Areca nut',
    aka: ['betel', 'betel quid'],
    latin: 'Areca catechu',
    partsUsed: ['nut'],
    aisle: 'Stimulants',
    summary: 'Chewed by hundreds of millions of people, usually as a betel quid.',
    compounds: [
      {
        name: 'Arecoline',
        part: 'nut',
        notes: 'A muscarinic agonist with some nicotinic activity.',
      },
    ],
    effects: ['mild stimulation'],
    routes: ['chewed (the betel quid)'],
    toxicity: 'high',
    toxicityNotes: 'Classified by IARC as a human carcinogen.',
    risks: ['oral submucous fibrosis', 'oral cancer', 'the quid is often chewed with tobacco'],
    evidence: 'A',
  }),
  bot({
    id: 'khat',
    name: 'Khat',
    latin: 'Catha edulis',
    partsUsed: ['fresh leaf'],
    aisle: 'Stimulants',
    summary: 'A stimulant leaf whose active compound, cathinone, degrades as the leaf dries.',
    compounds: [
      {
        name: 'Cathinone',
        part: 'fresh leaf',
        notes:
          'Releases dopamine and noradrenaline; degrades, so the fresh leaf is the active form.',
      },
      { name: 'Cathine', part: 'leaf', notes: 'A releaser of dopamine and noradrenaline.' },
    ],
    effects: ['stimulation'],
    routes: ['chewed fresh leaf'],
    toxicity: 'moderate',
    risks: ['cathinone degrades, so potency depends on freshness'],
    evidence: 'A',
  }),
  bot({
    id: 'coca',
    name: 'Coca',
    aka: ['coca leaf'],
    latin: 'Erythroxylum coca',
    partsUsed: ['leaf'],
    aisle: 'Stimulants',
    summary:
      'Chewing or tea made from the whole leaf delivers a small amount of alkaloid and is a long-standing Andean tradition. Extracted cocaine is a very different drug.',
    compounds: [
      {
        name: 'Cocaine',
        part: 'leaf',
        notes:
          'Blocks DAT, SERT and NET, and voltage-gated sodium channels (the local-anaesthetic action).',
      },
    ],
    effects: ['mild stimulation', 'mild numbing (local anaesthetic)'],
    routes: ['chewed leaf (traditional Andean use)', 'tea'],
    toxicity: 'moderate',
    risks: ['extracted cocaine is a very different drug from the whole leaf'],
    evidence: 'A',
  }),
  bot({
    id: 'ephedra',
    name: 'Ephedra',
    aka: ['ma huang'],
    latin: 'Ephedra sinica',
    aisle: 'Stimulants',
    summary:
      'Contains ephedrine and pseudoephedrine, which act as releasers and adrenergic agonists. Ephedrine is also a chemical precursor of methamphetamine.',
    compounds: [
      { name: 'Ephedrine', notes: 'Releaser and adrenergic agonist.' },
      { name: 'Pseudoephedrine', notes: 'Releaser and adrenergic agonist.' },
    ],
    effects: ['stimulation'],
    toxicity: 'high',
    risks: ['supplement use has caused heart attacks and strokes'],
    evidence: 'A',
  }),
  bot({
    id: 'yohimbe',
    name: 'Yohimbe',
    latin: 'Pausinystalia johimbe',
    aisle: 'Stimulants',
    summary:
      'Yohimbine is an α2-adrenergic antagonist that tends to raise anxiety and blood pressure.',
    compounds: [{ name: 'Yohimbine', notes: 'An α2-adrenergic antagonist.' }],
    effects: ['arousal'],
    toxicity: 'moderate',
    risks: ['tends to raise anxiety', 'raises blood pressure'],
    evidence: 'B',
  }),

  // ───────────────────────────── Opioids ─────────────────────────────
  bot({
    id: 'opium-poppy',
    name: 'Opium poppy',
    latin: 'Papaver somniferum',
    aisle: 'Opioids',
    summary:
      'The plant behind morphine and codeine. Raw plant material varies so widely in alkaloid content that poppy products have caused fatal overdoses.',
    compounds: [
      { name: 'Morphine', notes: 'A μ-opioid agonist.' },
      { name: 'Codeine', notes: 'Acts as a μ-opioid agonist via metabolism.' },
      { name: 'Thebaine', notes: 'A precursor for semi-synthetic opioids.' },
      { name: 'Noscapine and papaverine', notes: 'Act differently from the opioids.' },
    ],
    effects: ['analgesia', 'sedation', 'euphoria'],
    toxicity: 'severe',
    risks: [
      'respiratory depression',
      'alkaloid content in raw plant material is highly variable',
      'poppy products have caused fatal overdoses',
    ],
    evidence: 'A',
  }),
  bot({
    id: 'kratom',
    name: 'Kratom',
    latin: 'Mitragyna speciosa',
    aisle: 'Opioids',
    summary:
      'Low doses are stimulant-like and higher ones sedating. The minor alkaloid 7-hydroxymitragynine is a far stronger opioid agonist than the main one.',
    compounds: [
      {
        name: 'Mitragynine',
        notes: 'A partial μ-opioid agonist with adrenergic and serotonergic activity.',
      },
      {
        name: '7-Hydroxymitragynine (7-OH)',
        notes:
          'A much stronger μ-opioid agonist. A 2019 study found mitragynine is converted to 7-OH in human and mouse liver.',
      },
    ],
    effects: ['stimulant-like (low doses)', 'sedation (higher doses)'],
    toxicity: 'moderate',
    risks: [
      'dependence and withdrawal',
      'the 2026 US concern is about concentrated 7-OH and synthetic derivatives, not the raw leaf',
    ],
    evidence: 'B',
  }),

  // ───────────────────────────── Cannabis-Like ─────────────────────────────
  bot({
    id: 'cannabis',
    name: 'Cannabis',
    latin: 'Cannabis sativa',
    family: 'Cannabaceae',
    aisle: 'Cannabis-Like',
    summary:
      'The reference lineage for the finding that cannabinoid biosynthesis evolved at least four times. Terpenes and minor cannabinoids modify the experience.',
    compounds: [
      { name: 'Δ9-THC', notes: 'A CB1 partial agonist.' },
      {
        name: 'CBD',
        notes: 'Little direct CB1 agonism; acts through several other targets.',
      },
      { name: 'Terpenes and minor cannabinoids', notes: 'Modify the experience.' },
    ],
    effects: ['euphoria', 'relaxation'],
    toxicity: 'moderate',
    risks: [
      'psychosis risk in vulnerable people',
      'cannabinoid hyperemesis',
      'dependence in a minority of regular users',
      'potency drift in modern cultivars',
    ],
    evidence: 'A',
  }),

  // ───────────────────────────── Visionary ─────────────────────────────
  bot({
    id: 'psilocybin-mushrooms',
    name: 'Psilocybin mushrooms',
    aka: ['magic mushrooms', 'liberty cap', 'Psilocybe cubensis'],
    latin: 'Psilocybe cubensis, P. semilanceata, Panaeolus, Gymnopilus',
    aisle: 'Visionary',
    summary:
      'Fungi whose psilocybin is a prodrug of psilocin. The strongest modern human data of any plant-derived psychedelic.',
    compounds: [
      { name: 'Psilocybin', notes: 'A prodrug of psilocin.' },
      { name: 'Psilocin', notes: 'A 5-HT2A (and 5-HT1A/2C) agonist.' },
    ],
    effects: ['perceptual changes', 'altered mood'],
    toxicity: 'moderate',
    risks: [
      'anxiety',
      'challenging psychological experiences',
      'possible psychosis risk in predisposed people',
      'wild liberty caps are easy to misidentify; look-alike small brown mushrooms include seriously toxic species',
    ],
    history:
      'Synthetic psilocybin is the first classic psychedelic to reach an FDA filing: Compass Pathways completed its NDA for COMP360 in treatment-resistant depression on 9 Nov 2026, after two positive phase 3 trials, and a second sponsor (Usona) was reported to have an NDA complete as well. Not approved at the time of writing.',
    evidence: 'A',
    evidenceNotes:
      'Phase 3 trials of a synthetic psilocybin formulation in treatment-resistant depression reported positive results in 2025-2026.',
  }),
  bot({
    id: 'ayahuasca',
    name: 'Ayahuasca',
    aka: ['Banisteriopsis caapi', 'Psychotria viridis (chacruna)', 'Diplopterys cabrerana'],
    latin: 'Banisteriopsis caapi with Psychotria viridis or Diplopterys cabrerana',
    aisle: 'Visionary',
    summary:
      'A brew that pairs a DMT-bearing leaf with a β-carboline-bearing vine. The MAO inhibitor in the vine is what makes the DMT orally active.',
    compounds: [
      { name: 'DMT', part: 'leaf', notes: 'A 5-HT2A agonist; orally inactive alone.' },
      {
        name: 'Harmine, harmaline and tetrahydroharmine',
        part: 'vine',
        notes: 'Reversible MAO-A inhibitors; the same alkaloids as in Peganum.',
      },
    ],
    effects: ['visionary states', 'purging'],
    routes: ['brewed drink (traditional)'],
    toxicity: 'high',
    risks: [
      'dangerous interactions with SSRIs and other serotonergic drugs (serotonin syndrome)',
      'blood-pressure effects',
      'purging is part of the traditional experience',
    ],
    interactions: ['SSRIs and other serotonergic drugs'],
    history:
      'The best-known case of an ethnobotanical drug pairing. The same pattern underlies the jurema complex.',
    evidence: 'A',
  }),
  bot({
    id: 'san-pedro',
    name: 'San Pedro',
    aka: ['Echinopsis pachanoi', 'Echinopsis peruviana'],
    latin: 'Echinopsis pachanoi, E. peruviana',
    family: 'Cactaceae',
    aisle: 'Visionary',
    summary:
      'A mescaline cactus. Fast-growing San Pedro takes ecological pressure off slow, threatened peyote.',
    compounds: [{ name: 'Mescaline', notes: 'A 5-HT2A agonist.' }],
    effects: ['perceptual changes'],
    timing: { notes: 'Very long duration.' },
    toxicity: 'low',
    risks: ['nausea', 'very long duration'],
    evidence: 'A',
  }),
  bot({
    id: 'morning-glories',
    name: 'Morning glories',
    aka: ['ololiuqui', 'Ipomoea tricolor', 'Turbina corymbosa'],
    latin: 'Ipomoea tricolor, Turbina corymbosa',
    family: 'Convolvulaceae',
    partsUsed: ['seed'],
    aisle: 'Visionary',
    summary:
      'Seeds carrying ergoline alkaloids, including LSA: the same compound family as Hawaiian baby woodrose.',
    compounds: [{ name: 'LSA (ergine) and related ergolines', part: 'seed' }],
    effects: ['LSA-type effects'],
    toxicity: 'moderate',
    risks: ['ergoline alkaloids'],
    history:
      'Turbina corymbosa is the Aztec "ololiuqui", whose alkaloids Hofmann identified around 1959-60, helping him connect LSD to a plant-derived tradition.',
    evidence: 'A',
  }),
  bot({
    id: 'ergot',
    name: 'Ergot',
    latin: 'Claviceps purpurea',
    aisle: 'Poison Shelf',
    summary:
      'The fungus on rye that caused ergotism ("St Anthony\'s fire") and is the origin of LSD\'s lysergic acid.',
    compounds: [
      { name: 'Ergot alkaloids', notes: 'Potent vasoconstrictors.' },
      { name: 'Ergotamine', notes: 'A migraine medicine.' },
      { name: 'Ergometrine', notes: 'Used in obstetrics.' },
    ],
    effects: ['vasoconstriction'],
    toxicity: 'severe',
    risks: ['ergotism ("St Anthony\'s fire")', 'potent vasoconstriction'],
    history:
      'Ties directly to the tree\'s "fungal endophytes make much of the plant chemistry" finding: the same alkaloid class arrives by the same route in Argyreia and ryegrass.',
    evidence: 'A',
  }),

  // ───────────────────────────── Deliriants ─────────────────────────────
  bot({
    id: 'nightshade-deliriants',
    name: 'Nightshade deliriants',
    aka: ['Datura', "angel's trumpet", 'belladonna', 'henbane', 'mandrake'],
    latin:
      'Datura stramonium, Brugmansia spp., Atropa belladonna, Hyoscyamus niger, Mandragora officinarum',
    family: 'Solanaceae',
    aisle: 'Deliriants',
    summary:
      'Plants with a long witchcraft and poison history; mandrake and henbane have been in European herbals for centuries. They cause vivid, often indistinguishable-from-real hallucinations, amnesia and dangerous confusion.',
    compounds: [
      {
        name: 'Tropane alkaloids (atropine/hyoscyamine, scopolamine)',
        notes:
          'Muscarinic acetylcholine receptor antagonists: the opposite pole of the cholinergic dream branch.',
      },
    ],
    effects: ['delirium', 'vivid hallucinations', 'amnesia'],
    toxicity: 'severe',
    risks: [
      'classic toxidrome: hot, dry, flushed, dilated pupils, urinary retention, delirium, tachycardia',
      'alkaloid content varies enormously between plants and parts',
      'fatal poisonings and long hospital stays are a recurring feature of the history',
    ],
    history: 'Also the basis of the "witches\' ointment" tradition.',
    evidence: 'A',
  }),

  // ───────────────────────────── Calm & Sedation ─────────────────────────────
  bot({
    id: 'valerian',
    name: 'Valerian',
    latin: 'Valeriana officinalis',
    aisle: 'Calm & Sedation',
    summary: 'A supermarket and health-shop sleep herb with mixed clinical evidence.',
    compounds: [{ name: 'Valerenic acid', notes: 'Reputed GABA-A modulation.' }],
    effects: ['sedation', 'sleep aid (reputed)'],
    toxicity: 'low',
    evidence: 'C',
    evidenceNotes:
      'A 1995 binding study found extract displacement of a GABA radioligand was probably due only to free GABA. Clinical evidence for sleep is mixed.',
  }),
  bot({
    id: 'hops',
    name: 'Hops',
    latin: 'Humulus lupulus',
    family: 'Cannabaceae',
    aisle: 'Calm & Sedation',
    summary:
      'A sedative and sleep-promoting reputation, with studies pointing at GABA-A activity of hop compounds. Humulus is the closest relative of Cannabis.',
    compounds: [{ name: 'Hop compounds', notes: 'Studies point at GABA-A activity.' }],
    effects: ['sedation', 'sleep promotion'],
    toxicity: 'low',
    evidence: 'B',
  }),
  bot({
    id: 'passionflower',
    name: 'Passionflower',
    latin: 'Passiflora incarnata',
    aisle: 'Calm & Sedation',
    summary: 'A mild anxiolytic herb.',
    compounds: [{ name: 'Chrysin and apigenin', notes: 'Flavones with GABAergic activity.' }],
    effects: ['mild anxiolysis'],
    toxicity: 'low',
    evidence: 'C',
    evidenceNotes:
      'The persistent claim that it contains meaningful MAO-inhibiting harmala alkaloids is unconfirmed either way.',
  }),
  bot({
    id: 'lavender',
    name: 'Lavender',
    latin: 'Lavandula angustifolia',
    aisle: 'Calm & Sedation',
    summary:
      'A linalool-rich oil. Standardised oral lavender oil has controlled-trial support for anxiety in some European medicine markets.',
    compounds: [{ name: 'Linalool', notes: 'The main compound of the oil.' }],
    effects: ['calming', 'anxiolysis'],
    toxicity: 'low',
    evidence: 'A',
    evidenceNotes: 'Controlled trials for anxiety.',
  }),
  bot({
    id: 'ashwagandha',
    name: 'Ashwagandha',
    latin: 'Withania somnifera',
    aisle: 'Calm & Sedation',
    summary: 'Withanolides with GABA-mimetic and cortisol-lowering claims; mild sedation.',
    compounds: [{ name: 'Withanolides' }],
    effects: ['mild sedation'],
    toxicity: 'low',
    risks: ['rare liver injury'],
    evidence: 'C',
  }),

  // ───────────────────────────── Mind & Mood ─────────────────────────────
  bot({
    id: 'st-johns-wort',
    name: "St John's wort",
    latin: 'Hypericum perforatum',
    aisle: 'Mind & Mood',
    summary:
      'Effective for mild to moderate depression in a number of trials. The cleanest example of a "natural" product with a serious interaction surface.',
    compounds: [
      {
        name: 'Hyperforin',
        notes: 'Acts on monoamine reuptake and TRPC6 channels.',
      },
    ],
    effects: ['mood lift (mild to moderate depression)'],
    toxicity: 'moderate',
    toxicityNotes: 'A powerful inducer of the CYP3A4 enzyme and the P-glycoprotein transporter.',
    risks: [
      'lowers blood levels of many drugs, including some contraceptives and transplant medicines',
      'serotonin syndrome with SSRIs',
    ],
    interactions: ['SSRIs', 'some contraceptives', 'transplant medicines'],
    evidence: 'A',
  }),
];
