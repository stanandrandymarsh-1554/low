import type { Entry } from './data/types';
import { formatHours, formatMinutes, formatPercent } from './timing';
import { TOXICITY_STYLE } from './theme';

/** Content for the back of a tape box, independent of how it is drawn. */
export type Block =
  | { type: 'heading'; text: string }
  | { type: 'para'; text: string }
  | { type: 'facts'; rows: [label: string, value: string][] }
  | { type: 'chips'; items: string[] }
  | { type: 'bullets'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'warning'; text: string };

export function subtitle(entry: Entry): string {
  return entry.kind === 'botanical' ? entry.latin : entry.chemicalClass;
}

export function buildBackCover(entry: Entry): Block[] {
  const blocks: Block[] = [];
  const add = (b: Block) => blocks.push(b);
  const section = (title: string, ...body: Block[]) => {
    add({ type: 'heading', text: title });
    body.forEach(add);
  };

  if (entry.sample) {
    add({ type: 'warning', text: 'SAMPLE ENTRY - placeholder to show the format.' });
  }
  add({ type: 'para', text: entry.summary });

  if (entry.kind === 'botanical') {
    if (entry.compounds.length) {
      const rows = entry.compounds.map((c) => [
        c.name,
        c.percent ? formatPercent(c.percent) : '?',
        c.part ?? '',
      ]);
      const notes = entry.compounds.filter((c) => c.notes).map((c) => `${c.name}: ${c.notes}`);
      section(
        'ACTIVE COMPOUNDS',
        { type: 'table', head: ['COMPOUND', '% DRY WT', 'PART'], rows },
        ...(notes.length ? [{ type: 'bullets', items: notes } as Block] : []),
      );
    }
  } else {
    const { year, by, story } = entry.origin;
    const facts: [string, string][] = [];
    if (year) facts.push(['FIRST MADE', String(year)]);
    if (by) facts.push(['BY', by]);
    if (entry.synthesis) facts.push(['TYPE', entry.synthesis]);
    facts.push(['CLASS', entry.chemicalClass]);
    section('ORIGIN', { type: 'facts', rows: facts }, { type: 'para', text: story });
  }

  section('EFFECTS', { type: 'chips', items: entry.effects });

  const t = entry.timing;
  const timing: [string, string][] = [];
  if (t.onsetMinutes) timing.push(['ONSET', formatMinutes(t.onsetMinutes)]);
  if (t.peakMinutes) timing.push(['PEAK', formatMinutes(t.peakMinutes)]);
  timing.push(['DURATION', formatHours(t.totalHours)]);
  if (t.afterHours) timing.push(['AFTER-EFFECTS', formatHours(t.afterHours)]);
  section('RUNNING TIME', { type: 'facts', rows: timing });
  if (t.notes) add({ type: 'para', text: t.notes });

  section(TOXICITY_STYLE[entry.toxicity].long);
  if (entry.toxicityNotes) add({ type: 'para', text: entry.toxicityNotes });
  if (entry.risks.length) add({ type: 'bullets', items: entry.risks });

  if (entry.interactions?.length) {
    section('DO NOT MIX WITH', { type: 'bullets', items: entry.interactions });
  }

  if (entry.kind === 'botanical') {
    const facts: [string, string][] = [];
    if (entry.family) facts.push(['FAMILY', entry.family]);
    if (entry.region) facts.push(['REGION', entry.region]);
    if (entry.partsUsed?.length) facts.push(['PARTS USED', entry.partsUsed.join(', ')]);
    if (facts.length) section('ABOUT THE PLANT', { type: 'facts', rows: facts });
    if (entry.history) section('HISTORY', { type: 'para', text: entry.history });
  }

  if (entry.aka?.length) section('ALSO KNOWN AS', { type: 'chips', items: entry.aka });
  if (entry.legal) section('LEGAL STATUS', { type: 'para', text: entry.legal });
  if (entry.sources?.length) section('SOURCES', { type: 'bullets', items: entry.sources });

  return blocks;
}
