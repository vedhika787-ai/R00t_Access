import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db/store";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const json = await req.json();
    const requirement = json.requirement_text || "";
    const category = json.category || "commercial";

    if (!requirement) {
      return NextResponse.json({ error: "Requirement text required" }, { status: 400 });
    }

    let ideal = "";
    let fallback = "";
    let walkAway = "";

    // If Anthropic Claude available
    if (anthropic && process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes("your-anthropic")) {
      const response = await anthropic.messages.create({
        model: process.env.REWRITE_MODEL || "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: `You are senior legal counsel. Based on this requirement: "${requirement}" in category "${category}", generate JSON with three fields:
{
  "ideal_clause": "Gold standard enterprise clause text",
  "acceptable_fallback": "Negotiation fallback compromise text",
  "walk_away_text": "Non-negotiable walk away condition"
}`,
          },
        ],
      });

      const first = response.content[0];
      if (first.type === "text") {
        try {
          const parsed = JSON.parse(first.text.replace(/```json|```/g, "").trim());
          ideal = parsed.ideal_clause;
          fallback = parsed.acceptable_fallback;
          walkAway = parsed.walk_away_text;
        } catch {
          ideal = first.text;
        }
      }
    }

    if (!ideal) {
      // High-standard drafting template fallback
      ideal = `The parties agree that in respect of ${category}, the Supplier shall strictly adhere to: ${requirement}. Any failure to comply shall constitute a material breach entitling Customer to immediate termination without penalty.`;
      fallback = `Supplier agrees to commercially reasonable efforts regarding ${category} complying with industry standards and ${requirement}.`;
      walkAway = `Supplier outright disclaims responsibility or refuses liability for ${category}.`;
    }

    return NextResponse.json({
      ideal_clause_text: ideal,
      acceptable_fallback_text: fallback,
      walk_away_text: walkAway,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
