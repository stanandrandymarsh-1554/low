import { normalize } from '../search';
import raw from './sources/pharmacology-index.json';
import type { Botanical, Entry, Evidence, Synthetic, Toxicity } from './types';

/**
 * The CrossTheLimits pharmacology index: 333 compounds, extracts and supplement ingredients.
 * The JSON in `sources/` is kept exactly as supplied; this file turns each row into a catalogue
 * entry. The rules are written down here so they can be reviewed and tested:
 *
 *  - Evidence tier A-D comes from the row's evidence level (see `evidenceTier`).
 *  - Toxicity comes from the row's cautions (see `toxicityOf`).
 *  - Reported doses are kept only where the row gives an amount; nothing is invented.
 *  - Anything about legal status, regulation, retail or labelling is dropped.
 */

interface RawCompound {
  id: string;
  name: string;
  category: string;
  target_or_receptor_profile: string;
  reported_effects: string;
  reported_dose_or_range: string;
  dose_basis: string;
  evidence_level: string;
  cautions: string;
  reference_urls: string[];
}

const COMPOUNDS = (raw as unknown as { compounds: RawCompound[] }).compounds;

const SOURCE = 'CrossTheLimits compound pharmacology index (research draft)';
const PLACEHOLDER = /placeholder pending further research/i;

/** Sentences about law, regulation or selling are left out of entries. */
const OFF_LIMITS =
  /\b(FDA|banned|illegal|legal|legality|controlled[- ]substance|schedule[ds]?|prohibit\w*|WADA|doping|grey[- ]market|black[- ]market|vendors?|retail|marketed|marketing|labels?|labell?ed|sold|purchase|buy|CTL)\b|prescription(?:-class| drug)/i;

/** Drops any sentence that is about law, regulation or selling. */
export function clean(text: string): string {
  // A bracketed aside about selling ("marketed as ...") is cut out rather than losing the sentence.
  const bare = text.replace(/\s*\([^()]*\)/g, (m) => (OFF_LIMITS.test(m) ? '' : m));
  return bare
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim() && !OFF_LIMITS.test(s))
    .join(' ')
    .trim();
}

function fragments(text: string): string[] {
  return text
    .split(/[;.]\s+|[;.]$/)
    .map((s) => s.trim())
    .filter((s) => s && !OFF_LIMITS.test(s));
}

