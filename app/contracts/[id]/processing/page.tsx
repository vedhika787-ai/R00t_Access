"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FileText,
  Layers,
  Sparkles,
  Cpu,
  Scale,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface StepStatus {
  id: string;
  name: string;
  desc: string;
  icon: any;
  status: "pending" | "running" | "completed";
}

export default function LiveProcessingPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params?.id as string;

  const [steps, setSteps] = useState<StepStatus[]>([
    { id: "segmenting", name: "Clause Segmentation", desc: "Parsing articles, sections and numbering", icon: Layers, status: "running" },
    { id: "embedding", name: "Vector Embedding", desc: "Batch Voyage-3 vector representations", icon: Cpu, status: "pending" },
    { id: "matching", name: "Playbook Matching", desc: "Cosine similarity against 15 active legal rules", icon: Scale, status: "pending" },
    { id: "analyzing", name: "AI Risk Analysis", desc: "Parallel Claude analysis across clauses", icon: Sparkles, status: "pending" },
    { id: "scoring", name: "Risk Scorecard", desc: "Deterministic calculation & missing clause check", icon: CheckCircle2, status: "pending" },
  ]);

  const [currentMessage, setCurrentMessage] = useState("Initializing legal pipeline...");
  const [percent, setPercent] = useState(15);
  const [elapsed, setElapsed] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [finalTime, setFinalTime] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 100);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // SSE Stream
  useEffect(() => {
    if (!contractId) return;

    let isMounted = true;
    const sseUrl = `/api/contracts/${contractId}/analyze`;

    // Start POST via Fetch with readable stream for SSE
    fetch(sseUrl, { method: "POST" })
      .then(async (response) => {
        if (!response.body) throw new Error("No response stream");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const eventMatch = line.match(/^event:\s*(.+)$/m);
            const dataMatch = line.match(/^data:\s*(.+)$/m);

            if (dataMatch) {
              const eventType = eventMatch ? eventMatch[1].trim() : "message";
              try {
                const data = JSON.parse(dataMatch[1].trim());

                if (eventType === "progress") {
                  setCurrentMessage(data.message || "");
                  if (data.percent) setPercent(data.percent);

                  // Update steps
                  setSteps((prev) =>
                    prev.map((s) => {
                      if (s.id === data.step) {
                        return { ...s, status: "running" };
                      }
                      const stepOrder = ["segmenting", "embedding", "matching", "analyzing", "scoring"];
                      const currentIdx = stepOrder.indexOf(data.step);
                      const thisIdx = stepOrder.indexOf(s.id);
                      if (thisIdx < currentIdx) {
                        return { ...s, status: "completed" };
                      }
                      return s;
                    })
                  );
                } else if (eventType === "done") {
                  setIsDone(true);
                  setPercent(100);
                  const durationSec = ((data.processingMs || elapsed) / 1000).toFixed(1);
                  setFinalTime(durationSec);

                  setSteps((prev) => prev.map((s) => ({ ...s, status: "completed" })));
                  setCurrentMessage(`Analysis complete in ${durationSec}s! Redirecting to scorecard...`);

                  setTimeout(() => {
                    if (isMounted) {
                      router.push(`/contracts/${contractId}`);
                    }
                  }, 1200);
                } else if (eventType === "error") {
                  setErrorMsg(data.message || "Pipeline error occurred");
                }
              } catch (e) {
                console.error("Failed to parse SSE JSON:", e);
              }
            }
          }
        }
      })
      .catch((err) => {
        console.error("SSE stream connection error:", err);
        setErrorMsg(err.message || "Failed to stream live analysis.");
      });

    return () => {
      isMounted = false;
    };
  }, [contractId, router]);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-16 space-y-8">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          Live Contract Processing
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Benchmarking Against Corporate Playbook
        </h1>
        <p className="text-sm text-muted-foreground">
          Running parallel clause vector matches, LLM risk evaluations, and statutory checks.
        </p>
      </div>

      {/* Progress Bar & Timer */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            {currentMessage}
          </span>
          <span className="font-mono text-muted-foreground">
            {finalTime ? `Completed in ${finalTime}s` : `${(elapsed / 1000).toFixed(1)}s elapsed`}
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Pipeline Stepper */}
      <div className="rounded-2xl border border-border bg-card p-6 divide-y divide-border shadow-xs">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    step.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : step.status === "running"
                      ? "bg-primary/10 text-primary animate-pulse"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{step.name}</h4>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>

              <div>
                {step.status === "completed" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Passed
                  </span>
                ) : step.status === "running" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    Running
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground font-medium">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual redirect button if completed */}
      {isDone && (
        <div className="text-center pt-2">
          <button
            onClick={() => router.push(`/contracts/${contractId}`)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-primary hover:bg-primary/90 shadow-md transition-all"
          >
            <span>Proceed to Scorecard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
