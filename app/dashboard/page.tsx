"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Upload,
  FolderOpen,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { Contract } from "@/types/database";
import { TiltCard } from "@/components/ui/tilt-card";
import { RiskPill } from "@/components/ui/risk-pill";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { WorkflowStepper } from "@/components/layout/workflow-stepper";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { ContractsHero } from "@/components/contracts/contracts-hero";

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch contracts
  const { data, isLoading, refetch } = useQuery<{ contracts: Contract[] }>({
    queryKey: ["contracts"],
    queryFn: async () => {
      const res = await fetch("/api/contracts");
      if (!res.ok) throw new Error("Failed to load contracts");
      return res.json();
    },
  });

  const contracts = data?.contracts || [];

  // KPI calculations
  const totalContracts = contracts.length;
  const highRiskContracts = contracts.filter((c) => c.risk_score_current >= 50).length;
  const avgRiskScore =
    totalContracts > 0
      ? Math.round(
          contracts.reduce((acc, c) => acc + (c.risk_score_current || 0), 0) / totalContracts
        )
      : 0;
  const awaitingReview = contracts.filter(
    (c) => c.status === "processing" || c.status === "in_review" || c.status === "analyzed"
  ).length;
  const avgProcessingSec =
    totalContracts > 0
      ? (
          contracts.reduce((acc, c) => acc + (c.processing_ms || 3200), 0) /
          totalContracts /
          1000
        ).toFixed(1)
      : "3.2";

  // Filtered contracts
  const filtered = contracts.filter((c) => {
    const matchesSearch =
      c.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "high_risk" && c.risk_score_current >= 50) ||
      (statusFilter === "low_risk" && c.risk_score_current < 35) ||
      c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle multiple files upload
  const handleFilesUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const validFiles = files.filter((f) => {
      const name = f.name.toLowerCase();
      return (name.endsWith(".pdf") || name.endsWith(".docx")) && !f.name.startsWith("._");
    });

    if (validFiles.length === 0) {
      alert("Please select valid PDF or DOCX contract files.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(`Processing ${validFiles.length} contract document${validFiles.length > 1 ? "s" : ""}...`);

      let targetId: string | null = null;
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        if (file.size > 25 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 25 MB limit.`);
          continue;
        }

        setUploadProgress(`Uploading ${i + 1} of ${validFiles.length}: ${file.name}...`);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("vendor_name", vendorName || file.name.replace(/\.[^/.]+$/, ""));
        formData.append("title", file.name);

        const res = await fetch("/api/contracts/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          console.warn(`Upload failed for ${file.name}:`, err);
          continue;
        }

        const resData = await res.json();
        targetId = resData.contractId;
      }

      if (!targetId) throw new Error("Document upload failed.");
      refetch();
      setUploadProgress("Analysis initialized. Redirecting...");
      router.push(`/contracts/${targetId}/processing`);
    } catch (err: any) {
      alert(err.message || "Upload failed");
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  // Handle entire folder selection from system
  const handleFolderUpload = async (rawFiles: File[]) => {
    if (!rawFiles || rawFiles.length === 0) return;

    const validFiles = rawFiles.filter((f) => {
      const name = f.name.toLowerCase();
      return (name.endsWith(".pdf") || name.endsWith(".docx")) && !f.name.startsWith("._");
    });

    if (validFiles.length === 0) {
      alert("No PDF or DOCX contract files found in the selected folder. Please choose a folder containing vendor contracts.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(`Found ${validFiles.length} contract document${validFiles.length > 1 ? "s" : ""} in folder...`);

      let targetId: string | null = null;
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress(`Importing ${i + 1} of ${validFiles.length}: ${file.name}...`);

        const relativeParts = (file as any).webkitRelativePath?.split("/") || [];
        const detectedVendor =
          relativeParts.length > 1
            ? relativeParts[relativeParts.length - 2]
            : file.name.replace(/\.[^/.]+$/, "");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("vendor_name", vendorName || detectedVendor);
        formData.append("title", file.name);

        const res = await fetch("/api/contracts/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) continue;
        const resData = await res.json();
        targetId = resData.contractId;
      }

      if (!targetId) throw new Error("Could not process folder contracts.");
      refetch();
      setUploadProgress("Folder import complete! Redirecting to analysis pipeline...");
      router.push(`/contracts/${targetId}/processing`);
    } catch (err: any) {
      alert(err.message || "Folder import failed");
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  // Backward compatibility wrapper
  const handleFileUpload = (file: File) => handleFilesUpload([file]);

  // 1-Click Load Realistic Sample MSA
  const handleLoadSample = async () => {
    try {
      setIsUploading(true);
      setUploadProgress("Loading realistic Vendor MSA sample...");

      const res = await fetch("/api/contracts/sample", { method: "POST" });
      if (!res.ok) throw new Error("Failed to load sample");
      const resData = await res.json();

      router.push(`/contracts/${resData.contractId}/processing`);
    } catch (err: any) {
      alert(err.message || "Failed to load sample");
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  // Delete contract
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this contract and all findings?")) return;
    await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden File and Folder Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesUpload(Array.from(e.target.files));
            e.target.value = "";
          }
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard in HTML5 for directory selection
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFolderUpload(Array.from(e.target.files));
            e.target.value = "";
          }
        }}
      />

      {/* Global Workflow Stepper with dynamic links and click handlers */}
      <WorkflowStepper
        currentStep="upload"
        contractId={contracts[0]?.id}
        onUploadClick={() => {
          setShowUploadModal(true);
          fileInputRef.current?.click();
        }}
      />

      {/* Contracts Hero Section - Spanning full-width edge-to-edge */}
      <ContractsHero />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Centered Document Verification & Upload Section */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-b from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 p-8 sm:p-10 text-center shadow-sm">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>AI-Powered Contract Governance</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Verify Your Document by Uploading
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Upload your third-party vendor agreement (PDF or DOCX) or select an entire folder of contracts to benchmark against your corporate playbook rules, verify critical liabilities with anti-hallucination protection, and generate audit-ready redlines.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <button
                onClick={() => {
                  setShowUploadModal(true);
                  fileInputRef.current?.click();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Contract (PDF/DOCX)</span>
              </button>

              <button
                onClick={() => {
                  setShowUploadModal(true);
                  folderInputRef.current?.click();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 active:scale-[0.98] transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Select Folder from System</span>
              </button>

              <button
                onClick={handleLoadSample}
                disabled={isUploading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 active:scale-[0.98] transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{isUploading ? "Loading..." : "1-Click Demo Agreement"}</span>
              </button>
            </div>

            <p className="text-xs text-muted-foreground pt-1">
              Supports individual PDF &amp; DOCX files or batch folder import • DPDP &amp; GDPR compliant
            </p>
          </div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-mono tracking-wider text-brand-primary font-semibold">
                WORKSPACE OVERVIEW
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
              <span className="text-xs text-muted-foreground">Active Legal Repository</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Contract Risk Library
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-normal mt-1">
              Third-party vendor agreements analyzed against corporate playbook rules &amp; compliance standards.
            </p>
          </div>
        </div>

        {/* Onboarding Checklist for Users */}
        <OnboardingChecklist
          contractCount={contracts.length}
          onLoadSample={handleLoadSample}
          isLoadingSample={isUploading}
        />

        {/* 5 KPI Tilt Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <TiltCard className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Total Files
              </span>
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-foreground">{totalContracts}</p>
              <span className="text-[11px] text-muted-foreground font-mono">Agreements</span>
            </div>
          </TiltCard>

          <TiltCard className="p-5 border-red-500/30">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                High Risk
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">
                {highRiskContracts}
              </p>
              <span className="text-[11px] font-semibold text-red-600/80 uppercase">Score &ge; 50</span>
            </div>
          </TiltCard>

          <TiltCard className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Avg Risk Score
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p
                className={`text-3xl font-extrabold ${
                  avgRiskScore >= 50
                    ? "text-red-600"
                    : avgRiskScore >= 35
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {avgRiskScore}
                <span className="text-xs text-muted-foreground font-normal">/100</span>
              </p>
              <span className="text-[11px] text-muted-foreground font-mono">Weighted</span>
            </div>
          </TiltCard>

          <TiltCard className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                In Review
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-foreground">{awaitingReview}</p>
              <span className="text-[11px] text-muted-foreground font-mono">Active</span>
            </div>
          </TiltCard>

          <TiltCard className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                AI Speed
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {avgProcessingSec}s
              </p>
              <span className="text-[11px] text-muted-foreground font-mono">Avg / MSA</span>
            </div>
          </TiltCard>
        </div>

        {/* Compact Upload Area / Dropzone */}
        {(showUploadModal || contracts.length === 0) && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFilesUpload(Array.from(e.dataTransfer.files));
              }
            }}
            className={`relative rounded-2xl border-2 border-dashed p-8 transition-all ${
              dragActive
                ? "border-brand-primary bg-brand-primary/5 scale-[1.01] shadow-raised"
                : "border-border/80 hover:border-brand-primary/40 bg-surface shadow-soft"
            }`}
          >
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto shadow-inner">
                <Upload className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Upload Contract Document or Select Entire Folder
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag and drop contract files/folders here, or select from your system. Automatic clause segmentation, vector matching, and anti-hallucination analysis will begin immediately.
                </p>
              </div>

              <div className="flex items-center gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  placeholder="Vendor Name (e.g. ApexCloud Technologies)"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Choose File(s)</span>
                </button>

                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-purple-600 hover:bg-purple-500 shadow-sm transition-all"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Choose Folder</span>
                </button>

                {contracts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-surface text-foreground hover:bg-muted/40 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>

              {isUploading && (
                <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-xs text-brand-primary font-medium flex items-center justify-center gap-2 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{uploadProgress}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contracts Section Header & Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search vendor or agreement name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface border border-border/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-shadow"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-surface border border-border/80 rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                <option value="all">All Agreements</option>
                <option value="high_risk">High Risk (&ge; 50)</option>
                <option value="low_risk">Low Risk (&lt; 35)</option>
                <option value="analyzed">Analyzed</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          {isLoading ? (
            <SkeletonTable rows={5} cols={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No Agreements Found"
              description="No vendor contracts match your current search or filter criteria. Upload a new document or load the realistic enterprise sample MSA."
              actionLabel="Upload Contract"
              onAction={() => setShowUploadModal(true)}
              secondaryActionLabel="Load Sample MSA"
              onSecondaryAction={handleLoadSample}
            />
          ) : (
            <div className="rounded-2xl border border-border/80 bg-surface overflow-hidden shadow-soft">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 border-b border-border/80 text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3.5 px-5">Vendor &amp; Agreement</th>
                      <th className="py-3.5 px-4">Upload Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Risk Score</th>
                      <th className="py-3.5 px-4">Recommendation</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filtered.map((contract) => {
                      const score = contract.risk_score_current;

                      return (
                        <tr
                          key={contract.id}
                          onClick={() => router.push(`/contracts/${contract.id}`)}
                          className="hover:bg-muted/40 cursor-pointer transition-colors group"
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                                {contract.vendor_name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground text-sm group-hover:text-brand-primary transition-colors">
                                  {contract.vendor_name}
                                </p>
                                <p className="text-muted-foreground text-[11px] truncate max-w-xs mt-0.5">
                                  {contract.title}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-muted-foreground font-mono text-[11px]">
                            {new Date(contract.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>

                          <td className="py-4 px-4">
                            <StatusChip status={contract.status} size="sm" />
                          </td>

                          <td className="py-4 px-4">
                            <RiskPill score={score} size="sm" />
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`uppercase text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md border ${
                                contract.recommendation === "reject"
                                  ? "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/30"
                                  : contract.recommendation === "sign"
                                  ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                                  : "text-amber-800 dark:text-amber-300 bg-amber-500/10 border-amber-500/30"
                              }`}
                            >
                              {contract.recommendation}
                            </span>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/contracts/${contract.id}/review`);
                                }}
                                title="Open Reviewer Workspace"
                                className="p-2 rounded-xl hover:bg-brand-primary/10 text-muted-foreground hover:text-brand-primary transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(contract.id, e)}
                                title="Delete Contract"
                                className="p-2 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
