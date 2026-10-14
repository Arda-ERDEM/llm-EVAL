import { z } from 'zod';
import { CATEGORY_IDS, Severity } from './taxonomy.js';

export const SeverityEnum = z.enum(['low', 'medium', 'high']);

export const RawFindingSchema = z.object({
  category: z.enum(CATEGORY_IDS),
  severity: SeverityEnum,
  original_quote: z.string().min(5, 'Quote must be at least 5 characters long'),
  explanation_tr: z.string().min(10, 'Explanation must be in plain Turkish with details'),
  uncertainty_note: z.string().optional(),
});

export type RawFinding = z.infer<typeof RawFindingSchema>;

export const LLMOutputSchema = z.object({
  document_summary_tr: z.string().min(20, 'Document summary in Turkish is required'),
  findings: z.array(RawFindingSchema),
  general_uncertainties: z.array(z.string()).default([]),
});

export type LLMOutput = z.infer<typeof LLMOutputSchema>;

export interface GroundedFinding {
  id: string;
  category: string;
  categoryLabelTr: string;
  categoryDefinition: string;
  severity: Severity;
  severityLabelTr: string;
  originalQuote: string;
  startOffset: number;
  endOffset: number;
  line: number;
  explanationTr: string;
  groundingConfidence: number;
  jevScore?: {
    choice?: string;
    probability?: number;
    confidence?: number;
  };
  uncertaintyNote?: string;
}

export interface UncertaintyItem {
  id: string;
  type: 'model_hesitant' | 'unverified_quote' | 'baseline_discrepancy' | 'ambiguous_legal_clause';
  descriptionTr: string;
  relatedQuote?: string;
  category?: string;
  severity?: Severity;
}

export interface RiskReport {
  risk_score: number; // 0 - 100
  risk_level: 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik';
  risk_color: '#10b981' | '#f59e0b' | '#ef4444' | '#7f1d1d'; // green, amber, red, dark red
  summary_tr: string;
  findings: GroundedFinding[];
  uncertainties: UncertaintyItem[];
  rejected_claims_count: number;
  legal_disclaimer: string;
  metadata: {
    url?: string;
    title?: string;
    analyzed_at: string;
    total_characters: number;
    total_words: number;
    provider?: string;
    model?: string;
    execution_time_ms: number;
    jev_assisted: boolean;
  };
}

export const LEGAL_DISCLAIMER_TEXT =
  'YASAL UYARI: Bu uygulama hukuki tavsiye vermez. Üretilen analiz raporu hukuki mütalaa veya hukuki tavsiye niteliği taşımayıp yalnızca bilgilendirme ve farkındalık amaçlı otomatik bir karar-destek aracıdır. Haklarınız ve yükümlülükleriniz için bir hukuk uzmanına danışınız.';
