import DiffMatchPatch from "diff-match-patch";

export interface WordDiffChunk {
  type: "equal" | "insert" | "delete";
  value: string;
}

const dmp = new DiffMatchPatch();

/**
 * Computes word-level diff between original clause text and proposed replacement text
 */
export function computeWordDiff(originalText: string, proposedText: string): WordDiffChunk[] {
  if (originalText === proposedText) {
    return [{ type: "equal", value: originalText }];
  }

  // Tokenize by word boundaries so diff operates on words rather than individual characters
  const { words1, words2, lineArray } = linesToWords(originalText, proposedText);

  const diffs = dmp.diff_main(words1, words2, false);
  dmp.diff_charsToLines_(diffs, lineArray);

  return diffs.map(([op, text]) => {
    let type: "equal" | "insert" | "delete" = "equal";
    if (op === 1) type = "insert";
    if (op === -1) type = "delete";
    return { type, value: text };
  });
}

/**
 * Word tokenizer mapping for diff_match_patch character-based engine
 */
function linesToWords(text1: string, text2: string) {
  const lineArray: string[] = [];
  const lineHash: Record<string, number> = {};

  lineArray[0] = "";

  function wordsToCharsMunge(text: string): string {
    let chars = "";
    // Match words, spaces, punctuation
    const words = text.match(/[\w]+|[^\w\s]+|\s+/g) || [];
    for (const word of words) {
      if (lineHash.hasOwnProperty(word)) {
        chars += String.fromCharCode(lineHash[word]);
      } else {
        lineHash[word] = lineArray.length;
        lineArray.push(word);
        chars += String.fromCharCode(lineArray.length - 1);
      }
    }
    return chars;
  }

  const words1 = wordsToCharsMunge(text1);
  const words2 = wordsToCharsMunge(text2);
  return { words1, words2, lineArray };
}

/**
 * Render diff into formatted HTML for preview
 */
export function renderDiffHtml(chunks: WordDiffChunk[]): string {
  return chunks
    .map((chunk) => {
      const escaped = escapeHtml(chunk.value);
      if (chunk.type === "delete") {
        return `<del class="bg-red-500/20 text-red-400 line-through rounded px-0.5">${escaped}</del>`;
      }
      if (chunk.type === "insert") {
        return `<ins class="bg-emerald-500/20 text-emerald-400 underline decoration-2 rounded px-0.5">${escaped}</ins>`;
      }
      return `<span>${escaped}</span>`;
    })
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
