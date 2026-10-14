import { CATEGORIES, CategoryDef, Severity } from './taxonomy.js';
import { getLineNumber } from './grounding.js';

export interface BaselineFinding {
  category: string;
  categoryLabelTr: string;
  matchedKeyword: string;
  snippet: string;
  startOffset: number;
  endOffset: number;
  line: number;
  severity: Severity;
}

/**
 * Runs a deterministic keyword/regex scan across the document using the taxonomy's keywords.
 */
export function runBaselineScan(documentText: string): BaselineFinding[] {
  const findings: BaselineFinding[] = [];
  const lines = documentText.split('\n');

  let currentOffset = 0;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineText = lines[lineIdx];
    const lineNum = lineIdx + 1;

    for (const cat of CATEGORIES) {
      for (const kw of cat.keywords) {
        const match = kw.exec(lineText);
        if (match) {
          const matchOffsetInLine = match.index;
          const matchStart = currentOffset + matchOffsetInLine;
          const matchEnd = matchStart + match[0].length;

          // Extract a readable sentence/clause around the match
          const snippetStart = Math.max(0, matchOffsetInLine - 40);
          const snippetEnd = Math.min(lineText.length, matchOffsetInLine + match[0].length + 60);
          const snippet = lineText.slice(snippetStart, snippetEnd).trim();

          findings.push({
            category: cat.id,
            categoryLabelTr: cat.labelTr,
            matchedKeyword: match[0],
            snippet,
            startOffset: matchStart,
            endOffset: matchEnd,
            line: lineNum,
            severity: cat.minSeverity === cat.maxSeverity ? cat.minSeverity : 'medium',
          });
          break; // Avoid duplicate category hits on the same line
        }
      }
    }

    currentOffset += lineText.length + 1; // +1 for the newline
  }

  return findings;
}
