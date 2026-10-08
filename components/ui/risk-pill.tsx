"use client";

import React from "react";

interface RiskPillProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function RiskPill({
  score,
  label,
  size = "md",
  showLabel = true,
  className = "",
}: RiskPillProps) {
  // Score styling
  const getColor = (s: number) => {
    if (s <= 25) {
      return {
        bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
        border: "border-emerald-500/30",
        text: "text-emerald-700 dark:text-emerald-300",
        ring: "stroke-emerald-500",
        dot: "bg-emerald-500",
        level: "Low Risk",
      };
    }
    if (s <= 55) {
      return {
        bg: "bg-amber-500/10 dark:bg-amber-500/20",
        border: "border-amber-500/30",
        text: "text-amber-800 dark:text-amber-300",
        ring: "stroke-amber-500",
        dot: "bg-amber-500",
        level: "Medium Risk",
      };
    }
    if (s <= 75) {
      return {
        bg: "bg-orange-500/10 dark:bg-orange-500/20",
        border: "border-orange-500/30",
        text: "text-orange-700 dark:text-orange-300",
        ring: "stroke-orange-500",
        dot: "bg-orange-500",
        level: "High Risk",
      };
    }
    return {
      bg: "bg-red-500/10 dark:bg-red-500/20",
      border: "border-red-500/30",
      text: "text-red-700 dark:text-red-300 font-semibold",
      ring: "stroke-red-500",
      dot: "bg-red-500",
      level: "Critical Risk",
    };
  };

  const style = getColor(score);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-2",
    lg: "text-sm px-3.5 py-1.5 gap-2.5 font-medium",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all ${style.bg} ${style.border} ${style.text} ${sizeClasses} ${className}`}
      title={`Risk Score: ${score}/100 (${style.level})`}
    >
      <span className="relative flex items-center justify-center">
        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      </span>
      <span className="font-mono font-bold tracking-tight">{score}</span>
      {showLabel && (
        <span className="text-[11px] opacity-80 uppercase tracking-wider font-semibold">
          {label || style.level}
        </span>
      )}
    </span>
  );
}
