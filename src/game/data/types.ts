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

/** A [min, max] range. Use the same number twice for a single value. */
export type Range = readonly [min: number, max: number];

export interface Timing {
  /** Minutes until effects are first felt. */
  onsetMinutes?: Range;
  /** Minutes from dose to peak. */
  peakMinutes?: Range;
  /** Hours from onset until effects have mostly worn off. */
  totalHours: Range;
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
  /** Legal status notes. Laws vary by country; say where. */
  legal?: string;
  /** Where the info came from (URLs, books, papers). */
  sources?: string[];
  /** Mark placeholder entries so they are easy to find and remove. */
  sample?: boolean;
}

export interface Botanical extends EntryBase {
  kind: 'botanical';
  /** Scientific name, e.g. "Coffea arabica". */
  latin: string;
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
  origin: {
    year?: number;
    /** Person, lab or company. */
    by?: string;
    /** Where it came from: who made it, why, and what happened next. */
    story: string;
  };
}

export type Entry = Botanical | Synthetic;
