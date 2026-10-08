import { Clause } from "@/types/database";

export interface SegmentedClause {
  order_index: number;
  clause_number: string | null;
  heading: string | null;
  text: string;
  page: number;
  char_start: number;
  char_end: number;
  category: string | null;
}

// Regex patterns to match legal headings and numbering
const CLAUSE_HEADING_REGEX =
  /(?:^(?:(?:Article|SECTION|Section|Clause|SCHEDULE|EXHIBIT|ATTACHMENT)\s+([0-9IVXLCDM]+(?:\.[0-9]+)*)[:.]?\s*([^\n\r]*))|^(?:([0-9]+(?:\.[0-9]+)*)\.?\s+([A-Z][^\n\r]{2,80}))|^([A-Z\s]{4,60}):?\s*$)/im;

/**
 * Splits legal contract text into structured clauses with headings, numbering, and offsets
 */
export function segmentContract(
  text: string,
  contractId: string = "",
  pages: Array<{ pageNumber: number; text: string }> = []
): SegmentedClause[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Normalize line endings
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const paragraphs = normalizedText.split(/\n{2,}/);

  const clauses: SegmentedClause[] = [];
  let currentOffset = 0;
  let orderIndex = 0;

  let currentHeading: string | null = null;
  let currentNumber: string | null = null;
  let currentBuffer: string[] = [];
  let clauseCharStart = 0;

  function determinePage(offset: number): number {
    if (pages.length === 0) return 1;
    let accumulated = 0;
    for (const page of pages) {
      accumulated += page.text.length;
      if (offset <= accumulated) return page.pageNumber;
    }
    return pages[pages.length - 1].pageNumber;
  }

  function flushCurrentClause(nextOffset: number) {
    if (currentBuffer.length === 0) return;
    const clauseText = currentBuffer.join("\n\n").trim();
    if (clauseText.length > 20) {
      clauses.push({
        order_index: orderIndex++,
        clause_number: currentNumber,
        heading: currentHeading || (currentNumber ? `Section ${currentNumber}` : `Clause ${orderIndex}`),
        text: clauseText,
        page: determinePage(clauseCharStart),
        char_start: clauseCharStart,
        char_end: clauseCharStart + clauseText.length,
        category: categorizeClauseHeading(currentHeading, clauseText),
      });
    }
    currentBuffer = [];
  }

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (!p) continue;

    const pOffset = normalizedText.indexOf(p, currentOffset);
    const actualOffset = pOffset !== -1 ? pOffset : currentOffset;

    // Check if the paragraph starts with or is a clause heading
    const firstLine = p.split("\n")[0].trim();
    const headingMatch = firstLine.match(CLAUSE_HEADING_REGEX);

    if (headingMatch) {
      // Flush previous clause
      flushCurrentClause(actualOffset);

      clauseCharStart = actualOffset;
      const numCandidate = headingMatch[1] || headingMatch[3] || null;
      const titleCandidate = (headingMatch[2] || headingMatch[4] || headingMatch[5] || "").trim();

      currentNumber = numCandidate;
      currentHeading = titleCandidate || (numCandidate ? `Section ${numCandidate}` : firstLine);

      // Remaining lines after the heading in this paragraph
      const remainingLines = p.split("\n").slice(1).join("\n").trim();
      if (remainingLines) {
        currentBuffer.push(remainingLines);
      } else {
        // Just the heading line alone; the body will be in following paragraphs
        currentBuffer.push(firstLine);
      }
    } else {
      if (!currentHeading) {
        // No active heading; treat this paragraph as an independent section
        clauseCharStart = actualOffset;
        currentBuffer = [p];
        flushCurrentClause(actualOffset + p.length);
      } else {
        // Sub-paragraph under the active heading
        currentBuffer.push(p);
        const bufferLength = currentBuffer.join("\n\n").length;
        if (bufferLength > 1500) {
          flushCurrentClause(actualOffset + p.length);
          currentHeading = null;
          currentNumber = null;
        }
      }
    }

    currentOffset = actualOffset + p.length;
  }

  // Flush remaining
  flushCurrentClause(currentOffset);

  // Fallback: If no structured clauses found (e.g., flat text), chunk by paragraph
  if (clauses.length === 0) {
    let offset = 0;
    paragraphs.forEach((p, idx) => {
      const clean = p.trim();
      if (clean.length > 30) {
        clauses.push({
          order_index: idx,
          clause_number: `${idx + 1}`,
          heading: `Section ${idx + 1}`,
          text: clean,
          page: determinePage(offset),
          char_start: offset,
          char_end: offset + clean.length,
          category: categorizeClauseHeading("", clean),
        });
      }
      offset += p.length + 2;
    });
  }

  return clauses;
}

/**
 * Assign initial heuristic category based on clause keywords
 */
export function categorizeClauseHeading(heading: string | null, text: string): string {
  const combined = ((heading || "") + " " + text.slice(0, 300)).toLowerCase();

  if (/liabilit|damages cap|limitation of/i.test(combined)) return "liability";
  if (/indemnif|hold harmless|defend/i.test(combined)) return "indemnification";
  if (/privacy|personal data|gdpr|dpdp|breach notice/i.test(combined)) return "data_privacy";
  if (/payment|fee|invoice|interest|late/i.test(combined)) return "payment_penalties";
  if (/terminat|convenience|cure period|auto-renew|expiration/i.test(combined)) return "termination";
  if (/intellectual property|patent|copyright|ownership|work product/i.test(combined)) return "ip";
  if (/governing law|jurisdiction|arbitrat|venue/i.test(combined)) return "governing_law";
  if (/confident|nondisclosure|trade secret/i.test(combined)) return "confidentiality";
  if (/service level|sla|uptime|credit|maintenance/i.test(combined)) return "sla";
  if (/insurance|coverage|policy limit/i.test(combined)) return "insurance";
  return "other";
}
