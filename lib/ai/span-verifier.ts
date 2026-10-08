import { RiskySpan } from "@/types/database";

export interface VerifiedSpan {
  start: number;
  end: number;
  quote: string;
  reason: string;
}

/**
 * Verifies that quoted spans returned by the LLM exist in the source clause text.
 * Resolves character start and end offsets, handles whitespace normalization,
 * drops unverified spans, and resolves overlapping span intervals.
 */
export function verifyAndResolveSpans(
  clauseText: string,
  rawSpans: Array<{ quote: string; reason: string }>
): VerifiedSpan[] {
  if (!clauseText || !rawSpans || rawSpans.length === 0) {
    return [];
  }

  const verified: VerifiedSpan[] = [];
  const lowerClause = clauseText.toLowerCase();

  for (const span of rawSpans) {
    const rawQuote = (span.quote || "").trim();
    if (!rawQuote || rawQuote.length < 3) continue;

    // 1. Direct exact or lowercase match
    let startIdx = clauseText.indexOf(rawQuote);
    let matchedLength = rawQuote.length;

    if (startIdx === -1) {
      startIdx = lowerClause.indexOf(rawQuote.toLowerCase());
    }

    // 2. Normalized whitespace match if single-line mismatch occurred
    if (startIdx === -1) {
      const normalizedQuote = rawQuote.replace(/\s+/g, " ");
      const normalizedClause = clauseText.replace(/\s+/g, " ");
      const normStart = normalizedClause.toLowerCase().indexOf(normalizedQuote.toLowerCase());

      if (normStart !== -1) {
        // Map back to original text roughly by searching first and last token
        const tokens = normalizedQuote.split(" ");
        const firstToken = tokens[0].toLowerCase();
        const lastToken = tokens[tokens.length - 1].toLowerCase();

        const firstPos = lowerClause.indexOf(firstToken);
        if (firstPos !== -1) {
          const lastPos = lowerClause.indexOf(lastToken, firstPos);
          if (lastPos !== -1 && lastPos - firstPos < normalizedQuote.length * 2) {
            startIdx = firstPos;
            matchedLength = lastPos + lastToken.length - firstPos;
          }
        }
      }
    }

    // If verified, record true character offsets
    if (startIdx !== -1) {
      const actualQuote = clauseText.slice(startIdx, startIdx + matchedLength);
      verified.push({
        start: startIdx,
        end: startIdx + matchedLength,
        quote: actualQuote,
        reason: span.reason || "Deviation flagged by policy",
      });
    } else {
      console.warn(`[SpanVerifier] Dropped hallucinated quote: "${rawQuote}" not found in clause.`);
    }
  }

  // 3. Resolve Overlaps: Sort by start asc, length desc
  return resolveOverlappingSpans(verified);
}

/**
 * Merges or resolves overlapping intervals so highlights do not corrupt markup
 */
export function resolveOverlappingSpans(spans: VerifiedSpan[]): VerifiedSpan[] {
  if (spans.length <= 1) return spans;

  // Sort by start offset ascending, then by duration descending
  const sorted = [...spans].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  const merged: VerifiedSpan[] = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    if (next.start < current.end) {
      // Overlap detected: extend current end or combine reason if next extends further
      if (next.end > current.end) {
        current = {
          start: current.start,
          end: next.end,
          quote: current.quote + "... " + next.quote,
          reason: `${current.reason}; ${next.reason}`,
        };
      }
    } else {
      merged.push(current);
      current = next;
    }
  }

  merged.push(current);
  return merged;
}

/**
 * Builds HTML text with highlights from verified spans safely without raw injection
 */
export function buildHighlightedHtml(
  clauseText: string,
  spans: VerifiedSpan[],
  severityColor: string = "#ef4444"
): string {
  if (!spans || spans.length === 0) {
    return escapeHtml(clauseText);
  }

  let html = "";
  let lastIndex = 0;

  for (const span of spans) {
    // text before highlight
    if (span.start > lastIndex) {
      html += escapeHtml(clauseText.slice(lastIndex, span.start));
    }

    // highlighted span
    const spanText = escapeHtml(clauseText.slice(span.start, span.end));
    const escapedReason = escapeHtml(span.reason);
    html += `<mark class="lexi-highlight" data-reason="${escapedReason}" style="background-color: ${severityColor}26; color: ${severityColor}; border-bottom: 2px solid ${severityColor}; padding: 1px 4px; border-radius: 3px; font-weight: 500;">${spanText}</mark>`;

    lastIndex = span.end;
  }

  if (lastIndex < clauseText.length) {
    html += escapeHtml(clauseText.slice(lastIndex));
  }

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
