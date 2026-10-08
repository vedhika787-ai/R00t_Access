"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Download,
  Search,
  Filter,
  ShieldCheck,
  UploadCloud,
  FileCheck2,
  FileSearch,
  BookOpen,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  Laptop,
} from "lucide-react";
import { AuditLog } from "@/types/database";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton-table";

export default function AuditTrailPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ logs: AuditLog[] }>({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const res = await fetch("/api/audit");
      if (!res.ok) throw new Error("Failed to load audit logs");
      return res.json();
    },
  });

  const logs = data?.logs || [];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entity_id || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  const handleDownloadCsv = () => {
    window.open("/api/audit?format=csv", "_blank");
  };

  const getActionBadge = (action: string) => {
    if (action.includes("upload")) {
      return {
        icon: UploadCloud,
        label: "Document Upload",
        bg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
      };
    }
    if (action.includes("analyze")) {
      return {
        icon: FileSearch,
        label: "AI Analysis",
        bg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
      };
    }
    if (action.includes("redline") || action.includes("accept")) {
      return {
        icon: FileCheck2,
        label: "Redline Decision",
        bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      };
    }
    if (action.includes("playbook")) {
      return {
        icon: BookOpen,
        label: "Playbook Governance",
        bg: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
      };
    }
    if (action.includes("export")) {
      return {
        icon: Download,
        label: "Report Export",
        bg: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
      };
    }
    return {
      icon: Activity,
      label: action.replace(/_/g, " "),
      bg: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
    };
  };

  const formatHumanAction = (log: AuditLog) => {
    const act = log.action.toLowerCase();
    if (act.includes("upload")) return `Uploaded vendor agreement into repository`;
    if (act.includes("analyze")) return `Executed vector clause segmentation & AI risk evaluation`;
    if (act.includes("redline_accepted") || act.includes("accepted")) return `Approved compliant substitution clause`;
    if (act.includes("redline_rejected") || act.includes("rejected")) return `Rejected vendor clause redline`;
    if (act.includes("playbook")) return `Modified corporate legal benchmark policy`;
    if (act.includes("export")) return `Generated executive summary PDF / redlined DOCX`;
    return `Performed ${log.action.replace(/_/g, " ")} on ${log.entity}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase font-mono font-semibold tracking-wider text-brand-primary">
                SECURITY &amp; COMPLIANCE
              </span>
              <span className="text-muted-foreground">&bull;</span>
              <span className="text-xs text-muted-foreground">SOC 2 / ISO 27001 Verification</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Governance &amp; Audit Trail
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal mt-1">
              Append-only immutable record of all contract uploads, AI analyses, legal redlines, and executive exports.
            </p>
          </div>

          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-primary hover:bg-brand-primary/90 text-white shadow-soft transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>

        {/* Filter Ribbon */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by action, entity or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs bg-surface border border-border/80 rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="all">All Actions ({logs.length})</option>
              <option value="upload">Uploads</option>
              <option value="analyze">Analyses</option>
              <option value="redline">Redlines</option>
              <option value="playbook">Playbook Updates</option>
              <option value="export">Exports</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        {isLoading ? (
          <SkeletonTable rows={6} cols={5} />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No Audit Records Found"
            description="No compliance actions match your current search query or action filter."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchTerm("");
              setActionFilter("all");
            }}
          />
        ) : (
          <div className="rounded-2xl border border-border/80 bg-surface overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 border-b border-border/80 text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3.5 px-5">Timestamp</th>
                    <th className="py-3.5 px-4">Event Type</th>
                    <th className="py-3.5 px-4">Governance Action</th>
                    <th className="py-3.5 px-4">Entity Reference</th>
                    <th className="py-3.5 px-5 text-right">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredLogs.map((log) => {
                    const badge = getActionBadge(log.action);
                    const Icon = badge.icon;
                    const isExpanded = expandedRowId === log.id;

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          onClick={() => setExpandedRowId(isExpanded ? null : log.id)}
                          className="hover:bg-muted/40 cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-5 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badge.bg}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{badge.label}</span>
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <p className="font-semibold text-foreground text-xs">
                              {formatHumanAction(log)}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate max-w-xs mt-0.5">
                              Action ID: {log.action}
                            </p>
                          </td>

                          <td className="py-4 px-4 font-mono text-[11px] text-muted-foreground">
                            <span className="capitalize text-foreground font-sans font-medium mr-1.5">
                              {log.entity}:
                            </span>
                            {log.entity_id ? log.entity_id.slice(0, 8) + "..." : "System"}
                          </td>

                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRowId(isExpanded ? null : log.id);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-primary hover:underline"
                            >
                              <span>{isExpanded ? "Hide" : "Inspect"}</span>
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Detail Row */}
                        {isExpanded && (
                          <tr className="bg-muted/20 border-b border-border/60">
                            <td colSpan={5} className="p-4 px-6">
                              <div className="rounded-xl border border-border/80 bg-background/80 p-4 space-y-3">
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                                  <span>Log UUID: {log.id}</span>
                                  <span>IP Address: {log.ip || "127.0.0.1"}</span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[11px] font-semibold text-foreground">
                                    Structured Payload Snapshot:
                                  </span>
                                  <pre className="text-[11px] font-mono bg-surface p-3 rounded-lg border border-border/60 overflow-x-auto text-slate-800 dark:text-slate-200">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
