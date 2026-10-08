"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  FileText,
  BookOpen,
  Activity,
  Sun,
  Moon,
  Search,
  PlusCircle,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const navLinks = [
    { name: "Contracts", href: "/dashboard", icon: FileText },
    { name: "Legal Playbook", href: "/playbook", icon: BookOpen },
    { name: "Audit Trail", href: "/audit", icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                LexiGuard
              </span>
              <span className="ml-1.5 text-[10px] uppercase font-semibold tracking-wider text-indigo-500 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">
                Enterprise
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname.startsWith(link.href);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Right Tools & User Info */}
        <div className="flex items-center gap-3">
          {/* Cmd+K trigger */}
          <button
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true })
              );
            }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/60 border border-border rounded-lg hover:border-border/80 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search or jump...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background border border-border rounded shadow-xs">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User badge */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-indigo-900 border border-border flex items-center justify-center text-xs font-semibold text-white">
              SC
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <p className="font-semibold text-foreground">Sarah Chen</p>
              <p className="text-[11px] text-muted-foreground">General Counsel (Admin)</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
