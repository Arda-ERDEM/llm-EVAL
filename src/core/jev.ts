/**
 * Integration with TypeSafe AI's Jev (System One Model).
 *
 * Jev does not produce conversational prose. Instead, it directly evaluates application
 * state against schema-constrained questions and outputs calibrated probabilities
 * and structured choices (noul, choice, score).
 *
 * Supported endpoints:
 * - OpenRouter System One endpoint: POST https://openrouter.ai/api/v1/systemone or /api/alpha/decisions
 * - TypeSafe native endpoint: POST https://api.typesafe.ai/v1/systemone
 */

export interface JevVerdict {
  questionKey: string;
  type: 'noul' | 'choice' | 'score';
  choice?: string;
  probability?: number;
  confidence?: number;
  score?: number;
}

export interface JevDecisionResponse {
  model: string;
  answers: Record<
    string,
    {
      type: 'noul' | 'choice' | 'score';
      noul?: number;
      choice?: string;
      confidence?: number;
      probabilities?: Record<string, number>;
      score?: number;
    }
  >;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cost?: number;
  };
}

export interface JevClientConfig {
  apiKey?: string;
  baseURL?: string; // defaults to https://openrouter.ai/api
  model?: string; // defaults to 'typesafe/jev-1.13'
}

export class JevDecisionClient {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(config: JevClientConfig = {}) {
    this.apiKey = config.apiKey || '';
    this.baseURL = config.baseURL || 'https://openrouter.ai/api';
    this.model = config.model || 'typesafe/jev-1.13';
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  /**
   * Evaluates a clause using Jev to verify if it represents a high risk and determine the exact category.
   */
  async evaluateClauseRisk(
    clause: string,
    proposedCategory: string
  ): Promise<{ isRisk: boolean; confidence: number; verdict?: JevVerdict }> {
    if (!this.isConfigured) {
      // Deterministic offline fallback if Jev API key is not supplied
      return this.offlineFallbackEvaluate(clause, proposedCategory);
    }

    try {
      const endpoint = this.baseURL.endsWith('/') ? `${this.baseURL}v1/systemone` : `${this.baseURL}/v1/systemone`;

      const payload = {
        model: this.model,
        state: { clause },
        questions: {
          is_consumer_risk: {
            type: 'noul',
            instructions:
              'Does this legal clause impose an unfair, restrictive, or significant risk on the consumer or subscriber?',
          },
          category_match: {
            type: 'choice',
            instructions: 'Which consumer protection category best describes this clause?',
            criteria: {
              [proposedCategory]: `The clause represents the category: ${proposedCategory}`,
              other_risk: 'The clause represents another type of risk',
              benign: 'The clause is standard, fair, or benign',
            },
          },
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn(`Jev API responded with status ${res.status}, falling back to heuristic.`);
        return this.offlineFallbackEvaluate(clause, proposedCategory);
      }

      const data = (await res.json()) as JevDecisionResponse;
      const noulAnswer = data.answers?.is_consumer_risk;
      const choiceAnswer = data.answers?.category_match;

      const noulProb = noulAnswer?.noul ?? 0.5;
      const isRisk = noulProb >= 0.6;
      const confidence = choiceAnswer?.confidence ?? noulProb;

      return {
        isRisk,
        confidence,
        verdict: {
          questionKey: 'is_consumer_risk',
          type: 'noul',
          probability: noulProb,
          confidence,
          choice: choiceAnswer?.choice,
        },
      };
    } catch (err) {
      console.warn('Jev evaluation error:', err);
      return this.offlineFallbackEvaluate(clause, proposedCategory);
    }
  }

  /**
   * Deterministic offline probability estimation when no external API key is active.
   */
  private offlineFallbackEvaluate(
    clause: string,
    proposedCategory: string
  ): { isRisk: boolean; confidence: number; verdict?: JevVerdict } {
    // Quick heuristic based on clause length and presence of strong risk terms
    const lower = clause.toLowerCase();
    const hasRiskTerms =
      /arbitration|non-refundable|auto-renew|sole discretion|without notice|waive|indemnify|as is|fiyat|iade|tahkim/.test(
        lower
      );

    const prob = hasRiskTerms ? 0.92 : 0.65;
    return {
      isRisk: prob > 0.5,
      confidence: prob,
      verdict: {
        questionKey: 'offline_heuristic',
        type: 'noul',
        probability: prob,
        confidence: prob,
        choice: proposedCategory,
      },
    };
  }
}
