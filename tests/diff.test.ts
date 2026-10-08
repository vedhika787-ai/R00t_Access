import { describe, it, expect } from "vitest";
import { computeWordDiff, renderDiffHtml } from "../lib/diff";

describe("Word-Level Diff Engine", () => {
  it("identifies insertions and deletions accurately at word level", () => {
    const original = "Customer shall pay within 7 days.";
    const proposed = "Customer shall pay within 45 days.";

    const diffs = computeWordDiff(original, proposed);
    expect(diffs.length).toBeGreaterThan(0);

    const hasDelete = diffs.some((d) => d.type === "delete" && d.value.includes("7"));
    const hasInsert = diffs.some((d) => d.type === "insert" && d.value.includes("45"));

    expect(hasDelete).toBe(true);
    expect(hasInsert).toBe(true);
  });

  it("renders valid semantic HTML with del and ins tags", () => {
    const diffs = [
      { type: "equal" as const, value: "Keep " },
      { type: "delete" as const, value: "old" },
      { type: "insert" as const, value: "new" },
    ];

    const html = renderDiffHtml(diffs);
    expect(html).toContain("<del");
    expect(html).toContain("old</del>");
    expect(html).toContain("<ins");
    expect(html).toContain("new</ins>");
  });
});
