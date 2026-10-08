import { NextRequest, NextResponse } from "next/server";
import { db, DEFAULT_ORG_ID } from "@/lib/db/store";
import { UserRole } from "@/types/database";

export async function GET() {
  const activeProfile = db.getActiveProfile();
  const allProfiles = db.getProfiles(DEFAULT_ORG_ID);

  return NextResponse.json({
    activeProfile,
    profiles: allProfiles,
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const json = await req.json();
    const { userId, role } = json;

    if (userId) {
      db.setActiveUserId(userId);
    } else if (role) {
      // Find profile by role
      const matched = db.getProfiles(DEFAULT_ORG_ID).find((p) => p.role === role);
      if (matched) {
        db.setActiveUserId(matched.id);
      }
    }

    const activeProfile = db.getActiveProfile();

    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: null,
      user_id: activeProfile.id,
      action: "switch_active_profile",
      entity: "profiles",
      entity_id: activeProfile.id,
      metadata: { role: activeProfile.role, name: activeProfile.full_name },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      activeProfile,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { full_name, role } = json;

    if (!full_name || !role) {
      return NextResponse.json({ error: "full_name and role required" }, { status: 400 });
    }

    const newProfile = db.createProfile({
      id: crypto.randomUUID(),
      full_name,
      role: role as UserRole,
      organization_id: DEFAULT_ORG_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: null,
      user_id: db.getActiveUserId(),
      action: "invite_member",
      entity: "profiles",
      entity_id: newProfile.id,
      metadata: { name: newProfile.full_name, role: newProfile.role },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ profile: newProfile }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
