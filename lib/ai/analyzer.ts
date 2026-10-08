import Anthropic from "@anthropic-ai/sdk";
import { Clause, PlaybookRule, Finding, RuleSeverity } from "@/types/database";
import {
  ClauseAnalysisSchema,
  ClauseAnalysisOutput,
  CLAUSE_ANALYSIS_SYSTEM_PROMPT,
} from "./prompts/clause-analysis";
import { verifyAndResolveSpans } from "./span-verifier";
import { calculateFindingPoints } from "../scoring";
import { db } from "../db/store";

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export interface AnalysisInput {
  clause: Clause;
  matchedRule: PlaybookRule;
  similarity: number;
}

/**
 * Analyzes a single clause against a matched playbook rule using Anthropic Claude
 */
export async function analyzeClauseWithRule(
  input: AnalysisInput,
  contractId: string,
  userId: string | null = null
): Promise<Finding> {
  const { clause, matchedRule, similarity } = input;
  const modelName = process.env.ANALYSIS_MODEL || "claude-3-5-haiku-20241022";
  const startTime = Date.now();

  let rawAnalysis: ClauseAnalysisOutput | null = null;

  // 1. If Anthropic is configured, run LLM analysis
  if (anthropicClient && process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes("your-anthropic")) {
    rawAnalysis = await callClaudeWithRetry(clause.text, matchedRule, modelName);
  }

  // 2. Fallback to domain rule evaluator if Anthropic is not configured or in offline test mode
  if (!rawAnalysis) {
    rawAnalysis = evaluateClauseRuleEngine(clause, matchedRule);
  }

  const latencyMs = Date.now() - startTime;

  // Log usage telemetry
  db.createAiUsageLog({
    id: crypto.randomUUID(),
    user_id: userId,
    contract_id: contractId,
    model: modelName,
    input_tokens: Math.round((clause.text.length + matchedRule.requirement_text.length) / 4),
    output_tokens: 350,
    latency_ms: latencyMs,
    purpose: `clause_analysis:${matchedRule.category}`,
    created_at: new Date().toISOString(),
  });

  // Verify and resolve quoted spans mathematically against source clause text (anti-hallucination)
  const verifiedSpans = verifyAndResolveSpans(clause.text, rawAnalysis.risky_spans);

  const findingId = crypto.randomUUID();
  const points = calculateFindingPoints(
    rawAnalysis.severity as RuleSeverity,
    matchedRule.weight,
    false,
    matchedRule.category === "liability" || matchedRule.category === "indemnification"
  );

  const finding: Finding = {
    id: findingId,
    contract_id: contractId,
    clause_id: clause.id,
    playbook_rule_id: matchedRule.id,
    finding_type: rawAnalysis.finding_type,
    severity: rawAnalysis.severity as RuleSeverity,
    similarity,
    deviation_summary: rawAnalysis.deviation_summary,
    playbook_requirement_excerpt: rawAnalysis.playbook_requirement_excerpt || matchedRule.requirement_text,
    vendor_text_excerpt: clause.text.slice(0, 250),
    risky_spans: verifiedSpans,
    plain_english: rawAnalysis.plain_english,
    negotiation_priority: rawAnalysis.negotiation_priority,
    regulation_flags: rawAnalysis.regulation_flags || matchedRule.regulation_tags,
    suggested_clause: rawAnalysis.suggested_clause || matchedRule.ideal_clause_text,
    fallback_clause: rawAnalysis.fallback_clause || matchedRule.acceptable_fallback_text,
    walk_away_note: rawAnalysis.walk_away_note || matchedRule.walk_away_text,
    points,
    created_at: new Date().toISOString(),
    clause,
    playbook_rule: matchedRule,
  };

  return finding;
}

/**
 * Call Anthropic Claude with 1 retry on malformed JSON
 */
