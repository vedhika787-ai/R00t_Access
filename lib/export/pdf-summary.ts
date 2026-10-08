import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Contract, Finding, Redline } from "@/types/database";
import { RiskScoreResult } from "../scoring";

export interface SummaryExportData {
  contract: Contract;
  findings: Finding[];
  redlines: Redline[];
  riskResult: RiskScoreResult;
}

/**
 * Generates an executive legal summary PDF with risk metrics, category breakdown, and key action items
 */
export async function generateExecutiveSummaryPdf(data: SummaryExportData): Promise<Uint8Array> {
  const { contract, findings, redlines, riskResult } = data;
  const pdfDoc = await PDFDocument.create();

  // Page 1: Executive Overview & Risk Scorecard
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Corporate Header Bar
  page.drawRectangle({
    x: 0,
    y: height - 70,
    width: width,
    height: 70,
    color: rgb(0.06, 0.09, 0.16), // Dark Navy #0f172a
  });

  page.drawText("LEXIGUARD", {
    x: 40,
    y: height - 42,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("ENTERPRISE CONTRACT RISK SCORECARD", {
    x: 180,
    y: height - 40,
    size: 11,
    font: fontBold,
    color: rgb(0.5, 0.6, 0.9),
  });

  let currentY = height - 100;

  // Metadata Panel
  page.drawText("CONTRACT OVERVIEW", {
    x: 40,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });
  currentY -= 18;

  page.drawText(`Vendor Name: ${contract.vendor_name}`, { x: 40, y: currentY, size: 10, font: fontRegular });
  page.drawText(`Document Title: ${contract.title}`, { x: 300, y: currentY, size: 10, font: fontRegular });
  currentY -= 15;

  page.drawText(`Analysis Date: ${new Date(contract.created_at).toLocaleDateString()}`, { x: 40, y: currentY, size: 10, font: fontRegular });
  page.drawText(`Review Status: ${contract.status.toUpperCase()}`, { x: 300, y: currentY, size: 10, font: fontRegular });
  currentY -= 25;

  // Score Box
  const scoreBoxColor =
    riskResult.score >= 75
      ? rgb(0.94, 0.27, 0.27)
      : riskResult.score >= 50
      ? rgb(0.98, 0.45, 0.09)
      : riskResult.score >= 25
      ? rgb(0.96, 0.62, 0.04)
      : rgb(0.06, 0.73, 0.51);

  page.drawRectangle({
    x: 40,
    y: currentY - 70,
    width: width - 80,
    height: 70,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  page.drawText("RISK SCORE", {
    x: 60,
    y: currentY - 24,
    size: 10,
    font: fontBold,
    color: rgb(0.3, 0.35, 0.45),
  });

  page.drawText(`${riskResult.score}/100`, {
    x: 60,
    y: currentY - 55,
    size: 26,
    font: fontBold,
    color: scoreBoxColor,
  });

  page.drawText(`Level: ${riskResult.level.toUpperCase()}`, {
    x: 180,
    y: currentY - 25,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });

  page.drawText(`Recommendation: ${riskResult.recommendation.toUpperCase()}`, {
    x: 180,
    y: currentY - 42,
    size: 11,
    font: fontBold,
    color: scoreBoxColor,
  });

  page.drawText(riskResult.recommendationReason.slice(0, 75), {
    x: 180,
    y: currentY - 58,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.35, 0.4, 0.45),
  });

  currentY -= 95;

  // Key Finding Statistics
  page.drawText("DEVIATION METRICS", {
    x: 40,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });
  currentY -= 18;

  const statText = `Critical: ${riskResult.unresolvedCriticalCount}   |   High: ${riskResult.unresolvedHighCount}   |   Medium: ${riskResult.unresolvedMediumCount}   |   Low: ${riskResult.unresolvedLowCount}   |   Missing Mandatory: ${riskResult.missingClausesCount}`;
  page.drawText(statText, {
    x: 40,
    y: currentY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.3),
  });
  currentY -= 25;

  // Category Breakdown
  page.drawText("CATEGORY RISK BREAKDOWN", {
    x: 40,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });
  currentY -= 18;

  const categories = Object.entries(riskResult.breakdown);
  for (const [cat, pts] of categories.slice(0, 6)) {
    page.drawText(`• ${cat.replace(/_/g, " ").toUpperCase()}: ${pts} points`, {
      x: 50,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: rgb(0.15, 0.2, 0.25),
    });
    currentY -= 14;
  }
  currentY -= 15;

  // Top Deal Breakers
  page.drawText("TOP PRIORITY REDLINES & DEAL BREAKERS", {
    x: 40,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });
  currentY -= 18;

  const topFindings = findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 3);

  if (topFindings.length === 0) {
    page.drawText("No critical policy violations found.", {
      x: 50,
      y: currentY,
      size: 9.5,
      font: fontOblique,
      color: rgb(0.4, 0.45, 0.5),
    });
    currentY -= 20;
  } else {
    for (const f of topFindings) {
      page.drawText(`[${f.severity.toUpperCase()}] ${f.deviation_summary.slice(0, 90)}`, {
        x: 50,
        y: currentY,
        size: 9,
        font: fontBold,
        color: rgb(0.8, 0.1, 0.1),
      });
      currentY -= 14;

      page.drawText(`Action: ${f.plain_english.slice(0, 110)}`, {
        x: 60,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: rgb(0.3, 0.35, 0.4),
      });
      currentY -= 18;
    }
  }

  // Legal Disclaimer Footer
  page.drawLine({
    start: { x: 40, y: 45 },
    end: { x: width - 40, y: 45 },
    thickness: 0.5,
    color: rgb(0.8, 0.85, 0.9),
  });

  page.drawText(
    "LEGAL DISCLAIMER: AI-assisted analysis generated by LexiGuard. Not legal advice. Final execution requires qualified legal review.",
    {
      x: 40,
      y: 30,
      size: 7.5,
      font: fontOblique,
      color: rgb(0.45, 0.5, 0.55),
    }
  );

  return pdfDoc.save();
}
