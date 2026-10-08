"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, BookOpen, Shield, Settings, X } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;

  const actions = [
    { name: "Contract Library & Dashboard", href: "/dashboard", icon: FileText, category: "Navigation" },
    { name: "Legal Playbook Manager (15 Rules)", href: "/playbook", icon: BookOpen, category: "Governance" },
    { name: "Compliance & Audit Trail", href: "/audit", icon: Shield, category: "Security" },
    { name: "Settings & AI Configuration", href: "/settings", icon: Settings, category: "System" },
  ];

  const filtered = actions.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-border gap-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contracts, clauses, playbook rules... (Esc to close)"
            className="w-full bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-muted rounded-md text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/80 text-left transition-colors group text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                  {item.category}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No matching commands or contracts found.
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Navigate with arrows</span>
          <span>Press Esc to exit</span>
        </div>
      </div>
    </div>
  );
}
