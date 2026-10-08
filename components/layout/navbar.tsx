"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  FileText,
  BookOpen,
  Activity,
  Search,
  ChevronDown,
  UserCheck,
  Shield,
  Eye,
  Check,
  LogOut,
} from "lucide-react";
import { Profile } from "@/types/database";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Do not render navbar on standalone auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return null;
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch (e) {
      console.warn("Sign out request error:", e);
    }
    // Clear cookies & local storage
    document.cookie = "lexiguard_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("lexiguard_authenticated");
    localStorage.removeItem("lexiguard_user_id");
    queryClient.clear();
    router.push("/login");
  };

  // Fetch active user & available profiles
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

  const profiles = authData?.profiles || [
    {
      id: "00000000-0000-0000-0000-000000000002",
      full_name: "Sarah Chen (General Counsel)",
      role: "admin",
      organization_id: "00000000-0000-0000-0000-000000000001",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      full_name: "David Ross (Senior Reviewer)",
      role: "reviewer",
      organization_id: "00000000-0000-0000-0000-000000000001",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "00000000-0000-0000-0000-000000000004",
      full_name: "Alex Rivera (Procurement Analyst)",
      role: "viewer",
      organization_id: "00000000-0000-0000-0000-000000000001",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Role switcher mutation
  const switchRoleMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (!res.ok) throw new Error("Failed to switch profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      queryClient.invalidateQueries();
      setShowRoleMenu(false);
    },
  });

  const navLinks = [
    {
      name: "Contracts",
      href: "/dashboard",
      icon: FileText,
      isActive: (p: string) => p === "/dashboard" || p.startsWith("/contracts"),
    },
    {
      name: "Legal Playbook",
      href: "/playbook",
      icon: BookOpen,
      isActive: (p: string) => p.startsWith("/playbook"),
    },
    {
      name: "Audit Trail",
      href: "/audit",
      icon: Activity,
      isActive: (p: string) => p.startsWith("/audit"),
    },
  ];

  const roleBadgeStyle =
    activeProfile.role === "admin"
      ? "bg-purple-500/10 text-purple-500 border-purple-500/25"
      : activeProfile.role === "reviewer"
      ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/25"
      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/25";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
      {/* Full width navbar container with clean edge alignment matching reference */}
      <div className="w-full flex h-18 sm:h-20 items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <a href="/dashboard" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-foreground">
                LexiGuard
              </span>
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-500 bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-1 rounded-full whitespace-nowrap">
                Enterprise
              </span>
            </div>
          </a>
        </div>

        {/* Center / Nav Links (Single line, no wrapping, spaced out) */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = link.isActive(pathname);
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold whitespace-nowrap transition-all ${
                  active
                    ? "bg-primary/10 text-primary border border-primary/25 shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-foreground hover:bg-muted/70"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="whitespace-nowrap">{link.name}</span>
              </a>
            );
          })}
        </nav>

        {/* Right Side: Search, Theme, Profile & Sign Out */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Quick Search */}
          <button
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true })
              );
            }}
            className="hidden lg:flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 dark:text-slate-300 bg-muted/60 border border-border/90 rounded-xl hover:border-border hover:bg-muted/90 transition-all shadow-xs"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="whitespace-nowrap font-medium">Search or jump...</span>
            <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-background border border-border rounded shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Divider */}
          <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block" />

          {/* Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 py-1.5 rounded-xl hover:bg-muted/70 transition-colors"
              title="Switch active role context"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-slate-700 to-indigo-900 border border-border flex items-center justify-center text-sm font-bold text-white shadow-xs shrink-0">
                {activeProfile.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden xl:block text-left text-sm leading-tight">
                <p className="font-bold text-foreground flex items-center gap-1.5 whitespace-nowrap">
                  <span>{activeProfile.full_name}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border whitespace-nowrap ${roleBadgeStyle}`}>
                    {activeProfile.role}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-0.5 mt-0.5">
                  <span>Switch Role</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </p>
              </div>
            </button>

            {/* Role Dropdown */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-card border border-border shadow-xl p-2.5 z-50 text-sm space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-border">
                  <p className="font-bold text-foreground text-sm">Active Role Context</p>
                  <p className="text-xs text-muted-foreground">
                    Switch between enterprise roles to test permissions
                  </p>
                </div>

                {profiles.map((p) => {
                  const isSelected = p.id === activeProfile.id;
                  const Icon = p.role === "admin" ? Shield : p.role === "reviewer" ? UserCheck : Eye;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchRoleMutation.mutate(p.id);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                        isSelected ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground uppercase font-bold">
                            {p.role}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}

                <div className="pt-1 mt-1 border-t border-border">
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl text-left text-red-500 hover:bg-red-500/10 font-bold text-sm transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Sign Out Button */}
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border border-border hover:border-red-500/30 transition-all shadow-xs"
            title="Sign Out of LexiGuard"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">{isSigningOut ? "..." : "Sign Out"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
