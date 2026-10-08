"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2, Sparkles, FileText } from "lucide-react";

interface ScannerAnimationProps {
  currentStage: string;
  clausesAnalyzed?: number;
}

export function ScannerAnimation({ currentStage, clausesAnalyzed = 0 }: ScannerAnimationProps) {
  const simulatedClauses = [
    { title: "Article 1: Scope of Services & Deliverables", status: "compliant", color: "bg-cyan-500/20 text-cyan-600 border-cyan-500/30" },
    { title: "Article 4: Data Processing & Confidentiality", status: "medium", color: "bg-amber-500/20 text-amber-600 border-amber-500/30" },
    { title: "Article 8: Limitation of Liability (Cap)", status: "critical", color: "bg-red-500/20 text-red-600 border-red-500/30" },
    { title: "Article 11: Termination & Notice Periods", status: "high", color: "bg-orange-500/20 text-orange-600 border-orange-500/30" },
    { title: "Article 14: Governing Law & Jurisdiction", status: "low", color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" },
  ];

  return (
    <div className="relative w-full max-w-md mx-auto rounded-3xl border border-border/80 bg-surface shadow-raised overflow-hidden p-6">
      {/* Contract Page Representation */}
      <div className="relative rounded-2xl border border-border/60 bg-background/80 p-5 space-y-4 overflow-hidden">
        {/* Document Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-primary" />
            <span className="text-xs font-mono font-semibold text-foreground">
              MASTER_SERVICES_AGREEMENT.PDF
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
            {currentStage}
          </span>
        </div>

        {/* Sweeping Light Beam */}
        <motion.div
          animate={{
            top: ["0%", "100%", "0%"],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute left-0 right-0 h-16 bg-gradient-to-b from-transparent via-brand-primary/25 to-cyan-500/30 z-20"
          style={{
            boxShadow: "0 0 15px rgba(79, 70, 229, 0.4)",
          }}
        />

        {/* Clause Line Items */}
        <div className="space-y-2.5 relative z-10 text-xs">
          {simulatedClauses.map((clause, idx) => {
            const isScanned = clausesAnalyzed > idx * 2 || currentStage === "scoring" || currentStage === "analyzing";
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                  isScanned
                    ? `${clause.color} shadow-xs`
                    : "border-border/40 bg-muted/20 text-muted-foreground/50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                  <span className="truncate font-medium">{clause.title}</span>
                </div>
                <span className="text-[10px] uppercase font-mono font-bold shrink-0 ml-2">
                  {isScanned ? clause.status : "Queued"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
          <span>Vector Similarity Active</span>
        </span>
        <span className="font-mono text-foreground font-semibold">
          {clausesAnalyzed} Clauses Verified
        </span>
      </div>
    </div>
  );
}
