import { NextRequest, NextResponse } from "next/server";
import { db, DEFAULT_ORG_ID, DEFAULT_USER_ID } from "@/lib/db/store";
import { generateRedlinedDocx } from "@/lib/export/docx-redline";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contract = db.getContract(params.id);
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const clauses = db.getClauses(params.id);
    const findings = db.getFindings(params.id);
    const redlines = db.getRedlines(params.id);

    const docxBuffer = await generateRedlinedDocx({
      contract,
      clauses,
      findings,
      redlines,
    });

    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: params.id,
      user_id: DEFAULT_USER_ID,
      action: "export_redline_docx",
      entity: "contracts",
      entity_id: params.id,
      metadata: { file_name: `${contract.vendor_name}_Redlined.docx` },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(contract.vendor_name)}_Redlined.docx"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
