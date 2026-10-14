import { GroundedFinding, RiskReport } from './schema.js';

export interface ScoreBreakdown {
  rawScore: number;
  normalizedScore: number;
  level: RiskReport['risk_level'];
  color: RiskReport['risk_color'];
  counts: {
    high: number;
    medium: number;
    low: number;
    total: number;
    uniqueCategories: number;
  };
}

/**
 * Deterministic risk scoring function.
 * Weights:
 * - High severity: 22 points
 * - Medium severity: 10 points
 * - Low severity: 4 points
 *
 * Diminishing returns & category diversity:
 * Score uses an asymptotic saturation curve so it stays cleanly bounded within [0, 100].
 */
export function calculateRiskScore(findings: GroundedFinding[]): ScoreBreakdown {
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  const categories = new Set<string>();

  for (const f of findings) {
    categories.add(f.category);
    if (f.severity === 'high') highCount++;
    else if (f.severity === 'medium') mediumCount++;
    else lowCount++;
  }

  const rawSum = highCount * 22 + mediumCount * 10 + lowCount * 4;

  // Category diversity multiplier: (1 + 0.05 * (distinct_categories - 1))
  const diversityMultiplier = categories.size > 1 ? 1 + Math.min(0.35, (categories.size - 1) * 0.05) : 1.0;
  const weighted = rawSum * diversityMultiplier;

  // Asymptotic saturation curve: S = 100 * (1 - exp(-weighted / 52))
  let normalized = Math.round(100 * (1 - Math.exp(-weighted / 52)));
  if (findings.length === 0) normalized = 0;
  if (normalized > 100) normalized = 100;

  // Minimum floor if there are critical high-severity clauses
  if (highCount >= 2 && normalized < 60) {
    normalized = 60;
  }
  if (highCount >= 1 && normalized < 35) {
    normalized = 35;
  }

  let level: RiskReport['risk_level'] = 'Düşük';
  let color: RiskReport['risk_color'] = '#10b981';

  if (normalized >= 80) {
    level = 'Kritik';
    color = '#7f1d1d';
  } else if (normalized >= 55) {
    level = 'Yüksek';
    color = '#ef4444';
  } else if (normalized >= 30) {
    level = 'Orta';
    color = '#f59e0b';
  }

  return {
    rawScore: rawSum,
    normalizedScore: normalized,
    level,
    color,
    counts: {
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      total: findings.length,
      uniqueCategories: categories.size,
    },
  };
}
