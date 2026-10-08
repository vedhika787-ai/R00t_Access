import { NextRequest, NextResponse } from "next/server";
import { db, DEFAULT_ORG_ID, DEFAULT_USER_ID } from "@/lib/db/store";
import { getEmbeddings } from "@/lib/ai/embeddings";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const json = await req.json();
    const existing = db.getPlaybookRule(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Playbook rule not found" }, { status: 404 });
    }

    let updatedEmbedding = existing.embedding;
    if (json.requirement_text && json.requirement_text !== existing.requirement_text) {
      const emb = await getEmbeddings([`${json.title || existing.title}: ${json.requirement_text}`]);
      updatedEmbedding = emb[0] || null;
    }

    const updated = db.updatePlaybookRule(params.id, {
      ...json,
      embedding: updatedEmbedding,
    });

    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: null,
      user_id: DEFAULT_USER_ID,
      action: "update_playbook_rule",
      entity: "playbook_rules",
      entity_id: params.id,
      metadata: { title: updated?.title },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ rule: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = db.getPlaybookRule(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Playbook rule not found" }, { status: 404 });
    }

    const success = db.deletePlaybookRule(params.id);

    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: null,
      user_id: DEFAULT_USER_ID,
      action: "delete_playbook_rule",
      entity: "playbook_rules",
      entity_id: params.id,
      metadata: { title: existing.title },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
