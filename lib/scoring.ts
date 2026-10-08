import {
  Finding,
  Redline,
  RuleSeverity,
  RuleCategory,
  ContractRecommendation,
} from "@/types/database";

export interface ScoreBreakdownItem {
  findingId: string;
  category: RuleCategory | string;
  severity: RuleSeverity;
  points: number;
  isMissing: boolean;
  isAccepted: boolean;
  ruleTitle: string;
}

export interface RiskScoreResult {
  score: number;
  level: "Low" | "Medium" | "High" | "Critical";
  recommendation: ContractRecommendation;
  recommendationReason: string;
  breakdown: Record<string, number>; // Category to score
  unresolvedCriticalCount: number;
  unresolvedHighCount: number;
  unresolvedMediumCount: number;
  unresolvedLowCount: number;
  missingClausesCount: number;
  items: ScoreBreakdownItem[];
}

export const BASE_SEVERITY_POINTS: Record<RuleSeverity, number> = {
  critical: 25,
  high: 15,
  medium: 7,
  low: 2,
  none: 0,
};

/**
 * Deterministic calculation of single finding score
 */
export function calculateFindingPoints(
  severity: RuleSeverity,
  weight: number = 5,
  isMissingClause: boolean = false,
  isCriticalCategory: boolean = false
): number {
  if (isMissingClause) {
    // Missing mandatory clause: +10 each (critical category: +15)
    return isCriticalCategory ? 15 : 10;
  }
  const basePoints = BASE_SEVERITY_POINTS[severity] || 0;
  // Multiplied by rule weight / 5
  return Math.round((basePoints * (weight || 5)) / 5);
}

/**
 * Calculates deterministic risk score for a contract given its findings and redline states
 */
export function calculateContractRiskScore(
  findings: Finding[],
  redlines: Redline[] = []
): RiskScoreResult {
  const redlineMap = new Map<string, Redline>();
  for (const r of redlines) {
    redlineMap.set(r.finding_id, r);
  }

  let rawTotal = 0;
  const categoryScores: Record<string, number> = {};
  const items: ScoreBreakdownItem[] = [];

  let unresolvedCritical = 0;
  let unresolvedHigh = 0;
  let unresolvedMedium = 0;
  let unresolvedLow = 0;
  let missingClausesCount = 0;

  for (const finding of findings) {
    const redline = redlineMap.get(finding.id) || finding.redline;
    const isAccepted = redline?.status === "accepted";

    const rule = finding.playbook_rule;
    const weight = rule?.weight ?? 5;
    const isMissing = finding.finding_type === "missing_clause";
    const category = rule?.category || (finding.clause?.category as RuleCategory) || "other";
    const isCriticalCat = category === "liability" || category === "indemnification" || category === "data_privacy";

    if (isMissing) {
      missingClausesCount++;
    }

    const calculatedPoints = calculateFindingPoints(
      finding.severity,
      weight,
      isMissing,
      isCriticalCat
    );

    // Accepted redlines contribute 0 points
    const activePoints = isAccepted ? 0 : calculatedPoints;

    if (!isAccepted) {
      if (finding.severity === "critical") unresolvedCritical++;
      if (finding.severity === "high") unresolvedHigh++;
      if (finding.severity === "medium") unresolvedMedium++;
      if (finding.severity === "low") unresolvedLow++;
    }

    rawTotal += activePoints;

    categoryScores[category] = (categoryScores[category] || 0) + activePoints;

    items.push({
      findingId: finding.id,
      category,
      severity: finding.severity,
      points: activePoints,
      isMissing,
      isAccepted,
      ruleTitle: rule?.title || finding.deviation_summary.slice(0, 50),
    });
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

  // Risk Level
  let level: "Low" | "Medium" | "High" | "Critical" = "Low";
  if (finalScore >= 75) {
    level = "Critical";
  } else if (finalScore >= 50) {
    level = "High";
  } else if (finalScore >= 25) {
    level = "Medium";
  } else {
    level = "Low";
  }

  // Recommendation:
  // Sign (<25 and no critical)
  // Negotiate (25-74 or any high)
  // Reject (>=75 or 2+ unresolved critical)
  let recommendation: ContractRecommendation = "negotiate";
  let recommendationReason = "";

  if (finalScore >= 75 || unresolvedCritical >= 2) {
    recommendation = "reject";
    recommendationReason =
      unresolvedCritical >= 2
        ? `Contract contains ${unresolvedCritical} unresolved critical deviations breaching core legal policy.`
        : `Overall risk score of ${finalScore}/100 exceeds acceptable commercial risk thresholds.`;
  } else if (finalScore < 25 && unresolvedCritical === 0 && unresolvedHigh === 0) {
    recommendation = "sign";
    recommendationReason =
      "All mandatory policies are satisfied and deviations are within low acceptable limits.";
  } else {
    recommendation = "negotiate";
    recommendationReason =
      unresolvedHigh > 0
        ? `Contract contains ${unresolvedHigh} high-severity issue(s) requiring active redline negotiation.`
        : `Contract score of ${finalScore}/100 warrants legal redlines on flagged deviations prior to execution.`;
  }

  return {
    score: finalScore,
    level,
    recommendation,
    recommendationReason,
    breakdown: categoryScores,
    unresolvedCriticalCount: unresolvedCritical,
    unresolvedHighCount: unresolvedHigh,
    unresolvedMediumCount: unresolvedMedium,
    unresolvedLowCount: unresolvedLow,
    missingClausesCount,
    items,
  };
}
