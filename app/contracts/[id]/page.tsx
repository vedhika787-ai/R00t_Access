"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  ArrowRight,
  Download,
  FileCode,
  Info,
  HelpCircle,
  ExternalLink,
  Scale,
  Sparkles,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Contract, Finding, Redline, ScoreSnapshot } from "@/types/database";
import { RiskScoreResult } from "@/lib/scoring";

export default function ContractScorecardPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params?.id as string;
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  // Fetch contract details
  const { data, isLoading } = useQuery<{
    contract: Contract;
    findings: Finding[];
    redlines: Redline[];
    scoreSnapshots: ScoreSnapshot[];
    riskResult: RiskScoreResult;
  }>({
    queryKey: ["contract", contractId],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${contractId}`);
      if (!res.ok) throw new Error("Failed to load contract");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Generating Executive Risk Scorecard...</p>
      </div>
    );
  }

  const { contract, findings, redlines, scoreSnapshots, riskResult } = data;
  const originalScore = contract.risk_score_original || riskResult.score;
  const currentScore = riskResult.score;

  // Handle PDF Export
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const res = await fetch(`/api/contracts/${contractId}/export/summary`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${contract.vendor_name}_Executive_Summary.pdf`;
      a.click();
    } catch (e: any) {
      alert(e.message || "Failed to download PDF summary");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle DOCX Export
  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      const res = await fetch(`/api/contracts/${contractId}/export/docx`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${contract.vendor_name}_Redlined.docx`;
      a.click();
    } catch (e: any) {
      alert(e.message || "Failed to download DOCX");
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Gauge colors
  const scoreColor =
    currentScore >= 75
      ? "text-red-500"
      : currentScore >= 50
      ? "text-orange-500"
      : currentScore >= 25
      ? "text-amber-500"
      : "text-emerald-500";

  const scoreBg =
    currentScore >= 75
      ? "bg-red-500/10 border-red-500/20"
      : currentScore >= 50
      ? "bg-orange-500/10 border-orange-500/20"
      : currentScore >= 25
      ? "bg-amber-500/10 border-amber-500/20"
      : "bg-emerald-500/10 border-emerald-500/20";

  // Deal breakers (Critical & High deviations)
  const dealBreakers = findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 3);

  // Regulatory checks
  const dpdpViolations = findings.filter((f) =>
    f.regulation_flags?.some((r) => r.includes("DPDP"))
  );
  const gdprViolations = findings.filter((f) =>
    f.regulation_flags?.some((r) => r.includes("GDPR"))
  );

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
              Executive Scorecard
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded">
              {contract.file_type.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {contract.vendor_name}
          </h1>
          <p className="text-sm text-muted-foreground">{contract.title}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => router.push(`/contracts/${contractId}/review`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5"
          >
            <span>Open Reviewer Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs text-foreground bg-muted hover:bg-muted/80 border border-border transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? "Generating PDF..." : "Export PDF Summary"}</span>
          </button>

          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs text-foreground bg-muted hover:bg-muted/80 border border-border transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{isExportingDocx ? "Building DOCX..." : "Export Redline DOCX"}</span>
          </button>
        </div>
      </div>

      {/* Main Score & Recommendation Hero Card */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Large Gauge & Score */}
        <div className={`p-8 rounded-3xl border ${scoreBg} flex flex-col justify-between space-y-6`}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Risk Score
            </span>
            <button
              onClick={() => setShowFormulaModal(true)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Formula</span>
            </button>
          </div>

          <div className="text-center py-4">
            <div className={`text-6xl sm:text-7xl font-extrabold tracking-tight ${scoreColor}`}>
              {currentScore}
              <span className="text-2xl font-bold text-muted-foreground">/100</span>
            </div>
            <p className={`text-sm font-bold mt-2 uppercase tracking-wide ${scoreColor}`}>
              {riskResult.level} Risk Exposure
            </p>
          </div>

          {/* Before & After Delta */}
          <div className="p-3 rounded-2xl bg-background/80 border border-border text-xs flex items-center justify-between">
            <span className="text-muted-foreground">Original Score:</span>
            <div className="flex items-center gap-2 font-mono font-bold">
              <span className="text-muted-foreground line-through">{originalScore}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className={scoreColor}>{currentScore}</span>
              {currentScore < originalScore && (
                <span className="text-emerald-500 font-semibold text-[11px] flex items-center">
                  (-{originalScore - currentScore} pts)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Recommendation Justification */}
        <div className="p-8 rounded-3xl border border-border bg-card flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Action Recommendation
            </span>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`uppercase px-3 py-1 rounded-xl text-sm font-extrabold tracking-wider ${
                  riskResult.recommendation === "reject"
                    ? "bg-red-500/10 text-red-500 border border-red-500/30"
                    : riskResult.recommendation === "sign"
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                }`}
              >
                {riskResult.recommendation}
              </span>
            </div>
            <p className="text-sm text-foreground/90 font-medium leading-relaxed mt-4">
              {riskResult.recommendationReason}
            </p>
          </div>

          <div className="pt-4 border-t border-border grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Processing Speed</p>
              <p className="font-bold text-foreground font-mono">
                {contract.processing_ms ? (contract.processing_ms / 1000).toFixed(1) : "3.1"}s
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Clauses Analyzed</p>
              <p className="font-bold text-foreground font-mono">{findings.length}</p>
            </div>
          </div>
        </div>

        {/* Right: Finding Severity Counts */}
        <div className="p-8 rounded-3xl border border-border bg-card flex flex-col justify-between space-y-4">
          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            Discrepancy Breakdown
          </span>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-red-500/5 border border-red-500/10">
              <span className="font-semibold text-red-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Critical Deviations
              </span>
              <span className="font-mono font-bold text-red-500">{riskResult.unresolvedCriticalCount}</span>
            </div>

            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-orange-500/5 border border-orange-500/10">
              <span className="font-semibold text-orange-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                High Severity
              </span>
              <span className="font-mono font-bold text-orange-500">{riskResult.unresolvedHighCount}</span>
            </div>

            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <span className="font-semibold text-amber-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Medium Deviations
              </span>
              <span className="font-mono font-bold text-amber-500">{riskResult.unresolvedMediumCount}</span>
            </div>

            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-muted/60 border border-border">
              <span className="font-semibold text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                Missing Mandatory
              </span>
              <span className="font-mono font-bold text-foreground">{riskResult.missingClausesCount}</span>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground text-center">
            Accepting redlines reduces risk points to 0 in real time.
          </div>
        </div>
      </div>

      {/* Top 3 Deal Breakers */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-foreground">Top Priority Deal-Breakers</h2>
          </div>
          <button
            onClick={() => router.push(`/contracts/${contractId}/review`)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Review all in workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {dealBreakers.map((f, idx) => (
            <div
              key={f.id}
              onClick={() => router.push(`/contracts/${contractId}/review?clause=${f.clause_id || ""}`)}
              className="p-4 rounded-xl border border-border hover:border-red-500/40 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-500">
                  {f.severity}
                </span>
                <span className="text-xs text-muted-foreground group-hover:text-primary font-mono">
                  #{idx + 1}
                </span>
              </div>

              <h4 className="text-xs font-bold text-foreground line-clamp-2">
                {f.deviation_summary}
              </h4>

              <p className="text-[11px] text-muted-foreground line-clamp-3">
                {f.plain_english}
              </p>

              <div className="pt-2 text-[10px] font-semibold text-primary flex items-center gap-1">
                <span>View Discrepancy & Redline</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Risk Breakdown & Regulatory Matrix */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Bars */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Risk Points by Category
          </h3>

          <div className="space-y-3">
            {Object.entries(riskResult.breakdown).map(([cat, pts]) => {
              const maxCat = 50;
              const barWidth = Math.min(100, Math.round((pts / maxCat) * 100));
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-foreground font-medium">
                      {cat.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono font-bold text-muted-foreground">{pts} pts</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Regulatory Compliance Matrix */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Statutory Compliance Matrix
          </h3>

          <div className="space-y-3">
            {/* DPDP Act 2023 */}
            <div className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Digital Personal Data Protection Act 2023 (India)</p>
                <p className="text-[11px] text-muted-foreground">Mandatory 72-hr breach notice & DPA execution</p>
              </div>
              <div>
                {dpdpViolations.length > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                    <XCircle className="w-3 h-3" />
                    Failed ({dpdpViolations.length})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Compliant
                  </span>
                )}
              </div>
            </div>

            {/* GDPR */}
            <div className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">EU General Data Protection Regulation (GDPR)</p>
                <p className="text-[11px] text-muted-foreground">Sub-processor approval & cross-border data protection</p>
              </div>
              <div>
                {gdprViolations.length > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                    <XCircle className="w-3 h-3" />
                    Failed ({gdprViolations.length})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Compliant
                  </span>
                )}
              </div>
            </div>

            {/* IT Act 2000 */}
            <div className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Information Technology Act 2000 (Section 43A)</p>
                <p className="text-[11px] text-muted-foreground">Reasonable security practices & procedures</p>
              </div>
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <AlertCircle className="w-3 h-3" />
                  Review DPA
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground">Deterministic Risk Scoring Formula</h3>
            <div className="text-xs text-muted-foreground space-y-2">
              <p>Every risk flag is computed with zero random variance:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Base Severity Points:</strong> Critical: 25 | High: 15 | Medium: 7 | Low: 2 | None: 0</li>
                <li><strong>Rule Weight Multiplier:</strong> Points = round(Base * weight / 5)</li>
                <li><strong>Missing Mandatory Clauses:</strong> +10 points each (+15 if critical category)</li>
                <li><strong>Accepted Redlines:</strong> Once a redline is marked accepted, its contribution drops to 0 immediately.</li>
                <li><strong>Levels:</strong> 0-24 Low | 25-49 Medium | 50-74 High | 75-100 Critical</li>
                <li><strong>Recommendation:</strong> Sign (&lt;25), Negotiate (25-74 or any high), Reject (&gt;=75 or 2+ unresolved critical).</li>
              </ul>
            </div>
            <button
              onClick={() => setShowFormulaModal(false)}
              className="w-full py-2 rounded-xl text-xs font-semibold bg-primary text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
