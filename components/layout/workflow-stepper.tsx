"use client";

import React from "react";
import Link from "next/link";
import {
  UploadCloud,
  Cpu,
  Gauge,
  FileEdit,
  Download,
  Check,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { Contract } from "@/types/database";

export type WorkflowStepId = "upload" | "analysis" | "scorecard" | "review" | "export";

interface WorkflowStepperProps {
  currentStep: WorkflowStepId;
  contractId?: string;
  hasFindings?: boolean;
  onUploadClick?: () => void;
}

export function WorkflowStepper({
  currentStep,
  contractId,
  hasFindings = true,
  onUploadClick,
}: WorkflowStepperProps) {
  // Automatically fetch contracts so stepper links always resolve even without manual props
  const { data: contractsData } = useQuery<{ contracts: Contract[] }>({
    queryKey: ["contracts"],
    queryFn: async () => {
      const res = await fetch("/api/contracts");
      if (!res.ok) return { contracts: [] };
      return res.json();
    },
    staleTime: 30000,
  });

  const activeContractId =
    contractId ||
    (contractsData?.contracts && contractsData.contracts.length > 0
      ? contractsData.contracts[0].id
      : undefined);

  const steps: {
    id: WorkflowStepId;
    stepNumber: number;
    label: string;
    description: string;
    icon: React.ElementType;
    href: string;
  }[] = [
    {
      id: "upload",
      stepNumber: 1,
      label: "Upload",
      description: "Upload third-party vendor PDF/DOCX agreement or folder",
      icon: UploadCloud,
      href: "/dashboard",
    },
    {
      id: "analysis",
      stepNumber: 2,
      label: "AI Analysis",
      description: "Vector clause matching & anti-hallucination analysis",
      icon: Cpu,
      href: activeContractId ? `/contracts/${activeContractId}/processing` : "/dashboard",
    },
    {
      id: "scorecard",
      stepNumber: 3,
      label: "Scorecard",
      description: "Deterministic risk scoring, deal-breakers & compliance",
      icon: Gauge,
      href: activeContractId ? `/contracts/${activeContractId}` : "/dashboard",
    },
    {
      id: "review",
      stepNumber: 4,
      label: "Review & Redline",
      description: "Interactive clause redline workspace and policy compare",
      icon: FileEdit,
      href: activeContractId ? `/contracts/${activeContractId}/review` : "/dashboard",
    },
    {
      id: "export",
      stepNumber: 5,
      label: "Export",
      description: "Executive PDF summary & redlined DOCX export",
      icon: Download,
      href: activeContractId ? `/contracts/${activeContractId}#export-panel` : "/dashboard",
    },
  ];

  const currentIdx = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full bg-surface/80 border-b border-border/80 backdrop-blur-md px-4 py-3 sm:py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <nav
          aria-label="Contract Review Progress"
          className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto py-1 scrollbar-none w-full"
        >
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = step.id === currentStep;
            const isCompleted = idx < currentIdx;

            const StepContent = (
              <div
                className={`group relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-semibold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  isCurrent
                    ? "bg-brand-primary text-white shadow-md ring-2 ring-brand-primary/25"
                    : isCompleted
                    ? "bg-brand-primary/15 text-brand-primary hover:bg-brand-primary/20"
                    : "text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-muted/70"
                }`}
                title={`${step.label}: ${step.description}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 transition-transform group-hover:scale-105 ${
                    isCurrent
                      ? "bg-white text-brand-primary shadow-xs"
                      : isCompleted
                      ? "bg-brand-primary text-white"
                      : "bg-muted text-foreground border border-border"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.stepNumber}
                </div>
                <span className="whitespace-nowrap">
                  {step.label}
                </span>

                {/* Tooltip on hover */}
                <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 text-slate-100 px-2.5 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md">
                  {step.description}
                </span>
              </div>
            );

            return (
              <React.Fragment key={step.id}>
                {step.id === "upload" && onUploadClick ? (
                  <button
                    type="button"
                    onClick={onUploadClick}
                    className="focus:outline-none"
                  >
                    {StepContent}
                  </button>
                ) : (
                  <Link href={step.href} className="focus:outline-none">
                    {StepContent}
                  </Link>
                )}
                {idx < steps.length - 1 && (
                  <div
                    className={`h-1 w-4 sm:w-8 rounded-full transition-colors ${
                      idx < currentIdx ? "bg-brand-primary" : "bg-border"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
