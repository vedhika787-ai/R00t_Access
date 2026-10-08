import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, DEFAULT_ORG_ID, DEFAULT_USER_ID } from "@/lib/db/store";
import { calculateContractRiskScore } from "@/lib/scoring";

const UpdateRedlineSchema = z.object({
  status: z.enum(["pending", "accepted", "rejected", "edited"]),
  final_text: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const json = await req.json();
    const body = UpdateRedlineSchema.parse(json);

    const redline = db.getRedline(params.id);
    if (!redline) {
      return NextResponse.json({ error: "Redline not found" }, { status: 404 });
    }

    const updated = db.updateRedline(params.id, {
      status: body.status,
      final_text: body.final_text ?? redline.final_text,
      decided_by: DEFAULT_USER_ID,
      decided_at: new Date().toISOString(),
    });

    if (!updated) {
      return NextResponse.json({ error: "Failed to update redline" }, { status: 500 });
    }

    // Recalculate contract risk score live
    const contractId = redline.contract_id;
    const findings = db.getFindings(contractId);
    const redlines = db.getRedlines(contractId);

    const scoreResult = calculateContractRiskScore(findings, redlines);

    // Persist new current score on contract
    db.updateContract(contractId, {
      risk_score_current: scoreResult.score,
      recommendation: scoreResult.recommendation,
    });

    // Create score snapshot
    db.createScoreSnapshot({
      id: crypto.randomUUID(),
      contract_id: contractId,
      score: scoreResult.score,
      breakdown: scoreResult.breakdown,
      trigger: "redline_change",
      created_at: new Date().toISOString(),
    });

    // Audit log
    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: contractId,
      user_id: DEFAULT_USER_ID,
      action: `redline_${body.status}`,
      entity: "redlines",
      entity_id: params.id,
      metadata: {
        new_status: body.status,
        new_score: scoreResult.score,
      },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      redline: updated,
      newScore: scoreResult.score,
      newLevel: scoreResult.level,
      newRecommendation: scoreResult.recommendation,
      riskResult: scoreResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
