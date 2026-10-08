import { NextRequest, NextResponse } from "next/server";
import { db, DEFAULT_ORG_ID } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  try {
    const activeUserId = db.getActiveUserId();

    // Create Audit Log
    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: null,
      user_id: activeUserId,
      action: "user_signout",
      entity: "auth",
      entity_id: activeUserId,
      metadata: { action: "User signed out of enterprise workspace" },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    const response = NextResponse.json({ success: true });

    // Expire the session cookie immediately
    response.cookies.set("lexiguard_session", "", {
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
