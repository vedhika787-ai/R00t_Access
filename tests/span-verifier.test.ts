import { describe, it, expect } from "vitest";
import {
  verifyAndResolveSpans,
  resolveOverlappingSpans,
  buildHighlightedHtml,
} from "../lib/ai/span-verifier";

describe("Anti-Hallucination Span Verifier", () => {
  const clause = "Customer agrees that liability shall be unlimited and without notice.";

  it("verifies exact quotes and computes true character offsets", () => {
    const rawSpans = [
      { quote: "unlimited", reason: "Uncapped liability" },
      { quote: "without notice", reason: "Immediate action" },
    ];

    const verified = verifyAndResolveSpans(clause, rawSpans);
    expect(verified.length).toBe(2);
    expect(verified[0].quote).toBe("unlimited");
    expect(verified[0].start).toBe(40);
    expect(verified[0].end).toBe(49);
    expect(clause.slice(verified[0].start, verified[0].end)).toBe("unlimited");
  });

  it("drops hallucinated quotes that do not exist in the source clause", () => {
    const rawSpans = [
      { quote: "unlimited", reason: "Valid quote" },
      { quote: "fake non-existent phrase in contract", reason: "Hallucinated" },
    ];

    const verified = verifyAndResolveSpans(clause, rawSpans);
    expect(verified.length).toBe(1);
    expect(verified[0].quote).toBe("unlimited");
  });

  it("resolves and merges overlapping span intervals safely", () => {
    const overlapping = [
      { start: 10, end: 25, quote: "phrase one", reason: "Reason 1" },
      { start: 20, end: 35, quote: "phrase two", reason: "Reason 2" },
    ];

    const resolved = resolveOverlappingSpans(overlapping);
    expect(resolved.length).toBe(1);
    expect(resolved[0].start).toBe(10);
    expect(resolved[0].end).toBe(35);
  });

  it("constructs safe highlighted HTML without corruption", () => {
    const spans = [{ start: 0, end: 8, quote: "Customer", reason: "Party" }];
    const html = buildHighlightedHtml("Customer test", spans);
    expect(html).toContain('<mark class="lexi-highlight"');
    expect(html).toContain("Customer</mark>");
  });
});
