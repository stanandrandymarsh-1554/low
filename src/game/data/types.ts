/**
 * The shape of every entry in the store's catalogue.
 *
 * Two kinds of "tape" sit on the shelves:
 *  - `botanical`: a plant, fungus or other natural source, with the compounds it contains.
 *  - `synthetic`: a lab-made (or semi-synthetic) substance, with where it came from.
 *
 * See DATA.md in the repo root for a filled-in template.
 */

/** How dangerous the substance is, shown as the coloured "rating" sticker on the tape. */
export type Toxicity = 'low' | 'moderate' | 'high' | 'severe' | 'unknown';

export const TOXICITY_LEVELS: readonly Toxicity[] = [
  'low',
  'moderate',
  'high',
  'severe',
  'unknown',
];

/**
 * How strong the evidence is, shown as the A-D sticker on the tape.
 *  A: controlled human data, or a well-characterised human-active compound
 *  B: animal / in-vitro pharmacology with an identified active compound
 *  C: traditional reputation, compound identified, activity unconfirmed
 *  D: reputation only: investigated and nothing found, or never investigated
 */
export type Evidence = 'A' | 'B' | 'C' | 'D';

export const EVIDENCE_TIERS: Record<Evidence, string> = {
  A: 'Controlled human data, or a well-characterised human-active compound with published binding and functional data.',
  B: 'Animal or in-vitro pharmacology with an identified active compound.',
  C: 'Traditional reputation, compound identified, activity unconfirmed.',
  D: 'Reputation only: investigated and nothing found, or never investigated.',
};

/** A [min, max] range. Use the same number twice for a single value. */
export type Range = readonly [min: number, max: number];

export interface Timing {
  /** Minutes until effects are first felt. */
  onsetMinutes?: Range;
  /** Minutes from dose to peak. */
  peakMinutes?: Range;
  /** Hours from onset until effects have mostly worn off. Leave out if the sources don't say. */
  totalHours?: Range;
  /** Hours of lingering after-effects, if any. */
  afterHours?: Range;
  /** Anything that doesn't fit the numbers, e.g. "varies a lot with route". */
  notes?: string;
}

/** A compound found in a botanical. */
export interface CompoundContent {
  name: string;
  /** Percent by dry weight, as a [min, max] range. Leave out if unknown. */
  percent?: Range;
  /** Which part of the plant, e.g. "root bark", "seeds". */
  part?: string;
  notes?: string;
}

interface EntryBase {
  /** Unique, lowercase, kebab-case. Used for links between entries. */
  id: string;
  /** Display name, e.g. "Coffee" or "Modafinil". */
  name: string;
  /** Other names people search for: common names, brand names, slang. */
  aka?: string[];
  /** Which aisle it is shelved in, e.g. "Stimulants". Aisles are created from these. */
  aisle: string;
  /** One or two sentences for the back of the box. */
  summary: string;
  /** Short effect tags, e.g. ["alertness", "euphoria"]. These drive effect search. */
  effects: string[];
  timing: Timing;
  toxicity: Toxicity;
  /** Why it got that rating. */
  toxicityNotes?: string;
  risks: string[];
  /** Dangerous combinations. */
  interactions?: string[];
  /** Doses as reported: traditional use, studies, self-experiments. Say who and in what setting. */
  doses?: { amount: string; context: string }[];
  /** Ways it is (or was traditionally) taken. */
  routes?: string[];
  evidence?: Evidence;
  /** What the evidence rating is based on, including caveats. */
  evidenceNotes?: string;
  /** For entries whose reputation doesn't hold up: what people say, and what the record shows. */
  myth?: { reputation: string; finding: string };
  /** How it acts in the body: receptors, transporters, enzymes, as far as the sources say. */
  mechanism?: string;
  /** Where the info came from (URLs, books, papers). */
  sources?: string[];
  /** Mark placeholder entries so they are easy to find and remove. */
  sample?: boolean;
}

export interface Botanical extends EntryBase {
  kind: 'botanical';
  /** Scientific name, e.g. "Coffea arabica". Leave out for extracts with no single species. */
  latin?: string;
  family?: string;
  /** Where it grows / where it is from. */
  region?: string;
  partsUsed?: string[];
  compounds: CompoundContent[];
  /** Traditional or historical use. */
  history?: string;
}

export interface Synthetic extends EntryBase {
  kind: 'synthetic';
  /** Chemical class, e.g. "phenethylamine", "benzodiazepine". */
  chemicalClass: string;
  /** Fully synthetic, or made from a natural precursor. */
  synthesis?: 'synthetic' | 'semi-synthetic';
  /** Leave out when the sources don't say where it came from. */
  origin?: {
    year?: number;
    /** Person, lab or company. */
    by?: string;
    /** Where it came from: who made it, why, and what happened next. */
    story: string;
  };
}

export type Entry = Botanical | Synthetic;
