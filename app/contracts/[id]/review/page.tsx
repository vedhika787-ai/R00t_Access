"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Search,
  Filter,
  Sparkles,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  HelpCircle,
  Check,
  X,
  ExternalLink,
  Scale,
  Lock,
  Layers,
  TrendingDown,
} from "lucide-react";
import { Contract, Clause, Finding, Redline, Comment, Profile } from "@/types/database";
import { computeWordDiff, renderDiffHtml } from "@/lib/diff";
import { buildHighlightedHtml } from "@/lib/ai/span-verifier";
import { WorkflowStepper } from "@/components/layout/workflow-stepper";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { RiskPill } from "@/components/ui/risk-pill";

export default function ReviewerWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contractId = params?.id as string;

  // Active state
  const [selectedClauseIndex, setSelectedClauseIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"discrepancy" | "redline" | "plain_english" | "comments">("discrepancy");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [newComment, setNewComment] = useState("");

  // Fetch full contract data
  const { data, isLoading } = useQuery<{
    contract: Contract;
    clauses: Clause[];
    findings: Finding[];
    redlines: Redline[];
    comments: Comment[];
  }>({
    queryKey: ["contract-workspace", contractId],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${contractId}`);
      if (!res.ok) throw new Error("Failed to load workspace data");
      return res.json();
    },
  });

  // Fetch active profile for role-based controls
  const { data: authData } = useQuery<{ activeProfile: Profile }>({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to load active profile");
      return res.json();
    },
  });

  const isViewer = authData?.activeProfile?.role === "viewer";

  const clauses = data?.clauses || [];
  const findings = data?.findings || [];
  const redlines = data?.redlines || [];
  const comments = data?.comments || [];
  const contract = data?.contract;

  // Map findings and redlines to clauses
  const findingByClauseId = useMemo(() => {
    const map = new Map<string, Finding>();
    for (const f of findings) {
      if (f.clause_id) map.set(f.clause_id, f);
    }
    return map;
  }, [findings]);

  const redlineByFindingId = useMemo(() => {
    const map = new Map<string, Redline>();
    for (const r of redlines) {
      map.set(r.finding_id, r);
    }
    return map;
  }, [redlines]);

  // Handle URL deep-linking to specific clause
  useEffect(() => {
    const clauseIdParam = searchParams?.get("clause");
    if (clauseIdParam && clauses.length > 0) {
      const idx = clauses.findIndex((c) => c.id === clauseIdParam);
      if (idx !== -1) setSelectedClauseIndex(idx);
    }
  }, [searchParams, clauses]);

  // Current selected clause & related records
  const currentClause = clauses[selectedClauseIndex] || null;
  const currentFinding = currentClause ? findingByClauseId.get(currentClause.id) : null;
  const currentRedline = currentFinding ? redlineByFindingId.get(currentFinding.id) : null;

  // Sync edit text when selecting clause
  useEffect(() => {
    if (currentRedline) {
      setEditText(currentRedline.final_text || currentRedline.proposed_text);
    } else if (currentFinding?.suggested_clause) {
      setEditText(currentFinding.suggested_clause);
    } else {
      setEditText("");
    }
    setIsEditing(false);
  }, [selectedClauseIndex, currentRedline, currentFinding]);

  // Filtered clauses for navigator
  const filteredClauses = useMemo(() => {
    return clauses.filter((c) => {
      const finding = findingByClauseId.get(c.id);
      const matchesSearch =
        (c.heading || "").toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.text.toLowerCase().includes(searchFilter.toLowerCase());

      if (!matchesSearch) return false;
      if (filterSeverity === "all") return true;
      if (filterSeverity === "deviations") return finding?.finding_type === "deviation";
      if (filterSeverity === "compliant") return finding?.finding_type === "compliant";
      return finding?.severity === filterSeverity;
    });
  }, [clauses, findingByClauseId, searchFilter, filterSeverity]);

  // Reviewed progress
  const reviewedCount = redlines.filter((r) => r.status !== "pending").length;
  const totalDeviations = findings.filter((f) => f.finding_type === "deviation").length;
  const unresolvedCriticalCount = findings.filter(
    (f) => f.severity === "critical" && redlineByFindingId.get(f.id)?.status !== "accepted"
  ).length;

  // Redline Decision Mutation
  const updateRedlineMutation = useMutation({
    mutationFn: async ({
      redlineId,
      status,
      finalText,
    }: {
      redlineId: string;
      status: "accepted" | "rejected" | "edited";
      finalText?: string;
    }) => {
      const res = await fetch(`/api/redlines/${redlineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, final_text: finalText }),
      });
      if (!res.ok) throw new Error("Failed to update redline");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-workspace", contractId] });
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
    },
  });

  // Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!currentClause) return;
      const res = await fetch(`/api/contracts/${contractId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clauseId: currentClause.id,
          findingId: currentFinding?.id,
          body: text,
        }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["contract-workspace", contractId] });
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  // Keyboard navigation shortcuts (J/K/A/R/E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Next clause (J or ArrowDown)
      if (e.key === "j" || e.key === "J" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedClauseIndex((prev) => Math.min(clauses.length - 1, prev + 1));
      }
      // Prev clause (K or ArrowUp)
      if (e.key === "k" || e.key === "K" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedClauseIndex((prev) => Math.max(0, prev - 1));
      }
      // Accept redline (A)
      if ((e.key === "a" || e.key === "A") && currentRedline && !isViewer) {
        e.preventDefault();
        updateRedlineMutation.mutate({
          redlineId: currentRedline.id,
          status: "accepted",
          finalText: editText,
        });
      }
      // Reject redline (R)
      if ((e.key === "r" || e.key === "R") && currentRedline && !isViewer) {
        e.preventDefault();
        updateRedlineMutation.mutate({
          redlineId: currentRedline.id,
          status: "rejected",
        });
      }
      // Edit mode (E)
      if ((e.key === "e" || e.key === "E") && currentRedline && !isViewer) {
        e.preventDefault();
        setIsEditing((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clauses.length, currentRedline, editText, isViewer, updateRedlineMutation]);

  // Jump to next unresolved clause
  const handleJumpNextUnresolved = () => {
    const nextIdx = clauses.findIndex((c, i) => {
      if (i <= selectedClauseIndex) return false;
      const f = findingByClauseId.get(c.id);
      if (!f || f.finding_type !== "deviation") return false;
      const r = redlineByFindingId.get(f.id);
      return !r || r.status === "pending";
    });
    if (nextIdx !== -1) {
      setSelectedClauseIndex(nextIdx);
    } else {
      // Loop around
      const firstIdx = clauses.findIndex((c) => {
        const f = findingByClauseId.get(c.id);
        if (!f || f.finding_type !== "deviation") return false;
        const r = redlineByFindingId.get(f.id);
        return !r || r.status === "pending";
      });
      if (firstIdx !== -1) setSelectedClauseIndex(firstIdx);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: "accept_all_low" | "reject_all") => {
    if (isViewer) return;
    const confirmMsg =
      action === "accept_all_low"
        ? "Accept all low-severity suggested redlines across this agreement?"
        : "Reject all pending redlines across this agreement?";
    if (!confirm(confirmMsg)) return;

    for (const r of redlines) {
      const f = findings.find((find) => find.id === r.finding_id);
      if (action === "accept_all_low" && f?.severity === "low" && r.status === "pending") {
        await fetch(`/api/redlines/${r.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "accepted" }),
        });
      } else if (action === "reject_all" && r.status === "pending") {
        await fetch(`/api/redlines/${r.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected" }),
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ["contract-workspace", contractId] });
    queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
  };

  if (isLoading || !contract) {
    return (
      <div className="min-h-screen bg-background">
        <WorkflowStepper currentStep="review" contractId={contractId} />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-mono">
            Loading Interactive Legal Redline Workspace...
          </p>
        </div>
      </div>
    );
  }

  // Diff rendering setup
  const originalText = currentClause?.text || "";
  const replacementText =
    currentRedline?.status === "accepted" && currentRedline.final_text
      ? currentRedline.final_text
      : currentFinding?.suggested_clause || originalText;
  const wordDiffChunks = computeWordDiff(originalText, replacementText);

  // Verified highlighted HTML for center contract viewer
  const verifiedSpans = (currentFinding?.risky_spans || [])
    .map((s: any) => ({
      start: s.start ?? originalText.indexOf(s.quote),
      end: s.end ?? (originalText.indexOf(s.quote) + s.quote.length),
      quote: s.quote,
      reason: s.reason,
    }))
    .filter((s) => s.start !== -1);

  const highlightedClauseHtml = buildHighlightedHtml(
    originalText,
    verifiedSpans,
    currentFinding?.severity === "critical"
      ? "#DC2626"
      : currentFinding?.severity === "high"
      ? "#EA580C"
      : "#D97706"
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Global Workflow Stepper */}
      <WorkflowStepper currentStep="review" contractId={contractId} />

      {/* Top Workspace Action Sub-Ribbon */}
      <div className="h-14 border-b border-border/80 bg-surface/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/contracts/${contractId}`)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Scorecard</span>
          </button>
          <span className="text-border">|</span>
          <h2 className="text-sm font-semibold text-foreground truncate max-w-xs">
            {contract.vendor_name}
          </h2>
          <RiskPill score={contract.risk_score_current} size="sm" showLabel={false} />
        </div>

        {/* Action Shortcuts & Quick Bulk */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden lg:flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
            <span>Navigate: <kbd className="px-1.5 py-0.5 border border-border rounded bg-muted/60">J</kbd>/<kbd className="px-1.5 py-0.5 border border-border rounded bg-muted/60">K</kbd></span>
            <span>Accept: <kbd className="px-1.5 py-0.5 border border-border rounded bg-muted/60">A</kbd></span>
            <span>Reject: <kbd className="px-1.5 py-0.5 border border-border rounded bg-muted/60">R</kbd></span>
            <span>Edit: <kbd className="px-1.5 py-0.5 border border-border rounded bg-muted/60">E</kbd></span>
          </div>

          {!isViewer ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("accept_all_low")}
                className="px-3 py-1.5 rounded-xl font-semibold text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
              >
                Accept All Low Risk
              </button>
              <button
                onClick={() => handleBulkAction("reject_all")}
                className="px-3 py-1.5 rounded-xl font-semibold text-xs bg-surface hover:bg-muted/40 text-foreground border border-border/80 transition-colors"
              >
                Reject All
              </button>
            </div>
          ) : (
            <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-xl border border-border/80">
              Read-Only Viewer
            </span>
          )}
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* COLUMN 1: CLAUSE NAVIGATOR (Left, 3 cols) */}
        <div className="col-span-12 md:col-span-3 border-r border-border/80 bg-surface/50 flex flex-col h-full overflow-hidden">
          {/* Navigator Header */}
          <div className="p-3.5 border-b border-border/80 space-y-2.5 bg-surface">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Clause Navigator</span>
              <span className="text-muted-foreground font-mono text-[11px]">
                {reviewedCount}/{totalDeviations} reviewed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-primary h-full transition-all duration-300 rounded-full"
                style={{
                  width: totalDeviations > 0 ? `${(reviewedCount / totalDeviations) * 100}%` : "100%",
                }}
              />
            </div>

            {/* Unresolved Critical Badge */}
            {unresolvedCriticalCount > 0 && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
                <span className="text-red-700 dark:text-red-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  {unresolvedCriticalCount} Unresolved Critical
                </span>
                <button
                  onClick={handleJumpNextUnresolved}
                  className="text-[11px] text-red-600 font-bold hover:underline"
                >
                  Jump &rarr;
                </button>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search clauses..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-background border border-border/80 rounded-xl pl-9 pr-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {["all", "deviations", "critical", "high", "medium", "compliant"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-0.5 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
                    filterSeverity === sev
                      ? "bg-brand-primary text-white font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Clauses List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {filteredClauses.map((clause) => {
              const originalIndex = clauses.findIndex((c) => c.id === clause.id);
              const isSelected = originalIndex === selectedClauseIndex;
              const finding = findingByClauseId.get(clause.id);
              const redline = finding ? redlineByFindingId.get(finding.id) : null;

              return (
                <div
                  key={clause.id}
                  onClick={() => setSelectedClauseIndex(originalIndex)}
                  className={`p-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-brand-primary/10 border-l-4 border-l-brand-primary"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-foreground truncate max-w-[170px]">
                      {clause.heading || `Clause ${originalIndex + 1}`}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {redline && redline.status !== "pending" ? (
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            redline.status === "accepted"
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                              : "bg-red-500/20 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {redline.status}
                        </span>
                      ) : finding?.severity ? (
                        <SeverityBadge severity={finding.severity} size="sm" showIcon={false} />
                      ) : null}
                    </div>
                  </div>

                  <p className="text-muted-foreground text-[11px] line-clamp-2 leading-relaxed">
                    {clause.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: CONTRACT VIEWER (Center, 5 cols) */}
        <div className="col-span-12 md:col-span-5 border-r border-border/80 bg-surface flex flex-col h-full overflow-hidden">
          {/* Viewer Header */}
          <div className="p-3.5 border-b border-border/80 flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-primary" />
              <span className="text-sm font-semibold text-foreground">
                {currentClause?.heading || `Clause ${selectedClauseIndex + 1}`}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                (Page {currentClause?.page || 1})
              </span>
            </div>

            {currentFinding?.severity && currentFinding.severity !== "none" && (
              <SeverityBadge severity={currentFinding.severity} size="sm" />
            )}
          </div>

          {/* Full Clause Content with inline verified highlights */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="clause-prose text-foreground leading-relaxed text-base bg-background/50 p-6 rounded-2xl border border-border/80 shadow-xs">
              <div
                dangerouslySetInnerHTML={{
                  __html: highlightedClauseHtml,
                }}
              />
            </div>

            {/* Verified Risky Phrase Callouts */}
            {verifiedSpans.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                  VERIFIED DEVIATION PHRASES:
                </p>
                {verifiedSpans.map((span, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 text-xs space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-red-600 dark:text-red-400">
                        &quot;{span.quote}&quot;
                      </span>
                    </div>
                    <p className="text-[11px] text-secondary leading-relaxed">{span.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Floating Action Bar at bottom of center panel */}
          {currentRedline && !isViewer && (
            <div className="p-3 border-t border-border/80 bg-surface/90 backdrop-blur-md flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateRedlineMutation.mutate({
                      redlineId: currentRedline.id,
                      status: "accepted",
                      finalText: editText,
                    })
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept (A)</span>
                </button>
                <button
                  onClick={() =>
                    updateRedlineMutation.mutate({
                      redlineId: currentRedline.id,
                      status: "rejected",
                    })
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold text-foreground bg-surface hover:bg-muted/40 border border-border/80 flex items-center gap-1.5 transition-all"
                >
                  <X className="w-3.5 h-3.5 text-red-500" />
                  <span>Reject (R)</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("redline");
                    setIsEditing(true);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-brand-primary hover:bg-brand-primary/10 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                  Edit (E)
                </button>
              </div>

              <button
                onClick={handleJumpNextUnresolved}
                className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
              >
                <span>Next Unresolved</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* COLUMN 3: ANALYSIS & REDLINE PANEL (Right, 4 cols) */}
        <div className="col-span-12 md:col-span-4 bg-background flex flex-col h-full overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center border-b border-border/80 bg-surface overflow-x-auto text-xs font-medium scrollbar-none">
            <button
              onClick={() => setActiveTab("discrepancy")}
              className={`px-3.5 py-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "discrepancy"
                  ? "border-brand-primary text-brand-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Policy Discrepancy
            </button>
            <button
              onClick={() => setActiveTab("redline")}
              className={`px-3.5 py-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "redline"
                  ? "border-brand-primary text-brand-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Suggested Redline
            </button>
            <button
              onClick={() => setActiveTab("plain_english")}
              className={`px-3.5 py-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "plain_english"
                  ? "border-brand-primary text-brand-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Plain English
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`px-3.5 py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTab === "comments"
                  ? "border-brand-primary text-brand-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Comments ({comments.filter((c) => c.clause_id === currentClause?.id).length})</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {/* TAB 1: POLICY DISCREPANCY HIGHLIGHTER */}
            {activeTab === "discrepancy" && (
              <div className="space-y-4 text-xs">
                {currentFinding ? (
                  <>
                    {/* Side-by-side comparison cards */}
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300">
                          <Scale className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase font-mono font-bold tracking-wider">
                            Playbook Requires: {currentFinding.playbook_rule?.title}
                          </span>
                        </div>
                        <p className="text-xs text-foreground font-medium leading-relaxed">
                          {currentFinding.playbook_requirement_excerpt}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase font-mono font-bold tracking-wider">
                            Vendor Wrote:
                          </span>
                        </div>
                        <p className="text-xs text-foreground font-medium leading-relaxed">
                          {currentFinding.vendor_text_excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Deviation Summary Card */}
                    <div className="p-4 rounded-xl border border-border/80 bg-surface space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">Discrepancy Analysis</span>
                        <span className="text-[10px] uppercase font-mono font-bold text-brand-primary">
                          Priority: {currentFinding.negotiation_priority.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                        {currentFinding.deviation_summary}
                      </p>
                    </div>

                    {/* Switch to Redline action */}
                    <button
                      onClick={() => setActiveTab("redline")}
                      className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-brand-primary hover:bg-brand-primary/90 flex items-center justify-center gap-2 shadow-soft transition-all"
                    >
                      <span>Review &amp; Decide Redline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="font-semibold text-foreground">Standard Clause</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      No severe deviations detected against active playbook rules.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: INTERACTIVE REDLINE EDITOR */}
            {activeTab === "redline" && (
              <div className="space-y-4 text-xs">
                {currentRedline ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Proposed Redline Diff</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                          currentRedline.status === "accepted"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : currentRedline.status === "rejected"
                            ? "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30"
                            : "bg-muted text-foreground border-border"
                        }`}
                      >
                        Status: {currentRedline.status}
                      </span>
                    </div>

                    {/* Diff View with Clear Insertion & Deletion Styling */}
                    <div className="p-4 rounded-xl border border-border/80 bg-surface max-h-56 overflow-y-auto leading-relaxed font-sans text-xs shadow-xs">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: renderDiffHtml(wordDiffChunks),
                        }}
                      />
                    </div>

                    {/* Edit mode toggle */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <label className="font-semibold text-foreground">Custom Redline Draft:</label>
                        <textarea
                          rows={5}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-background border border-border/80 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline font-semibold"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Custom Edit Replacement Text</span>
                        </button>
                      </div>
                    )}

                    {/* Position Chooser */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-[11px] text-muted-foreground font-semibold">
                        Select Negotiation Position:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (currentFinding?.suggested_clause) setEditText(currentFinding.suggested_clause);
                          }}
                          className="p-2.5 text-left rounded-xl border border-border/80 hover:bg-muted/40 text-[11px] transition-colors"
                        >
                          <p className="font-bold text-foreground">Ideal Position</p>
                          <p className="text-[10px] text-muted-foreground truncate">Maximum protection</p>
                        </button>
                        <button
                          onClick={() => {
                            if (currentFinding?.fallback_clause) setEditText(currentFinding.fallback_clause);
                          }}
                          className="p-2.5 text-left rounded-xl border border-border/80 hover:bg-muted/40 text-[11px] transition-colors"
                        >
                          <p className="font-bold text-foreground">Acceptable Fallback</p>
                          <p className="text-[10px] text-muted-foreground truncate">Compromise term</p>
                        </button>
                      </div>
                    </div>

                    {/* Accept / Reject / Edit Action Buttons */}
                    {isViewer ? (
                      <div className="pt-2 p-3 rounded-xl bg-muted/60 text-center text-xs text-muted-foreground border border-border">
                        <p className="font-semibold text-foreground">Viewer Role: Read-Only</p>
                        <p className="text-[11px] mt-0.5">Switch to <strong>Reviewer</strong> or <strong>Admin</strong> in the top-right profile menu to accept or reject redlines.</p>
                      </div>
                    ) : (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateRedlineMutation.mutate({
                              redlineId: currentRedline.id,
                              status: "accepted",
                              finalText: editText,
                            })
                          }
                          className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept Redline</span>
                        </button>

                        <button
                          onClick={() =>
                            updateRedlineMutation.mutate({
                              redlineId: currentRedline.id,
                              status: "rejected",
                            })
                          }
                          className="py-2.5 px-4 rounded-xl font-bold text-xs bg-surface hover:bg-muted/40 text-foreground border border-border/80 flex items-center justify-center gap-1.5 transition-all"
                        >
                          <X className="w-4 h-4 text-red-500" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground space-y-2">
                    <p className="font-semibold text-foreground">No Redline Required</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">This clause satisfies corporate policy baselines.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PLAIN ENGLISH */}
            {activeTab === "plain_english" && (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl border border-border/80 bg-surface space-y-2 shadow-xs">
                  <h4 className="font-bold text-foreground">Business Impact for Procurement</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                    {currentFinding?.plain_english || "Standard commercial provision with acceptable corporate risk profile."}
                  </p>
                </div>

                {currentFinding?.walk_away_note && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                    <h5 className="font-bold text-amber-700 dark:text-amber-300">Walk-Away Threshold:</h5>
                    <p className="text-foreground/90 leading-relaxed">
                      {currentFinding.walk_away_note}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: COMMENTS */}
            {activeTab === "comments" && (
              <div className="space-y-4 text-xs">
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {comments
                    .filter((c) => c.clause_id === currentClause?.id)
                    .map((comm) => (
                      <div key={comm.id} className="p-3.5 rounded-xl border border-border/80 bg-surface space-y-1 shadow-xs">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground">{comm.user_name || "Reviewer"}</span>
                          <span>{new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-foreground leading-relaxed">{comm.body}</p>
                      </div>
                    ))}

                  {comments.filter((c) => c.clause_id === currentClause?.id).length === 0 && (
                    <p className="text-center text-muted-foreground py-6 text-[11px]">
                      No internal notes on this clause yet.
                    </p>
                  )}
                </div>

                {/* New Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add reviewer note or question..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
