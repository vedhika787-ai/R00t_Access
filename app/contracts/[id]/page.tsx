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
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Contract, Finding, Redline, ScoreSnapshot } from "@/types/database";
import { RiskScoreResult } from "@/lib/scoring";
import { WorkflowStepper } from "@/components/layout/workflow-stepper";
import { AnimatedRiskGauge } from "@/components/scorecard/animated-risk-gauge";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { TiltCard } from "@/components/ui/tilt-card";

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
      <div className="min-h-screen bg-background">
        <WorkflowStepper currentStep="scorecard" contractId={contractId} />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-mono">
            Generating Executive Risk Scorecard &amp; Category Breakdown...
          </p>
        </div>
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
    <div className="min-h-screen bg-background">
      {/* Global Workflow Stepper */}
      <WorkflowStepper currentStep="scorecard" contractId={contractId} />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Top Header & Navigation */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase font-mono font-semibold tracking-wider text-brand-primary">
                EXECUTIVE RISK SCORECARD
              </span>
              <span className="text-muted-foreground">&bull;</span>
              <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/80">
                {contract.file_type.toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {contract.vendor_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal mt-1">{contract.title}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => router.push(`/contracts/${contractId}/review`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-brand-primary hover:bg-brand-primary/90 shadow-soft hover:shadow-raised transition-all hover:-translate-y-0.5"
            >
              <span>Open Reviewer Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs text-foreground bg-surface hover:bg-muted/40 border border-border/80 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-brand-primary" />
              <span>{isExportingPdf ? "Generating PDF..." : "Export PDF Summary"}</span>
            </button>

            <button
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs text-foreground bg-surface hover:bg-muted/40 border border-border/80 transition-colors shadow-xs"
            >
              <FileCode className="w-3.5 h-3.5 text-brand-primary" />
              <span>{isExportingDocx ? "Building DOCX..." : "Export Redline DOCX"}</span>
            </button>
          </div>
        </div>

        {/* Main Score & Recommendation Hero Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Large Animated 3D Gauge Card */}
          <TiltCard className="p-6 rounded-3xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-muted-foreground">
                DETERMINISTIC GAUGE
              </span>
              <button
                onClick={() => setShowFormulaModal(true)}
                className="text-xs text-brand-primary hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Formula</span>
              </button>
            </div>

            {/* Glossy Semicircle Gauge */}
            <AnimatedRiskGauge
              score={currentScore}
              originalScore={originalScore}
              level={riskResult.level}
            />

            {/* Original vs Current Score Delta */}
            <div className="p-3 rounded-xl bg-background/80 border border-border/80 text-xs flex items-center justify-between">
              <span className="text-muted-foreground">Baseline Exposure:</span>
              <div className="flex items-center gap-2 font-mono font-bold">
                <span className="text-muted-foreground line-through">{originalScore}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-foreground">{currentScore}</span>
              </div>
            </div>
          </TiltCard>

          {/* Center: Recommendation Justification */}
          <TiltCard className="p-6 rounded-3xl flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-muted-foreground">
                ACTION RECOMMENDATION
              </span>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className={`uppercase px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider border ${
                    riskResult.recommendation === "reject"
                      ? "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30"
                      : riskResult.recommendation === "sign"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                  }`}
                >
                  {riskResult.recommendation}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed mt-4">
                {riskResult.recommendationReason}
              </p>
            </div>

            <div className="pt-4 border-t border-border/80 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Analysis Time</p>
                <p className="font-bold text-foreground font-mono">
                  {contract.processing_ms ? (contract.processing_ms / 1000).toFixed(1) : "3.1"}s
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Clauses Benchmarked</p>
                <p className="font-bold text-foreground font-mono">{findings.length}</p>
              </div>
            </div>
          </TiltCard>

          {/* Right: Finding Severity Counts */}
          <TiltCard className="p-6 rounded-3xl flex flex-col justify-between space-y-4">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-muted-foreground">
              DISCREPANCY BREAKDOWN
            </span>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-red-500/5 border border-red-500/20">
                <span className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  Critical Deviations
                </span>
                <span className="font-mono font-bold text-red-600">
                  {riskResult.unresolvedCriticalCount}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <span className="font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  High Severity
                </span>
                <span className="font-mono font-bold text-orange-600">
                  {riskResult.unresolvedHighCount}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <span className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Medium Deviations
                </span>
                <span className="font-mono font-bold text-amber-600">
                  {riskResult.unresolvedMediumCount}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20">
                <span className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Missing Mandatory
                </span>
                <span className="font-mono font-bold text-purple-600">
                  {riskResult.missingClausesCount}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground text-center">
              Accepting redlines reduces risk points to 0 in real time.
            </div>
          </TiltCard>
        </div>

        {/* Top 3 Deal Breakers */}
        <div className="p-6 rounded-2xl border border-border/80 bg-surface shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-foreground">Top Priority Deal-Breakers</h2>
            </div>
            <button
              onClick={() => router.push(`/contracts/${contractId}/review`)}
              className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
            >
              <span>Review all in workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dealBreakers.map((f, idx) => (
              <div
                key={f.id}
                onClick={() => router.push(`/contracts/${contractId}/review?clause=${f.clause_id || ""}`)}
                className="p-4 rounded-xl border border-border/80 hover:border-red-500/40 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all space-y-2 group shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <SeverityBadge severity={f.severity} size="sm" />
                  <span className="text-xs text-muted-foreground group-hover:text-brand-primary font-mono font-semibold">
                    #{idx + 1}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-foreground line-clamp-2">
                  {f.deviation_summary}
                </h4>

                <p className="text-[11px] text-muted-foreground line-clamp-3">
                  {f.plain_english}
                </p>

                <div className="pt-2 text-[10px] font-semibold text-brand-primary flex items-center gap-1">
                  <span>View Discrepancy &amp; Redline</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Risk Breakdown & Regulatory Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Bars */}
          <div className="p-6 rounded-2xl border border-border/80 bg-surface shadow-soft space-y-4">
            <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
              RISK POINTS BY CATEGORY
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
                        className="h-full bg-gradient-to-r from-brand-primary to-indigo-500 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Regulatory Compliance Matrix */}
          <div className="p-6 rounded-2xl border border-border/80 bg-surface shadow-soft space-y-4">
            <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
              STATUTORY COMPLIANCE MATRIX
            </h3>

            <div className="space-y-3">
              {/* DPDP Act 2023 */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Digital Personal Data Protection Act 2023 (India)
                  </p>
                  <p className="text-[11px] text-muted-foreground">Mandatory 72-hr breach notice &amp; DPA execution</p>
                </div>
                <div>
                  {dpdpViolations.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30">
                      <XCircle className="w-3 h-3" />
                      Failed ({dpdpViolations.length})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Compliant
                    </span>
                  )}
                </div>
              </div>

              {/* GDPR */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">
                    EU General Data Protection Regulation (GDPR)
                  </p>
                  <p className="text-[11px] text-muted-foreground">Sub-processor approval &amp; cross-border safeguards</p>
                </div>
                <div>
                  {gdprViolations.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30">
                      <XCircle className="w-3 h-3" />
                      Failed ({gdprViolations.length})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Compliant
                    </span>
                  )}
                </div>
              </div>

              {/* IT Act 2000 */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Information Technology Act 2000 (Section 43A)</p>
                  <p className="text-[11px] text-muted-foreground">Reasonable security practices &amp; procedures</p>
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30">
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
            <div className="bg-surface border border-border/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-raised">
              <h3 className="text-lg font-bold text-foreground">
                Deterministic Risk Scoring Formula
              </h3>
              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed font-normal">
                <p>Every risk score is computed with zero random variance:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Base Severity Points:</strong> Critical: 25 | High: 15 | Medium: 7 | Low: 2 | None: 0</li>
                  <li><strong>Rule Weight Multiplier:</strong> Points = round(Base * weight / 5)</li>
                  <li><strong>Missing Mandatory Clauses:</strong> +10 points each (+15 if critical category)</li>
                  <li><strong>Accepted Redlines:</strong> Once a redline is marked accepted, its contribution drops to 0 immediately.</li>
                  <li><strong>Levels:</strong> 0-24 Low | 25-49 Medium | 50-74 High | 75-100 Critical</li>
                  <li><strong>Recommendation:</strong> Sign (&lt;25), Negotiate (25-74 or any high), Reject (&ge;75 or 2+ unresolved critical).</li>
                </ul>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
