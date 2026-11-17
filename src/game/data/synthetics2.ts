import type { Synthetic, Timing } from './types';

const SUPP = 'The Target Tree: Supplement A, synthetics and familiar botanicals (17 Nov 2026)';

type Input = Omit<Synthetic, 'kind' | 'sources' | 'timing' | 'risks'> & {
  timing?: Timing;
  risks?: string[];
};

const syn = (e: Input): Synthetic => ({
  kind: 'synthetic',
  timing: {},
  risks: [],
  sources: [SUPP],
  ...e,
});

/** Manufactured and semi-synthetic compounds, grouped by what they act on. */
export const MORE_SYNTHETICS: Synthetic[] = [
  // ───────────────────────────── Visionary ─────────────────────────────
  syn({
    id: 'lsd',
    name: 'LSD',
    aka: ['Lysergic acid diethylamide', 'Acid'],
    chemicalClass: 'lysergamide (ergoline)',
    synthesis: 'semi-synthetic',
    aisle: 'Visionary',
    summary:
      'The best-known classic psychedelic. Made from lysergic acid, the same fungal-alkaloid family as the Argyreia and ryegrass-endophyte chemistry, with very long-lasting perceptual and cognitive effects.',
    origin: {
      story:
        'Semi-synthetic, made from lysergic acid, which comes from ergot alkaloids. An oral LSD formulation (MM120, which trade press now calls DT120 after MindMed became Definium Therapeutics) has reported three positive phase 3 readouts per trade press, for anxiety and depression.',
    },
    effects: ['perceptual changes', 'cognitive changes'],
    timing: { notes: 'Very long duration.' },
    toxicity: 'moderate',
    toxicityNotes:
      'No classic physical dependence, but real psychological risk in vulnerable people.',
    risks: [
      'rapid tolerance',
      'psychological risk in vulnerable people',
      'unpredictable in unsupervised settings',
    ],
    evidence: 'A',
    evidenceNotes: '5-HT2A agonist, with broad activity at other serotonin and dopamine receptors.',
  }),
  syn({
    id: 'dmt',
    name: 'DMT',
    aka: ['N,N-dimethyltryptamine'],
    chemicalClass: 'tryptamine',
    aisle: 'Visionary',
    summary:
      'A very short, intense perceptual compound found in many plants and in trace amounts in mammals. It is orally inactive on its own, because gut and liver MAO-A destroy it.',
    origin: {
      story:
        'Found in many plants and in trace amounts in mammals; also made synthetically. The reason ayahuasca pairs a DMT leaf with an MAO-inhibiting vine.',
    },
    effects: ['intense perceptual changes'],
    timing: { notes: 'Very short.' },
    toxicity: 'moderate',
    risks: ['intensity', 'disorientation'],
    evidence: 'A',
    evidenceNotes: '5-HT2A agonist; also sigma-1 and TAAR1 activity.',
  }),
  syn({
    id: '5-meo-dmt',
    name: '5-MeO-DMT',
    chemicalClass: 'tryptamine',
    aisle: 'Visionary',
    summary: 'A brief, often non-visual "dissolution"-type psychedelic.',
    origin: {
      story:
        'Found in the secretion of the Sonoran Desert toad (Incilius alvarius) and in trace amounts in some Anadenanthera and Virola; also made synthetically.',
    },
    effects: ['brief dissolution-type states', 'often non-visual'],
    timing: { notes: 'Brief.' },
    toxicity: 'moderate',
    risks: [
      'the toad is a wildlife-conservation problem',
      'CYP2D6 converts it to bufotenine, the loop described under Anadenanthera',
    ],
    evidence: 'A',
    evidenceNotes: 'Strongest at 5-HT1A, with 5-HT2A also engaged.',
  }),
  syn({
    id: '2c-b',
    name: '2C-B',
    chemicalClass: 'phenethylamine',
    aisle: 'Visionary',
    summary: 'A stimulant-tinged psychedelic that is frequently mis-sold.',
    origin: {
      by: 'Alexander Shulgin',
      story:
        'A Shulgin phenethylamine from the 1970s. "Pink cocaine" in the UK press is usually a mixture that can include ketamine, MDMA and 2C-B, with no cocaine.',
    },
    effects: ['psychedelic', 'stimulant-tinged'],
    toxicity: 'moderate',
    risks: ['narrow quality-control margin', 'frequently mis-sold'],
    evidence: 'A',
    evidenceNotes: '5-HT2A partial agonist.',
  }),
  syn({
    id: 'nbome',
    name: 'NBOMe series',
    aka: ['25I-NBOMe'],
    chemicalClass: 'N-benzyl phenethylamine',
    aisle: 'Visionary',
    summary:
      'Extremely potent 5-HT2A agonists with a documented fatal-overdose record, often sold on blotter as LSD.',
    origin: { story: 'A family of N-benzyl phenethylamines.' },
    effects: ['psychedelic'],
    toxicity: 'severe',
    toxicityNotes: 'A documented fatal-overdose and vasoconstriction/seizure record.',
    risks: [
      'fatal overdoses',
      'vasoconstriction and seizures',
      'often sold on blotter as LSD',
      'tiny active quantities leave very little margin for error',
    ],
    evidence: 'A',
    evidenceNotes: 'Extremely potent 5-HT2A agonists.',
  }),
  syn({
    id: 'psilocin-prodrugs-and-lsd-analogues',
    name: 'Psilocin prodrugs and LSD analogues',
    aka: ['4-AcO-DMT', '4-HO-MET', '1P-LSD'],
    chemicalClass: 'tryptamine and lysergamide derivatives',
    aisle: 'Visionary',
    summary: '"Legal-high era" derivatives that act as prodrugs of psilocin or LSD.',
    origin: {
      story: 'Derivatives from the "legal-high era" that act as prodrugs of psilocin or LSD.',
    },
    effects: ['psychedelic (via psilocin or LSD)'],
    toxicity: 'unknown',
    evidence: 'B',
    evidenceNotes: 'Act as prodrugs of psilocin or LSD.',
  }),

  // ───────────────────────────── Stimulants ─────────────────────────────
  syn({
    id: 'mdma',
    name: 'MDMA',
    chemicalClass: 'substituted phenethylamine (entactogen)',
    aisle: 'Stimulants',
    summary: 'The best-known entactogen: a serotonin-dominant monoamine releaser.',
    origin: {
      year: 1912,
      by: 'Merck',
      story:
        'Synthetic phenethylamine, first patented by Merck around 1912-14. The FDA issued a complete response letter rejecting MDMA-assisted therapy for PTSD on 9 Aug 2024; the sponsor (now Resilient Pharmaceuticals) resubmitted the application in Aug 2026 without a new phase 3 trial. Not approved.',
    },
    effects: ['entactogen'],
    toxicity: 'high',
    risks: [
      'hyperthermia',
      'hyponatraemia (too much water)',
      'a post-use mood low',
      'ongoing debate over serotonergic neurotoxicity',
    ],
    evidence: 'A',
    evidenceNotes:
      'Releases monoamines via SERT, DAT and NET, serotonin most of all, with some 5-HT2A action.',
  }),
  syn({
    id: 'amphetamine-and-methamphetamine',
    name: 'Amphetamine and methamphetamine',
    chemicalClass: 'substituted amphetamine',
    aisle: 'Stimulants',
    summary:
      'Stimulants used medically for ADHD (amphetamine salts, lisdexamfetamine) and narcolepsy. Methamphetamine is the more neurotoxic and more addictive of the two.',
    origin: { story: 'Synthetic stimulants, used medically for ADHD and narcolepsy.' },
    effects: ['stimulant'],
    toxicity: 'high',
    risks: ['dependence', 'cardiovascular strain', 'psychosis at high or prolonged use'],
    evidence: 'A',
    evidenceNotes:
      'TAAR1 agonism, with VMAT2 and DAT reversal giving dopamine and noradrenaline release.',
  }),
  syn({
    id: 'methylphenidate',
    name: 'Methylphenidate',
    aka: ['Ritalin'],
    chemicalClass: 'piperidine stimulant',
    aisle: 'Stimulants',
    summary: 'A prescription stimulant with a "study drug" reputation.',
    origin: { story: 'A prescription stimulant medicine.' },
    effects: ['stimulant', 'focus'],
    toxicity: 'moderate',
    risks: ['appetite loss', 'sleep disruption', 'cardiovascular effects'],
    evidence: 'A',
    evidenceNotes: 'A DAT/NET reuptake inhibitor: a blocker, not a releaser.',
  }),
  syn({
    id: 'cathinones',
    name: 'Synthetic cathinones',
    aka: ['mephedrone', 'MDPV', '3-MMC', 'bath salts'],
    chemicalClass: 'cathinone',
    aisle: 'Stimulants',
    summary: 'Synthetic derivatives of the khat alkaloid cathinone.',
    origin: {
      story:
        'Synthetic derivatives of the khat alkaloid cathinone. Behind the "bath salts" and "legal highs" scare of 2009-2015.',
    },
    effects: ['stimulant'],
    toxicity: 'high',
    risks: ['compulsive redosing', 'psychosis', 'heart strain'],
    evidence: 'A',
    evidenceNotes: 'Mixtures of releaser and reuptake-blocker activity, varying by compound.',
  }),
  syn({
    id: 'modafinil',
    name: 'Modafinil',
    aka: ['Provigil', 'Modalert'],
    chemicalClass: 'eugeroic (wakefulness-promoting agent)',
    synthesis: 'synthetic',
    aisle: 'Stimulants',
    summary: 'A prescription wakefulness drug.',
    origin: {
      year: 1976,
      by: 'Lafon Laboratories, France',
      story:
        'Found while studying adrafinil, which the body turns into modafinil. Approved in France in 1994 and in the US in 1998.',
    },
    effects: ['wakefulness', 'focus'],
    toxicity: 'low',
    risks: ['headaches', 'insomnia', 'rare skin reactions'],
    interactions: ['makes hormonal birth control less effective'],
    evidence: 'A',
    evidenceNotes:
      'Weak DAT inhibition plus wake-promoting orexin and histamine effects; the mechanism is not fully settled.',
  }),

  // ───────────────────────────── Dissociatives ─────────────────────────────
  syn({
    id: 'ketamine',
    name: 'Ketamine',
    chemicalClass: 'arylcyclohexylamine',
    synthesis: 'synthetic',
    aisle: 'Dissociatives',
    summary: 'A synthetic anaesthetic that works as a dissociative at lower levels.',
    origin: {
      story:
        'A synthetic arylcyclohexylamine anaesthetic from the 1960s. The S-enantiomer (esketamine) is licensed in some regions as a nasal spray for treatment-resistant depression.',
    },
    effects: ['dissociation'],
    toxicity: 'high',
    risks: [
      'bladder and urinary-tract damage with heavy use',
      'dependence',
      'the real mortality risk is mostly from mixing with other depressants',
    ],
    evidence: 'A',
    evidenceNotes:
      'An NMDA-receptor channel blocker (PCP site), with activity at opioid and HCN1 channels.',
  }),
  syn({
    id: 'pcp-and-ketamine-analogues',
    name: 'PCP and ketamine analogues',
    aka: ['phencyclidine', 'methoxetamine', 'diphenidine', 'ephenidine', 'methoxphenidine'],
    chemicalClass: 'arylcyclohexylamines and related dissociatives',
    aisle: 'Dissociatives',
    summary:
      'PCP (phencyclidine) is an NMDA antagonist. Methoxetamine, diphenidine, ephenidine, methoxphenidine and similar compounds are "dissociative designer drugs".',
    origin: {
      story:
        'PCP is the original dissociative. The designer analogues followed; several ketamine analogues have been detected in UK drug markets.',
    },
    effects: ['dissociation'],
    toxicity: 'high',
    risks: ['designer analogues have little published human data'],
    evidence: 'B',
    evidenceNotes: 'PCP and the analogues are NMDA antagonists.',
  }),
  syn({
    id: 'dxm',
    name: 'Dextromethorphan',
    aka: ['DXM'],
    chemicalClass: 'morphinan',
    aisle: 'Dissociatives',
    summary: 'A cough-suppressant ingredient that is an NMDA antagonist at high levels.',
    origin: { story: 'A common ingredient in cough medicines.' },
    effects: ['dissociation'],
    toxicity: 'moderate',
    risks: [
      'serotonin syndrome with MAOIs and some antidepressants',
      'combination cold and flu products carry other drugs',
    ],
    evidence: 'A',
    evidenceNotes:
      'NMDA antagonist via its metabolite dextrorphan, plus sigma-1 and weak SERT inhibition.',
  }),
  syn({
    id: 'nitrous-oxide',
    name: 'Nitrous oxide',
    aka: ['laughing gas'],
    chemicalClass: 'inorganic gas',
    aisle: 'Dissociatives',
    summary:
      'A simple gas used as an anaesthetic and food propellant, with a brief euphoric, dissociative effect.',
    origin: { story: 'A simple gas used as an anaesthetic and as a food propellant.' },
    effects: ['brief euphoria', 'dissociation'],
    timing: { notes: 'Brief.' },
    toxicity: 'moderate',
    risks: [
      'inactivates vitamin B12, which can cause nerve damage (myeloneuropathy) with heavy use',
      'oxygen displacement (hypoxia)',
    ],
    evidence: 'A',
    evidenceNotes: 'NMDA antagonism plus opioid-system effects.',
  }),

  // ───────────────────────────── Calm & Sedation ─────────────────────────────
  syn({
    id: 'benzodiazepines',
    name: 'Benzodiazepines',
    aka: ['diazepam', 'Valium', 'alprazolam', 'Xanax', 'designer benzodiazepines'],
    chemicalClass: 'benzodiazepine',
    aisle: 'Calm & Sedation',
    summary:
      'Prescribed sedative-anxiolytics, plus "designer" analogues sold outside medicine. They work on the most crowded mechanism in pharmacology, the GABA-A benzodiazepine site.',
    origin: {
      story:
        'Prescribed medicines (diazepam, alprazolam) alongside designer analogues such as bromazolam, clonazolam, flubromazolam, diclazepam and etizolam.',
    },
    effects: ['sedation', 'anxiolysis'],
    toxicity: 'high',
    risks: [
      'dependence',
      'dangerous withdrawal',
      'blackouts',
      'counterfeit "Valium" or "Xanax" pills may contain very potent analogues',
    ],
    interactions: ['opioids', 'alcohol'],
    evidence: 'A',
    evidenceNotes: 'Positive allosteric modulation of the GABA-A benzodiazepine site.',
  }),
  syn({
    id: 'ghb',
    name: 'GHB, GBL and 1,4-butanediol',
    aka: ['GHB', 'GBL', '1,4-BD'],
    chemicalClass: 'GABA-B agonist and prodrugs',
    aisle: 'Calm & Sedation',
    summary: 'A very steep line separates the effect from unconsciousness.',
    origin: { story: 'GBL and 1,4-butanediol are prodrugs of GHB.' },
    effects: ['sedation', 'euphoria'],
    toxicity: 'severe',
    risks: [
      'a very steep line between "effect" and unconsciousness',
      'severe dependence',
      'severe withdrawal',
    ],
    evidence: 'A',
    evidenceNotes: 'GABA-B agonism and a dedicated GHB receptor; GBL and 1,4-BD are prodrugs.',
  }),
  syn({
    id: 'gabapentinoids-and-z-drugs',
    name: 'Gabapentinoids and Z-drugs',
    aka: ['gabapentin', 'pregabalin', 'zolpidem', 'zopiclone'],
    chemicalClass: 'α2δ ligands and GABA-A modulators',
    aisle: 'Calm & Sedation',
    summary:
      'Prescribed medicines that appear in misuse data, usually alongside opioids. Gabapentinoids bind the α2δ calcium-channel subunit; Z-drugs act at GABA-A.',
    origin: { story: 'Prescribed medicines for nerve pain, seizures and sleep.' },
    effects: ['sedation'],
    toxicity: 'moderate',
    risks: ['misuse, usually alongside opioids'],
    interactions: ['opioids'],
    evidence: 'A',
  }),
  syn({
    id: 'phenibut',
    name: 'Phenibut',
    chemicalClass: 'GABA-B agonist',
    aisle: 'Calm & Sedation',
    summary: 'Sold as a "nootropic/anxiolytic" supplement.',
    origin: { story: 'Sold as a "nootropic/anxiolytic" supplement.' },
    effects: ['anxiolysis', 'sedation'],
    toxicity: 'high',
    risks: ['rapid tolerance', 'a harsh withdrawal'],
    evidence: 'B',
    evidenceNotes: 'GABA-B agonist plus α2δ activity.',
  }),

  // ───────────────────────────── Opioids ─────────────────────────────
  syn({
    id: 'fentanyl',
    name: 'Fentanyl',
    chemicalClass: 'synthetic opioid',
    synthesis: 'synthetic',
    aisle: 'Opioids',
    summary:
      "A μ-opioid agonist roughly fifty to a hundred times morphine's potency, with a narrow margin that contaminates street supply.",
    origin: { story: 'A synthetic opioid, now best known for contaminating street drug supply.' },
    effects: ['analgesia', 'sedation'],
    toxicity: 'severe',
    risks: ['a narrow margin between effect and overdose', 'contaminates street supply'],
    evidence: 'A',
    evidenceNotes: 'A μ-opioid agonist.',
  }),
  syn({
    id: 'nitazenes',
    name: 'Nitazenes',
    aka: ['isotonitazene', 'protonitazene'],
    chemicalClass: 'synthetic opioid family',
    aisle: 'Opioids',
    summary:
      'A family of synthetic opioids, some more potent than fentanyl, that reappeared in drug markets.',
    origin: {
      story:
        'First studied in the 1950s and never marketed; reappeared in drug markets. The UK government stated at least 400 deaths were linked to nitazenes since June 2023.',
    },
    effects: ['analgesia', 'sedation'],
    toxicity: 'severe',
    risks: ['some are more potent than fentanyl', 'deaths linked to nitazenes'],
    evidence: 'A',
    evidenceNotes: 'μ-opioid agonists.',
  }),
  syn({
    id: 'orphines',
    name: 'Orphines',
    chemicalClass: 'synthetic opioid class',
    aisle: 'Opioids',
    summary:
      'A new class of highly potent synthetic opioids that emerged in the UK market in spring 2026.',
    origin: {
      story:
        'Emerged in the UK market in spring 2026. The UN drugs office recorded 206 reports of orphine-containing samples from 2024 to April 2026.',
    },
    effects: ['analgesia', 'sedation'],
    toxicity: 'severe',
    risks: ['highly potent', 'a new class with minimal published data'],
    evidence: 'B',
  }),
  syn({
    id: 'tramadol-methadone-buprenorphine',
    name: 'Tramadol, methadone and buprenorphine',
    chemicalClass: 'pharmaceutical opioids',
    aisle: 'Opioids',
    summary:
      'Pharmaceutical opioids: tramadol (a μ-agonist plus serotonin and noradrenaline reuptake inhibition), and methadone and buprenorphine, which are treatment medicines.',
    origin: { story: 'Pharmaceutical opioids used for pain and for opioid-dependence treatment.' },
    effects: ['analgesia', 'sedation'],
    toxicity: 'high',
    risks: ['opioid dependence', 'respiratory depression'],
    evidence: 'A',
  }),
  syn({
    id: 'tianeptine',
    name: 'Tianeptine',
    aka: ['Stablon', 'Coaxil'],
    chemicalClass: 'atypical antidepressant',
    aisle: 'Opioids',
    summary:
      'An atypical antidepressant prescribed in some countries (such as France), notorious in the US as "gas station heroin".',
    origin: {
      story:
        'Prescribed as an atypical antidepressant in some countries, e.g. France as Stablon or Coaxil.',
    },
    effects: ['antidepressant', 'opioid-like effects at higher doses'],
    toxicity: 'high',
    risks: ['opioid-type dependence', 'withdrawal', 'overdose has been reported in the US'],
    evidence: 'B',
    evidenceNotes: 'μ-opioid agonism at higher doses; also PPAR and glutamatergic effects.',
  }),
  syn({
    id: 'xylazine',
    name: 'Xylazine',
    aka: ['tranq'],
    chemicalClass: 'α2-adrenergic agonist (veterinary sedative)',
    aisle: 'Opioids',
    summary: 'A veterinary sedative that is not an opioid, so naloxone does not reverse it.',
    origin: {
      story: 'An α2-adrenergic agonist veterinary sedative. Linked to severe skin ulceration.',
    },
    effects: ['sedation'],
    toxicity: 'high',
    risks: ['severe skin ulceration', 'not reversed by naloxone'],
    evidence: 'B',
    evidenceNotes: 'An α2-adrenergic agonist, not an opioid.',
  }),

  // ───────────────────────────── Cannabis-Like ─────────────────────────────
  syn({
    id: 'synthetic-cannabinoids',
    name: 'Synthetic cannabinoids',
    aka: ['Spice', 'K2', 'JWH-018', 'MDMB-4en-PINACA'],
    chemicalClass: 'synthetic cannabinoid receptor agonists',
    aisle: 'Cannabis-Like',
    summary:
      'Full CB1 agonists, unlike THC\'s partial agonism. Sprayed onto plant material, put in vape liquids, and used to adulterate "herbal" products.',
    origin: {
      story:
        'Used to adulterate "herbal" products; in the blue-lotus entry, 65 toxicology cases involved synthetic cannabinoids.',
    },
    effects: ['intense cannabinoid effects'],
    toxicity: 'severe',
    risks: ['unpredictable potency', 'seizures', 'psychosis', 'deaths'],
    evidence: 'A',
    evidenceNotes: 'Full CB1 agonists.',
  }),
  syn({
    id: 'hhc',
    name: 'HHC and HHCP',
    aka: ['hexahydrocannabinol'],
    chemicalClass: 'hexahydro cannabinoids',
    synthesis: 'semi-synthetic',
    aisle: 'Cannabis-Like',
    summary: 'Semi-synthetic THC-like compounds sold as "legal" cannabis alternatives.',
    origin: {
      story: 'Made from hemp-derived CBD by chemical conversion and sold as cannabis alternatives.',
    },
    effects: ['cannabis-like'],
    toxicity: 'unknown',
    evidence: 'B',
    evidenceNotes: 'Hexahydro derivatives are structurally THC-like.',
  }),

  // ───────────────────────────── Deliriants ─────────────────────────────
  syn({
    id: 'diphenhydramine',
    name: 'Diphenhydramine',
    chemicalClass: 'first-generation antihistamine',
    aisle: 'Deliriants',
    summary:
      'A household antihistamine. Taken far beyond its labelled use, the effect is delirium and hallucinations that are unpleasant and not a pleasant altered state.',
    origin: { story: 'A common over-the-counter antihistamine.' },
    effects: ['delirium', 'hallucinations (far beyond labelled use)'],
    toxicity: 'high',
    risks: ['unpleasant delirium', 'cardiac toxicity'],
    evidence: 'A',
    evidenceNotes:
      'H1 antagonism plus strong muscarinic antagonism: the same toxidrome as the nightshades.',
  }),

  // ───────────────────────────── Lab Spin-offs ─────────────────────────────
  syn({
    id: 'salvinorin-analogues',
    name: 'Salvinorin analogues',
    aka: ['herkinorin', 'RB-64'],
    chemicalClass: 'neoclerodane diterpene derivatives',
    synthesis: 'semi-synthetic',
    aisle: 'Lab Spin-offs',
    summary:
      'Semi-synthetic derivatives of salvinorin A or B that show the neoclerodane scaffold can be steered between targets.',
    origin: {
      story:
        'Herkinorin is a μ-opioid agonist; RB-64 is a G-protein-biased KOR agonist. They echo the Salvia splendens note on which part of the scaffold is load-bearing.',
    },
    effects: ['research compounds'],
    toxicity: 'unknown',
    evidence: 'B',
  }),
  syn({
    id: 'ibogaine-analogues',
    name: 'Ibogaine analogues',
    aka: ['18-MC', 'tabernanthalog'],
    chemicalClass: 'ibogaine-derived compounds',
    synthesis: 'semi-synthetic',
    aisle: 'Lab Spin-offs',
    summary:
      "Built to keep ibogaine's anti-craving and plasticity effects without the hERG/QT liability that is iboga's main catch.",
    origin: {
      story:
        '18-MC is an α3β4 nicotinic antagonist; tabernanthalog is a designed ibogaine analogue.',
    },
    effects: ['research compounds'],
    toxicity: 'unknown',
    evidence: 'B',
  }),
  syn({
    id: 'non-hallucinogenic-ergolines',
    name: 'Non-hallucinogenic ergolines',
    aka: ['lisuride', '2-bromo-LSD'],
    chemicalClass: 'ergoline',
    aisle: 'Lab Spin-offs',
    summary: "Ergoline relatives that lack LSD's perceptual effects.",
    origin: { story: 'Ergoline relatives of LSD.' },
    effects: ['no perceptual effects'],
    toxicity: 'unknown',
    evidence: 'B',
  }),
];
