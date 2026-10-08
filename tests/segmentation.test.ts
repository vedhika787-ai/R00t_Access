import { describe, it, expect } from "vitest";
import { segmentContract, categorizeClauseHeading } from "../lib/segmentation";

describe("Clause Segmentation Engine", () => {
  it("segments numbered sections and calculates character offsets correctly", () => {
    const rawText = `SECTION 1. DEFINITIONS AND SERVICES
Vendor agrees to provide Customer with access to cloud enterprise workflows.

SECTION 2. LIMITATION OF LIABILITY
Customer agrees that liability shall not be limited for any damages incurred.

SECTION 3. GOVERNING LAW
This agreement is governed by the laws of India.`;

    const clauses = segmentContract(rawText, "test-contract");

    expect(clauses.length).toBe(3);
    expect(clauses[0].heading).toContain("DEFINITIONS");
    expect(clauses[1].heading).toContain("LIMITATION OF LIABILITY");
    expect(clauses[1].category).toBe("liability");
    expect(clauses[2].category).toBe("governing_law");

    // Check offsets
    expect(clauses[0].char_start).toBeGreaterThanOrEqual(0);
    expect(clauses[0].char_end).toBeGreaterThan(clauses[0].char_start);
  });

  it("categorizes clause categories based on legal terminology", () => {
    expect(categorizeClauseHeading("Limitation of Liability", "Aggregate damages shall be capped")).toBe("liability");
    expect(categorizeClauseHeading("Indemnification", "Party shall defend and hold harmless")).toBe("indemnification");
    expect(categorizeClauseHeading("Data Privacy", "DPDP Act and GDPR compliance")).toBe("data_privacy");
    expect(categorizeClauseHeading("Term and Termination", "Termination for convenience with 30 days notice")).toBe("termination");
  });

  it("handles fallback chunking for flat documents without headings", () => {
    const flatText = `This is paragraph one containing terms and conditions that exceed thirty characters in total length.

This is paragraph two containing payment obligations and schedule details that also exceed thirty characters.`;

    const clauses = segmentContract(flatText);
    expect(clauses.length).toBe(2);
    expect(clauses[0].order_index).toBe(0);
    expect(clauses[1].order_index).toBe(1);
  });
});
