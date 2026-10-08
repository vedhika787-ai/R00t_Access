"use client";

import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  CheckCheck,
  FileX,
  MinusCircle,
} from "lucide-react";
import { RuleSeverity } from "@/types/database";

interface SeverityBadgeProps {
  severity: RuleSeverity | "compliant" | "missing" | "none" | string;
  showIcon?: boolean;
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function SeverityBadge({
  severity,
  showIcon = true,
  pulse = true,
  size = "md",
  className = "",
  label,
}: SeverityBadgeProps) {
  const norm = (severity || "none").toLowerCase();

  const configs: Record<
    string,
    {
      bg: string;
      text: string;
      border: string;
      icon: React.ElementType;
      defaultLabel: string;
      pulseStyle?: string;
    }
  > = {
    critical: {
      bg: "bg-red-500/10 dark:bg-red-500/20",
      text: "text-red-700 dark:text-red-300 font-semibold",
      border: "border-red-500/30 dark:border-red-500/40",
      icon: ShieldAlert,
      defaultLabel: "Critical",
      pulseStyle: "relative before:absolute before:-inset-0.5 before:rounded-full before:bg-red-500/30 before:animate-ping before:opacity-75",
    },
    high: {
      bg: "bg-orange-500/10 dark:bg-orange-500/20",
      text: "text-orange-700 dark:text-orange-300 font-medium",
      border: "border-orange-500/30 dark:border-orange-500/40",
      icon: AlertTriangle,
      defaultLabel: "High Risk",
    },
    medium: {
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      text: "text-amber-800 dark:text-amber-300 font-medium",
      border: "border-amber-500/30 dark:border-amber-500/40",
      icon: AlertCircle,
      defaultLabel: "Medium",
    },
    low: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-300 font-medium",
      border: "border-emerald-500/30 dark:border-emerald-500/40",
      icon: CheckCircle2,
      defaultLabel: "Low",
    },
    compliant: {
      bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
      text: "text-cyan-700 dark:text-cyan-300 font-medium",
      border: "border-cyan-500/30 dark:border-cyan-500/40",
      icon: CheckCheck,
      defaultLabel: "Compliant",
    },
    missing: {
      bg: "bg-purple-500/10 dark:bg-purple-500/20",
      text: "text-purple-700 dark:text-purple-300 font-medium",
      border: "border-purple-500/30 dark:border-purple-500/40",
      icon: FileX,
      defaultLabel: "Missing Clause",
    },
    none: {
      bg: "bg-slate-500/10 dark:bg-slate-500/20",
      text: "text-slate-600 dark:text-slate-400 font-normal",
      border: "border-slate-500/20 dark:border-slate-500/30",
      icon: MinusCircle,
      defaultLabel: "Standard",
    },
  };

  const cfg = configs[norm] || configs.none;
  const Icon = cfg.icon;

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3.5 py-1.5 gap-2",
  }[size];

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses} ${className}`}
      title={`Severity: ${label || cfg.defaultLabel}`}
    >
      {showIcon && (
        <span className="relative flex items-center justify-center">
          {norm === "critical" && pulse && (
            <span className="absolute -inset-0.5 rounded-full bg-red-500/40 animate-ping opacity-60" />
          )}
          <Icon className={`${iconSizes} flex-shrink-0`} aria-hidden="true" />
        </span>
      )}
      <span className="truncate">{label || cfg.defaultLabel}</span>
    </span>
  );
}