/** The short display name, and other names people might search for. */
export function splitName(full: string): { name: string; aka: string[] } {
  const base = (full.split('(')[0]?.trim() ?? full).split(':')[0] ?? full;
  const name = (base.length > 42 ? (base.split(',')[0] ?? base) : base).trim();
  const aka: string[] = [];
  for (const m of full.matchAll(/\(([^()]*)\)/g)) {
    for (const part of (m[1] ?? '').split(/;|\s\/\s|,\s+/)) {
      const t = part.trim().replace(/^["']|["']$/g, '');
      if (
        t.length >= 2 &&
        t.length <= 60 &&
        !OFF_LIMITS.test(t) &&
        normalize(t) !== normalize(name)
      ) {
        aka.push(t);
      }
    }
  }
  return { name, aka: [...new Set(aka)].slice(0, 8) };
}

/** A species name found in the row's name, if there is one. */
export function latinOf(full: string): string | undefined {
  const inParens = [...full.matchAll(/\(([^()]*)\)/g)]
    .map((m) => m[1] ?? '')
    .flatMap((s) => s.split(/[,;/]/))
    .map((s) => s.trim());
  const binomial = /^[A-Z][a-z]{3,} [a-z]{4,}(?: (?:var\.|subsp\.) [a-z]{3,})?$/;
  const hit = inParens.find((s) => binomial.test(s));
  if (hit) return hit;
  const lead = full.split('(')[0]?.trim() ?? '';
  return /^[A-Z][a-z]{3,} [a-z]{3,}(?:um|us|is|ii|ae|i|a|ens)$/.test(lead) ? lead : undefined;
}

/**
 * A-D tier from the evidence level the index gives:
 *  A: established in humans, or backed by human trials
 *  B: limited human data, or animal / in-vitro pharmacology
 *  C: traditional or historical reputation only
 *  D: unestablished, unidentified, or anecdote
 */
export function evidenceTier(level: string, placeholder = false): Evidence {
  const l = level.toLowerCase();
  if (placeholder) return 'D';
  if (/unidentified|identity|mixture|uncertain composition|analytical detection/.test(l))
    return 'D';
  // "unestablished" alone means nothing is known; next to human or animal data it means "so far".
  if (
    /unestablished/.test(l) &&
    !/human|preclinical|animal|in vitro|traditional|historical|ethnobotanical/.test(l)
  ) {
    return 'D';
  }
  if (/no (modern )?human/.test(l)) return /historical|traditional/.test(l) ? 'C' : 'D';
  const strong =
    /(?<!un)established|human trials?|human rct|human metabolic trials?|human physiology|nutrient|nutrition/.test(
      l,
    );
  if (strong && !/low certainty|unproven|uncertain/.test(l)) return 'A';
  if (strong) return 'B';
  if (/human|clinical|preclinical|in vitro|animal|receptor|basic|biochemical|physiology/.test(l)) {
    return 'B';
  }
  if (/traditional|historical|ethnobotanical/.test(l)) return 'C';
  return 'D';
}

/** Toxicity rating from the cautions the index lists. */
export function toxicityOf(
  cautions: string,
  level: string,
  tier: Evidence,
  unknown = false,
): Toxicity {
  if (unknown) return 'unknown';
  const c = cautions.toLowerCase();
  // Nothing listed is reassuring only where there is human experience to list it from.
  if (!c.trim()) return tier !== 'D' && /human|nutri|established/i.test(level) ? 'low' : 'unknown';
  if (/\b(death|fatal|lethal)\b/.test(c)) return 'severe';
  if (
    /seizure|excitotox|neurotox|hypertensive crisis|arrhythmi|respiratory|dependence|narrow therapeutic|serious cardiovascular|serotonin toxicity/.test(
      c,
    )
  ) {
    return 'high';
  }
  if (
    /cardiovascular|cardiac|tachycardia|blood-pressure|hypertension|liver|serotonin|serotonergic|bleeding|thyroid|anxiety|panic|interaction|hormonal|endocrine|electrolyte|skin|cancer|toxicity|risk/.test(
      c,
    )
  ) {
    return 'moderate';
  }
  return 'low';
}

/** Short effect tags from a sentence like "Alertness, jitter; increased pulse and insomnia." */
export function effectTags(text: string): string[] {
  const tags = fragments(text)
    .flatMap((s) => s.split(/,\s+|\s+and\s+/))
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter((s) => s.length >= 3 && s.length <= 56)
    .map((s) => s.charAt(0).toLowerCase() + s.slice(1));
  return [...new Set(tags)].slice(0, 6);
}

const AMOUNT =
  /\d[\d.]*(?:\s*(?:[–-]|,|or|to)\s*\d[\d.]*)*\s*(?:mg|g|µg|μg|mcg|ug|iu|ml|kg|%)(?:\s*\/\s*(?:day|kg|d|dose))?/i;

/** A reported amount, where the index gives one (and says it is a reported exposure). */
export function doseOf(
  text: string,
  basis: string,
): { amount: string; context: string } | undefined {
  if (/^not established/i.test(basis)) return undefined;
  const sentence = clean(text);
  if (!sentence || /^no\b/i.test(sentence)) return undefined;
  const amount = AMOUNT.exec(sentence)?.[0];
  if (!amount) return undefined;
  return { amount: amount.replace(/\s+/g, ' ').trim(), context: sentence };
}

/** Which aisle each category is shelved in, and a short class label for the sheet. */
const CATEGORY: Record<string, { aisle: string; label: string }> = {
  'Synthetic stimulants, amines and xanthines': {
    aisle: 'Stimulants',
    label: 'stimulant amine or xanthine',
  },
  'Eugeroics, racetams and other synthetic nootropics': { aisle: 'Nootropics', label: 'nootropic' },
  'Peptides and drug-class compounds': {
    aisle: 'Hormones & Peptides',
    label: 'peptide or drug-class compound',
  },
  'Endocannabinoid-type and lipid signalling': {
    aisle: 'Cannabis-Like',
    label: 'endocannabinoid-type lipid',
  },
  'Sleep and calming compounds': { aisle: 'Calm & Sedation', label: 'calming compound' },
  'Metabolic, mitochondrial and "longevity" compounds': {
    aisle: 'Longevity & Metabolism',
    label: 'metabolic compound',
  },
  'Amino acids, choline donors and performance basics': {
    aisle: 'Amino Acids & Basics',
    label: 'amino acid or nutrient',
  },
  'Vitamins and minerals': { aisle: 'Amino Acids & Basics', label: 'vitamin or mineral' },
};
const UNIDENTIFIED = { aisle: 'Mystery Labels', label: 'unidentified formula' };

/** There are 140 botanicals, so they are split over two aisles by first letter. */
function botanicalAisle(name: string): string {
  return /^[a-k]/i.test(name) ? 'Herbs & Extracts A-K' : 'Herbs & Extracts L-Z';
}

function slug(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
      .replace(/-+$/g, '') || 'item'
  );
}

/** Rows that describe something already on the shelves under another name. */
const DUPLICATE_OF: Record<string, string> = {
  'ctl-030': 'ephedra',
  'ctl-217': 'kratom',
  'ctl-264': 'yohimbe',
  'ctl-042': 'modafinil',
  'ctl-213': 'kanna',
  'ctl-214': 'kava',
  'ctl-226': 'magnolia-bark',
};

export function mapCompound(r: RawCompound, id: string): Entry {
  const { name, aka } = splitName(r.name);
  const placeholder = PLACEHOLDER.test(r.cautions);
  const unidentified = /unidentified/i.test(r.evidence_level);
  const tier = evidenceTier(r.evidence_level, placeholder);
  const botanical = r.category === 'Botanicals';
  const cat = botanical
    ? { aisle: botanicalAisle(name), label: 'plant extract' }
    : unidentified
      ? UNIDENTIFIED
      : (CATEGORY[r.category] ?? { aisle: 'Mystery Labels', label: 'compound' });

  const effects = effectTags(r.reported_effects);
  const summary =
    clean(r.reported_effects)
      .split(/(?<=[.!?])\s+/)
      .slice(0, 2)
      .join(' ') ||
    clean(r.target_or_receptor_profile).split(/(?<=[.!?])\s+/)[0] ||
    `${name}: no effects established in the sources.`;
  const dose = doseOf(r.reported_dose_or_range, r.dose_basis);
  const urls = r.reference_urls.filter((u) => !OFF_LIMITS.test(u));

  const base = {
    id,
    name,
    ...(aka.length ? { aka } : {}),
    aisle: cat.aisle,
    summary,
    effects: effects.length ? effects : ['no demonstrated effect'],
    timing: {},
    toxicity: toxicityOf(
      clean(r.cautions.replace(PLACEHOLDER, '')),
      r.evidence_level,
      tier,
      placeholder || unidentified,
    ),
    risks: fragments(
      r.cautions
        .replace(PLACEHOLDER, '')
        .replace(/^No individual source verification for this entry;?/i, ''),
    ),
    ...(dose ? { doses: [dose] } : {}),
    evidence: tier,
    evidenceNotes: `Evidence level in the index: ${r.evidence_level}.`,
    ...(clean(r.target_or_receptor_profile)
      ? { mechanism: clean(r.target_or_receptor_profile) }
      : {}),
    sources: [SOURCE, ...urls],
  };

  if (botanical) {
    const latin = latinOf(r.name);
    const entry: Botanical = {
      ...base,
      kind: 'botanical',
      ...(latin ? { latin } : {}),
      compounds: [],
    };
    return entry;
  }
  const entry: Synthetic = { ...base, kind: 'synthetic', chemicalClass: cat.label };
  return entry;
}

/** Which entry each index row ended up as (or was folded into), by row id. */
function plan(existing: readonly Entry[]): { row: RawCompound; id: string; fresh: boolean }[] {
  const taken = new Set(existing.map((e) => e.id));
  const names = new Map(
    existing.flatMap((e) => [e.name, ...(e.aka ?? [])].map((n) => [normalize(n), e.id] as const)),
  );
  const out: { row: RawCompound; id: string; fresh: boolean }[] = [];
  for (const r of COMPOUNDS) {
    const dup = DUPLICATE_OF[r.id];
    if (dup) {
      out.push({ row: r, id: dup, fresh: false });
      continue;
    }
    const { name } = splitName(r.name);
    const same = names.get(normalize(name));
    if (same) {
      out.push({ row: r, id: same, fresh: false });
      continue;
    }
    let id = slug(name);
    for (let n = 2; taken.has(id); n++) id = `${slug(name)}-${n}`;
    taken.add(id);
    out.push({ row: r, id, fresh: true });
  }
  return out;
}

/** The index as catalogue entries, skipping rows that repeat something already on the shelves. */
export function buildCtl(existing: readonly Entry[]): Entry[] {
  return plan(existing)
    .filter((p) => p.fresh)
    .map((p) => mapCompound(p.row, p.id));
}

/** Index row id (like "ctl-042") to the id of the entry that carries it. */
export function ctlEntryIds(existing: readonly Entry[]): Record<string, string> {
  return Object.fromEntries(plan(existing).map((p) => [p.row.id, p.id]));
}

export const CTL_ROW_COUNT = COMPOUNDS.length;
