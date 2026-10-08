import { NextRequest, NextResponse } from "next/server";
import { db, DEFAULT_ORG_ID } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  try {
    const contracts = db.getContracts(DEFAULT_ORG_ID);
    return NextResponse.json({ contracts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
