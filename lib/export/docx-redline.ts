import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { Contract, Clause, Redline, Finding } from "@/types/database";

export interface DocxExportInput {
  contract: Contract;
  clauses: Clause[];
  findings: Finding[];
  redlines: Redline[];
}

/**
 * Exports contract with redlines and negotiated replacements into a clean DOCX document
 */
export async function generateRedlinedDocx(input: DocxExportInput): Promise<Buffer> {
  const { contract, clauses, redlines } = input;
  const redlineMap = new Map<string, Redline>();
  for (const r of redlines) {
    redlineMap.set(r.finding_id, r);
  }

  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: contract.title || "Vendor Agreement (Negotiated Redline)",
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Vendor: ", bold: true }),
        new TextRun({ text: contract.vendor_name }),
        new TextRun({ text: "   |   Exported via LexiGuard", italics: true }),
      ],
      spacing: { after: 400 },
    }),
  ];

  for (const clause of clauses) {
    // Heading
    if (clause.heading) {
      paragraphs.push(
        new Paragraph({
          text: clause.heading,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      );
    }

    // Check if there is an accepted or edited redline for this clause
    const clauseFinding = input.findings.find((f) => f.clause_id === clause.id);
    const redline = clauseFinding ? redlineMap.get(clauseFinding.id) : null;

    if (redline && (redline.status === "accepted" || redline.status === "edited")) {
      const activeReplacement = redline.final_text || redline.proposed_text;
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "[REVISED CLAUSE - ACCEPTED REDLINE]: ",
              bold: true,
              color: "15803D",
            }),
            new TextRun({
              text: activeReplacement,
              color: "166534",
            }),
          ],
          spacing: { after: 200 },
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: clause.text,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