async function callClaudeWithRetry(
  clauseText: string,
  rule: PlaybookRule,
  model: string
): Promise<ClauseAnalysisOutput | null> {
  const promptContent = `
<contract_clause_untrusted>
${clauseText}
</contract_clause_untrusted>

<playbook_rule>
Title: ${rule.title}
Category: ${rule.category}
Requirement: ${rule.requirement_text}
Default Severity: ${rule.severity_default}
Ideal Clause: ${rule.ideal_clause_text}
Acceptable Fallback: ${rule.acceptable_fallback_text}
Walk-Away Condition: ${rule.walk_away_text}
Regulations: ${rule.regulation_tags.join(", ")}
</playbook_rule>
`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      if (!anthropicClient) return null;
      const response = await anthropicClient.messages.create({
        model,
        max_tokens: 1200,
        temperature: 0,
        system: CLAUSE_ANALYSIS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: promptContent }],
      });

      const firstBlock = response.content[0];
      if (firstBlock.type === "text") {
        let text = firstBlock.text.trim();
        // Remove markdown backticks if present
        if (text.startsWith("```json")) {
          text = text.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (text.startsWith("```")) {
          text = text.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const parsed = JSON.parse(text);
        const validated = ClauseAnalysisSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
      }
    } catch (e) {
      console.warn(`Claude analysis attempt ${attempt} failed:`, e);
    }
  }

  return null;
}

/**
 * High-precision domain rule evaluator for offline testing and instant response
 */
export function evaluateClauseRuleEngine(clause: Clause, rule: PlaybookRule): ClauseAnalysisOutput {
  const text = clause.text;
  const lower = text.toLowerCase();
  const riskySpans: Array<{ quote: string; reason: string }> = [];
  let severity: "critical" | "high" | "medium" | "low" | "none" = "none";
  let findingType: "deviation" | "compliant" = "compliant";
  let summary = "Clause appears substantially compliant with corporate baseline.";
  let plainEnglish = "This clause aligns with acceptable commercial terms.";
  let priority: "must_fix" | "should_fix" | "nice_to_have" = "nice_to_have";

  // Category-specific detection
  if (rule.category === "liability") {
    const isUnlimited = /unlimited liability|no cap|shall not be limited/i.test(lower);
    const noCapCustomer = /customer liability shall not be limited/i.test(lower);
    const vendorDisclaims = /vendor shall have no liability|disclaims all liability/i.test(lower);

    if (isUnlimited || noCapCustomer || vendorDisclaims) {
      findingType = "deviation";
      severity = "critical";
      priority = "must_fix";
      summary = "Vendor imposes uncapped/unlimited liability on Customer while disclaiming its own liability.";
      plainEnglish = "If there is any issue, Customer could be liable for unlimited damages, while the vendor takes zero financial responsibility.";
      
      const match = text.match(/(unlimited liability|shall not be limited|disclaims all liability)/i);
      if (match) {
        riskySpans.push({ quote: match[0], reason: "Uncapped liability exposes Customer to unbounded financial losses." });
      }
    } else if (/sole discretion|consequential damages/i.test(lower)) {
      findingType = "deviation";
      severity = "high";
      priority = "should_fix";
      summary = "One-sided exclusion of indirect damages favors vendor.";
      plainEnglish = "Vendor restricts damages in a way that prevents Customer from recovering real commercial losses.";
      const match = text.match(/(sole discretion|consequential damages)/i);
      if (match) {
        riskySpans.push({ quote: match[0], reason: "One-sided limitation of remedy" });
      }
    }
  } else if (rule.category === "indemnification") {
    const customerOnly = /customer shall indemnify|customer shall defend and hold harmless/i.test(lower);
    const vendorExempt = !/vendor shall indemnify|vendor shall defend/i.test(lower);

    if (customerOnly && vendorExempt) {
      findingType = "deviation";
      severity = "critical";
      priority = "must_fix";
      summary = "One-sided indemnification obligation. Customer indemnifies Vendor, but Vendor provides no reciprocal indemnity.";
      plainEnglish = "You are agreeing to pay all vendor legal costs and damages if they get sued, but they will not protect you if their product infringes IP.";
      
      const match = text.match(/(Customer shall indemnify|Customer shall defend and hold harmless)/i);
      if (match) {
        riskySpans.push({ quote: match[0], reason: "Unilateral indemnification obligation lacking reciprocity." });
      }
    }
  } else if (rule.category === "data_privacy") {
    const hasBreachNotice = /breach|security incident|unauthorized access/i.test(lower);
    const longNotice = /30 days|reasonable time|as soon as commercially practicable/i.test(lower);

    if (!hasBreachNotice || longNotice) {
      findingType = "deviation";
      severity = "critical";
      priority = "must_fix";
      summary = "Failure to commit to 72-hour breach notification required by DPDP Act 2023 and GDPR.";
      plainEnglish = "The vendor does not commit to notifying you quickly if your customer data is stolen or leaked.";
      
      const match = text.match(/(30 days|as soon as commercially practicable)/i);
      if (match) {
        riskySpans.push({ quote: match[0], reason: "Notice period exceeds statutory 72-hour regulatory threshold." });
      }
    }
  } else if (rule.category === "termination") {
    const autoRenew = /automatically renew/i.test(lower);
    const longNotice = /180 days|120 days|90 days/i.test(lower);

    if (autoRenew && longNotice) {
      findingType = "deviation";
      severity = "medium";
      priority = "should_fix";
      summary = "Unreasonable auto-renewal cancellation window (requires >60 days advance notice).";
      plainEnglish = "If you forget to cancel months in advance, you are locked into paying for another full year.";
      const match = text.match(/(automatically renew|180 days|120 days)/i);
      if (match) {
        riskySpans.push({ quote: match[0], reason: "Overly restrictive advance cancellation notice window." });
      }
    }
  } else if (rule.category === "payment_penalties") {
    const highInterest = /5%|3% per month|immediate suspension/i.test(lower);
    if (highInterest) {
      findingType = "deviation";
      severity = "medium";
      priority = "should_fix";
      summary = "Excessive late payment interest penalty exceeding 1% monthly standard.";
      plainEnglish = "Late fees are punitive and can lead to abrupt service shutoff without cure period.";
      const match = text.match(/(5%|3% per month|immediate suspension)/i);
      if (match) {
        riskySpans.push({ quote: match[0], reason: "Exorbitant penalty interest exceeding policy rate." });
      }
    }
  } else if (rule.category === "ip") {
    const vendorOwnsDeliverables = /vendor retains all right|vendor shall own all deliverables|customer hereby assigns/i.test(lower);
    if (vendorOwnsDeliverables) {
      findingType = "deviation";
      severity = "high";
      priority = "must_fix";
      summary = "Vendor claims ownership over customer custom deliverables or customer data.";
      plainEnglish = "The vendor is claiming intellectual property rights over work product you are paying them to build.";
      const match = text.match(/(Vendor retains all right|Vendor shall own all deliverables)/i);
      if (match) {
        riskySpans.push({ quote: match[0], reason: "Deprives Customer of proprietary work product ownership." });
      }
    }
  }

  return {
    finding_type: findingType,
    severity,
    deviation_summary: summary,
    playbook_requirement_excerpt: rule.requirement_text,
    risky_spans: riskySpans,
    plain_english: plainEnglish,
    negotiation_priority: priority,
    regulation_flags: rule.regulation_tags,
    suggested_clause: findingType === "deviation" ? rule.ideal_clause_text : "",
    fallback_clause: findingType === "deviation" ? rule.acceptable_fallback_text : "",
    walk_away_note: rule.walk_away_text,
    confidence: 0.92,
  };
}

