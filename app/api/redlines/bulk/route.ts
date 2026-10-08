import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, DEFAULT_ORG_ID, DEFAULT_USER_ID } from "@/lib/db/store";
import { calculateContractRiskScore } from "@/lib/scoring";

const BulkActionSchema = z.object({
  contract_id: z.string(),
  action: z.enum(["accept_all_low", "reject_all", "accept_all"]),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { contract_id, action } = BulkActionSchema.parse(json);

    const findings = db.getFindings(contract_id);
    const redlines = db.getRedlines(contract_id);

    let updatedCount = 0;

    for (const r of redlines) {
      const finding = findings.find((f) => f.id === r.finding_id);

      if (action === "accept_all") {
        db.updateRedline(r.id, {
          status: "accepted",
          decided_by: DEFAULT_USER_ID,
          decided_at: new Date().toISOString(),
        });
        updatedCount++;
      } else if (action === "reject_all") {
        db.updateRedline(r.id, {
          status: "rejected",
          decided_by: DEFAULT_USER_ID,
          decided_at: new Date().toISOString(),
        });
        updatedCount++;
      } else if (action === "accept_all_low") {
        if (finding && (finding.severity === "low" || finding.severity === "medium")) {
          db.updateRedline(r.id, {
            status: "accepted",
            decided_by: DEFAULT_USER_ID,
            decided_at: new Date().toISOString(),
          });
          updatedCount++;
        }
      }
    }

    // Live re-score
    const refreshedRedlines = db.getRedlines(contract_id);
    const scoreResult = calculateContractRiskScore(findings, refreshedRedlines);

    db.updateContract(contract_id, {
      risk_score_current: scoreResult.score,
      recommendation: scoreResult.recommendation,
    });

    db.createScoreSnapshot({
      id: crypto.randomUUID(),
      contract_id,
      score: scoreResult.score,
      breakdown: scoreResult.breakdown,
      trigger: "redline_change",
      created_at: new Date().toISOString(),
    });

    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id,
      user_id: DEFAULT_USER_ID,
      action: `bulk_${action}`,
      entity: "redlines",
      entity_id: null,
      metadata: { updatedCount, newScore: scoreResult.score },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      updatedCount,
      riskResult: scoreResult,
      redlines: refreshedRedlines,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
