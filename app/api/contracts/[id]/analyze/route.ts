import { NextRequest } from "next/server";
import { db, DEFAULT_ORG_ID, DEFAULT_USER_ID } from "@/lib/db/store";
import { getEmbeddings } from "@/lib/ai/embeddings";
import { analyzeClauseWithRule, detectMissingMandatoryClauses } from "@/lib/ai/analyzer";
import { calculateContractRiskScore } from "@/lib/scoring";
import { Finding, Redline } from "@/types/database";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const contractId = params.id;
  const contract = db.getContract(contractId);

  if (!contract) {
    return new Response(JSON.stringify({ error: "Contract not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const clauses = db.getClauses(contractId);
  const activeRules = db.getPlaybookRules(contract.organization_id);

  // Setup Server-Sent Events (SSE) stream
  const encoder = new TextEncoder();
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(type: string, data: Record<string, unknown>) {
        const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      try {
        // Step 1: Segmentation confirmation
        sendEvent("progress", {
          step: "segmenting",
          message: `Identified and indexed ${clauses.length} distinct legal clauses.`,
          percent: 20,
        });

        // Step 2: Batch Embeddings
        sendEvent("progress", {
          step: "embedding",
          message: `Batch-generating vector representations for ${clauses.length} clauses...`,
          percent: 35,
        });

        const clauseTexts = clauses.map((c) => `${c.heading || ""} ${c.text}`.slice(0, 1500));
        const embeddings = await getEmbeddings(clauseTexts);

        // Update clauses with embeddings
        for (let i = 0; i < clauses.length; i++) {
          if (embeddings[i]) {
            clauses[i].embedding = embeddings[i];
          }
        }
        db.saveClauses(clauses);

        // Step 3: Match clauses with playbook rules
        sendEvent("progress", {
          step: "matching",
          message: "Matching clauses against corporate legal playbook via vector similarity...",
          percent: 50,
        });

        const matchedPairs: Array<{
          clause: typeof clauses[0];
          matchedRule: typeof activeRules[0];
          similarity: number;
        }> = [];

        const matchedRuleIds = new Set<string>();

        for (let i = 0; i < clauses.length; i++) {
          const clause = clauses[i];
          const matched = db.matchPlaybookRules(clause.embedding, contract.organization_id, 2, 0.25);
          if (matched.length > 0) {
            matchedPairs.push({
              clause,
              matchedRule: matched[0],
              similarity: matched[0].similarity,
            });
            matchedRuleIds.add(matched[0].id);
          }
        }

        // Step 4: Parallel Clause Analysis
        sendEvent("progress", {
          step: "analyzing",
          message: `Running parallel risk & policy deviation analysis across ${matchedPairs.length} candidate clauses...`,
          completed: 0,
          total: matchedPairs.length,
          percent: 60,
        });

        const findings: Finding[] = [];
        const redlines: Redline[] = [];

        // Run with concurrency batching
        const BATCH_SIZE = 6;
        for (let i = 0; i < matchedPairs.length; i += BATCH_SIZE) {
          const batch = matchedPairs.slice(i, i + BATCH_SIZE);
          const results = await Promise.all(
            batch.map((pair) => analyzeClauseWithRule(pair, contractId, DEFAULT_USER_ID))
          );

          for (const finding of results) {
            findings.push(finding);

            // If deviation, generate corresponding initial redline
            if (finding.finding_type === "deviation" && finding.suggested_clause) {
              const redlineId = crypto.randomUUID();
              redlines.push({
                id: redlineId,
                finding_id: finding.id,
                contract_id: contractId,
                original_text: finding.clause?.text || finding.vendor_text_excerpt,
                proposed_text: finding.suggested_clause,
                final_text: finding.suggested_clause,
                status: "pending",
                decided_by: null,
                decided_at: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }

          const currentCount = Math.min(matchedPairs.length, i + BATCH_SIZE);
          const progressPercent = Math.min(88, 60 + Math.round((currentCount / matchedPairs.length) * 28));

          sendEvent("progress", {
            step: "analyzing",
            message: `Analyzed ${currentCount}/${matchedPairs.length} clauses for policy discrepancies`,
            completed: currentCount,
            total: matchedPairs.length,
            percent: progressPercent,
          });
        }

        // Step 5: Detect Missing Mandatory Clauses
        const missingFindings = detectMissingMandatoryClauses(activeRules, matchedRuleIds, contractId);
        for (const mf of missingFindings) {
          findings.push(mf);
          if (mf.suggested_clause) {
            redlines.push({
              id: crypto.randomUUID(),
              finding_id: mf.id,
              contract_id: contractId,
              original_text: "[Clause Missing]",
              proposed_text: mf.suggested_clause,
              final_text: mf.suggested_clause,
              status: "pending",
              decided_by: null,
              decided_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }

        // Step 6: Scoring
        sendEvent("progress", {
          step: "scoring",
          message: "Calculating deterministic risk score and policy deviation index...",
          percent: 92,
        });

        const scoreResult = calculateContractRiskScore(findings, redlines);
        const processingMs = Date.now() - startTime;

        // Step 7: Persist Findings, Redlines & Snapshots
        db.saveFindings(findings);
        db.saveRedlines(redlines);

        db.updateContract(contractId, {
          status: "analyzed",
          risk_score_original: scoreResult.score,
          risk_score_current: scoreResult.score,
          recommendation: scoreResult.recommendation,
          processing_ms: processingMs,
        });

        db.createScoreSnapshot({
          id: crypto.randomUUID(),
          contract_id: contractId,
          score: scoreResult.score,
          breakdown: scoreResult.breakdown,
          trigger: "initial",
          created_at: new Date().toISOString(),
        });

        // Audit Log
        db.createAuditLog({
          id: crypto.randomUUID(),
          organization_id: contract.organization_id,
          contract_id: contractId,
          user_id: DEFAULT_USER_ID,
          action: "analyze_contract",
          entity: "contracts",
          entity_id: contractId,
          metadata: {
            score: scoreResult.score,
            level: scoreResult.level,
            recommendation: scoreResult.recommendation,
            findings_count: findings.length,
            processing_ms: processingMs,
          },
          ip: "127.0.0.1",
          created_at: new Date().toISOString(),
        });

        // Step 8: Done Event
        sendEvent("done", {
          contractId,
          score: scoreResult.score,
          level: scoreResult.level,
          recommendation: scoreResult.recommendation,
          recommendationReason: scoreResult.recommendationReason,
          processingMs,
          findingsCount: findings.length,
          deviationsCount: findings.filter((f) => f.finding_type === "deviation").length,
          missingCount: missingFindings.length,
        });

        controller.close();
      } catch (err: any) {
        console.error("Analysis pipeline failed:", err);
        sendEvent("error", { message: err.message || "Analysis failed" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
