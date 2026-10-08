"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ShieldCheck,
  Scale,
  FileCheck2,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Cpu,
  FileText,
  AlertTriangle,
  Download,
  Check,
  Layers,
  ChevronRight,
  Play,
  ShieldAlert,
} from "lucide-react";
import { TiltCard } from "@/components/ui/tilt-card";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { RiskPill } from "@/components/ui/risk-pill";

// Lazy-load 3D Hero Scene with SSR false
const Hero3DScene = dynamic(
  () => import("@/components/landing/hero-3d-scene").then((mod) => mod.Hero3DScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[450px] rounded-3xl bg-surface/50 border border-border/80 flex items-center justify-center animate-pulse">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 mx-auto flex items-center justify-center text-brand-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-xs text-muted-foreground font-mono">Initializing 3D Vector Engine...</p>
        </div>
      </div>
    ),
  }
);

export default function LandingPage() {
  const [activeDemoTab, setActiveDemoTab] = useState<"before" | "after">("before");

  const howItWorksSteps = [
    {
      step: 1,
      title: "Upload Agreement",
      desc: "Drag and drop any vendor PDF or DOCX agreement. Text extracted and validated with magic-byte verification.",
      icon: FileText,
    },
    {
      step: 2,
      title: "Vector Segmentation",
      desc: "Contract is segmented into discrete clauses with precise character offsets and matched against your playbook.",
      icon: Cpu,
    },
    {
      step: 3,
      title: "Anti-Hallucination AI",
      desc: "Every flagged risk quote is verified against source text offsets to eliminate LLM hallucinations.",
      icon: ShieldCheck,
    },
    {
      step: 4,
      title: "Review & Redline",
      desc: "Accept, reject, or fine-tune compliant replacement clauses in an interactive 3-panel legal workspace.",
      icon: FileCheck2,
    },
    {
      step: 5,
      title: "Export & Audit",
      desc: "Generate C-level executive PDF summaries and clean redlined DOCX agreements with an append-only audit trail.",
      icon: Download,
    },
  ];

  const features = [
    {
      title: "Clause-Level AI Parsing",
      desc: "Automated extraction and classification of 15+ standard contract categories with exact section numbering.",
      icon: Layers,
      tag: "Deep Matching",
    },
    {
      title: "Policy Discrepancy Highlighter",
      desc: "Side-by-side view comparing 'Playbook Requires' against 'Vendor Wrote' with inline severity color codes.",
      icon: Scale,
      tag: "Explainable",
    },
    {
      title: "Interactive Redline Workspace",
      desc: "Word-level diffs with diff-match-patch. Accept/reject ideal or fallback positions with live score recomputation.",
      icon: FileCheck2,
      tag: "Zero-Latency",
    },
    {
      title: "Deterministic Risk Gauge",
      desc: "Strict 0-100 severity formula based on clause risk weights and missing mandatory clauses, not vague LLM guesses.",
      icon: ShieldAlert,
      tag: "Mathematical",
    },
    {
      title: "DPDP & GDPR Compliance",
      desc: "Automated regulatory checks for data localization, mandatory breach notification windows, and sub-processor consents.",
      icon: Lock,
      tag: "Statutory",
    },
    {
      title: "Executive Export Suite",
      desc: "One-click generation of branded 1-2 page C-level executive summary PDFs and redlined DOCX contracts.",
      icon: Download,
      tag: "Audit-Ready",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 px-4 sm:px-8 border-b border-border/80">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Generation Legal Risk &amp; Redline Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[4rem] font-extrabold tracking-tight text-foreground leading-[1.12]">
              Review vendor contracts in{" "}
              <span className="text-brand-gradient">seconds</span>, not hours.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl font-normal leading-relaxed">
              LexiGuard aligns third-party vendor agreements against your company&apos;s configurable legal playbook using vector clause matching, flags deviation severity, and provides instant compliant redlines with deterministic risk scores.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 shadow-soft hover:shadow-raised transition-all hover:-translate-y-0.5 text-sm"
              >
                <span>Enter Legal Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/playbook"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-foreground bg-surface hover:bg-muted/40 border border-border shadow-xs transition-colors text-sm"
              >
                <span>Inspect 15 Playbook Rules</span>
              </Link>
            </div>

            {/* Trust Badges Row */}
            <div className="pt-6 border-t border-border/60 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>DPDP &amp; GDPR Aware</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Playbook-Driven Governance</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Hallucination Quoting</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Append-Only Audit Trail</span>
              </span>
            </div>
          </div>

          {/* Right 3D Visual Scene */}
          <div className="lg:col-span-5 relative">
            <Hero3DScene />
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-b border-border/80 bg-surface/50 backdrop-blur-sm py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-foreground">15 hrs &rarr; 10s</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Average Review Turnaround</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">100%</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Deterministic Scoring Formula</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-brand-primary">15 Rules</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Standard Enterprise Policies Seeded</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-cyan-600 dark:text-cyan-400">0 Offset Error</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Exact Contract Character Anchoring</p>
          </div>
        </div>
      </section>

      {/* How It Works (5 Steps) */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-primary">
            SYSTEM ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            How LexiGuard Protects Your Organization
          </h2>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-sm sm:text-base font-normal">
            From raw vendor document upload to board-ready executive summaries in five verifiable stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {howItWorksSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="relative rounded-2xl border border-border/80 bg-surface p-5 shadow-soft hover:border-brand-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-mono font-bold flex items-center justify-center">
                      0{step.step}
                    </span>
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Before/After Redline Demo Snippet */}
      <section className="py-16 px-4 sm:px-8 bg-surface/50 border-y border-border/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-2 mb-8">
            <span className="text-xs font-mono uppercase tracking-wider text-brand-primary font-semibold">
              LIVE REDLINE ENGINE
            </span>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
              See the Anti-Hallucination Redline in Action
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl mx-auto font-normal">
              Vendor wrote an uncapped, one-sided liability clause. Click below to inspect how LexiGuard instantly generates a mutual, capped fallback.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface shadow-raised overflow-hidden">
            {/* Control Tabs */}
            <div className="flex items-center justify-between border-b border-border/80 px-5 py-3 bg-muted/20">
              <div className="flex items-center gap-2">
                <SeverityBadge severity="critical" size="sm" />
                <span className="text-xs font-semibold text-foreground">
                  Section 9.1: Limitation of Liability
                </span>
              </div>
              <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl">
                <button
                  onClick={() => setActiveDemoTab("before")}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    activeDemoTab === "before"
                      ? "bg-surface text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Vendor Version (Risky)
                </button>
                <button
                  onClick={() => setActiveDemoTab("after")}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    activeDemoTab === "after"
                      ? "bg-brand-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  LexiGuard Redline (Compliant)
                </button>
              </div>
            </div>

            {/* Snippet Body */}
            <div className="p-6 text-sm sm:text-base leading-relaxed">
              {activeDemoTab === "before" ? (
                <div className="space-y-4">
                  <p className="text-foreground">
                    &ldquo;In no event shall Vendor&apos;s aggregate liability arising out of or related to this Agreement exceed{" "}
                    <mark className="bg-red-500/20 text-red-700 dark:text-red-300 font-semibold px-1 rounded border border-red-500/40">
                      one hundred dollars ($100.00)
                    </mark>
                    , regardless of the theory of liability. Customer agrees that Customer&apos;s liability for breach of confidentiality shall be{" "}
                    <mark className="bg-red-500/20 text-red-700 dark:text-red-300 font-semibold px-1 rounded border border-red-500/40">
                      completely unlimited
                    </mark>
                    .&rdquo;
                  </p>
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-800 dark:text-red-300 flex items-center justify-between">
                    <span>
                      Playbook Deviation: <strong>Liability Cap Below 12x Fees (Critical)</strong> &bull; Weight 5/5
                    </span>
                    <span className="font-mono font-bold">+25 Risk Points</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-foreground">
                    &ldquo;In no event shall <span className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 underline font-semibold px-1 rounded">either party&apos;s</span> aggregate liability arising out of or related to this Agreement exceed{" "}
                    <span className="line-through text-red-500/80 bg-red-500/10 px-1 rounded mr-1">one hundred dollars ($100.00)</span>
                    <span className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 underline font-semibold px-1 rounded">the total amounts paid or payable by Customer in the preceding twelve (12) months</span>
                    . Neither party shall be subject to uncapped damages except for gross negligence, willful misconduct, or willful breach of confidentiality.&rdquo;
                  </p>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span>
                      Substitution Status: <strong>Compliant with Corporate Fallback Position</strong>
                    </span>
                    <span className="font-mono font-bold text-emerald-600">-25 Risk Points Restored</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid with 3D Tilt Cards */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-primary">
            FULL PLATFORM CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Enterprise Legal Technology, Built for Production
          </h2>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-sm sm:text-base font-normal">
            No mockups. Every feature operates end-to-end with deterministic scoring, persistent state, and real document parsing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <TiltCard key={i} className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-muted border border-border/80 text-muted-foreground">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {feat.desc}
                  </p>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="py-16 px-4 sm:px-8 border-t border-border/80 bg-surface/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Row-Level Security &amp; Tenant Isolation
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Every contract, finding, and redline is shielded behind strict Postgres RLS policies preventing cross-tenant leakage.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Anti-Hallucination Guarantee
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              AI-generated quote spans are mathematically substring-matched against source contract text before render. Non-matching quotes are discarded.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Multi-Role Legal Governance
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Separation of duties across Admin (General Counsel), Reviewer (Senior Legal), and Viewer (Procurement) profiles.
            </p>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 px-4 sm:px-8 border-t border-border/80 bg-gradient-to-b from-surface to-background text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Transform Your Legal Review Today
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
            Eliminate risk blindspots, negotiate with authority, and protect company liability with a deterministic legal AI copilot.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 shadow-soft hover:shadow-raised transition-all text-sm"
            >
              <span>Get Started in Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/playbook"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-foreground bg-surface hover:bg-muted/40 border border-border text-sm transition-colors"
            >
              <span>View Rule Standards</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
