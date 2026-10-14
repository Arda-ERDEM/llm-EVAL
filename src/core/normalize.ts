/**
 * Text normalization with an index map back to the original string.
 *
 * Quote grounding must be tolerant to typographic noise (curly quotes, NBSP,
 * dashes, whitespace runs, case) but nothing else. Every normalized character
 * remembers the index of the original character it came from, so a match in the
 * normalized text can be mapped back to an exact original substring — the UI
 * always shows that ORIGINAL substring, never the model's string.
 */

const CHAR_MAP: Record<string, string> = {
  '\u2018': "'", '\u2019': "'", '\u201A': "'", '\u201B': "'", '\u2032': "'", '`': "'", '\u00B4': "'",
  '\u201C': '"', '\u201D': '"', '\u201E': '"', '\u201F': '"', '\u00AB': '"', '\u00BB': '"', '\u2033': '"',
  '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2013': '-', '\u2014': '-', '\u2015': '-', '\u2212': '-',
  '\u00A0': ' ', '\u2007': ' ', '\u202F': ' ', '\u2009': ' ', '\u200A': ' ', '\u3000': ' ',
  '\u2026': '...',
  '\u0130': 'i', 'I': 'i', '\u0131': 'i', // Turkish dotted/dotless i folded together
};

const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF\u00AD\u0307]/;

export interface NormalizedText {
  text: string;
  /** map[i] = index in the original string of normalized char i */
  map: number[];
}

export function normalizeWithMap(input: string): NormalizedText {
  let out = '';
  const map: number[] = [];
  let lastWasSpace = true; // trims leading whitespace
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ZERO_WIDTH.test(ch)) continue;
    let rep = CHAR_MAP[ch] ?? ch.normalize('NFKC').toLowerCase();
    rep = rep.replace(/\u0307/g, '');
    for (const r of rep) {
      if (/\s/.test(r)) {
        if (lastWasSpace) continue;
        out += ' ';
        map.push(i);
        lastWasSpace = true;
      } else {
        out += r;
        map.push(i);
        lastWasSpace = false;
      }
    }
  }
  if (out.endsWith(' ')) {
    out = out.slice(0, -1);
    map.pop();
  }
  return { text: out, map };
}

export function normalize(input: string): string {
  return normalizeWithMap(input).text;
}

/** Strip wrapping quotes / brackets the model sometimes adds around a quote. */
export function stripQuoteWrapping(q: string): string {
  let s = q.trim();
  for (let k = 0; k < 3; k++) {
    const before = s;
    s = s.replace(/^["'“”‘’«»\s]+|["'“”‘’«»\s]+$/g, '').trim();
    if (s === before) break;
  }
  return s;
}
