import { EVIDENCE_TIERS, TOXICITY_LEVELS, type Entry, type Range } from './types';

/** Checks the catalogue for mistakes. Returns one message per problem (empty if fine). */
export function validateCatalogue(entries: readonly Entry[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  const checkRange = (where: string, range: Range | undefined, max = Infinity) => {
    if (!range) return;
    const [lo, hi] = range;
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo < 0 || hi > max || lo > hi) {
      problems.push(`${where}: bad range [${lo}, ${hi}]`);
    }
  };

  for (const e of entries) {
    const at = `"${e.id || e.name || '?'}"`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id)) problems.push(`${at}: id must be kebab-case`);
    if (seen.has(e.id)) problems.push(`${at}: duplicate id`);
    seen.add(e.id);

    if (!e.name.trim()) problems.push(`${at}: missing name`);
    if (!e.aisle.trim()) problems.push(`${at}: missing aisle`);
    if (!e.summary.trim()) problems.push(`${at}: missing summary`);
    if (e.effects.length === 0) problems.push(`${at}: needs at least one effect`);
    if (!TOXICITY_LEVELS.includes(e.toxicity)) problems.push(`${at}: unknown toxicity`);

    if (e.evidence && !(e.evidence in EVIDENCE_TIERS))
      problems.push(`${at}: unknown evidence tier`);
    if (e.myth && (!e.myth.reputation.trim() || !e.myth.finding.trim())) {
      problems.push(`${at}: myth needs both a reputation and a finding`);
    }
    e.doses?.forEach((d, i) => {
      if (!d.amount.trim() || !d.context.trim()) problems.push(`${at} dose #${i + 1}: incomplete`);
    });
    if (e.routes?.some((r) => !r.trim())) problems.push(`${at}: empty route`);

    checkRange(`${at} onsetMinutes`, e.timing.onsetMinutes);
    checkRange(`${at} peakMinutes`, e.timing.peakMinutes);
    checkRange(`${at} totalHours`, e.timing.totalHours);
    checkRange(`${at} afterHours`, e.timing.afterHours);

    if (e.kind === 'botanical') {
      if (e.latin !== undefined && !e.latin.trim()) problems.push(`${at}: empty latin name`);
      e.compounds.forEach((c, i) => {
        if (!c.name.trim()) problems.push(`${at} compound #${i + 1}: missing name`);
        checkRange(`${at} ${c.name} percent`, c.percent, 100);
      });
    } else {
      if (!e.chemicalClass.trim()) problems.push(`${at}: missing chemicalClass`);
      if (e.origin && !e.origin.story.trim()) problems.push(`${at}: empty origin story`);
    }
  }
  return problems;
}
