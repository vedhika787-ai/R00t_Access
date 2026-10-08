"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Building,
  Cpu,
  Bell,
  UserPlus,
  Shield,
  UserCheck,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Profile, UserRole } from "@/types/database";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "organization" | "ai" | "notifications">("profile");

  // Invite state
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("reviewer");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Fetch active user and all organization members
  const { data: authData } = useQuery<{
    activeProfile: Profile;
    profiles: Profile[];
  }>({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to load active profile");
      return res.json();
    },
  });

  const activeProfile = authData?.activeProfile || {
    id: "00000000-0000-0000-0000-000000000002",
    full_name: "Sarah Chen",
    role: "admin",
    organization_id: "00000000-0000-0000-0000-000000000001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const profiles = authData?.profiles || [];
  const isAdmin = activeProfile.role === "admin";

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ full_name, role }: { full_name: string; role: UserRole }) => {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name, role }),
      });
      if (!res.ok) throw new Error("Failed to invite member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      setInviteName("");
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;
    inviteMutation.mutate({ full_name: inviteName.trim(), role: inviteRole });
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="border-b border-border/80 pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs uppercase font-mono font-semibold tracking-wider text-brand-primary">
            ADMINISTRATION
          </span>
          <span className="text-muted-foreground">&bull;</span>
          <span className="text-xs text-muted-foreground">Governance Controls</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Workspace Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal mt-1">
          Enterprise profile, member roles, AI models, and regulatory compliance configuration.
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
              <h3 className="text-base font-bold text-foreground">Active Profile</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground">Full Name</label>
                  <p className="mt-1 font-bold text-foreground">{activeProfile.full_name}</p>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">System Role</label>
                  <p className="mt-1 font-bold text-primary uppercase">{activeProfile.role}</p>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">User ID</label>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{activeProfile.id}</p>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">Organization ID</label>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{activeProfile.organization_id}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "organization" && (
            <div className="space-y-6 text-xs">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-foreground">Enterprise Organization</h3>
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                  <p className="font-bold text-sm text-foreground">LexiGuard Global Legal Corp</p>
                  <p className="text-muted-foreground font-mono text-[11px]">Tenant ID: 00000000-0000-0000-0000-000000000001</p>
                </div>
              </div>

              {/* Invite Form (Admin only) */}
              {isAdmin ? (
                <div className="p-4 rounded-xl border border-border bg-background space-y-3">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <UserPlus className="w-4 h-4 text-primary" />
                    <span>Invite Team Member & Assign Role</span>
                  </div>

                  <form onSubmit={handleInviteSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="Colleague Full Name"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as UserRole)}
                      className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary capitalize"
                    >
                      <option value="reviewer">Reviewer (Upload & Redlines)</option>
                      <option value="viewer">Viewer (Read-Only Reports)</option>
                      <option value="admin">Admin (Playbook & Users)</option>
                    </select>

                    <button
                      type="submit"
                      disabled={inviteMutation.isPending}
                      className="py-2 px-4 rounded-xl font-semibold text-white bg-primary hover:bg-primary/90 transition-all text-xs"
                    >
                      {inviteMutation.isPending ? "Inviting..." : "Send Invite"}
                    </button>
                  </form>

                  {inviteSuccess && (
                    <p className="text-emerald-500 font-medium flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Member invited successfully and added to organization.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground italic text-[11px]">
                  Note: Only Organization Administrators can invite and assign member roles.
                </p>
              )}

              {/* Members List */}
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Active Team Members ({profiles.length}):</p>
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
                  {profiles.map((p) => {
                    const Icon = p.role === "admin" ? Shield : p.role === "reviewer" ? UserCheck : Eye;
                    const roleColor =
                      p.role === "admin"
                        ? "bg-purple-500/10 text-purple-500"
                        : p.role === "reviewer"
                        ? "bg-indigo-500/10 text-indigo-500"
                        : "bg-emerald-500/10 text-emerald-500";

                    return (
                      <div key={p.id} className="p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{p.full_name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">ID: {p.id.slice(0, 18)}...</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${roleColor}`}>
                          {p.role}
                        </span>
                      </div>
                    );
                  })}
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
