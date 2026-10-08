import { NextRequest, NextResponse } from "next/server";
import { db, DEFAULT_ORG_ID } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { email, password, role, userId } = json;

    const allProfiles = db.getProfiles(DEFAULT_ORG_ID);
    let matchedProfile = null;

    if (userId) {
      matchedProfile = allProfiles.find((p) => p.id === userId);
    } else if (role) {
      matchedProfile = allProfiles.find((p) => p.role === role);
    } else if (email) {
      // Find matching profile or default
      matchedProfile = allProfiles.find(
        (p) => p.full_name.toLowerCase().includes(email.split("@")[0].toLowerCase())
      ) || allProfiles[0];
    } else {
      matchedProfile = allProfiles[0];
    }

    if (!matchedProfile) {
      matchedProfile = allProfiles[0];
    }

    // Set active user in memory store
    db.setActiveUserId(matchedProfile.id);

    // Create Audit Log
    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: null,
      user_id: matchedProfile.id,
      action: "user_signin",
      entity: "auth",
      entity_id: matchedProfile.id,
      metadata: {
        email: email || `${matchedProfile.full_name.toLowerCase().replace(/\s+/g, ".")}@lexiguard.internal`,
        role: matchedProfile.role,
        name: matchedProfile.full_name,
      },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    const response = NextResponse.json({
      success: true,
      profile: matchedProfile,
    });

    // Set session cookie
    response.cookies.set("lexiguard_session", matchedProfile.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
      httpOnly: false, // Allow client reading for auth state check
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
