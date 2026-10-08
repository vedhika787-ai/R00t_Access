"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Upload,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { Contract } from "@/types/database";

export default function DashboardPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [dragActive, setDragActive] = useState(false);

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
  const awaitingReview = contracts.filter((c) => c.status === "processing" || c.status === "in_review" || c.status === "analyzed").length;
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

  // Handle file drop/upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("File exceeds maximum allowed size of 15 MB.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress("Validating and parsing document...");

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
        throw new Error(err.error || "Upload failed");
      }

      const resData = await res.json();
      setUploadProgress("Redirecting to live analysis pipeline...");
      router.push(`/contracts/${resData.contractId}/processing`);
    } catch (err: any) {
      alert(err.message || "Upload failed");
      setIsUploading(false);
      setUploadProgress("");
    }
  };

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
    <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Contract Risk Library
          </h1>
          <p className="text-sm text-muted-foreground">
            Active vendor MSAs and NDAs benchmarked against corporate legal playbook
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadSample}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all hover:scale-102"
          >
            <Sparkles className="w-4 h-4" />
            1-Click Demo MSA (Risk Loaded)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Contracts</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalContracts}</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">High Risk</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-500">{highRiskContracts}</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Risk Score</span>
            <span className="text-xs font-bold text-muted-foreground">0-100</span>
          </div>
          <p
            className={`text-2xl font-bold ${
              avgRiskScore >= 50
                ? "text-red-500"
                : avgRiskScore >= 35
                ? "text-amber-500"
                : "text-emerald-500"
            }`}
          >
            {avgRiskScore}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{awaitingReview}</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Analysis Speed</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-500">{avgProcessingSec}s</p>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 bg-card/60"
        }`}
      >
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-foreground">
              Drop vendor contract to analyze (PDF or DOCX)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum file size: 15 MB. Vector matching against active corporate playbook starts immediately.
            </p>
          </div>

          <div className="flex items-center gap-2 max-w-xs mx-auto">
            <input
              type="text"
              placeholder="Vendor Name (e.g. ApexCloud)"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full text-xs px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="pt-2">
            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-primary hover:bg-primary/90 shadow-sm transition-all">
              <span>Select File from Disk</span>
              <input
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {isUploading && (
            <div className="p-3 bg-muted rounded-xl text-xs text-primary font-medium flex items-center justify-center gap-2 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{uploadProgress}</span>
            </div>
          )}
        </div>
      </div>

      {/* Contracts Table Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search vendor or contract title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Contracts</option>
              <option value="high_risk">High Risk (&gt;= 50)</option>
              <option value="low_risk">Low Risk (&lt; 35)</option>
              <option value="analyzed">Analyzed</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Vendor & Contract</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Recommendation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading contracts from database...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No contracts found matching your filters. Click <strong>1-Click Demo MSA</strong> above to run an analysis.
                    </td>
                  </tr>
                ) : (
                  filtered.map((contract) => {
                    const score = contract.risk_score_current;
                    const scoreBadgeColor =
                      score >= 65
                        ? "bg-red-500/10 text-red-500 border-red-500/30"
                        : score >= 35
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";

                    return (
                      <tr
                        key={contract.id}
                        onClick={() => router.push(`/contracts/${contract.id}`)}
                        className="hover:bg-muted/40 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                            {contract.vendor_name}
                          </p>
                          <p className="text-muted-foreground text-[11px] truncate max-w-xs">
                            {contract.title}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-muted-foreground">
                          {new Date(contract.created_at).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted border border-border text-foreground">
                            {contract.status.replace("_", " ")}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${scoreBadgeColor}`}
                          >
                            {score}/100
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${
                              contract.recommendation === "reject"
                                ? "text-red-500 bg-red-500/10"
                                : contract.recommendation === "sign"
                                ? "text-emerald-500 bg-emerald-500/10"
                                : "text-amber-500 bg-amber-500/10"
                            }`}
                          >
                            {contract.recommendation}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/contracts/${contract.id}/review`);
                              }}
                              title="Open Reviewer Workspace"
                              className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(contract.id, e)}
                              title="Delete Contract"
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
