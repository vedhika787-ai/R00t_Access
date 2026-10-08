import { NextRequest, NextResponse } from "next/server";
import { db, DEFAULT_ORG_ID, DEFAULT_USER_ID } from "@/lib/db/store";
import { calculateContractRiskScore } from "@/lib/scoring";

export async function GET(
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
    const scoreSnapshots = db.getScoreSnapshots(params.id);
    const comments = db.getComments(params.id);

    const scoreResult = calculateContractRiskScore(findings, redlines);

    return NextResponse.json({
      contract,
      clauses,
      findings,
      redlines,
      scoreSnapshots,
      comments,
      riskResult: scoreResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contract = db.getContract(params.id);
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const success = db.deleteContract(params.id);

    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: params.id,
      user_id: DEFAULT_USER_ID,
      action: "delete_contract",
      entity: "contracts",
      entity_id: params.id,
      metadata: { title: contract.title },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
