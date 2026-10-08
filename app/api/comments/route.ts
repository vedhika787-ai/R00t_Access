import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, DEFAULT_USER_ID, DEFAULT_ORG_ID } from "@/lib/db/store";
import { Comment } from "@/types/database";

const CreateCommentSchema = z.object({
  contract_id: z.string(),
  clause_id: z.string().nullable().optional(),
  body: z.string().min(1),
  user_name: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractId = searchParams.get("contract_id");
    if (!contractId) {
      return NextResponse.json({ error: "contract_id required" }, { status: 400 });
    }

    const comments = db.getComments(contractId);
    return NextResponse.json({ comments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = CreateCommentSchema.parse(json);

    const comment: Comment = {
      id: crypto.randomUUID(),
      contract_id: data.contract_id,
      clause_id: data.clause_id || null,
      user_id: DEFAULT_USER_ID,
      body: data.body,
      user_name: data.user_name || "Legal Reviewer",
      created_at: new Date().toISOString(),
    };

    db.createComment(comment);

    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: data.contract_id,
      user_id: DEFAULT_USER_ID,
      action: "add_comment",
      entity: "comments",
      entity_id: comment.id,
      metadata: { clause_id: data.clause_id },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
