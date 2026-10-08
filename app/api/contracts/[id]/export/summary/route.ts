import { NextRequest, NextResponse } from "next/server";
import { db, DEFAULT_ORG_ID, DEFAULT_USER_ID } from "@/lib/db/store";
import { calculateContractRiskScore } from "@/lib/scoring";
import { generateExecutiveSummaryPdf } from "@/lib/export/pdf-summary";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contract = db.getContract(params.id);
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const findings = db.getFindings(params.id);
    const redlines = db.getRedlines(params.id);
    const riskResult = calculateContractRiskScore(findings, redlines);

    const pdfBytes = await generateExecutiveSummaryPdf({
      contract,
      findings,
      redlines,
      riskResult,
    });

    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: params.id,
      user_id: DEFAULT_USER_ID,
      action: "export_executive_summary_pdf",
      entity: "contracts",
      entity_id: params.id,
      metadata: { file_name: `${contract.vendor_name}_Risk_Summary.pdf` },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(contract.vendor_name)}_Executive_Summary.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
