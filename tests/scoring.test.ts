import { describe, it, expect } from "vitest";
import {
  calculateFindingPoints,
  calculateContractRiskScore,
  BASE_SEVERITY_POINTS,
} from "../lib/scoring";
import { Finding, Redline } from "../types/database";

describe("Deterministic Risk Scoring Engine", () => {
  it("calculates base finding points correctly with weight multiplier", () => {
    expect(calculateFindingPoints("critical", 5)).toBe(25);
    expect(calculateFindingPoints("high", 5)).toBe(15);
    expect(calculateFindingPoints("medium", 5)).toBe(7);
    expect(calculateFindingPoints("low", 5)).toBe(2);
    expect(calculateFindingPoints("none", 5)).toBe(0);

    // With weight = 10 (double)
    expect(calculateFindingPoints("critical", 10)).toBe(50);
  });

  it("calculates missing mandatory clause penalties correctly", () => {
    // Normal category: 10 points
    expect(calculateFindingPoints("critical", 5, true, false)).toBe(10);
    // Critical category (liability/indemnity/privacy): 15 points
    expect(calculateFindingPoints("critical", 5, true, true)).toBe(15);
  });

  it("calculates contract score and drops accepted redlines to 0 points", () => {
    const mockFinding: Finding = {
      id: "f1",
      contract_id: "c1",
      clause_id: "cl1",
      playbook_rule_id: "r1",
      finding_type: "deviation",
      severity: "critical",
      similarity: 0.85,
      deviation_summary: "Unlimited liability",
      playbook_requirement_excerpt: "Liability cap required",
      vendor_text_excerpt: "Unlimited liability applies",
      risky_spans: [],
      plain_english: "Customer liable without limit",
      negotiation_priority: "must_fix",
      regulation_flags: [],
      suggested_clause: "Cap at 12 months fees",
      fallback_clause: "",
      walk_away_note: "",
      points: 25,
      created_at: new Date().toISOString(),
      playbook_rule: {
        id: "r1",
        organization_id: "org1",
        title: "Liability Cap",
        category: "liability",
        requirement_text: "",
        ideal_clause_text: "",
        acceptable_fallback_text: "",
        walk_away_text: "",
        severity_default: "critical",
        weight: 5,
        is_mandatory: true,
        is_active: true,
        regulation_tags: [],
        created_at: "",
        updated_at: "",
      },
    };

    // When pending: score is 25
    const initialResult = calculateContractRiskScore([mockFinding], []);
    expect(initialResult.score).toBe(25);
    expect(initialResult.level).toBe("Medium");
    expect(initialResult.unresolvedCriticalCount).toBe(1);

    // When accepted: score drops to 0
    const acceptedRedline: Redline = {
      id: "red1",
      finding_id: "f1",
      contract_id: "c1",
      original_text: "",
      proposed_text: "",
      final_text: "",
      status: "accepted",
      decided_by: "u1",
      decided_at: new Date().toISOString(),
      created_at: "",
      updated_at: "",
    };

    const updatedResult = calculateContractRiskScore([mockFinding], [acceptedRedline]);
    expect(updatedResult.score).toBe(0);
    expect(updatedResult.level).toBe("Low");
    expect(updatedResult.recommendation).toBe("sign");
  });

  it("recommends reject when score >= 75 or 2+ unresolved critical issues exist", () => {
    const createCrit = (id: string): Finding => ({
      id,
      contract_id: "c1",
      clause_id: null,
      playbook_rule_id: null,
      finding_type: "deviation",
      severity: "critical",
      similarity: 0.8,
      deviation_summary: "Critical breach",
      playbook_requirement_excerpt: "",
      vendor_text_excerpt: "",
      risky_spans: [],
      plain_english: "",
      negotiation_priority: "must_fix",
      regulation_flags: [],
      suggested_clause: "",
      fallback_clause: "",
      walk_away_note: "",
      points: 25,
      created_at: "",
    });

    const res = calculateContractRiskScore([createCrit("1"), createCrit("2")], []);
    expect(res.unresolvedCriticalCount).toBe(2);
    expect(res.recommendation).toBe("reject");
  });
});
