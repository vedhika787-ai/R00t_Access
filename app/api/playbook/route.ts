import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, DEFAULT_ORG_ID, DEFAULT_USER_ID } from "@/lib/db/store";
import { getEmbeddings } from "@/lib/ai/embeddings";
import { PlaybookRule, RuleCategory, RuleSeverity } from "@/types/database";

const CreateRuleSchema = z.object({
  title: z.string().min(3),
  category: z.enum([
    "liability",
    "indemnification",
    "data_privacy",
    "payment_penalties",
    "termination",
    "ip",
    "governing_law",
    "confidentiality",
    "sla",
    "insurance",
    "other",
  ]),
  requirement_text: z.string().min(10),
  ideal_clause_text: z.string().min(10),
  acceptable_fallback_text: z.string(),
  walk_away_text: z.string(),
  severity_default: z.enum(["critical", "high", "medium", "low", "none"]),
  weight: z.number().min(1).max(10).default(5),
  is_mandatory: z.boolean().default(false),
  is_active: z.boolean().default(true),
  regulation_tags: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    const rules = db.getAllPlaybookRules(DEFAULT_ORG_ID);
    return NextResponse.json({ rules });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = CreateRuleSchema.parse(json);

    // Compute embedding for the rule requirement text
    const embeddings = await getEmbeddings([`${data.title}: ${data.requirement_text}`]);
    const ruleEmbedding = embeddings[0] || null;

    const rule: PlaybookRule = {
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      title: data.title,
      category: data.category as RuleCategory,
      requirement_text: data.requirement_text,
      ideal_clause_text: data.ideal_clause_text,
      acceptable_fallback_text: data.acceptable_fallback_text,
      walk_away_text: data.walk_away_text,
      severity_default: data.severity_default as RuleSeverity,
      weight: data.weight,
      is_mandatory: data.is_mandatory,
      is_active: data.is_active,
      regulation_tags: data.regulation_tags,
      embedding: ruleEmbedding,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.createPlaybookRule(rule);

    db.createAuditLog({
      id: crypto.randomUUID(),
      organization_id: DEFAULT_ORG_ID,
      contract_id: null,
      user_id: DEFAULT_USER_ID,
      action: "create_playbook_rule",
      entity: "playbook_rules",
      entity_id: rule.id,
      metadata: { title: rule.title, category: rule.category },
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
