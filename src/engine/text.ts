/** Measures the width of a string, e.g. `(s) => ctx.measureText(s).width`. */
export type Measure = (text: string) => number;

/**
 * Splits `text` into lines no wider than `maxWidth`. Respects "\n", and breaks words
 * that are too long to fit on a line by themselves.
 */
export function wrapText(text: string, maxWidth: number, measure: Measure): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = word;
      // Hard-break a word that is wider than the whole line.
      while (measure(line) > maxWidth && line.length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && measure(line.slice(0, cut)) > maxWidth) cut--;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Shortens `text` with an ellipsis so it fits in `maxWidth`. */
export function fitText(text: string, maxWidth: number, measure: Measure): string {
  if (measure(text) <= maxWidth) return text;
  let end = text.length;
  while (end > 0 && measure(`${text.slice(0, end)}…`) > maxWidth) end--;
  return end > 0 ? `${text.slice(0, end).trimEnd()}…` : '';
}
