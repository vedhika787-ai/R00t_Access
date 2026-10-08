import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const findings = db.getFindings(params.id);
    return NextResponse.json({ findings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
