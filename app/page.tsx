import React from "react";
import {
  ShieldCheck,
  Zap,
  Scale,
  FileCheck2,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 px-4 sm:px-8 border-b border-border bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Legal Risk Intelligence
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Review vendor contracts in{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              under 10 seconds
            </span>
            . Without missing a single clause.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto font-normal leading-relaxed">
            LexiGuard aligns third-party vendor MSAs against your company&apos;s corporate legal playbook using vector matching, flags deviation severity, highlights risky phrases inline, and drafts compliant redlines with deterministic risk scores.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5"
            >
              Enter Legal Workspace
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="/playbook"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-foreground bg-muted hover:bg-muted/80 border border-border transition-colors"
            >
              Explore 15 Pre-Seeded Playbook Rules
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 text-left">
            <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-xs">
              <p className="text-2xl font-bold text-foreground">&lt; 10s</p>
              <p className="text-xs text-muted-foreground">Full MSA Scorecard Latency</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-xs">
              <p className="text-2xl font-bold text-foreground">100%</p>
              <p className="text-xs text-muted-foreground">Deterministic Explainability</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-xs">
              <p className="text-2xl font-bold text-foreground">15 Rules</p>
              <p className="text-xs text-muted-foreground">Pre-Configured Enterprise Baseline</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-xs">
              <p className="text-2xl font-bold text-foreground">DPDP & GDPR</p>
              <p className="text-xs text-muted-foreground">Statutory Regulatory Flags</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Value Pillars */}
      <section className="py-20 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Architected for General Counsel and Procurement
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            No vague AI summaries. Every flag is anchored in your playbook, verified mathematically against exact contract offsets, and scored deterministically.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Policy Discrepancy Matching</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Side-by-side comparison of <em>Playbook Requires</em> vs. <em>Vendor Wrote</em>. Risky language like &quot;unlimited liability&quot; or &quot;180 days notice&quot; is highlighted inline with verified character offsets.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Interactive Redline Workspace</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Accept, reject, or edit replacement clauses with word-level diffs powered by diff-match-patch. Scores recompute live upon every decision and persist immediately to the database.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Audit Trail & Executive Export</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Generate 1-2 page C-level executive summary PDFs and negotiated DOCX contracts with tracked changes. Every review action is permanently logged to an append-only audit trail.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
