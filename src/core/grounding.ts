import { normalizeWithMap, stripQuoteWrapping } from './normalize.js';

export interface GroundingResult {
  valid: boolean;
  originalQuote?: string;
  startOffset?: number;
  endOffset?: number;
  line?: number;
  confidence: number;
  reason?: string;
}

/**
 * Finds character offset in original text for a given line number (1-indexed).
 */
export function getLineNumber(originalText: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < originalText.length; i++) {
    if (originalText[i] === '\n') {
      line++;
    }
  }
  return line;
}

/**
 * Validates that `candidateQuote` actually appears in `documentText`.
 * Uses normalized mapping first. If not found exactly, tries trimmed sub-quotes.
 * An ungrounded claim is STRICTLY invalid.
 */
export function groundQuote(documentText: string, candidateQuote: string): GroundingResult {
  if (!candidateQuote || typeof candidateQuote !== 'string') {
    return { valid: false, confidence: 0, reason: 'Empty or missing quote' };
  }

  const cleanQuote = stripQuoteWrapping(candidateQuote);
  if (cleanQuote.length < 8) {
    return { valid: false, confidence: 0, reason: 'Quote too short (< 8 chars)' };
  }

  // 1. Direct exact match in raw text
  const directIdx = documentText.indexOf(cleanQuote);
  if (directIdx !== -1) {
    const end = directIdx + cleanQuote.length;
    return {
      valid: true,
      originalQuote: documentText.slice(directIdx, end),
      startOffset: directIdx,
      endOffset: end,
      line: getLineNumber(documentText, directIdx),
      confidence: 1.0,
    };
  }

  // 2. Normalized match with char index map back to original
  const normDoc = normalizeWithMap(documentText);
  const normQ = normalizeWithMap(cleanQuote);

  if (normQ.text.length < 6) {
    return { valid: false, confidence: 0, reason: 'Normalized quote too short' };
  }

  const normIdx = normDoc.text.indexOf(normQ.text);
  if (normIdx !== -1) {
    const rawStart = normDoc.map[normIdx];
    const normEndIdx = normIdx + normQ.text.length - 1;
    const rawEnd = (normDoc.map[normEndIdx] ?? rawStart) + 1;
    const matchedOriginal = documentText.slice(rawStart, rawEnd);

    return {
      valid: true,
      originalQuote: matchedOriginal,
      startOffset: rawStart,
      endOffset: rawEnd,
      line: getLineNumber(documentText, rawStart),
      confidence: 0.98,
    };
  }

  // 3. Fallback: Prefix / Suffix anchor match (at least 35 characters) if the model truncated the middle
  if (normQ.text.length >= 50) {
    const head = normQ.text.slice(0, 32);
    const headIdx = normDoc.text.indexOf(head);
    if (headIdx !== -1) {
      const rawStart = normDoc.map[headIdx];
      // Check if tail is also found nearby
      const tail = normQ.text.slice(-25);
      const tailIdx = normDoc.text.indexOf(tail, headIdx);
      if (tailIdx !== -1 && tailIdx - headIdx <= normQ.text.length + 60) {
        const normEndIdx = tailIdx + tail.length - 1;
        const rawEnd = (normDoc.map[normEndIdx] ?? rawStart) + 1;
        return {
          valid: true,
          originalQuote: documentText.slice(rawStart, rawEnd),
          startOffset: rawStart,
          endOffset: rawEnd,
          line: getLineNumber(documentText, rawStart),
          confidence: 0.88,
          reason: 'Matched via head/tail anchor with minor internal variation',
        };
      }
    }
  }

  return {
    valid: false,
    confidence: 0,
    reason: 'Quote could not be grounded in document text',
  };
}
