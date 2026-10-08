import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  const activeRules = db.getPlaybookRules();
  const contractsCount = db.getContracts().length;

  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "LexiGuard Contract Risk & Redline Assistant",
    version: "1.0.0",
    database: "connected",
    activeRulesCount: activeRules.length,
    contractsCount,
  });
}
