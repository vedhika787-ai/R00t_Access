import { NextRequest, NextResponse } from "next/server";
import { db, DEFAULT_ORG_ID } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    const contractId = searchParams.get("contract_id");

    let logs = db.getAuditLogs(DEFAULT_ORG_ID);
    if (contractId) {
      logs = logs.filter((l) => l.contract_id === contractId);
    }

    if (format === "csv") {
      let csv = "Timestamp,Action,Entity,Entity_ID,Contract_ID,IP\n";
      for (const log of logs) {
        csv += `"${log.created_at}","${log.action}","${log.entity}","${log.entity_id || ""}","${log.contract_id || ""}","${log.ip || ""}"\n`;
      }
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="LexiGuard_Audit_Trail.csv"',
        },
      });
    }

    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
