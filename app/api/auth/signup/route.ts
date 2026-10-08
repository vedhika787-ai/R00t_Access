import { NextRequest, NextResponse } from "next/server";
import { db, DEFAULT_ORG_ID } from "@/lib/db/store";
import { UserRole } from "@/types/database";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { orgName, fullName, email, password, role } = json;

    const userRole = (role as UserRole) || "admin";
    const displayName = fullName || (email ? email.split("@")[0] : "New Counsel");

    const newProfile = db.createProfile({
      id: crypto.randomUUID(),
      full_name: displayName,
      role: userRole,
      organization_id: DEFAULT_ORG_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    db.setActiveUserId(newProfile.id);

    // Create Audit Log
    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: null,
      user_id: newProfile.id,
      action: "user_signup",
      entity: "auth",
      entity_id: newProfile.id,
      metadata: {
        organization: orgName || "Enterprise Workspace",
        name: newProfile.full_name,
        role: newProfile.role,
        email,
      },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    const response = NextResponse.json({
      success: true,
      profile: newProfile,
    });

    // Set session cookie
    response.cookies.set("lexiguard_session", newProfile.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
