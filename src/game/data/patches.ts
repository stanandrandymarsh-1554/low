import { clean, doseOf, effectTags } from './ctl';
import upgrade from './sources/evidence-upgrade.json';
import type { Entry, Evidence } from './types';

/**
 * An evidence upgrade for selected index rows: newer, source-backed mechanism, effects, exposure
 * amounts and caveats. It is applied on top of the entry each row became (or was folded into).
 */
interface Patch {
  original_id: string;
  research_update: {
    target_or_receptor_profile: string;
    reported_effects: string;
    research_exposure: string;
    interpretation_limits: string;
    target_evidence: string;
    human_effect_evidence: string;
    reference_urls: string[];
  };
}

const PATCHES = (upgrade as unknown as { patches: Patch[] }).patches;

/**
 * The tier each upgraded entry gets, decided once from its evidence: A where there are
 * controlled human data on the compound; B where there is limited human data (safety, pharmacokinetics,
 * one open study), or animal and in-vitro pharmacology only; D where nothing is established.
 */
export const PATCH_TIER: Record<string, Evidence> = {
  'ctl-001': 'A', // caffeine: controlled crossover trials
  'ctl-002': 'B', // DMAA: human pharmacokinetics plus a receptor panel, no effect trials
  'ctl-003': 'B', // DMHA: receptor panel only
  'ctl-004': 'B', // DMBA: receptor panel only
  'ctl-005': 'D', // 1,4-DMAA: nothing established for this isomer
  'ctl-006': 'B', // N,N-dimethylphenethylamine: receptor panel only
  'ctl-019': 'B', // p-synephrine: limited, mixed human data and a receptor panel
  'ctl-020': 'B', // oxilofrine: receptor panel only
  'ctl-021': 'B', // deterenol: receptor panel only
  'ctl-022': 'B', // higenamine: receptor panel and IV physiology
  'ctl-031': 'A', // yohimbine: controlled human challenge studies
  'ctl-032': 'B', // rauwolscine: animal pharmacology
  'ctl-027': 'B', // theacrine: small human trials
  'ctl-028': 'B', // methylliberine: human safety and pharmacokinetics
  'ctl-042': 'A', // modafinil: PET occupancy and clinical trials
  'ctl-041': 'B', // flmodafinil: one human pharmacokinetic study
  'ctl-044': 'B', // phenylpiracetam: animal binding
  'ctl-047': 'B', // noopept: open patient study
  'ctl-048': 'B', // sunifiram: animal and slice work
  'ctl-050': 'B', // IDRA-21: primate work
  'ctl-051': 'B', // dihexa: cell and rodent work
  'ctl-053': 'B', // 9-Me-BC: cell and enzyme assays
  'ctl-074': 'A', // tesofensine: controlled 24-week trial
  'ctl-061': 'B', // methylene blue: purified human enzyme assay
  'ctl-068': 'A', // huperzine A: controlled patient trial
  'ctl-069': 'B', // mesembrenone: in-vitro targets
  'ctl-213': 'B', // kanna: small trials of one standardised extract
  'ctl-214': 'A', // kava: controlled trials (mixed results)
  'ctl-226': 'B', // magnolia: receptor work and one blend trial
  'ctl-107': 'A', // L-theanine: controlled crossover trial
  'ctl-104': 'A', // 5-HTP: controlled trial and established biochemistry
  'ctl-103': 'A', // melatonin: meta-analysis of randomised trials
};

/** Keeps the statements of fact from a caveat; drops editorial instructions and corrections. */
export function factual(text: string): string {
  return clean(text)
    .split(/(?<=[.!?])\s+/)
    .filter(
      (s) =>
        !/^(do not|don't|avoid|should not|never)\b/i.test(s) && !/correction|outdated/i.test(s),
    )
    .join(' ')
    .trim();
}

const sentence = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);

/**
 * Applies the upgrade. `idOf` says which entry each index row became; entries for rows that were
 * folded into an existing one (modafinil, kanna, kava, magnolia) keep their own text and gain the
 * new mechanism, exposure and notes, while generated entries take the new text outright.
 */
export function applyPatches(
  entries: readonly Entry[],
  idOf: Record<string, string>,
  generated: ReadonlySet<string>,
): Entry[] {
  const byId = new Map(entries.map((e) => [e.id, e] as const));
  const out = new Map(byId);
  for (const p of PATCHES) {
    const id = idOf[p.original_id];
    const entry = id ? byId.get(id) : undefined;
    if (!entry) continue;
    const u = p.research_update;
    const fresh = generated.has(entry.id);
    const dose = doseOf(u.research_exposure, 'reported research exposure');
    const mechanism = clean(u.target_or_receptor_profile);
    const effects = effectTags(u.reported_effects);
    const notes = [
      `Target: ${u.target_evidence}.`,
      `Effects: ${u.human_effect_evidence}.`,
      factual(u.interpretation_limits),
    ]
      .filter(Boolean)
      .map(sentence)
      .join(' ');
    const urls = u.reference_urls.filter((x) => !/fda\.gov/i.test(x));
    const tier = PATCH_TIER[p.original_id];

    const next: Entry = {
      ...entry,
      ...(mechanism ? { mechanism } : {}),
      ...(fresh && clean(u.reported_effects)
        ? {
            summary: clean(u.reported_effects)
              .split(/(?<=[.!?])\s+/)
              .slice(0, 2)
              .join(' '),
            ...(effects.length ? { effects } : {}),
          }
        : {}),
      ...(tier ? { evidence: tier } : {}),
      evidenceNotes: fresh || !entry.evidenceNotes ? notes : `${entry.evidenceNotes} ${notes}`,
      sources: [...new Set([...(entry.sources ?? []), ...urls])],
      doses: fresh
        ? dose
          ? [dose]
          : undefined
        : [...(entry.doses ?? []), ...(dose ? [dose] : [])],
    };
    if (!next.doses?.length) delete next.doses;
    out.set(entry.id, next);
  }
  return entries.map((e) => out.get(e.id) ?? e);
}
