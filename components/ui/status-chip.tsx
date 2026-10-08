"use client";

import React from "react";
import {
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSearch,
} from "lucide-react";
import { ContractStatus } from "@/types/database";

interface StatusChipProps {
  status: ContractStatus | string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusChip({ status, size = "md", className = "" }: StatusChipProps) {
  const norm = (status || "").toLowerCase();

  const configs: Record<
    string,
    {
      bg: string;
      text: string;
      border: string;
      icon: React.ElementType;
      label: string;
    }
  > = {
    uploaded: {
      bg: "bg-slate-500/10 dark:bg-slate-500/20",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-500/30",
      icon: Clock,
      label: "Uploaded",
    },
    processing: {
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-500/30",
      icon: Sparkles,
      label: "Analyzing",
    },
    analyzing: {
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-500/30",
      icon: Sparkles,
      label: "Analyzing",
    },
    review_pending: {
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      text: "text-amber-800 dark:text-amber-300",
      border: "border-amber-500/30",
      icon: FileSearch,
      label: "Review Pending",
    },
    in_review: {
      bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
      text: "text-indigo-700 dark:text-indigo-300",
      border: "border-indigo-500/30",
      icon: FileSearch,
      label: "In Review",
    },
    approved: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-500/30",
      icon: CheckCircle2,
      label: "Approved",
    },
    rejected: {
      bg: "bg-red-500/10 dark:bg-red-500/20",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-500/30",
      icon: XCircle,
      label: "Rejected",
    },
  };

  const cfg = configs[norm] || {
    bg: "bg-slate-500/10 dark:bg-slate-500/20",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/30",
    icon: AlertCircle,
    label: status.replace(/_/g, " "),
  };

  const Icon = cfg.icon;
  const sizeClasses = size === "sm" ? "text-[11px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium uppercase tracking-wider ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses} ${className}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{cfg.label}</span>
    </span>
  );
}
