"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  BookOpen,
  UploadCloud,
  FileCheck2,
  Sparkles,
  X,
  ArrowRight,
} from "lucide-react";

interface OnboardingChecklistProps {
  contractCount: number;
  onLoadSample: () => void;
  isLoadingSample: boolean;
}

export function OnboardingChecklist({
  contractCount,
  onLoadSample,
  isLoadingSample,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("lexiguard_onboarding_dismissed") === "true";
    setDismissed(isDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("lexiguard_onboarding_dismissed", "true");
  };

  if (dismissed) return null;

  const steps = [
    {
      id: 1,
      title: "Review Your Legal Playbook",
      desc: "Inspect 15 seeded enterprise fallback rules and corporate risk weights.",
      completed: true,
      href: "/playbook",
      icon: BookOpen,
      action: "Open Playbook",
    },
    {
      id: 2,
      title: "Upload a Vendor Agreement",
      desc: "Drop a vendor MSA (PDF/DOCX) or load our pre-configured risky sample.",
      completed: contractCount > 0,
      href: "#upload-section",
      icon: UploadCloud,
      action: "Upload File",
    },
    {
      id: 3,
      title: "Review Redlines & Export",
      desc: "Accept compliant substitutions and download an executive legal summary.",
      completed: contractCount > 0,
      href: "/dashboard",
      icon: FileCheck2,
      action: "Inspect Agreements",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="relative rounded-2xl border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-surface to-surface p-6 shadow-soft mb-8 overflow-hidden">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Get Started with LexiGuard
              <span className="text-xs font-sans font-normal px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                {completedCount} of {steps.length} Completed ({progressPct}%)
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Follow these three quick steps to run your first enterprise contract risk audit.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/60 transition-colors"
          title="Dismiss guide"
          aria-label="Dismiss onboarding checklist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted/70 h-2 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-primary to-purple-600 transition-all duration-500 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className={`rounded-xl border p-4 transition-all ${
                s.completed
                  ? "bg-surface border-border/80 shadow-xs"
                  : "bg-surface/50 border-brand-primary/20 hover:border-brand-primary/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {s.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-semibold text-foreground">
                    Step {s.id}
                  </span>
                </div>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {s.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {s.desc}
              </p>
              <Link
                href={s.href}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
              >
                <span>{s.action}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Quick Action Button for Sample */}
      <div className="mt-5 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">
          Want to see how LexiGuard flags 9 enterprise deviations instantly?
        </span>
        <button
          onClick={onLoadSample}
          disabled={isLoadingSample}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-brand-primary/40 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-medium transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isLoadingSample ? "Loading MSA..." : "Try with Sample Contract (1-Click)"}</span>
        </button>
      </div>
    </div>
  );
}
