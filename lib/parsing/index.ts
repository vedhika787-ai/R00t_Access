import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export interface ParsedDocument {
  text: string;
  pages: Array<{ pageNumber: number; text: string }>;
  pageCount: number;
  fileType: "pdf" | "docx";
}

export class ParsingError extends Error {
  constructor(message: string, public code: string = "PARSING_ERROR") {
    super(message);
    this.name = "ParsingError";
  }
}

/**
 * Validates magic bytes of the file buffer to prevent MIME-spoofing
 */
export function validateMagicBytes(buffer: Buffer, declaredType: string): "pdf" | "docx" {
  if (buffer.length < 4) {
    throw new ParsingError("File is too small or corrupted.", "CORRUPT_FILE");
  }

  // PDF magic bytes: %PDF (0x25 0x50 0x44 0x46)
  const isPdf =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46;

  // DOCX (Zip archive): PK\x03\x04 (0x50 0x4B 0x03 0x04)
  const isDocx =
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;

  if (isPdf) return "pdf";
  if (isDocx) return "docx";

  throw new ParsingError(
    `Unsupported or invalid file format. File does not match valid PDF (%PDF) or DOCX (PK ZIP) signatures. Declared type: ${declaredType}`,
    "INVALID_MAGIC_BYTES"
  );
}

/**
 * Parse PDF document and extract page-by-page text
 */
export async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const data = await pdfParse(buffer);
    const fullText = (data.text || "").trim();

    // Split pages by form feed (\f) if available, or simulate based on numpages
    const rawPages = fullText.split("\f");
    const pages: Array<{ pageNumber: number; text: string }> = [];

    if (rawPages.length > 1) {
      rawPages.forEach((p, idx) => {
        pages.push({ pageNumber: idx + 1, text: p.trim() });
      });
    } else {
      const pageCount = data.numpages || 1;
      const charsPerPage = Math.max(1, Math.ceil(fullText.length / pageCount));
      for (let i = 0; i < pageCount; i++) {
        pages.push({
          pageNumber: i + 1,
          text: fullText.slice(i * charsPerPage, (i + 1) * charsPerPage).trim(),
        });
      }
    }

    // Check for scanned or image-only PDF
    const cleanChars = fullText.replace(/[\s\r\n\t]+/g, "");
    if (cleanChars.length < 50) {
      throw new ParsingError(
        "This PDF appears to be a scanned image or contains no selectable digital text. LexiGuard requires searchable text documents. Please run OCR or upload a text-based PDF/DOCX.",
        "SCANNED_PDF_DETECTED"
      );
    }

    return {
      text: fullText,
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: fullText }],
      pageCount: data.numpages || (pages.length > 0 ? pages.length : 1),
      fileType: "pdf",
    };
  } catch (err: any) {
    if (err instanceof ParsingError) throw err;
    throw new ParsingError(`Failed to parse PDF document: ${err.message}`, "PDF_PARSE_FAILED");
  }
}

/**
 * Parse DOCX document using Mammoth
 */
export async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const fullText = (result.value || "").trim();

    if (fullText.length < 50) {
      throw new ParsingError(
        "The DOCX file contains insufficient text for legal analysis.",
        "EMPTY_DOCX"
      );
    }

    // DOCX does not have native page boundaries in raw text, simulate by 3000 chars per page
    const pageSize = 3000;
    const pageCount = Math.max(1, Math.ceil(fullText.length / pageSize));
    const pages: Array<{ pageNumber: number; text: string }> = [];

    for (let i = 0; i < pageCount; i++) {
      pages.push({
        pageNumber: i + 1,
        text: fullText.slice(i * pageSize, (i + 1) * pageSize).trim(),
      });
    }

    return {
      text: fullText,
      pages,
      pageCount,
      fileType: "docx",
    };
  } catch (err: any) {
    if (err instanceof ParsingError) throw err;
    throw new ParsingError(`Failed to parse DOCX document: ${err.message}`, "DOCX_PARSE_FAILED");
  }
}

/**
 * Master parser entrypoint
 */
export async function parseContractFile(
  buffer: Buffer,
  declaredMimeOrExt: string
): Promise<ParsedDocument> {
  const maxBytes = 15 * 1024 * 1024; // 15 MB
  if (buffer.length > maxBytes) {
    throw new ParsingError("File exceeds the maximum allowed size of 15 MB.", "FILE_TOO_LARGE");
  }

  const detectedType = validateMagicBytes(buffer, declaredMimeOrExt);

  if (detectedType === "pdf") {
    return parsePdf(buffer);
  } else {
    return parseDocx(buffer);
  }
}
