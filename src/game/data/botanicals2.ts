import type { Botanical } from './types';

const TREE = 'The Target Tree: psychoactive botanicals by receptor (rebuild, 16 Sep 2026)';
const RANK =
  'Ethnobotanical pharmacology: consolidated ranking (handover v3 + Rätsch sweep), 4 Oct 2026';

const UBULAWU =
  'cold-water root froth, drunk then vomited (ubulawu, a complex of several unrelated plants)';

export const MORE: Botanical[] = [
  // ───────────────────────────── Dreams ─────────────────────────────
  {
    kind: 'botanical',
    id: 'calea-zacatechichi',
    name: 'Calea zacatechichi',
    aka: ['Dream herb', 'Zacatechichi', 'Calea ternifolia'],
    latin: 'Calea ternifolia (syn. C. zacatechichi)',
    family: 'Asteraceae',
    region: 'Mexico and Central America',
    partsUsed: ['leaf'],
    aisle: 'Dreams',
    summary:
      'A Mexican dream herb with better human data than almost any other oneirogen: a 1986 double-blind trial against placebo and diazepam.',
    compounds: [
      {
        name: 'Germacranolide sesquiterpene lactones and chromenes',
        part: 'leaf',
        notes:
          'No CNS target identified; their published pharmacology is cytotoxic, antileishmanial and antihyperglycaemic. The claim that caleicine is a eugenol prodrug traces to an uncited wiki paragraph.',
      },
    ],
    effects: ['vivid dreams', 'hypnagogic imagery', 'sedation'],
    timing: {},
    routes: ['tea (leaf)', 'smoked'],
    toxicity: 'unknown',
    toxicityNotes: 'Large doses give salivation, ataxia, retching and vomiting.',
    risks: ['salivation', 'ataxia', 'retching and vomiting at large doses'],
    evidence: 'C',
    evidenceNotes:
      'The tree rates it B, the ranking document C. Mayagoitia 1986 (double-blind): more dreams than placebo and more than diazepam; subjects reporting more than one dream per session were always on Calea. EEG showed more slow-wave sleep and apparently less REM, so the vendor claim of "more light sleep, less SWS" inverts the paper. The human arm used organic extracts, not tea; what reached significance in healthy volunteers was slower reaction time and time-lapse estimation. A 2016 mouse study found only analgesia; a 2021 rodent paper reports more hippocampal activity in REM, contradicting the REM decrease.',
    sources: [TREE, RANK],
  },
  {
    kind: 'botanical',
    id: 'agara',
    name: 'Agara',
    aka: ['Galbulimima belgraveana'],
    latin: 'Galbulimima belgraveana',
    region: 'Papua New Guinea',
    partsUsed: ['bark'],
    aisle: 'Dreams',
    summary:
      'An unidentified hallucinogen inside a 40-alkaloid family that also produced an approved drug. Reported to give deep sleep with visions.',
    compounds: [
      {
        name: 'Himbacine',
        part: 'bark',
        notes:
          'Cardioselective M2 muscarinic antagonist; the lead for vorapaxar, an approved PAR-1 antagonist.',
      },
      {
        name: 'Other alkaloids',
        part: 'bark',
        notes:
          '40+ alkaloids in four structural classes. The psychoactive principle is unidentified.',
      },
    ],
    effects: ['deep sleep with visions', 'euphoria', 'drowsiness'],
    timing: {},
    routes: ['bark chewed with Homalomena ereriba leaves', 'bark tea'],
    toxicity: 'unknown',
    toxicityNotes: 'Toxicity unknown.',
    risks: ['tremors', 'pinpoint pupils (miosis)'],
    evidence: 'C',
    evidenceNotes:
      'Reported effects only, with essentially no ethnopharmacological follow-up. M2 antagonism raises acetylcholine release, directionally the same as acetylcholinesterase inhibition, which is why it sits in the dream branch.',
    sources: [TREE],
  },
  {
    kind: 'botanical',
    id: 'synaptolepis-kirkii',
    name: 'Uvuma-omhlope',
    aka: ['Synaptolepis kirkii', 'African dream root'],
    latin: 'Synaptolepis kirkii',
    family: 'Thymelaeaceae',
    partsUsed: ['root'],
    aisle: 'Dreams',
    summary:
      'A dream plant whose isolated actives are diterpene orthoesters, not alkaloids. Sold alongside Silene undulata as African dream root, but they are different plants.',
    compounds: [
      {
        name: 'Kirkinine and kirkinines B-E',
        part: 'root',
        notes: 'Daphnane-type diterpene orthoesters, neurotrophic in a neuronal-viability assay.',
      },
      {
        name: 'Other daphnanes',
        part: 'root',
        notes: 'Synaptolepis factor K7, excoecariatoxin, yuanhuadine, 12β-acetoxyhuratoxin.',
      },
    ],
    effects: ['dream enhancement (reputed)'],
    timing: {},
    routes: [UBULAWU],
    toxicity: 'moderate',
    toxicityNotes: 'Daphnanes are skin irritants and tumour promoters.',
    risks: ['skin irritation', 'tumour promotion (daphnane class)'],
    evidence: 'B',
    evidenceNotes:
      'Secondary sources garble the kirkinine potency figures badly enough that the primary paper is needed before quoting a number. Related daphnanes (resiniferatoxin, prostratin) activate PKC and TRPV1.',
    sources: [TREE],
  },
  {
    kind: 'botanical',
    id: 'silene-undulata',
    name: 'Silene undulata',
    aka: ['African dream root', 'Ubulawu (one of several plants)'],
    latin: 'Silene undulata',
    family: 'Caryophyllaceae',
    region: 'Southern Africa',
    partsUsed: ['root'],
    aisle: 'Dreams',
    summary:
      'Either an unflagged MAO inhibitor sold as a dream herb, or a case of a misassigned spectral library. The question is open.',
    compounds: [
      {
        name: 'β-carbolines (norharman, harmalol, harmaline, harmine)',
        part: 'root',
        notes:
          'Reported in a 2024 LC-MS/MS screen of 51 compounds. The same list included ibogaine, which is almost certainly a library misassignment, so the whole identification is discounted pending replication.',
      },
      {
        name: 'Triterpenoid saponins',
        part: 'root',
        notes:
          'Possible prodrugs: in Polygala, onjisaponin B cannot cross the blood-brain barrier but its metabolite tenuifolin does.',
      },
    ],
    effects: ['vivid dreams (reputed)'],
    timing: {},
    routes: [UBULAWU],
    toxicity: 'unknown',
    risks: [
      'If the β-carbolines are real, this is an MAO inhibitor sold freely as a dream herb with no interaction warnings',
    ],
    evidence: 'C',
    evidenceNotes:
      'The pharmacology claim rests on docking, which is not binding affinity and cannot tell agonist from antagonist, so "5-HT2A agonist" is unsupported by the method.',
    sources: [TREE, RANK],
  },

  // ───────────────────────────── Mind & Mood ─────────────────────────────
  {
    kind: 'botanical',
    id: 'kanna',
    name: 'Kanna',
    aka: ['Sceletium', 'Sceletium tortuosum'],
    latin: 'Sceletium tortuosum',
    family: 'Aizoaceae',
    region: 'Southern Africa',
    aisle: 'Mind & Mood',
    summary:
      'The best receptor numbers on the shelf: mesembrine is a very potent serotonin-reuptake inhibitor in the lab, but it is largely removed by first-pass metabolism before it reaches the brain.',
    compounds: [
      {
        name: 'Mesembrine',
        notes:
          'SERT Ki 1.4 nM; functional IC50 27 nM against 5-HT uptake; about 10 µM at NET; no DAT activity at 10 µM. A ~5500-fold gap between SERT and PDE4 potency.',
      },
      {
        name: 'Mesembrenone',
        notes: 'The dual agent: about 17-fold gap between SERT and PDE4 potency.',
      },
      {
        name: 'Total alkaloids',
        percent: [0.35, 7],
        notes:
          'Zembrin is 0.35-0.45% (deliberately low mesembrine); another material is 7% total and about 50% mesembrine.',
      },
    ],
    effects: ['mood lift', 'relaxation'],
    timing: {
      notes: 'No timing data in the sources, and the effect tags are from general references.',
    },
    routes: ['oral', 'sublingual', 'chewed (traditional)'],
    toxicity: 'unknown',
    toxicityNotes: 'Not covered in the sources.',
    risks: [
      'which liver enzyme clears mesembrine is unknown, so interaction risk is unmapped',
      'chemotype varies widely between products',
    ],
    evidence: 'A',
    evidenceNotes:
      'Intestinal permeability exceeds caffeine\'s, yet oral plasma is below the limit of detection: the losing step is first-pass metabolism, which makes sublingual the better route. A 2023 meta-analysis of four trials (117 participants) found no separation from placebo on anxiety, and every human trial used the inverse chemotype. The Coetzee "releasing agent" paper measured expression, not function, in non-serotonergic cells.',
    sources: [TREE, RANK],
  },
  {
    kind: 'botanical',
    id: 'mucuna-pruriens',
    name: 'Velvet bean',
    aka: ['Mucuna', 'Cowhage'],
    latin: 'Mucuna pruriens',
    family: 'Fabaceae',
    partsUsed: ['seed'],
    aisle: 'Mind & Mood',
    summary:
      "The actual Parkinson's molecule, L-DOPA, at 3-7% of the seed, without the carbidopa that makes it tolerable.",
    compounds: [
      {
        name: 'L-DOPA',
        percent: [3, 7],
        part: 'seed',
        notes: 'Rätsch gives 3-6%.',
      },
    ],
    effects: ['dopaminergic', 'nausea'],
    timing: {},
    routes: ['oral (seed)'],
    toxicity: 'moderate',
    toxicityNotes:
      'Without carbidopa, peripheral decarboxylation gives nausea and cardiovascular load rather than reward.',
    risks: ['nausea', 'cardiovascular load'],
    evidence: 'B',
    evidenceNotes:
      'Mechanistically unimpeachable, therapeutically crude. The one human report in Rätsch was taken alongside harmala seeds, so it tells you nothing.',
    sources: [TREE, RANK],
  },
  {
    kind: 'botanical',
    id: 'syrian-rue',
    name: 'Syrian rue',
    aka: ['Peganum harmala', 'Esfand', 'Harmal'],
    latin: 'Peganum harmala',
    family: 'Nitrariaceae',
    region: 'Middle East and Central Asia',
    partsUsed: ['seed', 'root', 'aerial parts'],
    aisle: 'Mind & Mood',
    summary:
      "Not a true rue. The seeds are close to a solid block of β-carbolines that inhibit MAO-A, so the plant's own effect is mostly tremor and nausea; its importance is what it stops the body clearing.",
    compounds: [
      {
        name: 'Harmine',
        percent: [4.3, 4.3],
        part: 'seed',
        notes:
          'Figures from one analysis; the total is also reported as 2-7% of dry seed weight. Competitive, reversible MAO-A inhibition (seed extract IC50 27 µg/L). Also inhibits DYRK1A (Kd about 82 µM).',
      },
      {
        name: 'Harmaline',
        percent: [5.6, 5.6],
        part: 'seed',
        notes: 'The standard laboratory tremorgen.',
      },
      { name: 'Harmalol', percent: [0.6, 0.6], part: 'seed' },
      { name: 'Tetrahydroharmine (THH)', percent: [0.1, 0.1], part: 'seed' },
      {
        name: 'Vasicine (peganine)',
        part: 'aerial parts',
        notes: 'Up to 78% reported; the parent of bromhexine (Bisolvon, 1966) and ambroxol.',
      },
    ],
    effects: ['MAO-A inhibition', 'tremor', 'nausea', 'ataxia'],
    timing: {},
    routes: ['smoke from burning seeds (traditional ritual use, Iran, Turkey and Central Asia)'],
    toxicity: 'severe',
    toxicityNotes:
      'Documented toxicity is severe. The β-carbolines contract uterine muscle directly. At a noticeable dose the intrinsic profile is tremor, nausea and ataxia.',
    risks: ['tremor', 'nausea', 'ataxia', 'uterine contraction', 'wide drug-interaction surface'],
    interactions: ['CYP1A2, CYP2C19, CYP3A4, CYP2B6, CYP2D6 and CYP2E1 substrates'],
    history:
      'Across Iran, Turkey and Central Asia the dominant use is burning the seeds as apotropaic smoke, at weddings, in shops and over newborns: probably the most widely practised ritual use of a psychoactive plant in the world by headcount, and almost none of it oral or intended to be psychoactive. The seeds also give the red in Turkish and Persian carpets. A screen found harmine drives human pancreatic beta-cell replication via DYRK1A.',
    evidence: 'A',
    evidenceNotes:
      'Impeccable chemistry, but the target is an enzyme, so there is no experience of its own, only whatever stops being cleared.',
    sources: [TREE, RANK],
  },
  {
    kind: 'botanical',
    id: 'ginkgo',
    name: 'Ginkgo',
    aka: ['Ginkgo biloba'],
    latin: 'Ginkgo biloba',
    family: 'Ginkgoaceae',
    aisle: 'Mind & Mood',
    summary:
      "The world's most consumed herbal is a genuine disinhibitor in the lab, but the effect is below the threshold of perception.",
    compounds: [
      {
        name: 'Ginkgolides',
        notes:
          'Selective, potent glycine-receptor antagonists (open channels are required for block); structurally similar to picrotoxinin.',
      },
      { name: 'Bilobalide', notes: 'The more potent GABA-A antagonist.' },
      {
        name: 'Ginkgotoxin',
        notes: 'A vitamin B6 antagonist; B6 is the cofactor for GABA synthesis.',
      },
    ],
    effects: ['wakefulness (mouse data)'],
    timing: {},
    toxicity: 'moderate',
    toxicityNotes: 'Ginkgotoxin has documented seizure cases.',
    risks: ['seizures (ginkgotoxin, through vitamin B6 antagonism)'],
    evidence: 'B',
    evidenceNotes:
      'Ginkgolide B dose-dependently increased wake and decreased NREM in mice without changing EEG power density, temperature or locomotion.',
    sources: [TREE, RANK],
  },

  // ───────────────────────────── Calm & Sedation ─────────────────────────────
  {
    kind: 'botanical',
    id: 'kava',
    name: 'Kava',
    aka: ['Piper methysticum', 'Awa', 'Yaqona'],
    latin: 'Piper methysticum',
    family: 'Piperaceae',
    region: 'Pacific islands',
    partsUsed: ['root'],
    aisle: 'Calm & Sedation',
    summary:
      'The only entry that passes chemistry, route and subjective profile together, with human trial support for anxiety.',
    compounds: [
      {
        name: 'Kavalactones',
        percent: [3, 20],
        part: 'root',
        notes: 'Na+ and Ca2+ channel blockade, GABA-A modulation, weak MAO-B inhibition.',
      },
    ],
    effects: ['calm', 'anxiolysis', 'relaxation'],
    timing: {},
    routes: ['oral (root drink)'],
    toxicity: 'moderate',
    toxicityNotes:
      'Liver-injury reports led to restrictions on kava in several countries around 2002. This is from general reference; the two main sources do not cover toxicity.',
    risks: ['liver injury reports'],
    evidence: 'B',
    sources: [TREE],
  },
  {
    kind: 'botanical',
    id: 'magnolia-bark',
    name: 'Magnolia bark',
    aka: ['Honokiol', 'Magnolol', 'Houpu'],
    latin: 'Magnolia officinalis',
    family: 'Magnoliaceae',
    partsUsed: ['bark'],
    aisle: 'Calm & Sedation',
    summary:
      'Honokiol and magnolol are benzodiazepine-site GABA-A modulators. Flumazenil completely abolishes the sleep-promoting effect of both, which is how the site is known.',
    compounds: [
      {
        name: 'Honokiol',
        part: 'bark',
        notes:
          'Shortens NREM latency and increases NREM with no effect on REM or EEG power density.',
      },
      {
        name: 'Magnolol',
        part: 'bark',
        notes:
          'Increases NREM and REM; raises c-Fos in the ventrolateral preoptic area and lowers it in the arousal-driving tuberomammillary nucleus.',
      },
    ],
    effects: ['sedation', 'anxiolysis (low doses)', 'sleep'],
    timing: {},
    toxicity: 'unknown',
    toxicityNotes: 'Not covered in the sources.',
    risks: ['motor slowing at higher doses'],
    evidence: 'B',
    evidenceNotes:
      'Dose sets the character: low occupancy gives anxiolysis, higher occupancy sedation and motor slowing, as with any benzodiazepine-site drug. A working sedative on the single most crowded mechanism in pharmacology.',
    sources: [TREE],
  },
  {
    kind: 'botanical',
    id: 'lagochilus',
    name: 'Lagochilus',
    aka: ['Lagochilus inebrians', 'Intoxicating mint'],
    latin: 'Lagochilus inebrians',
    family: 'Lamiaceae',
    region: 'Central Asia (Uzbekistan)',
    partsUsed: ['leaf'],
    aisle: 'Calm & Sedation',
    summary:
      'A mint in the same tribe as Leonotis and Leonurus, with a labdane diterpene (lagochilin) rather than an alkaloid. Sedative and hemostatic in animals; no receptor data.',
    compounds: [
      {
        name: 'Lagochilin',
        percent: [1, 17],
        part: 'leaf',
        notes:
          'A 9α,13-epoxylabdane tetraol (a diterpene alcohol; Rätsch wrongly calls it an alkaloid). Rätsch: up to 17% of leaf and about 3% on average; one isolation method gave about 1%.',
      },
    ],
    effects: ['sedation'],
    timing: {},
    toxicity: 'low',
    toxicityNotes: 'Mouse LD50 3.6 g/kg for the acetic ester.',
    risks: ['hemostatic (blood-clotting) activity in animals'],
    evidence: 'C',
    evidenceNotes:
      'A 2020 cholinesterase screen put a flavone ahead of lagochilin. Target uncharacterised.',
    sources: [RANK],
  },
  {
    kind: 'botanical',
    id: 'california-poppy',
    name: 'California poppy',
    aka: ['Eschscholzia californica'],
    latin: 'Eschscholzia californica',
    family: 'Papaveraceae',
    region: 'California',
    aisle: 'Calm & Sedation',
    summary: 'Sold in pharmacies as a sedative, with mouse sedative and anxiolytic data from 1991.',
    compounds: [
      {
        name: '(S)-Reticuline',
        notes: 'Modulates GABA-A α3 and α5 receptors in vitro.',
      },
    ],
    effects: ['sedation', 'anxiolysis', 'mild euphoria (smoked reports)'],
    timing: {},
    routes: ['smoked (reports)'],
    toxicity: 'unknown',
    toxicityNotes: 'Not covered in the sources.',
    risks: [],
    evidence: 'B',
    evidenceNotes: 'Not perceptual; human trials are thin.',
    sources: [RANK],
  },

  // ───────────────────────────── Cannabis-Like ─────────────────────────────
  {
    kind: 'botanical',
    id: 'wild-dagga',
    name: 'Wild dagga',
    aka: ["Lion's ear", 'Leonotis leonurus'],
    latin: 'Leonotis leonurus',
    family: 'Lamiaceae',
    region: 'Southern Africa',
    partsUsed: ['leaf'],
    aisle: 'Cannabis-Like',
    summary:
      'The "wild cannabis" claim is unsupported, but a failed claim is not an absence of pharmacology. The only entry where anyone has studied the traditional smoked route.',
    compounds: [
      {
        name: 'Leoleorin C',
        part: 'leaf',
        notes:
          'Sigma-1 Ki 2.9 µM: one Ki published out of 11 compounds screened. Roughly a thousandfold weaker than mesembrine at SERT or salvinorin A at KOR.',
      },
      { name: 'Marrubiin', part: 'leaf', notes: 'Antiplatelet mechanism.' },
    ],
    effects: ['anticonvulsant (animal data)', 'anxiolytic (zebrafish)'],
    timing: {},
    routes: ['smoked (traditional)'],
    toxicity: 'moderate',
    toxicityNotes:
      'Aqueous shoot extract killed rats at 3200 mg/kg, with significant haematological changes at far lower doses.',
    risks: ['haematological changes (animal data)'],
    myth: {
      reputation: '"Wild cannabis", with leonurine as the active.',
      finding:
        'The leonurine attribution is a genus mix-up with Leonurus; leonurine has never been found in L. leonurus. But the aqueous extract (200 and 400 mg/kg) protected 37.5% and 50% of mice from pentylenetetrazole seizures and delayed picrotoxin- and NMDA-induced seizures, but not bicuculline-induced ones, so the action is not at the GABA binding site. The widely repeated "inhibition at various CNS receptors" names no receptor: it comes from a 10 µM primary screen. A 2024 study profiled the smoke constituents with zebrafish assays.',
    },
    evidence: 'B',
    sources: [TREE, RANK],
  },
  {
    kind: 'botanical',
    id: 'siberian-motherwort',
    name: 'Siberian motherwort',
    aka: ['Leonurus sibiricus', 'Honeyweed'],
    latin: 'Leonurus sibiricus',
    family: 'Lamiaceae',
    aisle: 'Cannabis-Like',
    summary:
      'The strongest new lead from the Rätsch sweep: a cannabis-like reputation and a cluster of spirocyclic labdanes. Chemistry confirmed, pharmacology absent.',
    compounds: [
      {
        name: 'Leonurine',
        percent: [0.02, 0.04],
        notes: 'Rätsch lists it here, not under Leonotis.',
      },
      {
        name: 'Leosibiricin and related labdanes',
        notes:
          'Six new spirocyclic labdanes characterised by NMR (J Nat Prod, 2011). No receptor data found.',
      },
    ],
    effects: ['cannabis-like (reputed)'],
    timing: {},
    toxicity: 'unknown',
    toxicityNotes: 'Not covered in the sources.',
    risks: [],
    evidence: 'C',
    evidenceNotes:
      'Rätsch suggests leosibiricin "may" resemble salvinorin A; they are labdanes and salvinorin is a neoclerodane. Related extracts (L. cardiaca, L. japonicus) displace a GABA-site radioligand, but free GABA in the extract is the cheapest explanation.',
    sources: [RANK],
  },
  {
    kind: 'botanical',
    id: 'radula-liverwort',
    name: 'Radula liverworts',
    aka: ['Perrottetinene liverwort'],
    latin: 'Radula marginata (and relatives)',
    region: 'New Zealand (R. marginata); European R. complanata unresolved',
    aisle: 'Cannabis-Like',
    summary:
      'A real cannabinoid-like compound with real CB1 activity at trace concentration. Top of the tree as phytochemistry, bottom as a preparation.',
    compounds: [
      {
        name: 'cis-Perrottetinene',
        notes:
          'A bibenzyl cis-THC analogue with a benzyl side chain where cannabis uses pentyl. Trace quantities. Brain-penetrant; in animals it causes CB1-dependent hypothermia, catalepsy, hypolocomotion and analgesia, and lowers brain prostaglandins like 2-AG (Chicca et al., Science Advances 2018).',
      },
      {
        name: 'PET / PTD chemotypes',
        notes:
          'Across 75 collections at three North Island sites: one PTD-dominant (non-intoxicating), one PET-dominant (psychoactive branch), one mixed (Andre et al. 2025).',
      },
    ],
    effects: ['hypothermia (animal data)', 'analgesia (animal data)'],
    timing: {},
    toxicity: 'unknown',
    toxicityNotes: 'Not covered in the sources.',
    risks: [],
    history:
      'One of at least four independent evolutions of cannabinoid biosynthesis (alongside Cannabaceae, Helichrysum umbraculigerum and Rhododendron). R. visianica is Critically Endangered and was presumed extinct 1938-2014.',
    evidence: 'B',
    evidenceNotes:
      'Arithmetically the same shape as blue lotus (real compound, real receptor activity, irrelevant concentration) but opposite scientific significance. A population-level answer of yes, a specimen-level answer of maybe.',
    sources: [TREE, RANK],
  },
  {
    kind: 'botanical',
    id: 'damiana',
    name: 'Damiana',
    aka: ['Turnera diffusa'],
    latin: 'Turnera diffusa',
    aisle: 'Cannabis-Like',
    summary: 'A smoked "mild marijuana-like" herb with no identified active.',
    compounds: [
      {
        name: 'Apigenin',
        notes:
          'A flavone isolated from damiana; anxiolytic in mice. Flavones at the GABA-A benzodiazepine site are the only common thread (inference).',
      },
    ],
    effects: ['mild euphoria (reported)'],
    timing: { totalHours: [1, 1], notes: 'Smoked reports describe about 60 minutes.' },
    routes: ['smoked'],
    toxicity: 'unknown',
    toxicityNotes: 'Not covered in the sources.',
    risks: [],
    evidence: 'D',
    evidenceNotes: 'No controlled human trials of mood effects; effects are subtle.',
    sources: [TREE, RANK],
  },

  // ───────────────────────────── Poison Shelf ─────────────────────────────
  {
    kind: 'botanical',
    id: 'mad-honey',
    name: 'Mad honey',
    aka: ['Grayanotoxin honey'],
    latin: 'Rhododendron ponticum, R. luteum',
    family: 'Ericaceae',
    region: 'Black Sea region (ancient Pontus)',
    aisle: 'Poison Shelf',
    summary:
      'A category nothing else occupies: the plant is never eaten, bees carry its toxin into honey. A poisoning rather than an experience.',
    compounds: [
      {
        name: 'Grayanotoxin',
        notes: 'A non-nitrogenous diterpene acting at voltage-gated sodium channels, site II.',
      },
      {
        name: 'Daurichromenic acid',
        notes:
          'Rhododendron also makes cannabinoid-like meroterpenoids: two unrelated psychoactive chemistries in one genus.',
      },
    ],
    effects: ['intoxication', 'delirium'],
    timing: {},
    routes: ['honey (eaten)'],
    toxicity: 'high',
    toxicityNotes:
      'Xenophon (Anabasis, 401 BC, Pontus): those who ate a little were like very drunk people; those who ate much seemed crazy or dying. A 2025 emergency-department case describes the same syndrome.',
    risks: ['poisoning', 'incapacitation'],
    history:
      'Romans in the same region were later incapacitated and overrun after eating it: the earliest documented use of a psychoactive plant as a weapon.',
    evidence: 'B',
    sources: [TREE],
  },
  {
    kind: 'botanical',
    id: 'coriaria',
    name: 'Coriaria (shanshi)',
    aka: ['Coriaria thymifolia', 'Tutu'],
    latin: 'Coriaria ruscifolia subsp. microphylla (syn. C. thymifolia)',
    family: 'Coriariaceae',
    region: 'Ecuador and Colombia',
    partsUsed: ['fruit'],
    aisle: 'Poison Shelf',
    summary:
      'Fruits eaten for a "soaring through the air" feeling. The chemistry is a picrotoxane convulsant, and there are deaths on record.',
    compounds: [
      {
        name: 'Coriamyrtin',
        notes: 'A picrotoxane convulsant; mouse LD50 3 mg/kg i.p.',
      },
      { name: 'Tutin', notes: 'A picrotoxane and GABA-A antagonist.' },
    ],
    effects: ['"soaring through the air" sensation'],
    timing: {},
    routes: ['fruit (eaten)'],
    toxicity: 'severe',
    toxicityNotes:
      'Tutin poisoning causes giddiness, stupor, delirium and convulsions; deaths are on record.',
    risks: ['convulsions', 'delirium', 'death'],
    history:
      'Ecuador\'s shanshi, with a flying tradition, was studied as a "psychotomimetic" plant (Naranjo 1961). In New Zealand, tutin reaches honey through passion-vine hoppers feeding on Coriaria and bees collecting their honeydew: four organisms in the chain.',
    evidence: 'C',
    evidenceNotes:
      'Fits the picrotoxane cluster (picrotoxin, tutin, coriamyrtin; ginkgolides resemble picrotoxinin).',
    sources: [TREE, RANK],
  },
];
