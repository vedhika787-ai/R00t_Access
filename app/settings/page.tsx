"use client";

import React, { useState } from "react";
import {
  User,
  Building,
  Cpu,
  Shield,
  Key,
  Bell,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "organization" | "ai" | "notifications">("profile");

  return (
    <div className="container max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Workspace Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Enterprise profile, member roles, AI models, and regulatory compliance configuration
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Settings Navigation Tabs */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
              activeTab === "profile"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Reviewer Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("organization")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
              activeTab === "organization"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Organization & Members</span>
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
              activeTab === "ai"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Models & Vectors</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
              activeTab === "notifications"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
          {activeTab === "profile" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground">Reviewer Profile</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground">Full Name</label>
                  <p className="mt-1 font-bold text-foreground">Sarah Chen</p>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">Title</label>
                  <p className="mt-1 font-bold text-foreground">General Counsel & Compliance Head</p>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">Email</label>
                  <p className="mt-1 font-bold text-foreground font-mono">sarah.chen@lexiguard.internal</p>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">System Role</label>
                  <p className="mt-1 font-bold text-primary uppercase">Administrator (Full Access)</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "organization" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-foreground">Enterprise Organization</h3>
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <p className="font-bold text-sm text-foreground">LexiGuard Global Legal Corp</p>
                <p className="text-muted-foreground font-mono text-[11px]">Tenant ID: 00000000-0000-0000-0000-000000000001</p>
              </div>

              <div className="pt-2">
                <p className="font-semibold text-foreground mb-2">Active Team Members:</p>
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">Sarah Chen</p>
                      <p className="text-[11px] text-muted-foreground">sarah.chen@lexiguard.internal</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                      Admin
                    </span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">David Ross</p>
                      <p className="text-[11px] text-muted-foreground">david.ross@lexiguard.internal</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-muted text-foreground">
                      Reviewer
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-foreground">AI Models & Embedding Telemetry</h3>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                  <span className="font-bold text-foreground">Per-Clause Analysis Model</span>
                  <p className="text-muted-foreground font-mono">claude-3-5-haiku-20241022 (Latency target: &lt; 800ms/clause)</p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                  <span className="font-bold text-foreground">Executive Rewrite & Synthesis Model</span>
                  <p className="text-muted-foreground font-mono">claude-3-5-sonnet-20241022 (High precision drafting)</p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                  <span className="font-bold text-foreground">Vector Embeddings Provider</span>
                  <p className="text-muted-foreground font-mono">Voyage AI (voyage-3, 1024 dimensions, Cosine HNSW Index)</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-foreground">Notification Preferences</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <div>
                    <p className="font-bold text-foreground">Critical Deviation Alerts</p>
                    <p className="text-muted-foreground text-[11px]">Instant notification when uploaded MSA has 2+ critical risks</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <div>
                    <p className="font-bold text-foreground">Analysis Complete Stream</p>
                    <p className="text-muted-foreground text-[11px]">Notify when contract processing finishes in background</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
