"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit3,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  BookOpen,
  MessageSquare,
  FileText,
  CornerDownRight,
  Send,
  HelpCircle,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { Contract, Clause, Finding, Redline, Comment } from "@/types/database";
import { computeWordDiff, renderDiffHtml } from "@/lib/diff";
import { buildHighlightedHtml } from "@/lib/ai/span-verifier";

export default function ReviewerWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contractId = params?.id as string;

  // Active state
  const [selectedClauseIndex, setSelectedClauseIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"discrepancy" | "redline" | "plain_english" | "regulations" | "comments">("discrepancy");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [editText, setEditText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
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

  // Bulk Accept All Low Risk
  const handleBulkAction = async (action: "accept_all_low" | "reject_all") => {
    await fetch("/api/redlines/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contract_id: contractId, action }),
    });
    queryClient.invalidateQueries({ queryKey: ["contract-workspace", contractId] });
  };

  // Keyboard navigation shortcuts (J/K next/prev, A accept, R reject, E edit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in textarea or input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        setSelectedClauseIndex((prev) => Math.min(clauses.length - 1, prev + 1));
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        setSelectedClauseIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "a" || e.key === "A") {
        if (currentRedline) {
          e.preventDefault();
          updateRedlineMutation.mutate({
            redlineId: currentRedline.id,
            status: "accepted",
          });
        }
      } else if (e.key === "r" || e.key === "R") {
        if (currentRedline) {
          e.preventDefault();
          updateRedlineMutation.mutate({
            redlineId: currentRedline.id,
            status: "rejected",
          });
        }
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setIsEditing(true);
        setActiveTab("redline");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clauses.length, currentRedline, updateRedlineMutation]);

  // Comment submission
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentClause) return;

    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contract_id: contractId,
        clause_id: currentClause.id,
        body: newComment.trim(),
        user_name: "Sarah Chen (General Counsel)",
      }),
    });
    setNewComment("");
    queryClient.invalidateQueries({ queryKey: ["contract-workspace", contractId] });
  };

  if (isLoading || !contract) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent animate-spin rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Reviewer Workspace...</p>
        </div>
      </div>
    );
  }

  // Diff computation for redline view
  const originalText = currentClause?.text || "";
  const replacementText = editText || currentFinding?.suggested_clause || originalText;
  const wordDiffChunks = computeWordDiff(originalText, replacementText);

  // Verified highlighted HTML for center contract viewer
  const verifiedSpans = (currentFinding?.risky_spans || []).map((s: any) => ({
    start: s.start ?? originalText.indexOf(s.quote),
    end: s.end ?? (originalText.indexOf(s.quote) + s.quote.length),
    quote: s.quote,
    reason: s.reason,
  })).filter((s) => s.start !== -1);

  const highlightedClauseHtml = buildHighlightedHtml(
    originalText,
    verifiedSpans,
    currentFinding?.severity === "critical"
      ? "#ef4444"
      : currentFinding?.severity === "high"
      ? "#f97316"
      : "#f59e0b"
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Top Workspace Action Ribbon */}
      <div className="h-14 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <a
            href={`/contracts/${contractId}`}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            ← Scorecard
          </a>
          <span className="text-border">|</span>
          <h2 className="text-sm font-bold text-foreground truncate max-w-xs">
            {contract.vendor_name}
          </h2>
          <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
            Score: {contract.risk_score_current}/100
          </span>
        </div>

        {/* Action Shortcuts & Quick Bulk */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden lg:flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
            <span>Navigate: <kbd className="px-1 border rounded bg-muted">J</kbd>/<kbd className="px-1 border rounded bg-muted">K</kbd></span>
            <span>Accept: <kbd className="px-1 border rounded bg-muted">A</kbd></span>
            <span>Reject: <kbd className="px-1 border rounded bg-muted">R</kbd></span>
            <span>Edit: <kbd className="px-1 border rounded bg-muted">E</kbd></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction("accept_all_low")}
              className="px-3 py-1.5 rounded-lg font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
            >
              Accept All Low Risk
            </button>
            <button
              onClick={() => handleBulkAction("reject_all")}
              className="px-3 py-1.5 rounded-lg font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
            >
              Reject All
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* COLUMN 1: CLAUSE NAVIGATOR (Left, 3 cols) */}
        <div className="col-span-12 md:col-span-3 border-r border-border bg-background flex flex-col h-full overflow-hidden">
          {/* Navigator Header */}
          <div className="p-3 border-b border-border space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">Clause Navigator</span>
              <span className="text-muted-foreground font-mono text-[11px]">
                {reviewedCount}/{totalDeviations} reviewed
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search clauses..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {["all", "deviations", "critical", "high", "medium", "compliant"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2 py-0.5 rounded capitalize whitespace-nowrap transition-colors ${
                    filterSeverity === sev
                      ? "bg-primary text-white font-semibold"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Clauses List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredClauses.map((clause) => {
              const finding = findingByClauseId.get(clause.id);
              const redline = finding ? redlineByFindingId.get(finding.id) : null;
              const isSelected = clauses[selectedClauseIndex]?.id === clause.id;

              return (
                <div
                  key={clause.id}
                  onClick={() => {
                    const originalIdx = clauses.findIndex((c) => c.id === clause.id);
                    setSelectedClauseIndex(originalIdx);
                  }}
                  className={`p-3 cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? "bg-primary/10 border-l-4 border-l-primary"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-foreground truncate max-w-[170px]">
                      {clause.heading || `Clause ${clause.order_index + 1}`}
                    </span>

                    {/* Status / Severity indicator */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {redline && redline.status !== "pending" ? (
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            redline.status === "accepted"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {redline.status}
                        </span>
                      ) : finding?.severity ? (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            finding.severity === "critical"
                              ? "bg-red-500"
                              : finding.severity === "high"
                              ? "bg-orange-500"
                              : finding.severity === "medium"
                              ? "bg-amber-500"
                              : finding.severity === "low"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />
                      ) : null}
                    </div>
                  </div>

                  <p className="text-muted-foreground text-[11px] line-clamp-2">
                    {clause.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: CONTRACT VIEWER (Center, 5 cols) */}
        <div className="col-span-12 md:col-span-5 border-r border-border bg-card flex flex-col h-full overflow-hidden">
          {/* Viewer Header */}
          <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">
                {currentClause?.heading || `Clause ${selectedClauseIndex + 1}`}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                (Page {currentClause?.page || 1})
              </span>
            </div>

            {currentFinding?.severity && currentFinding.severity !== "none" && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">
                {currentFinding.severity} deviation
              </span>
            )}
          </div>

          {/* Full Clause Content with inline verified highlights */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="clause-prose text-foreground leading-relaxed text-sm bg-background/50 p-5 rounded-2xl border border-border">
              <div
                dangerouslySetInnerHTML={{
                  __html: highlightedClauseHtml,
                }}
              />
            </div>

            {/* Verified Risky Phrase Tooltips List */}
            {verifiedSpans.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Flagged Phrases in Vendor Text:
                </p>
                {verifiedSpans.map((span, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-red-500">
                        &quot;{span.quote}&quot;
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{span.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: ANALYSIS & REDLINE PANEL (Right, 4 cols) */}
        <div className="col-span-12 md:col-span-4 bg-background flex flex-col h-full overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center border-b border-border bg-card overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setActiveTab("discrepancy")}
              className={`px-3 py-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "discrepancy"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Policy Discrepancy
            </button>
            <button
              onClick={() => setActiveTab("redline")}
              className={`px-3 py-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "redline"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Suggested Redline
            </button>
            <button
              onClick={() => setActiveTab("plain_english")}
              className={`px-3 py-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "plain_english"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Plain English
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`px-3 py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTab === "comments"
                  ? "border-primary text-primary font-bold"
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
                      <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
                          Playbook Requires: {currentFinding.playbook_rule?.title}
                        </span>
                        <p className="text-xs text-foreground font-medium leading-relaxed">
                          {currentFinding.playbook_requirement_excerpt}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">
                          Vendor Wrote:
                        </span>
                        <p className="text-xs text-foreground font-medium leading-relaxed">
                          {currentFinding.vendor_text_excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Deviation Summary Card */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">Discrepancy Analysis</span>
                        <span className="text-[10px] uppercase font-bold text-primary">
                          Priority: {currentFinding.negotiation_priority.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentFinding.deviation_summary}
                      </p>
                    </div>

                    {/* Switch to Redline action */}
                    <button
                      onClick={() => setActiveTab("redline")}
                      className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>Review & Decide Redline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="font-semibold text-foreground">Standard Clause</p>
                    <p className="text-[11px]">No severe deviations detected against active playbook rules.</p>
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
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          currentRedline.status === "accepted"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : currentRedline.status === "rejected"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        Status: {currentRedline.status}
                      </span>
                    </div>

                    {/* Diff View */}
                    <div className="p-4 rounded-xl border border-border bg-card max-h-56 overflow-y-auto leading-relaxed font-sans">
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
                          className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
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
                          className="p-2 text-left rounded-lg border border-border hover:bg-muted text-[11px]"
                        >
                          <p className="font-bold text-foreground">Ideal Position</p>
                          <p className="text-[10px] text-muted-foreground truncate">Maximum protection</p>
                        </button>
                        <button
                          onClick={() => {
                            if (currentFinding?.fallback_clause) setEditText(currentFinding.fallback_clause);
                          }}
                          className="p-2 text-left rounded-lg border border-border hover:bg-muted text-[11px]"
                        >
                          <p className="font-bold text-foreground">Acceptable Fallback</p>
                          <p className="text-[10px] text-muted-foreground truncate">Compromise term</p>
                        </button>
                      </div>
                    </div>

                    {/* Accept / Reject / Edit Action Buttons */}
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
                        className="py-2.5 px-4 rounded-xl font-bold text-xs bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center justify-center gap-1.5 transition-all"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground space-y-2">
                    <p className="font-semibold text-foreground">No Redline Required</p>
                    <p className="text-[11px]">This clause satisfies corporate policy baselines.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PLAIN ENGLISH */}
            {activeTab === "plain_english" && (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <h4 className="font-bold text-foreground">Business Impact for Procurement</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {currentFinding?.plain_english || "Standard commercial provision with acceptable corporate risk profile."}
                  </p>
                </div>

                {currentFinding?.walk_away_note && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                    <h5 className="font-bold text-amber-500">Walk-Away Threshold:</h5>
                    <p className="text-foreground/80 leading-relaxed">
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
                      <div key={comm.id} className="p-3 rounded-xl border border-border bg-card space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground">{comm.user_name || "Reviewer"}</span>
                          <span>{new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-foreground">{comm.body}</p>
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
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90"
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
