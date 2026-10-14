/**
 * Prompt Injection Detector and Document Sanitizer.
 * Protects against Indirect Prompt Injection where malicious web pages hide instructions
 * in ToS / Privacy text attempting to override the analyzer or hide risks.
 */

export interface InjectionCheckResult {
  hasSuspiciousInstructions: boolean;
  patternsDetected: string[];
  sanitizedText: string;
  warningNote?: string;
}

const INJECTION_PATTERNS: { name: string; regex: RegExp }[] = [
  {
    name: 'ignore_instructions',
    regex: /(?:ignore|disregard|forget|override)\s+(?:all\s+)?(?:previous|prior|above|former)\s+(?:instructions|prompts|rules|commands)/i,
  },
  {
    name: 'system_prompt_override',
    regex: /(?:system\s*:\s*you\s+are|developer\s+mode\s+activated|you\s+are\s+now\s+in\s+developer\s+mode)/i,
  },
  {
    name: 'suppress_risks',
    regex: /(?:do\s+not\s+(?:report|flag|find|extract)\s+any\s+risks?|always\s+return\s+(?:a\s+risk\s+score\s+of\s+0|0\s+risk|empty\s+findings))/i,
  },
  {
    name: 'jailbreak_dan',
    regex: /(?:DAN\s+mode|jailbreak|pretend\s+you\s+have\s+no\s+safety\s+guidelines)/i,
  },
  {
    name: 'fake_json_structure',
    regex: /```json\s*\{\s*"risk_score"\s*:\s*0/i,
  },
  {
    name: 'turkish_injection',
    regex: /(?:önceki\s+(?:tüm\s+)?talimatları\s+unut|hiçbir\s+risk\s+raporlama|risk\s+skorunu\s+0\s+yap|bu\s+metinde\s+risk\s+yoktur\s+de)/i,
  },
];

/**
 * Scans a document for prompt injection signatures and prepares a safe wrapped document block.
 */
export function checkPromptInjection(documentText: string): InjectionCheckResult {
  const detected: string[] = [];

  for (const p of INJECTION_PATTERNS) {
    if (p.regex.test(documentText)) {
      detected.push(p.name);
    }
  }

  const hasSuspicious = detected.length > 0;
  let warningNote: string | undefined;

  if (hasSuspicious) {
    warningNote = `DİKKAT: Sayfa metninde yapay zekâ analizini yanıltmaya yönelik şüpheli komut/enjeksiyon kalıpları tespit edildi (${detected.join(
      ', '
    )}). Bu kısımlar tarafsız veri olarak ele alınmıştır.`;
  }

  return {
    hasSuspiciousInstructions: hasSuspicious,
    patternsDetected: detected,
    sanitizedText: documentText, // we don't destroy text so grounding works, but we wrap it in strict barriers
    warningNote,
  };
}

/**
 * Creates an armored prompt payload with strict XML boundary delimiters.
 */
export function wrapUntrustedDocument(text: string, nonce: string = 'LEGAL_DOC_CONTENT'): string {
  // Replace closing delimiter to prevent escape attacks
  const safeText = text.replaceAll(`</${nonce}>`, `[ESCAPED_CLOSING_TAG]`);
  return `<${nonce}>\n${safeText}\n</${nonce}>`;
}
