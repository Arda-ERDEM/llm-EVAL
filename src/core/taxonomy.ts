/**
 * Risk taxonomy — single source of truth.
 *
 * Used by: the LLM JSON schema (enum), the prompt (definitions), the deterministic
 * validator (severity clamping), the scorer (points), the keyword baseline and the
 * eval annotation guide. Changing a category here changes it everywhere.
 */

export type Severity = 'low' | 'medium' | 'high';

export const SEVERITY_ORDER: Record<Severity, number> = { low: 0, medium: 1, high: 2 };

export interface CategoryDef {
  id: string;
  /** Short Turkish label shown in the UI. */
  labelTr: string;
  /** Definition given to the LLM and to Jev (English works best for both models). */
  definition: string;
  /**
   * Allowed severity band. The LLM's proposed severity is CLAMPED into this band,
   * so neither the model nor an injected instruction can move a category outside it.
   */
  minSeverity: Severity;
  maxSeverity: Severity;
  /**
   * High-recall keyword patterns (case-insensitive) used by the deterministic
   * baseline. They never create findings on their own; they only surface
   * "possible clause the model did not flag" items in the uncertainty list.
   */
  keywords: RegExp[];
}

export const CATEGORIES: readonly CategoryDef[] = [
  {
    id: 'unilateral_change',
    labelTr: 'Tek taraflı değişiklik',
    definition:
      'The provider may change the terms, features or the service unilaterally, without the user’s explicit consent, or with notice only by posting on the website.',
    minSeverity: 'low',
    maxSeverity: 'high',
    keywords: [
      /\b(may|reserve the right to) (modify|change|amend|update|revise) (these|this|the) (terms|agreement)/i,
      /at any time(,)? (with or )?without (prior )?notice/i,
      /continued use .{0,60}(constitutes|means|deemed) .{0,30}accept/i,
      /tek taraflı olarak değiştir/i,
    ],
  },
  {
    id: 'auto_renewal',
    labelTr: 'Otomatik yenileme',
    definition:
      'A paid subscription or free trial renews or converts to paid automatically and keeps charging until the user actively cancels.',
    minSeverity: 'medium',
    maxSeverity: 'high',
    keywords: [/auto(matic(ally)?)?[- ]?renew/i, /recurring (billing|charge|payment)/i, /otomatik (olarak )?yenilen/i],
  },
  {
    id: 'price_change',
    labelTr: 'Fiyat değişikliği',
    definition: 'The provider may increase prices or fees of an ongoing subscription or service.',
    minSeverity: 'low',
    maxSeverity: 'high',
    keywords: [/(change|increase|adjust) (our |the )?(price|prices|fees|subscription fee)/i, /fiyat(lar)?(ı|i)? değiştir/i],
  },
  {
    id: 'refund_restriction',
    labelTr: 'İade kısıtlaması',
    definition: 'Payments are non-refundable, or refunds/credits for partial periods are excluded or heavily restricted.',
    minSeverity: 'medium',
    maxSeverity: 'high',
    keywords: [/non-?refundable/i, /no refunds?/i, /(do|will) not (provide|issue|offer) (any )?refunds?/i, /iade (edilmez|yapılmaz)/i],
  },
  {
    id: 'cancellation_barrier',
    labelTr: 'İptal engeli',
    definition:
      'Cancellation is made difficult: special procedures, notice periods, early-termination fees, or the service continues/charges after cancellation.',
    minSeverity: 'low',
    maxSeverity: 'high',
    keywords: [/early termination fee/i, /cancel(lation)? .{0,40}(at least|prior to) .{0,20}days/i, /iptal .{0,40}gün önce/i],
  },
  {
    id: 'arbitration_class_waiver',
    labelTr: 'Tahkim / toplu dava feragati',
    definition:
      'Disputes must go to binding arbitration, or the user waives class actions, jury trials or the right to go to court.',
    minSeverity: 'medium',
    maxSeverity: 'high',
    keywords: [/binding arbitration/i, /class action/i, /jury trial/i, /waive .{0,40}right .{0,40}(court|class|jury)/i, /tahkim/i],
  },
  {
    id: 'liability_limitation',
    labelTr: 'Sorumluluk sınırlaması',
    definition:
      'The provider disclaims warranties ("as is") or limits/excludes its liability for damages, data loss or service failures.',
    minSeverity: 'low',
    maxSeverity: 'medium',
    keywords: [/["“]?as is["”]?/i, /limitation of liability/i, /(shall|will) not be liable/i, /in no event/i, /sorumlu (tutulamaz|değildir)/i],
  },
  {
    id: 'indemnification',
    labelTr: 'Tazmin yükümlülüğü',
    definition: 'The user must indemnify / hold harmless the provider against claims, losses or legal costs.',
    minSeverity: 'low',
    maxSeverity: 'medium',
    keywords: [/indemnif/i, /hold harmless/i, /tazmin/i],
  },
  {
    id: 'content_license',
    labelTr: 'İçerik lisansı',
    definition:
      'The user grants the provider a broad (worldwide, royalty-free, perpetual, sublicensable or transferable) license over user content.',
    minSeverity: 'medium',
    maxSeverity: 'high',
    keywords: [/(worldwide|royalty[- ]free|perpetual|irrevocable|sublicens)/i, /münhasır olmayan .{0,40}lisans/i],
  },
  {
    id: 'account_termination',
    labelTr: 'Hesabın keyfi kapatılması',
    definition:
      'The provider may suspend or terminate the user’s account or access at its sole discretion, for any or no reason, or without notice.',
    minSeverity: 'low',
    maxSeverity: 'high',
    keywords: [/(suspend|terminate) .{0,60}(at (our|its) (sole )?discretion|for any reason|without (prior )?notice)/i, /hesab(ı|ınızı) .{0,40}(kapat|askıya al)/i],
  },
  {
    id: 'data_sharing',
    labelTr: 'Üçüncü taraflarla veri paylaşımı',
    definition:
      'Personal data is shared with, sold to, or disclosed to third parties such as advertisers, partners, affiliates or data brokers.',
    minSeverity: 'medium',
    maxSeverity: 'high',
    keywords: [/(share|disclose|sell)s? .{0,60}(personal (data|information)|your (data|information)) .{0,60}(third[- ]part|partners|advertisers|affiliates)/i, /üçüncü (taraf|kişi)lar(la|a) .{0,40}paylaş/i],
  },
  {
    id: 'tracking_profiling',
    labelTr: 'İzleme ve profilleme',
    definition:
      'The provider tracks the user (cookies, cross-site tracking, device fingerprinting, precise location, biometrics) or builds profiles for targeted advertising.',
    minSeverity: 'low',
    maxSeverity: 'high',
    keywords: [/targeted advertising|interest-based ad|personali[sz]ed ad/i, /precise location|geolocation/i, /fingerprint|biometric/i, /çerez|profilleme/i],
  },
  {
    id: 'data_retention',
    labelTr: 'Veri saklama',
    definition:
      'Data is retained for long or undefined periods, or kept after the user deletes content or the account.',
    minSeverity: 'low',
    maxSeverity: 'medium',
    keywords: [/retain .{0,60}(as long as|after (you )?(delete|close|terminat))/i, /saklanır|muhafaza edil/i],
  },
  {
    id: 'ai_training',
    labelTr: 'Yapay zekâ eğitimi',
    definition: 'User data or content may be used to train or improve AI / machine-learning models.',
    minSeverity: 'medium',
    maxSeverity: 'high',
    keywords: [/(train|improve|develop) .{0,40}(machine learning|artificial intelligence|\bAI\b|models)/i, /yapay zek[aâ]/i],
  },
  {
    id: 'jurisdiction',
    labelTr: 'Yargı yeri / uygulanacak hukuk',
    definition:
      'Disputes are governed by a foreign law or must be brought in courts far from the user (e.g. a specific foreign state or country).',
    minSeverity: 'low',
    maxSeverity: 'medium',
    keywords: [/governed by the laws of/i, /exclusive jurisdiction/i, /(courts?|venue) (located )?in .{0,40}(county|state|california|ireland|delaware)/i, /yetkili mahkeme/i],
  },
] as const;

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [string, ...string[]];

export const CATEGORY_BY_ID: Record<string, CategoryDef> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export function clampSeverity(categoryId: string, proposed: Severity): Severity {
  const c = CATEGORY_BY_ID[categoryId];
  if (!c) return proposed;
  const v = SEVERITY_ORDER[proposed];
  if (v < SEVERITY_ORDER[c.minSeverity]) return c.minSeverity;
  if (v > SEVERITY_ORDER[c.maxSeverity]) return c.maxSeverity;
  return proposed;
}

export const SEVERITY_LABEL_TR: Record<Severity, string> = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' };
