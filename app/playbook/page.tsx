"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  Scale,
} from "lucide-react";
import { PlaybookRule, RuleCategory, RuleSeverity } from "@/types/database";

export default function PlaybookPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingRule, setEditingRule] = useState<PlaybookRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<RuleCategory>("liability");
  const [formRequirement, setFormRequirement] = useState("");
  const [formIdeal, setFormIdeal] = useState("");
  const [formFallback, setFormFallback] = useState("");
  const [formWalkAway, setFormWalkAway] = useState("");
  const [formSeverity, setFormSeverity] = useState<RuleSeverity>("medium");
  const [formWeight, setFormWeight] = useState(5);
  const [formMandatory, setFormMandatory] = useState(false);

  // Fetch Playbook Rules
  const { data, isLoading } = useQuery<{ rules: PlaybookRule[] }>({
    queryKey: ["playbook-rules"],
    queryFn: async () => {
      const res = await fetch("/api/playbook");
      if (!res.ok) throw new Error("Failed to load playbook rules");
      return res.json();
    },
  });

  const rules = data?.rules || [];

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requirement_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === "all" || r.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const openEditModal = (rule: PlaybookRule) => {
    setEditingRule(rule);
    setFormTitle(rule.title);
    setFormCategory(rule.category);
    setFormRequirement(rule.requirement_text);
    setFormIdeal(rule.ideal_clause_text);
    setFormFallback(rule.acceptable_fallback_text);
    setFormWalkAway(rule.walk_away_text);
    setFormSeverity(rule.severity_default);
    setFormWeight(rule.weight);
    setFormMandatory(rule.is_mandatory);
    setIsCreating(true);
  };

  const openNewModal = () => {
    setEditingRule(null);
    setFormTitle("");
    setFormCategory("liability");
    setFormRequirement("");
    setFormIdeal("");
    setFormFallback("");
    setFormWalkAway("");
    setFormSeverity("medium");
    setFormWeight(5);
    setFormMandatory(false);
    setIsCreating(true);
  };

  // AI Assist
  const handleAiAssist = async () => {
    if (!formRequirement) {
      alert("Please provide the requirement text first.");
      return;
    }
    try {
      setIsGeneratingAi(true);
      const res = await fetch("/api/playbook/generate/generate-clause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirement_text: formRequirement,
          category: formCategory,
        }),
      });
      if (!res.ok) throw new Error("AI generation failed");
      const generated = await res.json();
      setFormIdeal(generated.ideal_clause_text);
      setFormFallback(generated.acceptable_fallback_text);
      setFormWalkAway(generated.walk_away_text);
    } catch (e: any) {
      alert(e.message || "AI assist failed");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Save Rule
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: formTitle,
      category: formCategory,
      requirement_text: formRequirement,
      ideal_clause_text: formIdeal,
      acceptable_fallback_text: formFallback,
      walk_away_text: formWalkAway,
      severity_default: formSeverity,
      weight: Number(formWeight),
      is_mandatory: formMandatory,
      is_active: true,
      regulation_tags: [formCategory.replace("_", " ").toUpperCase()],
    };

    if (editingRule) {
      await fetch(`/api/playbook/${editingRule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/playbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setIsCreating(false);
    setEditingRule(null);
    queryClient.invalidateQueries({ queryKey: ["playbook-rules"] });
  };

  // Delete Rule
  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    await fetch(`/api/playbook/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["playbook-rules"] });
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rules, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "LexiGuard_Playbook_Rules.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Corporate Legal Playbook
          </h1>
          <p className="text-sm text-muted-foreground">
            Configurable enterprise rules, preferred clauses, acceptable fallbacks, and walk-away limits
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Playbook Rule</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search rules by title or requirement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Categories ({rules.length})</option>
            <option value="liability">Liability</option>
            <option value="indemnification">Indemnification</option>
            <option value="data_privacy">Data Privacy</option>
            <option value="termination">Termination</option>
            <option value="payment_penalties">Payment & Penalties</option>
            <option value="ip">Intellectual Property</option>
            <option value="governing_law">Governing Law</option>
            <option value="confidentiality">Confidentiality</option>
            <option value="sla">SLA</option>
            <option value="insurance">Insurance</option>
          </select>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            Loading corporate playbook rules...
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            No rules found matching your filter.
          </div>
        ) : (
          filteredRules.map((rule) => {
            const isCritical = rule.severity_default === "critical";
            const isHigh = rule.severity_default === "high";

            return (
              <div
                key={rule.id}
                className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all shadow-xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        isCritical
                          ? "bg-red-500/10 text-red-500"
                          : isHigh
                          ? "bg-orange-500/10 text-orange-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {rule.severity_default} • Weight {rule.weight}
                    </span>

                    {rule.is_mandatory && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        Mandatory
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-foreground">{rule.title}</h3>

                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {rule.requirement_text}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="capitalize text-muted-foreground text-[11px] font-medium">
                    {rule.category.replace("_", " ")}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(rule)}
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                      title="Edit Rule"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit / Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground">
              {editingRule ? "Edit Playbook Rule" : "Create New Playbook Rule"}
            </h3>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Rule Title</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Limitation of Liability Cap"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as RuleCategory)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                  >
                    <option value="liability">Liability</option>
                    <option value="indemnification">Indemnification</option>
                    <option value="data_privacy">Data Privacy</option>
                    <option value="termination">Termination</option>
                    <option value="payment_penalties">Payment & Penalties</option>
                    <option value="ip">Intellectual Property</option>
                    <option value="governing_law">Governing Law</option>
                    <option value="confidentiality">Confidentiality</option>
                    <option value="sla">SLA</option>
                    <option value="insurance">Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground">Policy Requirement</label>
                  <button
                    type="button"
                    onClick={handleAiAssist}
                    disabled={isGeneratingAi}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isGeneratingAi ? "Drafting..." : "AI Assist: Draft Clauses"}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  value={formRequirement}
                  onChange={(e) => setFormRequirement(e.target.value)}
                  placeholder="Describe mandatory policy terms..."
                  className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Ideal Clause (Gold Standard)</label>
                <textarea
                  rows={3}
                  required
                  value={formIdeal}
                  onChange={(e) => setFormIdeal(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Acceptable Fallback (Compromise Position)</label>
                <textarea
                  rows={2}
                  value={formFallback}
                  onChange={(e) => setFormFallback(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Walk-Away Threshold</label>
                <textarea
                  rows={2}
                  value={formWalkAway}
                  onChange={(e) => setFormWalkAway(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Default Severity</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as RuleSeverity)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Weight (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2 font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={formMandatory}
                      onChange={(e) => setFormMandatory(e.target.checked)}
                      className="rounded"
                    />
                    <span>Mandatory Clause</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white font-semibold shadow-md"
                >
                  Save Playbook Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
