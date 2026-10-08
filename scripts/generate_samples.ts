import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

const SAMPLE_MSA_TEXT = `MASTER SERVICES AGREEMENT (MSA)

This Master Services Agreement ("Agreement") is made effective as of October 1, 2026, by and between ApexCloud Solutions Ltd. ("Vendor") and Enterprise Procurement Partner ("Customer").

SECTION 1. DEFINITIONS AND SERVICES
Vendor agrees to provide Customer with access to cloud enterprise data integration and analytics workflows as described in applicable Order Forms.

SECTION 2. FEES, INVOICING AND PAYMENT PENALTIES
Customer shall pay all fees within seven (7) days of invoice date. In the event Customer fails to make payment when due, Customer shall pay a late fee penalty of five percent (5%) per month on all overdue amounts. Vendor reserves the right to immediately suspend or terminate Customer access without notice in the event of any billing dispute.

SECTION 3. TERM AND AUTOMATIC RENEWAL
The Initial Term of this Agreement shall be twelve (12) months. This Agreement shall automatically renew for successive two-year periods unless Customer delivers written notice of non-renewal to Vendor at least one hundred eighty (180) days prior to the expiration of the then-current term. Customer shall have no right of termination for convenience.

SECTION 4. INTELLECTUAL PROPERTY AND WORK PRODUCT
As between the parties, Vendor retains sole and exclusive ownership of all software, architectures, custom scripts, models, datasets, deliverables, and modifications created in connection with this Agreement. Customer hereby assigns all right, title, and interest in custom work product to Vendor.

SECTION 5. DATA PRIVACY AND SECURITY
Customer acknowledges that Vendor provides the platform on an "as-is" basis. In the event of any suspected data breach, Vendor will use commercially reasonable efforts to investigate at its sole discretion within reasonable time. Vendor offers no committed breach notification timeframe and no DPA is incorporated herein.

SECTION 6. ONE-SIDED INDEMNIFICATION
Customer shall defend, indemnify, and hold harmless Vendor, its affiliates, directors, officers, and employees against any and all third-party claims, liabilities, losses, costs, and damages arising out of or related to Customer's use of the Services. Vendor shall have no reciprocal obligation to defend or indemnify Customer against intellectual property infringement claims or regulatory fines.

SECTION 7. UNLIMITED LIABILITY FOR CUSTOMER AND VENDOR DISCLAIMER
CUSTOMER'S LIABILITY UNDER THIS AGREEMENT SHALL BE UNLIMITED. Customer agrees to unlimited liability for any breach of this Agreement. In contrast, Vendor disclaims all liability for direct, indirect, consequential, punitive, or incidental damages. IN NO EVENT SHALL VENDOR'S TOTAL AGGREGATE LIABILITY EXCEED ONE HUNDRED DOLLARS ($100.00).

SECTION 8. SERVICE LEVELS AND DOWNTIME
Vendor will use reasonable efforts to maintain platform availability, but provides no uptime SLA percentage commitment. Vendor offers no service credits or refunds for service outages or planned maintenance.

SECTION 9. GOVERNING LAW AND DISPUTE RESOLUTION
This Agreement shall be governed exclusively by the laws of the Cayman Islands. Any dispute arising out of this Agreement shall be adjudicated solely in the courts of George Town, Grand Cayman, and each party irrevocably waives any objection to venue or inconvenient forum.

SECTION 10. CONFIDENTIALITY
Customer shall maintain all Vendor proprietary pricing, documentation, and source code strictly confidential. Vendor's confidentiality obligations shall expire upon termination of this Agreement.
`;

async function main() {
  const samplesDir = path.join(process.cwd(), "samples");
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  // 1. Generate DOCX
  console.log("Generating samples/vendor_msa_sample.docx...");
  const paragraphs = SAMPLE_MSA_TEXT.split("\n\n").map((chunk) => {
    const lines = chunk.trim().split("\n");
    if (lines[0].startsWith("SECTION") || lines[0].startsWith("MASTER SERVICES")) {
      return new Paragraph({
        children: [new TextRun({ text: lines[0], bold: true, size: 24 })],
        spacing: { before: 200, after: 100 },
      });
    }
    return new Paragraph({
      children: [new TextRun({ text: chunk.trim(), size: 22 })],
      spacing: { after: 150 },
    });
  });

  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  });

  const docxBuffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(samplesDir, "vendor_msa_sample.docx"), docxBuffer);
  console.log("✅ DOCX generated.");

  // 2. Generate PDF
  console.log("Generating samples/vendor_msa_sample.pdf...");
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const lines = SAMPLE_MSA_TEXT.split("\n");
  let page = pdfDoc.addPage([595.28, 841.89]);
  let y = 800;

  for (const line of lines) {
    if (y < 60) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = 800;
    }

    if (line.startsWith("SECTION") || line.startsWith("MASTER SERVICES")) {
      page.drawText(line, {
        x: 50,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.2),
      });
      y -= 18;
    } else if (line.trim().length > 0) {
      // Wrap line roughly at 85 characters
      const words = line.split(" ");
      let currentLine = "";
      for (const w of words) {
        if ((currentLine + w).length > 85) {
          page.drawText(currentLine, { x: 50, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
          y -= 13;
          currentLine = w + " ";
          if (y < 60) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = 800;
          }
        } else {
          currentLine += w + " ";
        }
      }
      if (currentLine.trim()) {
        page.drawText(currentLine, { x: 50, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
        y -= 13;
      }
    } else {
      y -= 8;
    }
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(samplesDir, "vendor_msa_sample.pdf"), pdfBytes);
  console.log("✅ PDF generated.");
  console.log("🎉 Sample contracts successfully created in /samples/");
}

main().catch((err) => {
  console.error("Error generating samples:", err);
  process.exit(1);
});