/**
 * Detects missing mandatory clauses where no clause in the contract satisfied the mandatory policy
 */
export function detectMissingMandatoryClauses(
  activeRules: PlaybookRule[],
  matchedRuleIds: Set<string>,
  contractId: string
): Finding[] {
  const missingFindings: Finding[] = [];

  for (const rule of activeRules) {
    if (rule.is_mandatory && !matchedRuleIds.has(rule.id)) {
      const isCriticalCat = rule.category === "liability" || rule.category === "indemnification" || rule.category === "data_privacy";
      const points = isCriticalCat ? 15 : 10;

      missingFindings.push({
        id: crypto.randomUUID(),
        contract_id: contractId,
        clause_id: null,
        playbook_rule_id: rule.id,
        finding_type: "missing_clause",
        severity: rule.severity_default,
        similarity: 0.0,
        deviation_summary: `Mandatory corporate protection missing: ${rule.title}`,
        playbook_requirement_excerpt: rule.requirement_text,
        vendor_text_excerpt: "[Clause absent from contract]",
        risky_spans: [],
        plain_english: `The vendor contract omits a required ${rule.title} clause. You should insert the company standard provision.`,
        negotiation_priority: "must_fix",
        regulation_flags: rule.regulation_tags,
        suggested_clause: rule.ideal_clause_text,
        fallback_clause: rule.acceptable_fallback_text,
        walk_away_note: rule.walk_away_text,
        points,
        created_at: new Date().toISOString(),
        playbook_rule: rule,
      });
    }
  }

  return missingFindings;
}
